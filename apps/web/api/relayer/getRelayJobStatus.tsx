import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { RelayJob, status } from 'contexts/relayJobs';
import { relayerBaseUrl } from 'config/env';

// interface IRelayStatusInput {
//   url: string;
//   jobId: string;
// }

const getRelayJobStatus = async ({ id: jobId }: RelayJob) => {
  return axios.get(`${relayerBaseUrl}/jobs/${jobId}`).then((res) => res.data);
};

export const useGetRelayJobStatus = (job: RelayJob) => {
  return useQuery(['jobs', job.id], () => getRelayJobStatus(job), {
    enabled: !!job.id && job.status !== status.CONFIRMED && job.status !== status.FAILED,
    staleTime: 4000,
  });
};
