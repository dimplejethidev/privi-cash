import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const deploymentName = `${network.name}-registrar`;
  await deploy(deploymentName, {
    from: deployer,
    contract: 'Registrar',
    args: [],
    log: true,
    autoMine: true,
  });
};

deploy.tags = ['registrar'];
export default deploy;
