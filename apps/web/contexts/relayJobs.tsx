// import { relayersRegistry } from 'config/network';
import useInstance from 'hooks/instance';
import useLocalStorage from 'hooks/localStorage';
import { createContext, FC, PropsWithChildren, useCallback, useContext, useMemo } from 'react';

const KEY_RELAY_JOBS = 'RELAY_JOBS';

export const status = Object.freeze({
  QUEUED: 'QUEUED',
  ACCEPTED: 'ACCEPTED',
  SENT: 'SENT',
  MINED: 'MINED',
  RESUBMITTED: 'RESUBMITTED',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
});

export interface RelayJob {
  id: string;
  timestamp: number;
  relayer: string;
  status: string;
  amount: number;
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
  // const [jobs, setJobs] = useLocalStorage<RelayJob[]>(KEY_RELAY_JOBS, []);
  // const { chainId } = useInstance();

  // const saveJob = useCallback(
  //   ({
  //     id,
  //     relayer,
  //     amount,
  //     chainId,
  //   }: {
  //     id: string;
  //     relayer: string;
  //     type: string;
  //     amount: number;
  //     chainId: number;
  //   }) => {
  //     if (jobs.findIndex((job) => job.id === id) !== -1) return;
  //     console.log(`Adding new job..`);

  //     const newJobItem = {
  //       id,
  //       relayer,
  //       amount,
  //       chainId,
  //       timestamp: Date.now(),
  //       status: status.QUEUED,
  //     };
  //     const newJobs = [newJobItem, ...jobs];
  //     setJobs(() => newJobs);
  //   },
  //   [jobs, setJobs],
  // );

  // const removeJob = useCallback(
  //   (id: string) => {
  //     setJobs(jobs.filter((job) => job.id !== id));
  //   },
  //   [jobs, setJobs],
  // );

  // const updateJob = useCallback(
  //   (id: string, data: Partial<RelayJob>) => {
  //     const idx = jobs.findIndex((job) => job.id === id);
  //     if (idx === -1) return;
  //     const newJobs = [...jobs];
  //     newJobs[idx] = { ...newJobs[idx], ...data };
  //     setJobs(newJobs);
  //   },
  //   [jobs, setJobs],
  // );

  // const value = useMemo(
  //   () => ({
  //     jobs,
  //     saveJob,
  //     removeJob,
  //     updateJob,
  //     relayersList: relayersRegistry[chainId],
  //   }),
  //   [jobs, saveJob, removeJob, updateJob, chainId],
  // );

  return <RelayJobsContext.Provider value={{}}>{children}</RelayJobsContext.Provider>;
};

export const useRelayers = () => {
  const context = useContext(RelayJobsContext);
  if (context === undefined) {
    throw new Error(`useSaveRelayJobs must be used within a RelayJobsContextProvider`);
  }
  return context;
};
