import { BigNumberish, Contract } from 'ethers';
import { CircuitPath, FIELD_SIZE, KeyPair, TxProver, Utxo, ZERO_LEAF } from '@privi-cash/common';
import { toFixedHex, poseidonHash, BN, formatEther } from 'privi-utils';
import MerkleTree from 'fixed-merkle-tree';
import { TREE_HEIGHT } from 'config/constants';
import { fetchUserUnspentNotes } from './pool';
import logger from './logger';

const tx2CircuitPath: CircuitPath = {
  circuit: `/circuits/transaction2.wasm`,
  zKey: `/circuits/transaction2.zkey`,
};

const tx16CircuitPath: CircuitPath = {
  circuit: `/circuits/transaction16.wasm`,
  zKey: `/circuits/transaction16.zkey`,
};

//@todo Complete this
async function buildMerkleTree(pool: Contract) {
  const filter = pool.filters.CommitmentInserted();
  const events = await pool.queryFilter(filter, 0);

  const leaves = events
    .sort((a, b) => a.args?.leafIndex - b.args?.leafIndex)
    .map((e) => toFixedHex(e.args?.commitment));
  return new MerkleTree(TREE_HEIGHT, leaves, {
    hashFunction: poseidonHash,
    zeroElement: ZERO_LEAF,
  });
}

export const prepareDepositProof = async ({
  pool,
  from,
  to,
  amount,
}: {
  pool: Contract;
  from: KeyPair;
  to: KeyPair;
  amount: BigNumberish;
}) => {
  //@ts-ignore
  const snarkJs = window.snarkjs;
  const merkleTree = await buildMerkleTree(pool);
  const isSelfDeposit = from.equals(to);

  let inputNotes: Utxo[] = [];
  if (isSelfDeposit) {
    inputNotes = await fetchUserUnspentNotes(from, pool);
  }

  const inputsSum = inputNotes.reduce((acc, note) => acc.add(note.amount), BN(0));
  logger.info(`Current UTXOs: Count ${inputNotes.length} Sum: ${formatEther(inputsSum)}`);

  const outputsSum = inputsSum.add(amount);
  const outputNotes = [new Utxo({ amount: outputsSum, keyPair: to })];
  logger.info(`New UTXOs: Amount sum: ${formatEther(outputsSum)}`);

  const prover = new TxProver({
    snarkJs,
    circuits: { transact2: tx2CircuitPath, transact16: tx16CircuitPath },
    merkleTree,
    fieldSize: FIELD_SIZE,
  });

  const { proofArgs, extData } = await prover.prepareTxProof({
    txType: 'deposit',
    inputs: inputNotes,
    outputs: outputNotes,
    fee: 0,
    relayer: 0,
    recipient: 0,
  });

  return { proofArgs, extData };
};

export const prepareWithdrawProof = async ({
  pool,
  from,
  amount,
  recipient,
}: {
  pool: Contract;
  from: KeyPair;
  amount: BigNumberish;
  recipient: string;
}) => {
  //@ts-ignore
  const snarkJs = window.snarkjs;
  const merkleTree = await buildMerkleTree(pool);

  const inputNotes = await fetchUserUnspentNotes(from, pool);

  const inputsSum = inputNotes.reduce((acc, note) => acc.add(note.amount), BN(0));
  logger.info(`Current UTXOs: Count ${inputNotes.length} Sum: ${formatEther(inputsSum)}`);

  const outputsSum = inputsSum.sub(amount);
  if (outputsSum.isNegative()) {
    throw new Error('Not enough balance');
  }

  const outputNotes = [new Utxo({ amount: outputsSum, keyPair: from })];
  logger.info(`New UTXOs: Amount sum: ${formatEther(outputsSum)}`);

  const prover = new TxProver({
    snarkJs,
    circuits: { transact2: tx2CircuitPath, transact16: tx16CircuitPath },
    merkleTree,
    fieldSize: FIELD_SIZE,
  });

  const { proofArgs, extData } = await prover.prepareTxProof({
    txType: 'withdraw',
    inputs: inputNotes,
    outputs: outputNotes,
    recipient,
    fee: 0,
    relayer: 0,
  });

  return { proofArgs, extData };
};

export const prepareTransferProof = async ({
  pool,
  from,
  to,
  amount,
}: {
  pool: Contract;
  from: KeyPair;
  to: KeyPair;
  amount: BigNumberish;
}) => {
  //@ts-ignore
  const snarkJs = window.snarkjs;
  const merkleTree = await buildMerkleTree(pool);

  const inputNotes: Utxo[] = await fetchUserUnspentNotes(from, pool);

  const inputsSum = inputNotes.reduce((acc, note) => acc.add(note.amount), BN(0));
  logger.info(`Current UTXOs: Count ${inputNotes.length} Sum: ${formatEther(inputsSum)}`);

  const fromOutputsSum = inputsSum.sub(amount);
  if (fromOutputsSum.isNegative()) {
    throw new Error('Not enough balance');
  }
  const fromOutputNote = new Utxo({ amount: fromOutputsSum, keyPair: from });
  const toOutputNote = new Utxo({ amount: amount, keyPair: to });

  const outputNotes = [fromOutputNote, toOutputNote];
  logger.info(`New UTXOs: Amount sum: ${formatEther(fromOutputsSum)}`);

  const prover = new TxProver({
    snarkJs,
    circuits: { transact2: tx2CircuitPath, transact16: tx16CircuitPath },
    merkleTree,
    fieldSize: FIELD_SIZE,
  });

  const { proofArgs, extData } = await prover.prepareTxProof({
    txType: 'transfer',
    inputs: inputNotes,
    outputs: outputNotes,
    fee: 0,
    relayer: 0,
    recipient: 0,
  });

  return { proofArgs, extData };
};
