import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const deploymentName = `${network.name}-verifier2`;
  await deploy(deploymentName, {
    from: deployer,
    contract: 'contracts/verifiers/Verifier2.sol:Verifier',
    args: [],
    log: true,
    autoMine: true,
  });
};

deploy.tags = ['verifier', 'verifier2'];
export default deploy;
