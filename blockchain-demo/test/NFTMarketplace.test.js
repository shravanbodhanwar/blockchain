const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BlockchainIdentityNFT & NFTMarketplace", function () {
  let nft, market;
  let owner, seller, buyer;

  beforeEach(async function () {
    [owner, seller, buyer] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("BlockchainIdentityNFT");
    nft = await NFT.deploy();
    await nft.waitForDeployment();

    const Market = await ethers.getContractFactory("NFTMarketplace");
    market = await Market.deploy();
    await market.waitForDeployment();
  });

  it("Should deploy both contracts and have correct names", async function () {
    expect(await nft.name()).to.equal("BlockchainIdentityNFT");
    expect(await nft.symbol()).to.equal("BINFT");
    expect(await nft.totalSupply()).to.equal(0n);
  });

  it("Should mint an NFT with tokenURI and record creator", async function () {
    const uri = "ipfs://QmTestCID123456789";
    const tx = await nft.connect(seller).mintNFT(uri);
    await tx.wait();

    expect(await nft.totalSupply()).to.equal(1n);
    expect(await nft.ownerOf(0)).to.equal(seller.address);
    expect(await nft.tokenURI(0)).to.equal(uri);
    expect(await nft.tokenCreators(0)).to.equal(seller.address);
  });

  it("Should list an NFT on marketplace after approval", async function () {
    const uri = "ipfs://QmTestCID123456789";
    await nft.connect(seller).mintNFT(uri);

    const nftAddress = await nft.getAddress();
    const marketAddress = await market.getAddress();

    await nft.connect(seller).approve(marketAddress, 0);

    const price = ethers.parseEther("0.05");
    await market.connect(seller).listNFT(nftAddress, 0, price);

    const [listingSeller, listingPrice, active] = await market.getListing(nftAddress, 0);
    expect(listingSeller).to.equal(seller.address);
    expect(listingPrice).to.equal(price);
    expect(active).to.be.true;
  });

  it("Should allow a buyer to buy the listed NFT", async function () {
    const uri = "ipfs://QmTestCID123456789";
    await nft.connect(seller).mintNFT(uri);

    const nftAddress = await nft.getAddress();
    const marketAddress = await market.getAddress();

    await nft.connect(seller).approve(marketAddress, 0);
    const price = ethers.parseEther("0.1");
    await market.connect(seller).listNFT(nftAddress, 0, price);

    const sellerBalBefore = await ethers.provider.getBalance(seller.address);

    await market.connect(buyer).buyNFT(nftAddress, 0, { value: price });

    expect(await nft.ownerOf(0)).to.equal(buyer.address);

    const [, , active] = await market.getListing(nftAddress, 0);
    expect(active).to.be.false;

    const sellerBalAfter = await ethers.provider.getBalance(seller.address);
    expect(sellerBalAfter - sellerBalBefore).to.equal(price);
  });

  it("Should allow seller to cancel listing", async function () {
    const uri = "ipfs://QmTestCID123456789";
    await nft.connect(seller).mintNFT(uri);

    const nftAddress = await nft.getAddress();
    const marketAddress = await market.getAddress();

    await nft.connect(seller).approve(marketAddress, 0);
    const price = ethers.parseEther("0.05");
    await market.connect(seller).listNFT(nftAddress, 0, price);

    await market.connect(seller).cancelListing(nftAddress, 0);
    const [, , active] = await market.getListing(nftAddress, 0);
    expect(active).to.be.false;
  });

  it("Should allow direct transfer of NFT", async function () {
    const uri = "ipfs://QmTestCID123456789";
    await nft.connect(seller).mintNFT(uri);

    await nft.connect(seller).transferFrom(seller.address, buyer.address, 0);
    expect(await nft.ownerOf(0)).to.equal(buyer.address);
  });
});
