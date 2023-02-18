import { FC, ReactNode } from 'react';
import { InstanceProvider } from './instance';
import { RelayJobsProvider } from './relayJobs';
import { ShieldedAccountProvider } from './shieldedAccount';
import { UIProvider } from './ui';
import WalletProvider from './wallet';

const AppContext: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <WalletProvider>
      <ShieldedAccountProvider>
        <InstanceProvider>
          <RelayJobsProvider>
            <UIProvider>{children}</UIProvider>
          </RelayJobsProvider>
        </InstanceProvider>
      </ShieldedAccountProvider>
    </WalletProvider>
  );
};

export default AppContext;
