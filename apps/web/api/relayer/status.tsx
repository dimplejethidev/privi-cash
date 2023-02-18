import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

interface IRelayerStatusInput {
  url: string;
}

const getRelayerStatus = async ({ url }: IRelayerStatusInput) => {
  return axios.get(`${url}/status`).then((res) => res.data);
};

export const useGetRelayerStatus = ({ url }: IRelayerStatusInput) => {
  return useQuery(['status', url], () => getRelayerStatus({ url }), {
    enabled: !!url,
  });
};
