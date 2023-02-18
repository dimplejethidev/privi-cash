import { useQuery } from '@tanstack/react-query';
import { BigNumber, Contract } from 'ethers';
import { KeyPair } from '@privi-cash/common';
import { fetchUserUnspentNotes } from 'utils/pool';
import { usePoolContract } from 'hooks/contracts';

export async function getShieldedBalance(keyPair: KeyPair, pool: Contract) {
  const unspentOutputs = await fetchUserUnspentNotes(keyPair, pool);

  let balance = BigNumber.from(0);
  unspentOutputs.forEach((utxo) => {
    balance = balance.add(utxo.amount);
  });

  return {
    balance,
  };
}

export const useGetShieldedBalance = ({
  keyPair,
  poolAddress,
}: {
  keyPair?: KeyPair;
  poolAddress: string;
}) => {
  const pool = usePoolContract({ poolAddress });

  return useQuery(
    ['shieldedBalance', keyPair?.publicKey, poolAddress],
    () => getShieldedBalance(keyPair as KeyPair, pool),
    {
      enabled: !!keyPair && !!poolAddress,
    }
  );
};
