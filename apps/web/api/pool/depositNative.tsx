import { useEffect } from 'react';
import { useContractWrite, useProvider, useWaitForTransaction } from 'wagmi';
import { BN } from 'privi-utils';
import wTokenGateway from 'abi/wTokenGateway.json';
import logger from 'utils/logger';
import { usePoolContract, useRegistrarContract, useWTokenGatewayContract } from 'hooks/contracts';
import { BigNumber, Wallet } from 'ethers';
import { prepareDepositProof } from 'utils/proof';
import { fetchUserShieldedAccount } from 'utils/pool';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { testPrivateKey } from 'config/env';

type PoolDepositReturnType = ReturnType<typeof useContractWrite> & {
  depositAsync: (amount: BigNumber, recipient: string) => Promise<void>;
  testAsync: (amount: BigNumber, recipient: string) => Promise<boolean>;
};

export const usePoolDepositNative = ({
  poolAddress,
}: {
  poolAddress: string;
}): PoolDepositReturnType => {
  const poolContract = usePoolContract({ poolAddress });
  const wTokenGatewayContract = useWTokenGatewayContract();
  const registrarContract = useRegistrarContract();
  const { keyPair } = useShieldedAccount();
  const provider = useProvider();

  const { data, error, writeAsync, ...rest } = useContractWrite({
    mode: 'recklesslyUnprepared',
    address: wTokenGatewayContract.address,
    abi: wTokenGateway.abi,
    functionName: 'deposit',
    overrides: {
      gasLimit: BN(2_000_000),
    },
  });

  const { data: receipt } = useWaitForTransaction({ hash: data?.hash });

  const generateProof = async (amount: BigNumber, recipient: string) => {
    if (!keyPair) {
      throw new Error('Please login to deposit');
    }

    const recipientKeyPair = await fetchUserShieldedAccount(recipient, registrarContract);
    if (!recipientKeyPair) {
      throw new Error('Recipient shielded account not found');
    }

    const { proofArgs, extData } = await prepareDepositProof({
      pool: poolContract,
      from: keyPair,
      to: recipientKeyPair,
      amount,
    });

    return { proofArgs, extData };
  };

  const depositAsync = async (amount: BigNumber, recipient: string) => {
    const { proofArgs, extData } = await generateProof(amount, recipient);

    await writeAsync?.({
      recklesslySetUnpreparedArgs: [poolContract.address, proofArgs, extData],
      recklesslySetUnpreparedOverrides: { value: amount, gasLimit: BN(2_000_000) },
    });
  };

  const testAsync = async (amount: BigNumber, recipient: string) => {
    logger.info(`Simulating deposit...`);
    const { proofArgs, extData } = await generateProof(amount, recipient);
    const testWallet = new Wallet(testPrivateKey, provider);
    const contract = wTokenGatewayContract.connect(testWallet);

    try {
      const tx = await contract.callStatic.deposit(poolContract.address, proofArgs, extData, {
        value: amount,
        gasLimit: BN(2_000_000),
      });
      logger.info(`deposit simulation successful`, tx);
      return true;
    } catch (error) {
      logger.error(`deposit simulation failed:`, error);
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

  return { data, error, writeAsync, depositAsync, testAsync, ...rest };
};
