import { BigNumberish, Contract } from 'ethers';
import MerkleTree, { PartialMerkleTree } from 'fixed-merkle-tree';
import { InstanceInfo } from 'types';
import { KeyPair } from './keyPair';
import { Utxo } from './utxo';

export type MerkleTreeServiceArgs = {
  commitment: string;
} & InstanceInfo;

export type EventServiceArgs = {
  factoryMethods?: Record<string, Function>;
} & InstanceInfo;

export type ExtData = {
  recipient: BigNumberish;
  extAmount: BigNumberish;
  relayer: BigNumberish;
  fee: BigNumberish;
  encryptedOutput1: BigNumberish;
  encryptedOutput2: BigNumberish;
};

export type PrepareTxArgs = {
  inputs: Utxo[];
  outputs: Utxo[];
  tree: MerkleTree | PartialMerkleTree;
  fee: BigNumberish;
  relayer: BigNumberish;
  recipient?: BigNumberish;
};

export type PrepareDepositArgs = {
  pool: Contract;
  amount: BigNumberish;
  keyPairs: {
    spender: KeyPair;
    receiver: KeyPair;
  };
};

export type PrepareWithdrawArgs = {
  pool: Contract;
  amount: BigNumberish;
  spenderKeyPair: KeyPair;
  receiverAddress: BigNumberish;
  relayer?: BigNumberish;
  fee?: BigNumberish;
};

export type PrepareTransferArgs = {
  pool: Contract;
  amount: BigNumberish;
  keyPairs: {
    spender: KeyPair;
    receiver: KeyPair;
  };
  relayer?: BigNumberish;
  fee?: BigNumberish;
};
