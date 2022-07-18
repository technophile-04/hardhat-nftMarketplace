import { assert, expect } from 'chai';
import { deployments, ethers, getNamedAccounts, network } from 'hardhat';
import { developmentChains } from '../../helper-hardhat.config';
import { BasicNFT, NFTMarketplace } from '../../typechain-types';

!developmentChains.includes(network.name)
    ? describe.skip
    : describe('NFT Marketplace tests', () => {
          let nftMarketplace: NFTMarketplace;
          let basicNFT: BasicNFT;
          let player: string;
          let deployer: string;
          const PRICE = ethers.utils.parseEther('0.1');
          const TOKEN_ID = 0;
          beforeEach(async () => {
              await deployments.fixture(['all']);
              nftMarketplace = await ethers.getContract('NFTMarketplace');
              basicNFT = await ethers.getContract('BasicNFT');
              deployer = (await getNamedAccounts()).deployer;
              player = (await getNamedAccounts()).player;
              await basicNFT.mintNft();
              await basicNFT.approve(nftMarketplace.address, TOKEN_ID);
          });

          describe('listItem', async () => {
              it('emit an event after listing NFT', async () => {
                  await expect(nftMarketplace.listItem(basicNFT.address, TOKEN_ID, PRICE)).to.emit(
                      nftMarketplace,
                      'ItemListed'
                  );
              });
              it('only allow owner to list', async function () {
                  const accounts = await ethers.getSigners();
                  const player = accounts[1];
                  await basicNFT.approve(player.address, TOKEN_ID);
                  await expect(
                      nftMarketplace.connect(player).listItem(basicNFT.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWithCustomError(nftMarketplace, 'NFTMarketplace__NotOwner');
              });
              it('revert when item is listed again', async function () {
                  await nftMarketplace.listItem(basicNFT.address, TOKEN_ID, PRICE);
                  await expect(
                      nftMarketplace.listItem(basicNFT.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWithCustomError(
                      nftMarketplace,
                      'NFTMarketplace__NFTAlreadyListed'
                  );
              });
              it('revert if no approvals', async function () {
                  await basicNFT.approve(ethers.constants.AddressZero, TOKEN_ID);
                  await expect(
                      nftMarketplace.listItem(basicNFT.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWithCustomError(
                      nftMarketplace,
                      'NFTMarketplace__NotApprovedForMarketplace'
                  );
              });
              it('Updates listing with seller and price', async function () {
                  await nftMarketplace.listItem(basicNFT.address, TOKEN_ID, PRICE);
                  const listing = await nftMarketplace.getListing(basicNFT.address, TOKEN_ID);
                  assert(listing.price.toString() === PRICE.toString());
                  assert(listing.seller.toString() === deployer);
              });
          });
      });
