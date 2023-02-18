import axios from 'axios';
import { useMutation } from '@tanstack/react-query';

interface IRelayTxInput {
  chainId: number;
  args: { proofArgs: any; extData: any };
  url: string;
}

const relayTx = async ({ url, args, chainId }: IRelayTxInput) => {
  const res = await axios.post(`${url}/relay`, {
    chainId,
    args,
  });

  return {
    url: res.config.url?.split('/').slice(0, -1).join('/') as string,
    ...res.data,
  };
};

export const useRelayTx = () => {
  return useMutation((input: IRelayTxInput) => relayTx(input));
};
