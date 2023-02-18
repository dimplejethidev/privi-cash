import {
  createContext,
  PropsWithChildren,
  useState,
  FC,
  useMemo,
  useContext,
  useEffect,
} from 'react';
import { useAccount } from 'wagmi';
import { useGetShieldedAccount, useGetShieldedBalance } from 'api/account';
import { KeyPair } from '@privi-cash/common';

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
  const { address } = useAccount();
  // const { data: balance, isFetching: isBalanceFetching } = useGetShieldedBalance(privateKey);
  const { data: shieldedAccount, isFetching: isAccountFetching } = useGetShieldedAccount();

  useEffect(() => {
    // Log out
    setPrivateKey('');
  }, [address]);

  const logOut = () => setPrivateKey('');

  const value = useMemo(
    () => ({
      logIn: setPrivateKey,
      logOut,
      privateKey,
      isLoggedIn: !!privateKey,
      keyPair: privateKey ? new KeyPair(privateKey) : undefined,
      // isLoading: (isBalanceFetching && !balance) || (isAccountFetching && !shieldedAccount),
      // balance,
      address: shieldedAccount?.address,
      isRegistered: shieldedAccount?.isRegistered,
    }),
    [privateKey, shieldedAccount, setPrivateKey]
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
