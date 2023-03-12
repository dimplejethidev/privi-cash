import { FC, PropsWithChildren } from 'react';
import { getDefaultWallets, lightTheme, RainbowKitProvider, Chain } from '@rainbow-me/rainbowkit';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import { goerli, polygonMumbai } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { keyAlchemyGoerli, keyAlchemyPolygonMumbai, rpcGnosisChiado } from 'config/env';
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
  nativeCurrency: { name: 'xDai', symbol: 'xdai', decimals: 18 },
};

const defaultChains: Chain[] = [
  chiadoChain,
  { ...polygonMumbai, iconUrl: '/images/matic.png' },
  { ...goerli, iconUrl: '/images/eth.png' },
];

const { chains, provider } = configureChains(defaultChains, [
  publicProvider(),
  alchemyProvider({ apiKey: keyAlchemyPolygonMumbai }),
  alchemyProvider({ apiKey: keyAlchemyGoerli }),
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
