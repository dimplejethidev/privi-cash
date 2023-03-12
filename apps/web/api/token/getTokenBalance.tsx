import { useBalance } from 'wagmi';
import { constants } from 'ethers';
import { useInstance } from 'contexts/instance';

interface TokenBalanceQueryInput {
  address?: `0x${string}`;
  tokenAddress?: `0x${string}`;
}

export const useGetTokenBalance = ({ address, tokenAddress }: TokenBalanceQueryInput): any => {
  const isNativeToken = tokenAddress === constants.AddressZero;
  const { chainId } = useInstance();

  const nativeBalanceData = useBalance({
    address,
    chainId,
    token: isNativeToken ? undefined : tokenAddress,
  });

  return nativeBalanceData;
};
