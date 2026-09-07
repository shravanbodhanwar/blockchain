const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log("🚀 Starting Deployment to Ethereum Sepolia...");
  console.log("==================================================");

  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    console.error("❌ Error: No deployer account found!");
    console.error("Please add your PRIVATE_KEY to .env file before deploying.");
    process.exit(1);
  }

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Deployer Address: ${deployer.address}`);
  console.log(`Account Balance:  ${hre.ethers.formatEther(balance)} SepoliaETH`);

  if (balance === 0n) {
    console.error("❌ Error: Deployer account has 0 Sepolia ETH.");
    console.error("Please fund your wallet using a Sepolia faucet (e.g. https://sepoliafaucet.com) to pay for gas.");
    process.exit(1);
  }

  // 1. Deploy BlockchainIdentityNFT
  console.log("\n📦 Deploying BlockchainIdentityNFT...");
  const NFTFactory = await hre.ethers.getContractFactory("BlockchainIdentityNFT");
  const nftContract = await NFTFactory.deploy();
  await nftContract.waitForDeployment();
  const nftAddress = await nftContract.getAddress();
  console.log(`✅ BlockchainIdentityNFT deployed to: ${nftAddress}`);

  // 2. Deploy NFTMarketplace
  console.log("\n📦 Deploying NFTMarketplace...");
  const MarketFactory = await hre.ethers.getContractFactory("NFTMarketplace");
  const marketContract = await MarketFactory.deploy();
  await marketContract.waitForDeployment();
  const marketAddress = await marketContract.getAddress();
  console.log(`✅ NFTMarketplace deployed to: ${marketAddress}`);

  console.log("\n==================================================");
  console.log("🎉 DEPLOYMENT SUMMARY");
  console.log("==================================================");
  console.log(`NFT Contract Address:         ${nftAddress}`);
  console.log(`Marketplace Contract Address: ${marketAddress}`);
  console.log("Network:                      Ethereum Sepolia");
  console.log("Chain ID:                     11155111");
  console.log("==================================================");

  // 3. Automatically update app.js frontend configuration
  const appJsPath = path.join(__dirname, "..", "app.js");
  if (fs.existsSync(appJsPath)) {
    let content = fs.readFileSync(appJsPath, "utf8");

    // Replace CONTRACTS configuration or individual address constants
    content = content.replace(
      /nft:\s*"(0x[a-fA-F0-9]{40})?"/,
      `nft: "${nftAddress}"`
    );
    content = content.replace(
      /marketplace:\s*"(0x[a-fA-F0-9]{40})?"/,
      `marketplace: "${marketAddress}"`
    );
    // Legacy fallback replacements
    content = content.replace(
      /const NFT_CONTRACT_ADDRESS\s*=\s*"(0x[a-fA-F0-9]{40})?";/,
      `const NFT_CONTRACT_ADDRESS = "${nftAddress}";`
    );
    content = content.replace(
      /const MARKETPLACE_ADDRESS\s*=\s*"(0x[a-fA-F0-9]{40})?";/,
      `const MARKETPLACE_ADDRESS = "${marketAddress}";`
    );

    fs.writeFileSync(appJsPath, content, "utf8");
    console.log("✅ Frontend app.js automatically updated with deployed contract addresses!");
  }

  console.log("\nNext steps:");
  console.log("1. View contracts on Sepolia Etherscan:");
  console.log(`   NFT:         https://sepolia.etherscan.io/address/${nftAddress}`);
  console.log(`   Marketplace: https://sepolia.etherscan.io/address/${marketAddress}`);
  console.log("2. Refresh your browser at http://localhost:8080");
  console.log("3. Start minting and trading NFTs!\n");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
