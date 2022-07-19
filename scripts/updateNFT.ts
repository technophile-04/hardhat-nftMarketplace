import { ethers, network } from 'hardhat';
import { BasicNFT, NFTMarketplace } from '../typechain-types';
import { moveBlocks } from '../utils/moveBlock';

const TOKEN_ID = 3;
const PRICE = ethers.utils.parseEther('0.02');

async function updateNFT() {
    const nftMarketplace: NFTMarketplace = await ethers.getContract('NFTMarketplace');
    const basicNFT: BasicNFT = await ethers.getContract('BasicNFT');

    console.log(`Updating item with tokenID ${TOKEN_ID}....`);
    const txn = await nftMarketplace.updateListing(basicNFT.address, TOKEN_ID, PRICE);
    await txn.wait(1);

    console.log(`Updated item with tokenID ${TOKEN_ID}`);

    if (network.config.chainId?.toString() === '31337') {
        await moveBlocks(2, 1000);
    }

    console.log(network.config.chainId?.toString());
    if (network.config.chainId?.toString() === '31337') {
        await moveBlocks(2, 1000);
    }
}

updateNFT()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
