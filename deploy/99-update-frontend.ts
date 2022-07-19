import { artifacts, ethers, network } from 'hardhat';
import fs from 'fs';
import path from 'path';
import { DeployFunction } from 'hardhat-deploy/dist/types';

interface ICurrentAddresses {
    [key: string]: {
        NFTMarketplace: string[];
        BasicNFT: string[];
    };
}

// const contractDir: string = "../lottery-frontend/contracts";
const contractDir: string = path.join('..', 'frontend-marketplace', 'contracts');
const FRONTEND_LOCATION_ADDRESSES_FILE: string = path.join(contractDir, 'contract-addresses.json');
const FRONTEND_LOCATION_MARKETPLACE_ABI_FILE: string = path.join(
    contractDir,
    'NFTMarketplace.json'
);
const FRONTEND_LOCATION_BASIC_NFT_ABI_FILE: string = path.join(contractDir, 'BasicNFT.json');

const deployFunc: DeployFunction = async () => {
    if (process.env.UPDATE_FRONTEND) {
        console.log('Update frontend', contractDir);
    }

    if (!fs.existsSync(contractDir)) {
        fs.mkdirSync(contractDir);
    }

    await updateContractAddresses();
    await updateABI();
};

const updateABI = async () => {
    const NFTMarketplace = artifacts.readArtifactSync('NFTMarketplace');
    const BasicNFT = artifacts.readArtifactSync('BasicNFT');

    fs.writeFileSync(
        FRONTEND_LOCATION_MARKETPLACE_ABI_FILE,
        JSON.stringify(NFTMarketplace, null, 2)
    );
    fs.writeFileSync(FRONTEND_LOCATION_BASIC_NFT_ABI_FILE, JSON.stringify(BasicNFT, null, 2));
};

const updateContractAddresses = async () => {
    const nftMarketplace = await ethers.getContract('NFTMarketplace');
    const basicNFT = await ethers.getContract('BasicNFT');
    const chainId = network.config.chainId?.toString()!;

    if (!fs.existsSync(FRONTEND_LOCATION_ADDRESSES_FILE)) {
        fs.writeFileSync(
            FRONTEND_LOCATION_ADDRESSES_FILE,
            JSON.stringify({
                [chainId]: {
                    NFTMarketplace: [nftMarketplace.address],
                    BasicNFT: [basicNFT.address],
                },
            })
        );
    } else {
        const currentAddresses: ICurrentAddresses = JSON.parse(
            fs.readFileSync(FRONTEND_LOCATION_ADDRESSES_FILE, 'utf8')
        );

        if (chainId in currentAddresses) {
            if (!currentAddresses[chainId].NFTMarketplace.includes(nftMarketplace.address)) {
                currentAddresses[chainId].NFTMarketplace.push(nftMarketplace.address);
            }
            if (!currentAddresses[chainId].BasicNFT.includes(basicNFT.address)) {
                currentAddresses[chainId].BasicNFT.push(basicNFT.address);
            }
        } else {
            currentAddresses[chainId].NFTMarketplace = [nftMarketplace.address];
            currentAddresses[chainId].BasicNFT = [basicNFT.address];
        }

        fs.writeFileSync(FRONTEND_LOCATION_ADDRESSES_FILE, JSON.stringify(currentAddresses));
    }
};
export default deployFunc;
deployFunc.tags = ['all', 'frontend'];
