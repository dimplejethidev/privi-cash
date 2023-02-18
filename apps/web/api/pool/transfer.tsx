import { useEffect } from 'react';
import { useContractWrite, useProvider, useWaitForTransaction } from 'wagmi';
import { BN } from 'privi-utils';
import pool from 'abi/pool.json';
import logger from 'utils/logger';
import { usePoolContract, useRegistrarContract } from 'hooks/contracts';
import { BigNumber, Wallet } from 'ethers';
import { prepareTransferProof } from 'utils/proof';
import { fetchUserShieldedAccount } from 'utils/pool';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { testPrivateKey } from 'config/env';

type PoolTransferReturnType = ReturnType<typeof useContractWrite> & {
  transferAsync: (amount: BigNumber, recipient: string) => Promise<void>;
  testAsync: (amount: BigNumber, recipient: string) => Promise<boolean>;
};

export const usePoolTransfer = ({
  poolAddress,
}: {
  poolAddress: string;
}): PoolTransferReturnType => {
  const poolContract = usePoolContract({ poolAddress });
  const registrarContract = useRegistrarContract();
  const { keyPair } = useShieldedAccount();
  const provider = useProvider();

  const { data, error, writeAsync, ...rest } = useContractWrite({
    mode: 'recklesslyUnprepared',
    address: poolContract.address,
    abi: pool.abi,
    functionName: 'transfer',
    overrides: {
      gasLimit: BN(2_000_000),
    },
  });

  const { data: receipt } = useWaitForTransaction({ hash: data?.hash });

  const generateProof = async (amount: BigNumber, recipient: string) => {
    if (!keyPair) {
      throw new Error('Please login to transfer');
    }

    const recipientKeyPair = await fetchUserShieldedAccount(recipient, registrarContract);
    if (!recipientKeyPair) {
      throw new Error('Recipient shielded account not found');
    }

    const { proofArgs, extData } = await prepareTransferProof({
      pool: poolContract,
      from: keyPair,
      to: recipientKeyPair,
      amount,
    });

    return { proofArgs, extData };
  };

  const transferAsync = async (amount: BigNumber, recipient: string) => {
    const { proofArgs, extData } = await generateProof(amount, recipient);

    await writeAsync?.({
      recklesslySetUnpreparedArgs: [proofArgs, extData],
      recklesslySetUnpreparedOverrides: { gasLimit: BN(2_000_000) },
    });
  };

  const testAsync = async (amount: BigNumber, recipient: string) => {
    logger.info(`Simulating transfer...`);
    const { proofArgs, extData } = await generateProof(amount, recipient);
    const testWallet = new Wallet(testPrivateKey, provider);
    const contract = poolContract.connect(testWallet);

    try {
      const tx = await contract.callStatic.transfer(proofArgs, extData, {
        gasLimit: BN(2_000_000),
      });
      logger.info(`transfer simulation successful`, tx);
      return true;
    } catch (error) {
      logger.error(`transfer simulation failed:`, error);
      return false;
    }
  };

  useEffect(() => {
    if (receipt) logger.info('Tx receipt:', receipt);
  }, [receipt]);

  useEffect(() => {
    if (data) logger.info('Tx:', data);
    if (error) logger.error(`Tx error:`, error);
  }, [data, error]);

  return { data, error, writeAsync, transferAsync, testAsync, ...rest };
};
