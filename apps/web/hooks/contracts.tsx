import { useContract, useProvider } from 'wagmi';
import pool from 'abi/pool.json';
import registrar from 'abi/registrar.json';
import wTokenGateway from 'abi/wTokenGateway.json';
import { registrarAddress } from 'config/network';
import { Contract } from 'ethers';
import { useInstance } from 'contexts/instance';
// import useInstance from './instance';

export const usePoolContract = ({ poolAddress }: { poolAddress: string }) => {
  const provider = useProvider();
  return useContract({
    address: poolAddress,
    abi: pool.abi,
    signerOrProvider: provider,
  }) as Contract;
};

export const useWTokenGatewayContract = () => {
  const provider = useProvider();
  const { wTokenGateway: wTokenGatewayAddress } = useInstance();
  return useContract({
    address: wTokenGatewayAddress,
    abi: wTokenGateway.abi,
    signerOrProvider: provider,
  }) as Contract;
};

export const useRegistrarContract = () => {
  const provider = useProvider();
  return useContract({
    address: registrarAddress,
    abi: registrar.abi,
    signerOrProvider: provider,
  }) as Contract;
};
