import { ethers, network } from 'hardhat';
import { BasicNFT, NFTMarketplace } from '../typechain-types';
import { moveBlocks } from '../utils/moveBlock';

const TOKEN_ID = 2;

async function getTokenURI() {
    const basicNFT: BasicNFT = await ethers.getContract('BasicNFT');
    const tokenURI = await basicNFT.tokenURI(TOKEN_ID);
    console.log(tokenURI);
}

getTokenURI()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
