import { ZERO_LEAF } from '@privi-cash/common';
import { constants } from 'ethers';
import { rpcGnosisChiado, rpcGoerli, rpcPolygonMumbai } from './env';

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
  registrar: string;
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

//@todo update deployed blocks

// #####################################
// #     GNOSIS CHIADO INSTANCES       #
// #####################################
const gnosisChiadoConfig: InstanceConfig = {
  rpcUrl: rpcGnosisChiado,
  wTokenGateway: '0xA3410F89bD9AF9858100062123717d2b21e31e53',
  registrar: '0x3212B94c51b32289083CeA861718faE3AaE8a02c',
  instances: {
    xdai: {
      pool: '0x80Ca34172fFA772Bc22E7C92E8e0aa5098E02216',
      deployedBlock: 28876158,
      treeHeight: 20,
      zeroElement: ZERO_LEAF,
      token: {
        address: constants.AddressZero,
        name: 'xdai',
        symbol: 'xDAI',
        decimals: 18,
        isNative: true,
        iconUrl: '/images/dai.png',
      },
    },
    wxdai: {
      pool: '0x80Ca34172fFA772Bc22E7C92E8e0aa5098E02216',
      deployedBlock: 28876158,
      treeHeight: 20,
      zeroElement: ZERO_LEAF,
      token: {
        address: '0x8D08ac9a511581C7e5BDf8CEd27b7353d0EB7e40',
        name: 'wxdai',
        symbol: 'WXDAI',
        decimals: 18,
        isNative: false,
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
  registrar: '0x3212B94c51b32289083CeA861718faE3AaE8a02c',
  instances: {
    matic: {
      pool: '0x28a37a8d3078162EA2109852a2835949A382AE12',
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
      pool: '0x28a37a8d3078162EA2109852a2835949A382AE12',
      deployedBlock: 28876158,
      treeHeight: 20,
      zeroElement: ZERO_LEAF,
      token: {
        address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
        name: 'wmatic',
        symbol: 'WMATIC',
        decimals: 18,
        isNative: false,
        iconUrl: '/images/matic.png',
      },
    },
  },
};

// #####################################
// #         GOERLI INSTANCES          #
// #####################################
const goerliConfig: InstanceConfig = {
  rpcUrl: rpcGoerli,
  wTokenGateway: '0x92D0A9283028aE4d4B2AAff79add531CA20fE40E',
  registrar: '0x930677540ab430420055528D7d952B502A3d109b',
  instances: {
    eth: {
      pool: '0x986BEe188e81B0413DAbbC6D31C5d547Dd5431Cd',
      deployedBlock: 28876158,
      treeHeight: 20,
      zeroElement: ZERO_LEAF,
      token: {
        address: constants.AddressZero,
        name: 'eth',
        symbol: 'ETH',
        decimals: 18,
        isNative: true,
        iconUrl: '/images/eth.png',
      },
    },
    weth: {
      pool: '0x986BEe188e81B0413DAbbC6D31C5d547Dd5431Cd',
      deployedBlock: 28876158,
      treeHeight: 20,
      zeroElement: ZERO_LEAF,
      token: {
        address: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
        name: 'weth',
        symbol: 'WETH',
        decimals: 18,
        isNative: false,
        iconUrl: '/images/eth.png',
      },
    },
  },
};

export const instanceConfig: Record<number, InstanceConfig> = {
  [chains.GNOSIS_CHIADO]: gnosisChiadoConfig,
  [chains.POLYGON_MUMBAI]: polygonMumbaiConfig,
  [chains.GOERLI]: goerliConfig,
};

export const blockExplorers = {
  [chains.GOERLI]: 'https://goerli.etherscan.io',
  [chains.POLYGON_MUMBAI]: 'https://mumbai.polygonscan.com',
  [chains.POLYGON_MAINNET]: 'https://polygonscan.com',
  [chains.GNOSIS_CHIADO]: 'https://blockscout.chiadochain.net',
};
