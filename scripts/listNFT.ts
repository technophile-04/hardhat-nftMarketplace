import { ethers, network } from 'hardhat';
import { BasicNFT, NFTMarketplace } from '../typechain-types';
import { moveBlocks } from '../utils/moveBlock';
const PRICE = ethers.utils.parseEther('0.01');

async function list() {
    const nftMarketplace: NFTMarketplace = await ethers.getContract('NFTMarketplace');
    const basicNFT: BasicNFT = await ethers.getContract('BasicNFT');

    const tokenId = 0;

    // console.log('Approving marketplace....');
    // await basicNFT.approve(nftMarketplace.address, tokenId);

    console.log('Listing....');
    const txnRes = await nftMarketplace.listItem(basicNFT.address, tokenId, PRICE);
    const txnReceipt = await txnRes.wait(1);
    console.log('Listed on marketplace...');

    console.log(network.config.chainId?.toString());
    if (network.config.chainId?.toString() === '31337') {
        await moveBlocks(2, 1000);
    }
}

list()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
