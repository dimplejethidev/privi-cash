import { Contract, utils, BigNumber } from 'ethers';
import { formatEther, randomBN, toFixedHex } from 'utils/bigInt';
import logger from 'utils/logger';
import { checkCommitments, checkRoot, getUTXOsOf } from 'utils/pool';
import { FIELD_SIZE, generateSnarkProofSolidity } from './snark';
import {
  ExtData,
  PrepareDepositArgs,
  PrepareTransferArgs,
  PrepareTxArgs,
  PrepareWithdrawArgs,
} from './types';
import { Utxo } from './utxo';
import { treesInterface } from './merkleTree';
import { EventsFactory } from './events';
import { InstanceInfo } from 'types';

function hashExtData({
  recipient,
  extAmount,
  relayer,
  fee,
  encryptedOutput1,
  encryptedOutput2,
}: ExtData) {
  const abi = new utils.AbiCoder();
  const encodedData = abi.encode(
    [
      'tuple(address recipient,int256 extAmount,address relayer,uint256 fee,bytes encryptedOutput1,bytes encryptedOutput2)',
    ],
    [
      {
        recipient: toFixedHex(recipient, 20),
        extAmount: toFixedHex(extAmount),
        relayer: toFixedHex(relayer, 20),
        fee: toFixedHex(fee),
        encryptedOutput1,
        encryptedOutput2,
      },
    ],
  );
  const hash = utils.keccak256(encodedData);
  return BigNumber.from(hash).mod(FIELD_SIZE);
}

async function buildMerkleTree(
  pool: Contract,
  commitment: string,
  eventsData: any,
  instanceInfo: InstanceInfo,
) {
  logger.info(`Building tree...`);
  const treeService = treesInterface.getService({ ...instanceInfo, commitment });
  const cachedTree = await treeService.getTree();

  const commitments = eventsData.events.map((e: any) => e.commitment.toString(10));

  let tree = cachedTree;
  if (tree) {
    const newLeaves = commitments.slice(tree.elements.length);
    tree.bulkInsert(newLeaves);
  } else {
    checkCommitments(eventsData.events);
    tree = treeService.createTree(commitments);
  }

  const root = toFixedHex(tree.root);
  await checkRoot(root, pool);

  return { tree, root };
}

async function fetchEventsData(instanceInfo: InstanceInfo) {
  const rpcUrl = instanceInfo.rpcUrl;
  const eventsService = new EventsFactory(rpcUrl).getService(instanceInfo);
  return await eventsService.updateEvents('commitment');
}

async function generateProofArgs({
  inputs,
  outputs,
  tree,
  extAmount,
  fee,
  recipient,
  relayer,
}: any) {
  const circuit = inputs.length > 2 ? 'transaction16' : 'transaction2';

  logger.log(`Circuit: ${circuit} Inputs len: ${inputs.length}`);

  const inputPathIndices = [];
  const inputPathElements = [];
  for (const input of inputs) {
    if (input.amount > 0) {
      input.index = tree.indexOf(toFixedHex(input.commitment));
      if (input.index < 0) {
        throw new Error(`Input commitment ${toFixedHex(input.commitment)} was not found`);
      }
      inputPathIndices.push(input.index);
      inputPathElements.push(tree.path(input.index).pathElements);
    } else {
      inputPathIndices.push(0);
      inputPathElements.push(new Array(tree.levels).fill(0));
    }
  }

  const extData: ExtData = {
    recipient: toFixedHex(recipient, 20),
    extAmount: toFixedHex(extAmount),
    relayer: toFixedHex(relayer, 20),
    fee: toFixedHex(fee),
    encryptedOutput1: outputs[0].encrypt(),
    encryptedOutput2: outputs[1].encrypt(),
  };

  const extDataHash = hashExtData(extData);
  const input = {
    root: tree.root,
    publicAmount: BigNumber.from(extAmount).sub(fee).add(FIELD_SIZE).mod(FIELD_SIZE).toString(),
    extDataHash,
    inputNullifier: inputs.map((x: Utxo) => x.nullifier),
    // data for 2 or 16 transaction inputs
    inAmount: inputs.map((x: Utxo) => x.amount),
    inPrivateKey: inputs.map((x: Utxo) => x.keyPair.privateKey),
    inBlinding: inputs.map((x: Utxo) => x.blinding),
    inPathIndices: inputPathIndices,
    inPathElements: inputPathElements,
    // data for 2 transaction outputs
    outputCommitment: outputs.map((x: Utxo) => x.commitment),
    outAmount: outputs.map((x: Utxo) => x.amount),
    outPubkey: outputs.map((x: Utxo) => x.keyPair.publicKey),
    outBlinding: outputs.map((x: Utxo) => x.blinding),
  };

  const { proof } = await generateSnarkProofSolidity(input);

  const args = {
    proof,
    root: toFixedHex(input.root),
    inputNullifiers: inputs.map((x: Utxo) => toFixedHex(x.nullifier as string)),
    outputCommitments: outputs.map((x: Utxo) => toFixedHex(x.commitment)),
    publicAmount: toFixedHex(input.publicAmount),
    extDataHash: toFixedHex(extDataHash),
  };

  return {
    extData,
    args,
  };
}

export async function prepareTransaction({
  inputs = [],
  outputs = [],
  tree,
  fee,
  recipient,
  relayer,
}: PrepareTxArgs) {
  if (inputs.length > 16 || outputs.length > 2) {
    throw new Error('Incorrect inputs/outputs count');
  }
  while (inputs.length !== 2 && inputs.length < 16) {
    inputs.push(Utxo.zero());
  }
  while (outputs.length < 2) {
    outputs.push(Utxo.zero());
  }

  const extAmount = BigNumber.from(fee)
    .add(outputs.reduce((sum, x) => sum.add(x.amount), BigNumber.from(0)))
    .sub(inputs.reduce((sum, x) => sum.add(x.amount), BigNumber.from(0)));

  const { args, extData } = await generateProofArgs({
    inputs,
    outputs,
    tree,
    extAmount,
    fee,
    recipient,
    relayer,
  });

  logger.info(`extData.fee`, formatEther(extData.fee));
  logger.info(`extData.extAmount`, formatEther(extData.extAmount));

  return {
    proofArgs: args,
    extData,
  };
}

/**
 * Prepares args for DEPOSIT transaction
 */
export async function prepareDeposit(
  { pool, amount, keyPairs }: PrepareDepositArgs,
  instanceInfo: InstanceInfo,
) {
  const { spender: spenderKeyPair, receiver: receiverKeyPair } = keyPairs;
  const isSelfDeposit = spenderKeyPair.equals(receiverKeyPair);
  const depositAmount = BigNumber.from(amount);

  const eventsData = await fetchEventsData(instanceInfo);

  let currentUTXOs: Utxo[] = [];
  if (isSelfDeposit) {
    logger.info(`Self deposit: Fetching depositor UTXOs...`);
    currentUTXOs = await getUTXOsOf(spenderKeyPair, eventsData.events, pool);
  }

  const { tree } = await buildMerkleTree(
    pool,
    currentUTXOs.length > 0
      ? BigNumber.from(currentUTXOs[0].commitment).toHexString()
      : (undefined as any),
    eventsData,
    instanceInfo,
  );

  const currentUTXOsAmountSum = currentUTXOs.reduce(
    (sum: BigNumber, utxo: Utxo) => sum.add(utxo.amount),
    BigNumber.from(0),
  );
  logger.info(
    `Current UTXOs: Count ${currentUTXOs.length} Amount sum: ${formatEther(currentUTXOsAmountSum)}`,
  );

  const newUTXOsAmountSum = currentUTXOsAmountSum.add(depositAmount);
  const newUTXOs = [new Utxo({ amount: newUTXOsAmountSum, keyPair: receiverKeyPair })];

  logger.info(`New UTXOs: Amount sum: ${formatEther(newUTXOsAmountSum)}`);

  return prepareTransaction({
    inputs: currentUTXOs,
    outputs: newUTXOs,
    tree,
    fee: 0,
    relayer: 0,
    recipient: 0,
  });
}

/**
 * Prepares args for WITHDRAW transaction
 */
export async function prepareWithdraw(
  { pool, amount, spenderKeyPair, receiverAddress, relayer = 0, fee = 0 }: PrepareWithdrawArgs,
  instanceInfo: InstanceInfo,
) {
  const withdrawAmount = BigNumber.from(amount);
  const relayerFee = BigNumber.from(fee);

  // Total amount that goes out of pool
  const publicAmount = withdrawAmount.add(relayerFee);

  const eventsData = await fetchEventsData(instanceInfo);
  const currentUTXOs = await getUTXOsOf(spenderKeyPair, eventsData.events, pool);

  const { tree } = await buildMerkleTree(
    pool,
    BigNumber.from(currentUTXOs[currentUTXOs.length - 1].commitment).toHexString(),
    eventsData,
    instanceInfo,
  );

  const currentUTXOsAmountSum = currentUTXOs.reduce(
    (sum: BigNumber, utxo: Utxo) => sum.add(utxo.amount),
    BigNumber.from(0),
  );
  logger.info(
    `Current UTXOs: Count ${currentUTXOs.length} Amount sum: ${formatEther(currentUTXOsAmountSum)}`,
  );

  if (currentUTXOsAmountSum.lt(publicAmount)) {
    throw new Error(
      `Not enough utxo amount sum: ${formatEther(currentUTXOsAmountSum)} < ${formatEther(
        publicAmount,
      )}`,
    );
  }

  const newUTXOsAmountSum = currentUTXOsAmountSum.sub(publicAmount);
  const blinding = randomBN();
  const newUTXOs = [new Utxo({ amount: newUTXOsAmountSum, keyPair: spenderKeyPair, blinding })];

  logger.info(`New UTXOs: Amount sum: ${formatEther(newUTXOsAmountSum)}`);

  return prepareTransaction({
    inputs: currentUTXOs,
    outputs: newUTXOs,
    tree,
    recipient: receiverAddress,
    relayer,
    fee,
  });
}

/**
 * Prepares args for TRANSFER transaction
 */
export async function prepareTransfer(
  { pool, amount, keyPairs, relayer = 0, fee = 0 }: PrepareTransferArgs,
  instanceInfo: InstanceInfo,
) {
  const { spender: spenderKeyPair, receiver: receiverKeyPair } = keyPairs;
  const transferAmount = BigNumber.from(amount);
  const relayerFee = BigNumber.from(fee);

  // Total amount that goes out of pool
  const publicAmount = relayerFee;

  if (spenderKeyPair.equals(receiverKeyPair)) {
    throw Error(`Spender and receiver are same`);
  }

  const eventsData = await fetchEventsData(instanceInfo);
  const currentUTXOs = await getUTXOsOf(spenderKeyPair, eventsData.events, pool);

  const { tree } = await buildMerkleTree(
    pool,
    BigNumber.from(currentUTXOs[currentUTXOs.length - 1].commitment).toHexString(),
    eventsData,
    instanceInfo,
  );

  const currentUTXOsAmountSum = currentUTXOs.reduce(
    (sum: BigNumber, utxo: Utxo) => sum.add(utxo.amount),
    BigNumber.from(0),
  );
  logger.info(
    `Current UTXOs: Count ${currentUTXOs.length} Amount sum: ${formatEther(currentUTXOsAmountSum)}`,
  );
  if (currentUTXOsAmountSum.lt(transferAmount)) {
    throw new Error(
      `Not enough utxo amount sum: ${formatEther(currentUTXOsAmountSum)} < ${formatEther(
        transferAmount,
      )}`,
    );
  }

  const spenderUTXOChangeAmount = currentUTXOsAmountSum.sub(transferAmount).sub(publicAmount);

  const newUTXOs = [
    new Utxo({ amount: spenderUTXOChangeAmount, keyPair: spenderKeyPair }),
    new Utxo({ amount: transferAmount, keyPair: receiverKeyPair }),
  ];

  logger.info(
    `New UTXOs: Amount (spender): ${formatEther(
      spenderUTXOChangeAmount,
    )} Amount (receiver): ${formatEther(transferAmount)}`,
  );

  return prepareTransaction({
    inputs: currentUTXOs,
    outputs: newUTXOs,
    tree,
    relayer,
    fee,
    recipient: 0,
  });
}
