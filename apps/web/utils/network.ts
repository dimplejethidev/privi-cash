import { blockExplorers, defaultChainId } from 'config/network';

export const getBlockExplorerUrl = (
  data: string,
  chainId: number = defaultChainId,
  type: string = 'tx',
) => {
  return `${blockExplorers[chainId]}/${type}/${data}`;
};
