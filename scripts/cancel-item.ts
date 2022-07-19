import { ethers, network } from 'hardhat';
import { BasicNFT, NFTMarketplace } from '../typechain-types';
import { moveBlocks } from '../utils/moveBlock';

const TOKEN_ID = 0;

async function cancelItem() {
    const nftMarketplace: NFTMarketplace = await ethers.getContract('NFTMarketplace');
    const basicNFT: BasicNFT = await ethers.getContract('BasicNFT');

    console.log(`Cancelling item with tokenID ${TOKEN_ID}....`);
    const txn = await nftMarketplace.cancelListing(basicNFT.address, TOKEN_ID);
    await txn.wait(1);

    console.log(`Canceled item with tokenID ${TOKEN_ID}`);

    if (network.config.chainId?.toString() === '31337') {
        await moveBlocks(2, 1000);
    }
}

cancelItem()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
