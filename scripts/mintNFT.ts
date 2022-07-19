import { ethers, network } from 'hardhat';
import { BasicNFT, NFTMarketplace } from '../typechain-types';
import { moveBlocks } from '../utils/moveBlock';

async function mint() {
    const basicNFT: BasicNFT = await ethers.getContract('BasicNFT');

    console.log('Minting NFT....');
    let txnRes = await basicNFT.mintNft();
    let txnReceipt = await txnRes.wait(1);
    const tokenId = txnReceipt.events![0]?.args?.tokenId;
    console.log(`Minted TokenID : ${tokenId}`);
    console.log('NFT Minted....');

    console.log(network.config.chainId?.toString());
    if (network.config.chainId?.toString() === '31337') {
        await moveBlocks(2, 1000);
    }
}

mint()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
