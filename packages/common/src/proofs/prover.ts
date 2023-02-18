import { BigNumber } from 'ethers';
import { toFixedHex } from '../helpers';
import { Utxo } from '../utxo';
import { generateSnarkProofSolidity, hashExtData } from './helpers';
import { GenerateProofArgs, PrepareTxArgs, ProofGeneratorConstructorArgs } from './types';

export class TxProver {
  snarkJs: ProofGeneratorConstructorArgs['snarkJs'];
  fieldSize: ProofGeneratorConstructorArgs['fieldSize'];
  circuits: ProofGeneratorConstructorArgs['circuits'];
  merkleTree: ProofGeneratorConstructorArgs['merkleTree'];

  constructor({ fieldSize, snarkJs, circuits, merkleTree }: ProofGeneratorConstructorArgs) {
    this.snarkJs = snarkJs;
    this.fieldSize = BigNumber.from(fieldSize);
    this.merkleTree = merkleTree;
    this.circuits = circuits;
  }

  async prepareTxProof({
    txType,
    inputs = [],
    outputs = [],
    fee = 0,
    recipient = 0,
    relayer = 0,
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

    let amount: BigNumber;
    if (txType === 'deposit') {
      amount = BigNumber.from(fee)
        .add(outputs.reduce((sum, x) => sum.add(x.amount), BigNumber.from(0)))
        .sub(inputs.reduce((sum, x) => sum.add(x.amount), BigNumber.from(0)));
    } else {
      amount = inputs
        .reduce((sum, x) => sum.add(x.amount), BigNumber.from(0))
        .sub(outputs.reduce((sum, x) => sum.add(x.amount), BigNumber.from(0)))
        .sub(BigNumber.from(fee));
    }

    const { proofArgs, extData } = await this.generateProof({
      inputs,
      outputs,
      amount,
      txType,
      fee,
      recipient,
      relayer,
    });

    return {
      proofArgs,
      extData,
    };
  }

  async generateProof({
    txType,
    inputs,
    outputs,
    amount,
    fee,
    recipient,
    relayer,
  }: GenerateProofArgs) {
    const tree = this.merkleTree;

    const inputPathIndices = [];
    const inputPathElements = [];
    for (const input of inputs) {
      if (input.amount.gt(0)) {
        input.leafIndex = tree.indexOf(toFixedHex(input.commitment));
        if (input.leafIndex && input.leafIndex < 0) {
          throw new Error(`Input commitment ${toFixedHex(input.commitment)} was not found`);
        }
        inputPathIndices.push(input.leafIndex);
        inputPathElements.push(tree.path(input.leafIndex).pathElements);
      } else {
        inputPathIndices.push(0);
        inputPathElements.push(new Array(tree.levels).fill(0));
      }
    }

    const extData = {
      recipient: toFixedHex(recipient, 20),
      amount: toFixedHex(amount),
      relayer: toFixedHex(relayer, 20),
      fee: toFixedHex(fee),
      encryptedOutput1: outputs[0].encrypt(),
      encryptedOutput2: outputs[1].encrypt(),
    };

    let publicAmount;
    if (txType === 'deposit') {
      publicAmount = BigNumber.from(amount);
    } else if (txType === 'withdraw') {
      publicAmount = BigNumber.from(this.fieldSize).sub(BigNumber.from(amount).add(fee));
    } else if (txType === 'transfer') {
      publicAmount = BigNumber.from(fee);
    } else {
      throw new Error(`Invalid txType: ${txType}`);
    }

    const extDataHash = hashExtData(extData, this.fieldSize);
    const input = {
      root: tree.root,
      publicAmount: publicAmount.toString(),
      extDataHash,
      inputNullifier: inputs.map((x) => x.nullifier),
      // data for 2/16 transaction inputs
      inAmount: inputs.map((x) => x.amount),
      inPrivateKey: inputs.map((x) => x.keyPair.privateKey),
      inBlinding: inputs.map((x) => x.blinding),
      inPathIndices: inputPathIndices,
      inPathElements: inputPathElements,
      // data for 2 transaction outputs
      outputCommitment: outputs.map((x) => x.commitment),
      outAmount: outputs.map((x) => x.amount),
      outPubkey: outputs.map((x) => x.keyPair.publicKey),
      outBlinding: outputs.map((x) => x.blinding),
    };

    const circuitPath = inputs.length > 2 ? this.circuits.transact16 : this.circuits.transact2;
    const { proof } = await generateSnarkProofSolidity({
      snarkJs: this.snarkJs,
      inputs: input,
      circuitPath,
    });

    const proofArgs = {
      proof,
      root: toFixedHex(input.root),
      inputNullifiers: inputs.map((x) => toFixedHex(x.nullifier as string)),
      outputCommitments: outputs.map((x) => toFixedHex(x.commitment)),
      publicAmount: toFixedHex(input.publicAmount),
      extDataHash: toFixedHex(extDataHash),
    };

    return {
      extData,
      proofArgs,
    };
  }
}
