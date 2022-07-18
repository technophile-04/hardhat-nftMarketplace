import { verify } from '../utils/verify';
import { DeployFunction } from 'hardhat-deploy/dist/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { developmentChains, networkConfig } from '../helper-hardhat.config';

const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts, network } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId!;

    log('-------------------------------------------------');
    const args: any[] = [];
    const basicNFT = await deploy('BasicNFT', {
        from: deployer,
        args,
        log: true,
        waitConfirmations: networkConfig[chainId].blockConfirmations || 1,
    });

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log('Verifying...');
        await verify(basicNFT.address, args);
    }
};

export default deployFunc;
deployFunc.tags = ['all', 'basicNFT'];
