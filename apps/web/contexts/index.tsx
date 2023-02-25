import { FC, ReactNode } from 'react';
import { InstanceProvider } from './instance';
import { RelayJobsProvider } from './relayJobs';
import { ShieldedAccountProvider } from './shieldedAccount';
import { UIProvider } from './ui';
import WalletProvider from './wallet';

const AppContext: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <WalletProvider>
      <UIProvider>
        <ShieldedAccountProvider>
          <InstanceProvider>
            <RelayJobsProvider>{children}</RelayJobsProvider>
          </InstanceProvider>
        </ShieldedAccountProvider>
      </UIProvider>
    </WalletProvider>
  );
};

export default AppContext;
