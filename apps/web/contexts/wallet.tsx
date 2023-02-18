import { FC, PropsWithChildren } from 'react';
import { getDefaultWallets, lightTheme, RainbowKitProvider, Chain } from '@rainbow-me/rainbowkit';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import { goerli, polygonMumbai, polygon } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import {
  keyAlchemyGoerli,
  keyAlchemyPolygonMumbai,
  keyAlchemyPolygonMainnet,
  rpcGnosisChiado,
} from 'config/env';
import { APP_NAME } from 'config/constants';
import fonts from 'theme/fonts';
import { defaultChainId } from 'config/network';

const chiadoChain: Chain = {
  id: 10200,
  name: 'Gnosis Chiado',
  iconUrl: '/images/gnosis.png',
  network: 'chiado',
  rpcUrls: { default: { http: [rpcGnosisChiado] } },
  testnet: true,
  nativeCurrency: { name: 'dai', symbol: 'dai', decimals: 18 },
};

const defaultChains: Chain[] = [
  // { ...polygon, iconUrl: '/images/matic.png' },
  chiadoChain,
  { ...polygonMumbai, iconUrl: '/images/matic.png' },
  // { ...goerli, iconUrl: '/images/eth.png' },
];

const { chains, provider } = configureChains(defaultChains, [
  // alchemyProvider({ apiKey: keyAlchemyPolygonMainnet }),
  alchemyProvider({ apiKey: keyAlchemyPolygonMumbai }),
  // alchemyProvider({ apiKey: keyAlchemyGoerli }),
  jsonRpcProvider({ rpc: () => ({ http: rpcGnosisChiado }) }),
]);

const { connectors } = getDefaultWallets({
  appName: APP_NAME,
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

const rainbowKitTheme = {
  ...lightTheme({ fontStack: 'system', borderRadius: 'small' }),
  fonts: { body: fonts.body },
};

const WalletProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains} initialChain={defaultChainId} theme={rainbowKitTheme}>
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default WalletProvider;
