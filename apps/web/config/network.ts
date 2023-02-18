import { ZERO_LEAF } from '@privi-cash/common';
import { constants } from 'ethers';
import { rpcGnosisChiado, rpcPolygonMumbai } from './env';

export type Instance = {
  pool: string;
  deployedBlock: number;
  treeHeight: number;
  zeroElement: string;
  token: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    isNative: boolean;
    iconUrl: string;
  };
};

export type InstanceConfig = {
  rpcUrl: string;
  wTokenGateway: string;
  instances: {
    [token: string]: Instance;
  };
};

export const chains = {
  GNOSIS_CHIADO: 10200,
  GOERLI: 5,
  POLYGON_MAINNET: 137,
  POLYGON_MUMBAI: 80001,
};

export const defaultChainId = chains.GNOSIS_CHIADO;

// #####################################
// #     GNOSIS CHIADO INSTANCES       #
// #####################################
const gnosisChiadoConfig: InstanceConfig = {
  rpcUrl: rpcGnosisChiado,
  wTokenGateway: '0xA3410F89bD9AF9858100062123717d2b21e31e53',
  instances: {
    dai: {
      pool: '0xb91682AB65Fb9e70cD619BFFd8FB045020Fb6de0',
      deployedBlock: 28876158,
      treeHeight: 20,
      zeroElement: ZERO_LEAF,
      token: {
        address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
        name: 'dai',
        symbol: 'DAI',
        decimals: 18,
        isNative: true,
        iconUrl: '/images/dai.png',
      },
    },
  },
};

// #####################################
// #     POLYGON MUMBAI INSTANCES      #
// #####################################
const polygonMumbaiConfig: InstanceConfig = {
  rpcUrl: rpcPolygonMumbai,
  wTokenGateway: '0xb91682AB65Fb9e70cD619BFFd8FB045020Fb6de0',
  instances: {
    matic: {
      pool: '0x71f23bb6418ec79fE638bE776804Fb9101042Fac',
      deployedBlock: 28876158,
      treeHeight: 20,
      zeroElement: ZERO_LEAF,
      token: {
        address: constants.AddressZero,
        name: 'matic',
        symbol: 'MATIC',
        decimals: 18,
        isNative: true,
        iconUrl: '/images/matic.png',
      },
    },
    wmatic: {
      pool: '0x71f23bb6418ec79fE638bE776804Fb9101042Fac',
      deployedBlock: 28876158,
      treeHeight: 20,
      zeroElement: ZERO_LEAF,
      token: {
        address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
        name: 'wmatic',
        symbol: 'WMATIC',
        decimals: 18,
        isNative: true,
        iconUrl: '/images/matic.png',
      },
    },
  },
};

export const instanceConfig: Record<number, InstanceConfig> = {
  [chains.GNOSIS_CHIADO]: gnosisChiadoConfig,
  [chains.POLYGON_MUMBAI]: polygonMumbaiConfig,
};

export const blockExplorers = {
  [chains.GOERLI]: 'https://goerli.etherscan.io',
  [chains.POLYGON_MUMBAI]: 'https://mumbai.polygonscan.com',
  [chains.POLYGON_MAINNET]: 'https://polygonscan.com',
  [chains.GNOSIS_CHIADO]: 'https://chiado.gnosis-safe.io',
};

// export const registrarAddress = '0x80Ca34172fFA772Bc22E7C92E8e0aa5098E02216';
export const registrarAddress = '0x3212B94c51b32289083CeA861718faE3AaE8a02c';
