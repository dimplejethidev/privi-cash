import { Instance } from 'config/network';

export type CachedCommitment = {
  leafIndex: number;
  commitment: string;
  encryptedOutput: string;
  blockNumber: number;
  transactionHash: string;
};

export type CachedNullifier = {
  nullifier: string;
  blockNumber: number;
  transactionHash: string;
};

export type InstanceInfo = {
  token: string;
  chainId: number;
  rpcUrl: string;
  instance: Instance;
};
