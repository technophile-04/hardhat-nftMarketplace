import { ethers } from 'hardhat';
import { BasicNFT, NFTMarketplace } from '../typechain-types';

const PRICE = ethers.utils.parseEther('0.01');

async function mintAndList() {
    const nftMarketplace: NFTMarketplace = await ethers.getContract('NFTMarketplace');
    const basicNFT: BasicNFT = await ethers.getContract('BasicNFT');

    console.log('Minting NFT....');
    let txnRes = await basicNFT.mintNft();
    let txnReceipt = await txnRes.wait(1);
    const tokenId = txnReceipt.events![0]?.args?.tokenId;
    console.log('NFT Minted....');

    console.log('Approving marketplace....');
    await basicNFT.approve(nftMarketplace.address, tokenId);

    console.log('Listing....');
    txnRes = await nftMarketplace.listItem(basicNFT.address, tokenId, PRICE);
    txnReceipt = await txnRes.wait(1);
    console.log('Listing on marketplace...');
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
