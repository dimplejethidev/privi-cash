import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { relayerBaseUrl } from 'config/env';

const getRelayerStatus = async () => {
  return axios.get(`${relayerBaseUrl}/status`).then((res) => res.data);
};

export const useGetRelayerStatus = () => {
  return useQuery(['status'], () => getRelayerStatus());
};
