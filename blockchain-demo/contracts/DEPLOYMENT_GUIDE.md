# Step-by-Step Contract Deployment Guide (Ethereum Sepolia)

This guide takes ~5 minutes using **Remix IDE**. You do **NOT** need Hardhat, Foundry, or any command-line tools.

---

## Prerequisites
1. **MetaMask** installed in your browser.
2. MetaMask switched to **Ethereum Sepolia** (Chain ID: `11155111`).
3. Some **Sepolia ETH** in your wallet for gas.

---

## Contract 1: Deploy `BlockchainIdentityNFT`

1. Open [https://remix.ethereum.org](https://remix.ethereum.org) in your browser.
2. In the left file explorer, under `contracts/`, click the **New File** icon and name it:
   `BlockchainIdentityNFT.sol`
3. Copy the entire contents of [`contracts/BlockchainIdentityNFT.sol`](./BlockchainIdentityNFT.sol) and paste it into Remix.
4. Click the **Solidity Compiler** tab (3rd icon on the left panel):
   - **Compiler version**: Select `0.8.20` (or `0.8.24` / `0.8.26`).
   - Click **Compile BlockchainIdentityNFT.sol**. (You will see a green checkmark ✓).
5. Click the **Deploy & Run Transactions** tab (4th icon on the left panel):
   - **Environment**: Select **Injected Provider - MetaMask**.
   - MetaMask will prompt you to connect. Approve the connection.
   - Verify that Remix displays network `11155111` (Sepolia).
   - **Contract**: Ensure `BlockchainIdentityNFT` is selected in the dropdown.
   - Click the orange **Deploy** button (no constructor parameters needed).
6. MetaMask will pop up asking you to confirm the transaction:
   - Click **Confirm**.
7. Wait 10–15 seconds for the transaction to be mined.
8. Under **Deployed Contracts** at the bottom left:
   - Click the **Copy** icon next to `BlockchainIdentityNFT at 0x...` to copy the deployed contract address.
   - Save this address as your **NFT Contract Address**.

---

## Contract 2: Deploy `NFTMarketplace`

1. In Remix, create a second file in `contracts/` and name it:
   `NFTMarketplace.sol`
2. Copy the entire contents of [`contracts/NFTMarketplace.sol`](./NFTMarketplace.sol) and paste it into Remix.
3. In the **Solidity Compiler** tab:
   - Click **Compile NFTMarketplace.sol** (green checkmark ✓).
4. In the **Deploy & Run Transactions** tab:
   - **Environment**: Still **Injected Provider - MetaMask**.
   - **Contract dropdown**: Select `NFTMarketplace`.
   - Click the orange **Deploy** button (no constructor parameters needed).
5. MetaMask will pop up:
   - Click **Confirm**.
6. Wait 10–15 seconds for confirmation.
7. Under **Deployed Contracts**:
   - Copy the address of `NFTMarketplace at 0x...`.
   - Save this address as your **Marketplace Contract Address**.

---

## Update Frontend

Open [`app.js`](../app.js) and update lines 58 and 79:

```javascript
const NFT_CONTRACT_ADDRESS = "0xYourDeployedNFTContractAddress";
const MARKETPLACE_ADDRESS  = "0xYourDeployedMarketplaceAddress";
```

Save the file and refresh your browser at `http://localhost:8080`.
The "⚙️ NFT Contracts Setup Required" card will automatically disappear, and all NFT functionality will be active.
