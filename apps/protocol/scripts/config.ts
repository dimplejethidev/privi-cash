import { BigNumber } from 'ethers';
import { parseEther } from 'privi-utils';

type TokenInstance = {
  address: string;
  maxDepositAmount: BigNumber;
  numTreeLevels: number;
};

type NetworkInstances = {
  chainId: string;
  nativeWToken: string;
  sanctionsList: string;
  tokens: Record<string, TokenInstance>;
};

const goerli: NetworkInstances = {
  chainId: '5',
  nativeWToken: 'weth',
  sanctionsList: '0x40C57923924B5c5c5455c48D93317139ADDaC8fb',
  tokens: {
    weth: {
      address: '0xCCB14936C2E000ED8393A571D15A2672537838Ad',
      maxDepositAmount: parseEther('1'),
      numTreeLevels: 20,
    },
  },
};

const polygonMumbai: NetworkInstances = {
  chainId: '80001',
  nativeWToken: 'wmatic',
  sanctionsList: '0x80Ca34172fFA772Bc22E7C92E8e0aa5098E02216',
  tokens: {
    wmatic: {
      address: '0xf237dE5664D3c2D2545684E76fef02A3A58A364c',
      maxDepositAmount: parseEther('500'),
      numTreeLevels: 20,
    },
  },
};

const gnosisChiado: NetworkInstances = {
  chainId: '10200',
  nativeWToken: 'wxdai',
  sanctionsList: '0xAAB8Bd495Ae247DF6798A60b7f9c52e15dCb071b',
  tokens: {
    wxdai: {
      address: '0x8D08ac9a511581C7e5BDf8CEd27b7353d0EB7e40',
      maxDepositAmount: parseEther('1000'),
      numTreeLevels: 20,
    },
  },
};

// For deploy test run
const hardhat: NetworkInstances = {
  chainId: '31337',
  tokens: goerli.tokens,
  sanctionsList: goerli.sanctionsList,
  nativeWToken: goerli.nativeWToken,
};

export const networks: Record<string, NetworkInstances> = {
  [goerli.chainId]: goerli,
  [polygonMumbai.chainId]: polygonMumbai,
  [gnosisChiado.chainId]: gnosisChiado,
  [hardhat.chainId]: hardhat,
};
