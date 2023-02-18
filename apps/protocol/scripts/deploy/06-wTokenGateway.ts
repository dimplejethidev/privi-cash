import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { networks } from '../config';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId, network } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  const wToken = networks[chainId].nativeWToken;
  const wTokenAddress = networks[chainId].tokens[wToken].address;

  const deploymentName = `${network.name}-wTokenGateway`;
  await deploy(deploymentName, {
    from: deployer,
    contract: 'WTokenGateway',
    args: [wTokenAddress],
    log: true,
    autoMine: true,
  });
};

deploy.tags = ['wTokenGateway'];
export default deploy;
