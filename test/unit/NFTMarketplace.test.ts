import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { assert, expect } from 'chai';
import { deployments, ethers, getNamedAccounts, network } from 'hardhat';
import { developmentChains } from '../../helper-hardhat.config';
import { BasicNFT, NFTMarketplace } from '../../typechain-types';

!developmentChains.includes(network.name)
    ? describe.skip
    : describe('NFT Marketplace tests', () => {
          let nftMarketplace: NFTMarketplace;
          let basicNFT: BasicNFT;
          let user: SignerWithAddress;
          let deployer: string;
          const PRICE = ethers.utils.parseEther('0.1');
          const TOKEN_ID = 0;
          beforeEach(async () => {
              await deployments.fixture(['all']);
              nftMarketplace = await ethers.getContract('NFTMarketplace');
              basicNFT = await ethers.getContract('BasicNFT');
              deployer = (await getNamedAccounts()).deployer;
              user = (await ethers.getSigners())[1];
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

          describe('buyItem', function () {
              it('reverts if the item isnt listed', async function () {
                  await expect(
                      nftMarketplace.buyItem(basicNFT.address, TOKEN_ID)
                  ).to.be.revertedWithCustomError(nftMarketplace, 'NFTMarketplace__NotListed');
              });
              it('reverts if the price isnt met', async function () {
                  await nftMarketplace.listItem(basicNFT.address, TOKEN_ID, PRICE);
                  await expect(
                      nftMarketplace.buyItem(basicNFT.address, TOKEN_ID)
                  ).to.be.revertedWithCustomError(nftMarketplace, 'NFTMarketplace__PriceNotMet');
              });
              it('transfers the nft to the buyer and updates internal proceeds mapping', async function () {
                  await nftMarketplace.listItem(basicNFT.address, TOKEN_ID, PRICE);

                  expect(
                      await nftMarketplace
                          .connect(user)
                          .buyItem(basicNFT.address, TOKEN_ID, { value: PRICE })
                  ).to.emit(nftMarketplace, 'ItemBought');
                  const newOwner = await basicNFT.ownerOf(TOKEN_ID);
                  const deployerProceeds = await nftMarketplace.getProceeds();
                  assert(newOwner.toString() === user.address);
                  assert(deployerProceeds.toString() === PRICE.toString());
              });
          });

          describe('cancelListing', function () {
              it('reverts if there is no listing', async function () {
                  const error = `NFTMarketplace__NotListed`;
                  await expect(
                      nftMarketplace.cancelListing(basicNFT.address, TOKEN_ID)
                  ).to.be.revertedWithCustomError(nftMarketplace, error);
              });
              it('reverts if anyone but the owner tries to call', async function () {
                  await nftMarketplace.listItem(basicNFT.address, TOKEN_ID, PRICE);
                  await basicNFT.approve(user.address, TOKEN_ID);
                  await expect(
                      nftMarketplace.connect(user).cancelListing(basicNFT.address, TOKEN_ID)
                  ).to.be.revertedWithCustomError(nftMarketplace, 'NFTMarketplace__NotOwner');
              });
              it('emits event and removes listing', async function () {
                  await nftMarketplace.listItem(basicNFT.address, TOKEN_ID, PRICE);
                  expect(await nftMarketplace.cancelListing(basicNFT.address, TOKEN_ID)).to.emit(
                      nftMarketplace,
                      'ItemCanceled'
                  );
                  const listing = await nftMarketplace.getListing(basicNFT.address, TOKEN_ID);
                  assert.strictEqual(listing.price.toString(), '0');
              });
          });
      });
