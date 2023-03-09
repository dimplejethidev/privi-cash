import {
  createContext,
  PropsWithChildren,
  useState,
  FC,
  useMemo,
  useContext,
  useEffect,
} from 'react';
import { useAccount, useNetwork } from 'wagmi';
import { useGetShieldedAccount } from 'api/account';
import { KeyPair } from '@privi-cash/common';
import { modalViews, useUI } from './ui';

interface State {
  isLoggedIn: boolean;
  balance: number | string;
  privateKey: string;
  keyPair?: KeyPair;
}

const initialState: State = {
  isLoggedIn: false,
  balance: '0',
  privateKey: '',
};

export const ShieldedAccountContext = createContext<State | any>(initialState);
ShieldedAccountContext.displayName = 'ShieldedAccountContext';

export const ShieldedAccountProvider: FC<PropsWithChildren> = ({ children }) => {
  const [privateKey, setPrivateKey] = useState<string>('');
  const { address, isConnected } = useAccount();
  const { setModalViewAndOpen, setModalConfig, closeModal } = useUI();
  const { data: shieldedAccount, isLoading } = useGetShieldedAccount({ address });
  const { chain } = useNetwork();

  useEffect(() => {
    const isLoggedIn = !!privateKey;
    const isSupportedChain = chain?.unsupported === false;

    if (isConnected && !isSupportedChain) {
      setModalConfig({ closeOnOverlayClick: false });
      setModalViewAndOpen(modalViews.NETWORK_SWITCH);
    } else if (isConnected && !isLoggedIn) {
      setModalConfig({ closeOnOverlayClick: false });
      setModalViewAndOpen(modalViews.ACCOUNT_LOGIN);
    } else {
      closeModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, privateKey, chain?.unsupported]);

  const logOut = () => setPrivateKey('');

  const value = useMemo(
    () => ({
      logIn: setPrivateKey,
      logOut,
      privateKey,
      isLoggedIn: !!privateKey,
      keyPair: privateKey ? new KeyPair(privateKey) : undefined,
      isLoading,
      address: shieldedAccount?.address,
      isRegistered: shieldedAccount?.isRegistered,
    }),
    [privateKey, shieldedAccount, setPrivateKey, isLoading]
  );

  return (
    <ShieldedAccountContext.Provider value={value}>{children}</ShieldedAccountContext.Provider>
  );
};

export const useShieldedAccount = () => {
  const context = useContext(ShieldedAccountContext);
  if (context === undefined) {
    throw new Error(`useShieldedAccount must be used within a ShieldedAccountProvider`);
  }
  return context;
};
