import { useEffect } from 'react';
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import { BN } from 'privi-utils';
import registrar from 'abi/registrar.json';
import { registrarAddress } from 'config/network';
import logger from 'utils/logger';

export const useRegisterAccount = () => {
  const txRes = useContractWrite({
    mode: 'recklesslyUnprepared',
    address: registrarAddress,
    abi: registrar.abi,
    functionName: 'register',
    overrides: {
      gasLimit: BN(100_000),
    },
  });

  const { data: receipt } = useWaitForTransaction({ hash: txRes.data?.hash });

  useEffect(() => {
    if (receipt) logger.info('Tx receipt:', receipt);
  }, [receipt]);

  useEffect(() => {
    if (txRes.data) logger.info('Tx:', txRes.data);
    if (txRes.error) logger.error(`Tx error:`, txRes.error);
  }, [txRes.data, txRes.error]);

  return txRes;
};
