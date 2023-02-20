import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import { relayerAddress, relayerBaseUrl } from 'config/env';
import { BigNumber } from 'ethers';
import { usePoolContract, useRegistrarContract } from 'hooks/contracts';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { useProvider } from 'wagmi';
import { prepareTransferProof } from 'utils/proof';
import { fetchUserShieldedAccount } from 'utils/pool';
import { parseEther } from 'privi-utils';

interface IRelayTransferInput {
  chainId: number;
  args: { proofArgs: any; extData: any };
  poolAddress: string;
}

const relayTransfer = async (params: IRelayTransferInput) => {
  const res = await axios.post(`${relayerBaseUrl}/relay/transfer`, params);

  return {
    ...res.data,
  };
};

export const useRelayTransfer = ({ poolAddress }: { poolAddress: string }) => {
  const poolContract = usePoolContract({ poolAddress });
  const registrarContract = useRegistrarContract();
  const { keyPair } = useShieldedAccount();
  const provider = useProvider();

  const { mutateAsync, ...rest } = useMutation((input: IRelayTransferInput) =>
    relayTransfer(input)
  );

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
      fee: parseEther('0.02').toString(), //@todo fix
      relayer: relayerAddress,
    });

    return { proofArgs, extData };
  };

  const relayTransferAsync = async (amount: BigNumber, recipient: string) => {
    const { proofArgs, extData } = await generateProof(amount, recipient);
    await mutateAsync({
      chainId: provider.network.chainId,
      args: { proofArgs, extData },
      poolAddress: poolContract.address,
    });
  };

  return { relayTransferAsync, ...rest };
};
