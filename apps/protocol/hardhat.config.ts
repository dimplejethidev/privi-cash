import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-deploy';
import '@openzeppelin/hardhat-upgrades';
import dotenv from 'dotenv';

dotenv.config();

const rpcGoerli = process.env.RPC_GOERLI as string;
const rpcPolygonMumbai = process.env.RPC_POLYGON_MUMBAI as string;
const rpcPolygonMainnet = process.env.RPC_POLYGON_MAINNET as string;
const rpcGnosisChiado = process.env.RPC_GNOSIS_CHIADO as string;

const privateKeys = (process.env.PRIVATE_KEYS_TEST as string).split(',');
const forkEnabled = process.env.HARDHAT_FORK === 'true';

const forkBlock = {
  goerli: 8361140,
  mumbai: 30794887,
  polygon: 28876152,
};

const config: HardhatUserConfig = {
  solidity: { compilers: [{ version: '0.8.17' }, { version: '0.6.11' }] },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      forking: {
        url: rpcGoerli,
        blockNumber: forkBlock.goerli,
        enabled: forkEnabled,
      },
      saveDeployments: true,
    },
    polygon: {
      url: rpcPolygonMainnet,
      accounts: privateKeys,
    },
    mumbai: {
      url: rpcPolygonMumbai,
      accounts: privateKeys,
    },
    goerli: {
      url: rpcGoerli,
      accounts: privateKeys,
    },
    chiado: {
      url: rpcGnosisChiado,
      accounts: privateKeys,
    },
  },
  namedAccounts: {
    deployer: 0,
  },
  paths: {
    deploy: './scripts/deploy',
  },
};

export default config;
