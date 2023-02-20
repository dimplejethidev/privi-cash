import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import { relayerAddress, relayerBaseUrl } from 'config/env';
import { BigNumber } from 'ethers';
import { usePoolContract, useWTokenGatewayContract } from 'hooks/contracts';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { useProvider } from 'wagmi';
import { prepareWithdrawProof } from 'utils/proof';
import { parseEther } from 'privi-utils';

interface IRelayWithdrawInput {
  chainId: number;
  args: { proofArgs: any; extData: any };
  poolAddress: string;
  wTokenGatewayAddress: string;
  unwrappedTokenReceiver: string;
}

const relayWithdraw = async (params: IRelayWithdrawInput) => {
  const res = await axios.post(`${relayerBaseUrl}/relay/withdraw`, params);

  return {
    ...res.data,
  };
};

export const useRelayWithdraw = ({ poolAddress }: { poolAddress: string }) => {
  const poolContract = usePoolContract({ poolAddress });
  const wTokenGatewayContract = useWTokenGatewayContract();
  const { keyPair } = useShieldedAccount();
  const provider = useProvider();

  const { mutateAsync, ...rest } = useMutation((input: IRelayWithdrawInput) =>
    relayWithdraw(input)
  );

  const generateProof = async (amount: BigNumber, recipient: string) => {
    if (!keyPair) {
      throw new Error('Please login to withdraw');
    }

    const { proofArgs, extData } = await prepareWithdrawProof({
      pool: poolContract,
      from: keyPair,
      amount,
      recipient: wTokenGatewayContract.address,
      fee: parseEther('0.02').toString(), //@todo fix
      relayer: relayerAddress,
    });

    return { proofArgs, extData };
  };

  const relayWithdrawAsync = async (amount: BigNumber, recipient: string) => {
    const { proofArgs, extData } = await generateProof(amount, recipient);
    await mutateAsync({
      chainId: provider.network.chainId,
      args: { proofArgs, extData },
      poolAddress: poolContract.address,
      wTokenGatewayAddress: wTokenGatewayContract.address,
      unwrappedTokenReceiver: recipient,
    });
  };

  return { relayWithdrawAsync, ...rest };
};
