import { ethers, network } from 'hardhat';
import { BasicNFT, NFTMarketplace } from '../typechain-types';
import { moveBlocks } from '../utils/moveBlock';

const TOKEN_ID = 3;

async function buyItem() {
    const nftMarketplace: NFTMarketplace = await ethers.getContract('NFTMarketplace');
    const basicNFT: BasicNFT = await ethers.getContract('BasicNFT');
    const player = (await ethers.getSigners())[1];

    const itemToBeBought = await nftMarketplace.getListing(basicNFT.address, TOKEN_ID);

    console.log(`Buying item with tokenID ${TOKEN_ID}....`);

    const txn = await nftMarketplace.connect(player).buyItem(basicNFT.address, TOKEN_ID, {
        value: itemToBeBought.price,
    });
    await txn.wait(1);

    console.log(`Item bought with tokenID ${TOKEN_ID}`);

    if (network.config.chainId?.toString() === '31337') {
        await moveBlocks(2, 1000);
    }
}

buyItem()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
