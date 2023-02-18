import { BigNumberish } from 'ethers';
import MerkleTree, { PartialMerkleTree } from 'fixed-merkle-tree';
import { Utxo } from '../utxo';

export type TxType = 'deposit' | 'withdraw' | 'transfer';

export type CircuitPath = { circuit: string; zKey: string };
export type ProofGeneratorConstructorArgs = {
  snarkJs: any;
  fieldSize: BigNumberish;
  merkleTree: MerkleTree | PartialMerkleTree;
  circuits: {
    transact2: CircuitPath;
    transact16: CircuitPath;
  };
};

export type ExtData = {
  recipient: BigNumberish;
  amount: BigNumberish;
  relayer: BigNumberish;
  fee: BigNumberish;
  encryptedOutput1: BigNumberish;
  encryptedOutput2: BigNumberish;
};

export type GenerateProofArgs = {
  txType: TxType;
  inputs: Utxo[];
  outputs: Utxo[];
  amount: BigNumberish;
  fee: BigNumberish;
  recipient: BigNumberish;
  relayer: BigNumberish;
};

export type PrepareTxArgs = {
  txType: TxType;
  inputs: Utxo[];
  outputs: Utxo[];
  fee: BigNumberish;
  relayer: BigNumberish;
  recipient?: BigNumberish;
};
