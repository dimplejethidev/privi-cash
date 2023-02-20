import { createContext, FC, PropsWithChildren, useCallback, useContext, useMemo } from 'react';
import { BigNumberish } from 'ethers';
import useLocalStorage from 'hooks/localStorage';
import logger from 'utils/logger';
import { useInstance } from './instance';

const KEY_RELAY_JOBS = 'RELAY_JOBS';

export const status = Object.freeze({
  QUEUED: 'QUEUED',
  ACCEPTED: 'ACCEPTED',
  SENT: 'SENT',
  MINED: 'MINED',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
});

export interface RelayJob {
  id: string;
  type: string;
  amount: BigNumberish;
  token: string;
  timestamp: number;
  status: string;
  chainId: number;
  txHash?: string;
}

interface State {
  jobs: RelayJob[];
}

const initialState: State = {
  jobs: [],
};

export const RelayJobsContext = createContext<State | any>(initialState);
RelayJobsContext.displayName = 'RelayJobsContext';

export const RelayJobsProvider: FC<PropsWithChildren> = ({ children }) => {
  const [jobs, setJobs] = useLocalStorage<RelayJob[]>(KEY_RELAY_JOBS, []);
  const { instance, chainId } = useInstance();

  const saveJob = useCallback(
    ({ id, amount, type }: { id: string; type: string; amount: string }) => {
      if (jobs.findIndex((job) => job.id === id) !== -1) return;

      const newJobItem = {
        id,
        amount,
        type,
        chainId,
        token: instance.token.name,
        timestamp: Date.now(),
        status: status.QUEUED,
      };
      logger.info(`Saving new job..`, newJobItem);
      const newJobs = [newJobItem, ...jobs];
      setJobs(() => newJobs);
    },
    [jobs, setJobs, instance.token.name, chainId]
  );

  const removeJob = useCallback(
    (id: string) => {
      setJobs(jobs.filter((job) => job.id !== id));
    },
    [jobs, setJobs]
  );

  const updateJob = useCallback(
    (id: string, data: Partial<RelayJob>) => {
      const idx = jobs.findIndex((job) => job.id === id);
      if (idx === -1) {
        logger.warn(`Job with id ${id} not found to update`);
        return;
      }
      const newJobs = [...jobs];
      newJobs[idx] = { ...newJobs[idx], ...data };
      setJobs(newJobs);
    },
    [jobs, setJobs]
  );

  const value = useMemo(
    () => ({
      jobs,
      saveJob,
      removeJob,
      updateJob,
      // relayersList: relayersRegistry[chainId],
    }),
    [jobs, saveJob, removeJob, updateJob]
  );

  return <RelayJobsContext.Provider value={value}>{children}</RelayJobsContext.Provider>;
};

export const useRelayers = () => {
  const context = useContext(RelayJobsContext);
  if (context === undefined) {
    throw new Error(`useSaveRelayJobs must be used within a RelayJobsContextProvider`);
  }
  return context;
};
