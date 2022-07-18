import { network } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/dist/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { developmentChains, networkConfig } from '../helper-hardhat.config';
import { verify } from '../utils/verify';

const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy, log } = deployments;
    const deployer = (await getNamedAccounts()).deployer;
    const chainId = network.config.chainId!;

    log('-------------------------------------------');

    const nftMarketplace = await deploy('NFTMarketplace', {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: networkConfig[chainId].blockConfirmations || 1,
    });

    log('-------------------------------------------');

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log('Verifying...');
        await verify(nftMarketplace.address, []);
    }
};

export default deployFunc;

deployFunc.tags = ['all', 'nftMarketplace'];
