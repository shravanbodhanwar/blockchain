// ============================================================
// BLOCKCHAIN IDENTITY & NFT MARKETPLACE — MODERN WEB3 ENGINE
// Decentralized on Ethereum Sepolia (Chain ID: 11155111)
// Ethers.js v6 · MetaMask · ERC-721 · Hardhat
// ============================================================

// ============================================================
// 1. CONFIGURATION & CONTRACT ADDRESSES
// ============================================================

const CONTRACTS = {
    sepolia: {
        identity:    "0x33F5422Dc7fca52D844a8e382A885C6832E72E60",
        nft:         "0x7aF25E48e8F80De26DA27b29659e661eA438Da93",
        marketplace: "0x284eF61ce8e59959249D1Be80d7FadB9F3E58e11"
    }
};

const SEPOLIA_DEPLOYMENT_BLOCK = 11653150;
const USER_STORAGE_ADDRESS     = CONTRACTS.sepolia.identity;
const CONTRACT_ADDRESS         = USER_STORAGE_ADDRESS; // Backward-compatibility alias
const NFT_CONTRACT_ADDRESS     = CONTRACTS.sepolia.nft;
const MARKETPLACE_ADDRESS      = CONTRACTS.sepolia.marketplace;

const SEPOLIA_CHAIN_ID         = "11155111";
const SEPOLIA_CHAIN_ID_HEX     = "0xaa36a7";
const ETHERSCAN_BASE_URL       = "https://sepolia.etherscan.io";
const IPFS_GATEWAY             = "https://ipfs.io/ipfs/";
const ZERO_ADDRESS             = "0x0000000000000000000000000000000000000000";

// Permanently removed/filtered tokens (e.g. test tokens #0, #1, #2)
const REMOVED_TOKEN_IDS        = new Set(["0", "1", "2"]);

// ============================================================
// 2. CONTRACT ABIs
// ============================================================

const USER_STORAGE_ABI = [
    "function storeUser(string memory _name, string memory _role) public",
    "function getUser(address _user) public view returns (string memory, string memory)",
    "event UserStored(address indexed user, string name, string role)"
];
const CONTRACT_ABI = USER_STORAGE_ABI;

const NFT_ABI = [
    "function name() public view returns (string)",
    "function symbol() public view returns (string)",
    "function mintNFT(string memory metadataURI) public returns (uint256)",
    "function ownerOf(uint256 tokenId) public view returns (address)",
    "function tokenURI(uint256 tokenId) public view returns (string memory)",
    "function totalSupply() public view returns (uint256)",
    "function tokenCreators(uint256 tokenId) public view returns (address)",
    "function getApproved(uint256 tokenId) public view returns (address)",
    "function isApprovedForAll(address owner, address operator) public view returns (bool)",
    "function approve(address to, uint256 tokenId) public",
    "function setApprovalForAll(address operator, bool approved) public",
    "function transferFrom(address from, address to, uint256 tokenId) public",
    "function safeTransferFrom(address from, address to, uint256 tokenId) public",
    "function balanceOf(address owner) public view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "event NFTMinted(address indexed creator, uint256 indexed tokenId, string tokenURI)",
    "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)"
];

const MARKETPLACE_ABI = [
    "function listNFT(address nftContract, uint256 tokenId, uint256 price) external",
    "function cancelListing(address nftContract, uint256 tokenId) external",
    "function buyNFT(address nftContract, uint256 tokenId) external payable",
    "function getListing(address nftContract, uint256 tokenId) external view returns (address seller, uint256 price, bool active)",
    "function listings(address, uint256) external view returns (address seller, uint256 price, bool active)",
    "event NFTListed(address indexed nftContract, uint256 indexed tokenId, address indexed seller, uint256 price)",
    "event NFTSold(address indexed nftContract, uint256 indexed tokenId, address seller, address indexed buyer, uint256 price)",
    "event ListingCancelled(address indexed nftContract, uint256 indexed tokenId, address indexed seller)"
];

// ============================================================
// 3. DOM ELEMENT REFERENCES
// ============================================================

function el(id) { return document.getElementById(id); }

const dom = {
    // Header & Nav
    logoLink:                  el("logoLink"),
    mainNav:                   el("mainNav"),
    connectBtn:                el("connectBtn"),
    connectBtnText:            el("connectBtnText"),
    networkBadge:              el("networkBadge"),
    networkDot:                el("networkDot"),
    networkName:               el("networkName"),
    mobileNavToggle:           el("mobileNavToggle"),
    
    // Wallet Drawer
    walletDrawer:              el("walletDrawer"),
    closeWalletDrawer:         el("closeWalletDrawer"),
    drawerWalletAddress:       el("drawerWalletAddress"),
    drawerCopyBtn:             el("drawerCopyBtn"),
    drawerBalance:             el("drawerBalance"),
    drawerEtherscanLink:       el("drawerEtherscanLink"),
    disconnectBtn:             el("disconnectBtn"),

    // Warnings & Setup
    noMetamaskCard:            el("noMetamaskCard"),
    wrongNetworkCard:          el("wrongNetworkCard"),
    switchNetworkBtn:          el("switchNetworkBtn"),
    setupCard:                 el("setupCard"),
    setupCardTitle:            el("setupCardTitle"),
    setupCardMessage:          el("setupCardMessage"),

    // Explore / Home
    statExploreTotalMinted:    el("statExploreTotalMinted"),
    statExploreListed:         el("statExploreListed"),
    statExploreVolume:         el("statExploreVolume"),
    statExploreCreators:       el("statExploreCreators"),
    exploreFeaturedGrid:       el("exploreFeaturedGrid"),

    // Marketplace
    marketSearchInput:         el("marketSearchInput"),
    marketSortSelect:          el("marketSortSelect"),
    marketLoading:             el("marketLoading"),
    marketEmpty:               el("marketEmpty"),
    marketEmptyTitle:          el("marketEmptyTitle"),
    marketEmptySubtitle:       el("marketEmptySubtitle"),
    marketStatListed:          el("marketStatListed"),
    marketStatUnlisted:        el("marketStatUnlisted"),
    marketStatAll:             el("marketStatAll"),
    marketGrid:                el("marketGrid"),

    // Create Studio & Live Preview
    previewNftCard:            el("previewNftCard"),
    previewImg:                el("previewImg"),
    previewBadge:              el("previewBadge"),
    previewCategory:           el("previewCategory"),
    previewTitle:              el("previewTitle"),
    previewTokenId:            el("previewTokenId"),
    previewDesc:               el("previewDesc"),
    previewPrice:              el("previewPrice"),
    modeAutoBtn:               el("modeAutoBtn"),
    modeManualBtn:             el("modeManualBtn"),
    autoMetadataFields:        el("autoMetadataFields"),
    manualMetadataFields:      el("manualMetadataFields"),
    nftNameInput:              el("nftNameInput"),
    nftDescInput:              el("nftDescInput"),
    nftImageInput:             el("nftImageInput"),
    nftCategoryInput:          el("nftCategoryInput"),
    nftInitialPriceInput:      el("nftInitialPriceInput"),
    nftNameError:              el("nftNameError"),
    nftDescError:              el("nftDescError"),
    nftImageError:             el("nftImageError"),
    manualUriInput:            el("manualUriInput"),
    manualUriError:            el("manualUriError"),
    mintBtn:                   el("mintBtn"),
    mintTxCard:                el("mintTxCard"),
    mintTxStatus:              el("mintTxStatus"),
    mintTxDetails:             el("mintTxDetails"),
    mintTokenId:               el("mintTokenId"),
    mintTxHash:                el("mintTxHash"),
    mintTxBlock:               el("mintTxBlock"),
    mintTxActions:             el("mintTxActions"),
    mintEtherscanLink:         el("mintEtherscanLink"),
    step1Node:                 el("step1Node"),
    step2Node:                 el("step2Node"),
    step3Node:                 el("step3Node"),
    sampleArt1:                el("sampleArt1"),
    sampleArt2:                el("sampleArt2"),
    sampleArt3:                el("sampleArt3"),

    // Portfolio (My NFTs)
    portfolioWalletAddr:       el("portfolioWalletAddr"),
    portStatOwned:             el("portStatOwned"),
    portStatCreated:           el("portStatCreated"),
    portStatListed:            el("portStatListed"),
    portStatHidden:            el("portStatHidden"),
    refreshMyNftsBtn:          el("refreshMyNftsBtn"),
    myNftsLoading:             el("myNftsLoading"),
    myNftsEmpty:               el("myNftsEmpty"),
    myNftsGrid:                el("myNftsGrid"),

    // Identity
    identityLoading:           el("identityLoading"),
    identityEmpty:             el("identityEmpty"),
    identityData:              el("identityData"),
    displayName:               el("displayName"),
    displayRole:               el("displayRole"),
    displayWallet:             el("displayWallet"),
    refreshBtn:                el("refreshBtn"),
    storeForm:                 el("storeForm"),
    inputName:                 el("inputName"),
    inputRole:                 el("inputRole"),
    nameError:                 el("nameError"),
    roleError:                 el("roleError"),
    submitBtn:                 el("submitBtn"),
    txCard:                    el("txCard"),
    txStatus:                  el("txStatus"),
    txDetails:                 el("txDetails"),
    txHash:                    el("txHash"),
    txBlock:                   el("txBlock"),
    txResult:                  el("txResult"),
    txActions:                 el("txActions"),
    etherscanTxLink:           el("etherscanTxLink"),
    copyContractBtn:           el("copyContractBtn"),
    nftContractDisplay:        el("nftContractDisplay"),
    marketplaceContractDisplay:el("marketplaceContractDisplay"),
    copyNftContractBtn:        el("copyNftContractBtn"),
    copyMarketplaceBtn:        el("copyMarketplaceBtn"),

    // Activity Feed
    refreshActivityBtn:        el("refreshActivityBtn"),
    actStatTotal:              el("actStatTotal"),
    actStatMints:              el("actStatMints"),
    actStatListings:           el("actStatListings"),
    actStatSales:              el("actStatSales"),
    activityLoading:           el("activityLoading"),
    activityEmpty:             el("activityEmpty"),
    activityBody:              el("activityBody"),
    activityTableBody:         el("activityTableBody"),

    // Detail Modal
    nftModal:                  el("nftModal"),
    modalClose:                el("modalClose"),
    modalImage:                el("modalImage"),
    modalCategory:             el("modalCategory"),
    modalName:                 el("modalName"),
    modalTokenId:              el("modalTokenId"),
    modalDesc:                 el("modalDesc"),
    modalOwner:                el("modalOwner"),
    modalCreator:              el("modalCreator"),
    modalListingStatus:        el("modalListingStatus"),
    modalPrice:                el("modalPrice"),
    modalContract:             el("modalContract"),
    modalMetadataUri:          el("modalMetadataUri"),
    modalTxStatus:             el("modalTxStatus"),
    modalActions:              el("modalActions"),

    // Sell Modal
    sellModal:                 el("sellModal"),
    sellModalClose:            el("sellModalClose"),
    sellPriceInput:            el("sellPriceInput"),
    sellPriceError:            el("sellPriceError"),
    sellTxStatus:              el("sellTxStatus"),
    sellConfirmBtn:            el("sellConfirmBtn"),

    // Transfer Modal
    transferModal:             el("transferModal"),
    transferModalClose:        el("transferModalClose"),
    transferAddressInput:      el("transferAddressInput"),
    transferAddressError:      el("transferAddressError"),
    transferTxStatus:          el("transferTxStatus"),
    transferConfirmBtn:        el("transferConfirmBtn"),

    // Delist Modal (Remove from Marketplace)
    delistModal:               el("delistModal"),
    delistModalClose:          el("delistModalClose"),
    delistTokenDisplay:        el("delistTokenDisplay"),
    delistPriceDisplay:        el("delistPriceDisplay"),
    delistTxStatus:            el("delistTxStatus"),
    delistConfirmBtn:          el("delistConfirmBtn"),
    delistCancelBtn:           el("delistCancelBtn"),

    // Toast
    toastContainer:            el("toastContainer")
};

// ============================================================
// 4. GLOBAL APPLICATION STATE
// ============================================================

let currentAccount       = null;
let provider             = null;
let signer               = null;
let contract             = null;   // UserStorage (read)
let nftContract          = null;   // BlockchainIdentityNFT (read)
let nftContractWrite     = null;   // NFT (write)
let marketContract       = null;   // NFTMarketplace (read)
let marketContractWrite  = null;   // Marketplace (write)
let currentChainId       = null;
let metadataMode         = "auto";

// Cached Data Collections
let allTokensCache       = [];     // Array of fully hydrated NFT objects
let allActivityEvents    = [];     // Raw and normalized blockchain events
let blockTimeCache       = new Map();
let nftMetadataCache     = new Map();

// Active Filters & UI State
let activeTab            = "explore";
let currentMarketFilter  = "for-sale";  // Default: Listed for Sale (removes non-listed NFTs from marketplace)
let currentMarketSort    = "newest";
let currentPortfolioFilter = "owned";
let currentActFilter     = "all";
let activeModalTokenId   = null;
let activeDelistTokenId  = null;

// Hidden Tokens Local Persistence
function getHiddenTokens() {
    try {
        return new Set(JSON.parse(localStorage.getItem("binft_hidden_tokens") || "[]"));
    } catch { return new Set(); }
}

function toggleHideToken(tokenId) {
    const hidden = getHiddenTokens();
    const idStr = tokenId.toString();
    if (hidden.has(idStr)) {
        hidden.delete(idStr);
        showToast(`Token #${idStr} restored to view`, "👁️");
    } else {
        hidden.add(idStr);
        showToast(`Token #${idStr} hidden from portfolio`, "🙈");
    }
    try {
        localStorage.setItem("binft_hidden_tokens", JSON.stringify(Array.from(hidden)));
    } catch {}
    renderMarketplace();
    renderPortfolio();
    updateStatsRibbon();
}

let isMetaMaskListenersRegistered = false;
let isConnecting                  = false;
let isFutureListenersAttached     = false;

// ============================================================
// 5. PROVIDER & SIGNER SINGLETON
// ============================================================

function getProvider() {
    if (!provider && window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
    }
    return provider;
}

async function getSigner() {
    const p = getProvider();
    if (!p) throw new Error("MetaMask is not available.");
    signer = await p.getSigner();
    return signer;
}

// Fallback high-availability RPC for background data queries when MetaMask is busy
function getReadOnlyRpcProvider() {
    return new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
}

// ============================================================
// 6. UTILITY FUNCTIONS
// ============================================================

function shortenAddress(addr) {
    if (!addr) return "—";
    return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function ipfsToHttp(uri) {
    if (!uri) return "";
    uri = uri.trim();
    if (uri.startsWith("ipfs://ipfs/")) return IPFS_GATEWAY + uri.slice(12);
    if (uri.startsWith("ipfs://")) return IPFS_GATEWAY + uri.slice(7);
    if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{55})/i.test(uri)) return IPFS_GATEWAY + uri;
    return uri;
}

function nftContractsConfigured() {
    return Boolean(
        CONTRACTS.sepolia.nft &&
        ethers.isAddress(CONTRACTS.sepolia.nft) &&
        CONTRACTS.sepolia.marketplace &&
        ethers.isAddress(CONTRACTS.sepolia.marketplace)
    );
}

function isSepoliaActive() {
    return currentChainId === SEPOLIA_CHAIN_ID;
}

function showToast(msg, icon = "ℹ️") {
    if (!dom.toastContainer) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(msg)}</span>`;
    dom.toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

function showSuccess(msg) { showToast(msg, "✅"); }
function showError(msg)   { showToast(msg, "⚠️"); }

// ============================================================
// 7. INITIALISATION & METAMASK EVENT GUARDS
// ============================================================

async function init() {
    updateContractStaticDisplay();
    if (!window.ethereum) {
        showNoMetaMask();
        loadPublicData();
        return;
    }
    setupMetaMaskEventListeners();
    await checkNetwork();
    await autoConnectWallet();
    loadPublicData();
}

function updateContractStaticDisplay() {
    if (dom.nftContractDisplay) {
        dom.nftContractDisplay.innerHTML = `<a href="${ETHERSCAN_BASE_URL}/address/${CONTRACTS.sepolia.nft}" target="_blank" rel="noopener noreferrer">${CONTRACTS.sepolia.nft} ↗</a>`;
    }
    if (dom.marketplaceContractDisplay) {
        dom.marketplaceContractDisplay.innerHTML = `<a href="${ETHERSCAN_BASE_URL}/address/${CONTRACTS.sepolia.marketplace}" target="_blank" rel="noopener noreferrer">${CONTRACTS.sepolia.marketplace} ↗</a>`;
    }
}

function setupMetaMaskEventListeners() {
    if (isMetaMaskListenersRegistered || !window.ethereum) return;
    isMetaMaskListenersRegistered = true;

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        currentAccount = null;
        updateWalletUI();
        showToast("Wallet disconnected", "🔌");
    } else if (accounts[0] !== currentAccount) {
        currentAccount = accounts[0];
        updateWalletUI();
        showSuccess(`Account changed: ${shortenAddress(currentAccount)}`);
        postConnection();
    }
}

function handleChainChanged(chainIdHex) {
    currentChainId = parseInt(chainIdHex, 16).toString();
    updateNetworkBadge();
    if (isSepoliaActive()) {
        hideWrongNetwork();
        initializeBlockchain();
        postConnection();
    } else {
        showWrongNetwork();
    }
}

async function checkNetwork() {
    if (!window.ethereum) return;
    try {
        const hex = await window.ethereum.request({ method: "eth_chainId" });
        currentChainId = parseInt(hex, 16).toString();
        updateNetworkBadge();
        if (!isSepoliaActive()) showWrongNetwork(); else hideWrongNetwork();
    } catch (err) {
        console.warn("checkNetwork warning:", err);
    }
}

function updateNetworkBadge() {
    if (!dom.networkBadge) return;
    if (isSepoliaActive()) {
        dom.networkDot.className = "network-dot active";
        dom.networkName.textContent = "Sepolia (11155111)";
        dom.networkBadge.className = "network-badge";
    } else {
        dom.networkDot.className = "network-dot";
        dom.networkName.textContent = currentChainId ? `Wrong Network (${currentChainId})` : "Disconnected";
        dom.networkBadge.className = "network-badge";
    }
}

function showNoMetaMask() {
    if (dom.noMetamaskCard) dom.noMetamaskCard.hidden = false;
}

function showWrongNetwork() {
    if (dom.wrongNetworkCard) dom.wrongNetworkCard.hidden = false;
}

function hideWrongNetwork() {
    if (dom.wrongNetworkCard) dom.wrongNetworkCard.hidden = true;
}

async function switchToSepolia() {
    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }]
        });
    } catch (err) {
        if (err.code === 4902) {
            try {
                await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [{
                        chainId: SEPOLIA_CHAIN_ID_HEX,
                        chainName: "Ethereum Sepolia",
                        nativeCurrency: { name: "SepoliaETH", symbol: "SepoliaETH", decimals: 18 },
                        rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com", "https://rpc.sepolia.ethpandaops.io"],
                        blockExplorerUrls: [ETHERSCAN_BASE_URL]
                    }]
                });
            } catch { showError("Could not add Sepolia network."); }
        } else if (err.code === 4001) {
            showError("Network switch rejected.");
        } else {
            showError("Could not switch to Sepolia network.");
        }
    }
}

// ============================================================
// 8. WALLET CONNECTION
// ============================================================

async function autoConnectWallet() {
    try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts && accounts.length > 0) {
            currentAccount = accounts[0];
            await initializeBlockchain();
            updateWalletUI();
            postConnection();
        }
    } catch (err) {
        console.warn("Auto-connect check:", err);
    }
}

async function connectWallet() {
    if (isConnecting) return;
    if (!window.ethereum) { showNoMetaMask(); return; }
    isConnecting = true;
    dom.connectBtnText.textContent = "Connecting…";
    try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        currentAccount = accounts[0];
        await checkNetwork();
        if (isSepoliaActive()) {
            await initializeBlockchain();
            updateWalletUI();
            postConnection();
            showSuccess("Connected to Sepolia!");
        } else {
            await switchToSepolia();
        }
    } catch (err) {
        if (err.code === 4001) showError("Connection rejected in MetaMask.");
        else showError("Failed to connect MetaMask.");
    } finally {
        isConnecting = false;
        updateWalletUI();
    }
}

function updateWalletUI() {
    if (currentAccount) {
        dom.connectBtn.classList.add("connected");
        dom.connectBtnText.textContent = shortenAddress(currentAccount);
        if (dom.portfolioWalletAddr) dom.portfolioWalletAddr.textContent = currentAccount;
        if (dom.drawerWalletAddress) dom.drawerWalletAddress.textContent = shortenAddress(currentAccount);
        if (dom.drawerEtherscanLink) dom.drawerEtherscanLink.href = `${ETHERSCAN_BASE_URL}/address/${currentAccount}`;
        loadBalance();
    } else {
        dom.connectBtn.classList.remove("connected");
        dom.connectBtnText.textContent = "Connect Wallet";
        if (dom.drawerBalance) dom.drawerBalance.textContent = "—";
        if (dom.portfolioWalletAddr) dom.portfolioWalletAddr.textContent = "Not connected";
    }
}

async function loadBalance() {
    const p = getProvider();
    if (!p || !currentAccount) return;
    try {
        const wei = await p.getBalance(currentAccount);
        const eth = parseFloat(ethers.formatEther(wei)).toFixed(4);
        if (dom.drawerBalance) dom.drawerBalance.textContent = `${eth} SepoliaETH`;
    } catch {
        if (dom.drawerBalance) dom.drawerBalance.textContent = "—";
    }
}

// ============================================================
// 9. CONTRACT INITIALISATION & HEALTH CHECK
// ============================================================

async function initializeBlockchain() {
    const p = getProvider();
    if (!p) return;
    try {
        signer = await getSigner();
    } catch {}

    try {
        contract = new ethers.Contract(USER_STORAGE_ADDRESS, USER_STORAGE_ABI, p);
    } catch (err) {
        console.warn("UserStorage init warning:", err);
    }

    if (nftContractsConfigured()) {
        try {
            nftContract         = new ethers.Contract(CONTRACTS.sepolia.nft, NFT_ABI, p);
            marketContract      = new ethers.Contract(CONTRACTS.sepolia.marketplace, MARKETPLACE_ABI, p);
            if (signer) {
                nftContractWrite    = new ethers.Contract(CONTRACTS.sepolia.nft, NFT_ABI, signer);
                marketContractWrite = new ethers.Contract(CONTRACTS.sepolia.marketplace, MARKETPLACE_ABI, signer);
            }
            if (dom.setupCard) dom.setupCard.hidden = true;
            attachFutureEventListeners();
        } catch (err) {
            console.warn("NFT/Marketplace contract init warning:", err);
        }
    }
}

// ============================================================
// 10. SAFE HISTORICAL EVENT QUERYING (NO BLOCK 0 CRASHES)
// ============================================================

/**
 * Safely fetches historical logs in safe chunks starting from SEPOLIA_DEPLOYMENT_BLOCK.
 * Avoids the "exceed maximum block range: 50000" RPC error on Sepolia.
 */
async function getLogsInChunks(targetContract, filter, fromBlock = SEPOLIA_DEPLOYMENT_BLOCK, toBlock = "latest", chunkSize = 25000) {
    if (!targetContract) return [];
    const p = targetContract.runner?.provider || getProvider() || getReadOnlyRpcProvider();
    let currentLatest = toBlock;
    if (toBlock === "latest" && p) {
        try { currentLatest = await p.getBlockNumber(); } catch { currentLatest = 11654000; }
    }
    const endBlock = Number(currentLatest);
    const startBlock = Number(fromBlock);
    if (isNaN(startBlock) || isNaN(endBlock) || startBlock > endBlock) return [];

    // If block range is small enough, query directly in 1 fast call
    if (endBlock - startBlock <= 30000) {
        try {
            return await targetContract.queryFilter(filter, startBlock, endBlock);
        } catch (err) {
            console.warn("Single chunk queryFilter failed, falling back to split chunks:", err);
        }
    }

    const logs = [];
    for (let b = startBlock; b <= endBlock; b += chunkSize) {
        const chunkTo = Math.min(b + chunkSize - 1, endBlock);
        try {
            const chunkLogs = await targetContract.queryFilter(filter, b, chunkTo);
            logs.push(...chunkLogs);
        } catch (err) {
            console.warn(`Query logs chunk [${b}..${chunkTo}] warning:`, err);
        }
    }
    return logs;
}

// Cached block timestamp loader to avoid duplicate RPC calls
async function getBlockTimestamp(blockNumber) {
    if (blockTimeCache.has(blockNumber)) return blockTimeCache.get(blockNumber);
    try {
        const p = getProvider() || getReadOnlyRpcProvider();
        const block = await p.getBlock(blockNumber);
        if (block && block.timestamp) {
            blockTimeCache.set(blockNumber, block.timestamp);
            return block.timestamp;
        }
    } catch {}
    return null;
}

function formatTimeAgo(timestampSeconds) {
    if (!timestampSeconds) return "Recently";
    const now = Math.floor(Date.now() / 1000);
    const diff = Math.max(0, now - timestampSeconds);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    const days = Math.floor(diff / 86400);
    if (days < 30) return `${days}d ago`;
    return new Date(timestampSeconds * 1000).toLocaleDateString();
}

// ============================================================
// 11. METADATA & TOKEN HYDRATION
// ============================================================

async function fetchMetadata(uri) {
    if (!uri) return null;
    try {
        if (uri.startsWith("data:application/json;base64,")) {
            const json = atob(uri.split(",")[1]);
            return JSON.parse(json);
        }
        if (uri.startsWith("data:application/json,")) {
            return JSON.parse(decodeURIComponent(uri.split(",")[1]));
        }
        const url = ipfsToHttp(uri);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500); // 4.5s safe timeout
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function getNFTDetails(tokenId) {
    if (!nftContract) return null;
    const idStr = tokenId.toString();
    if (REMOVED_TOKEN_IDS.has(idStr)) return null;
    try {
        const [owner, uri, creator] = await Promise.all([
            nftContract.ownerOf(tokenId),
            nftContract.tokenURI(tokenId),
            nftContract.tokenCreators(tokenId).catch(() => ZERO_ADDRESS)
        ]);

        let metadata = nftMetadataCache.get(tokenId);
        if (!metadata) {
            metadata = await fetchMetadata(uri);
            if (metadata) nftMetadataCache.set(tokenId, metadata);
        }

        let listing = { active: false, price: 0n, seller: ZERO_ADDRESS };
        if (marketContract) {
            try {
                const [s, p, a] = await marketContract.getListing(CONTRACTS.sepolia.nft, tokenId);
                listing = { seller: s, price: p, active: a };
            } catch {}
        }

        return {
            tokenId: tokenId.toString(),
            owner,
            creator,
            uri,
            name: metadata?.name || `BINFT #${tokenId}`,
            description: metadata?.description || "No description provided.",
            image: metadata?.image ? ipfsToHttp(metadata.image) : "favicon.svg",
            category: metadata?.category || (metadata?.attributes?.find(a => a.trait_type === "Category")?.value) || "Art",
            attributes: metadata?.attributes || [],
            listing
        };
    } catch (err) {
        console.warn(`getNFTDetails(${tokenId}) warning:`, err);
        return null;
    }
}

// ============================================================
// 12. DATA LOADING & COLLECTIONS
// ============================================================

async function postConnection() {
    loadUserData();
    loadAllTokens();
    loadActivity();
}

async function loadPublicData() {
    if (!nftContract) {
        const p = getReadOnlyRpcProvider();
        nftContract = new ethers.Contract(CONTRACTS.sepolia.nft, NFT_ABI, p);
        marketContract = new ethers.Contract(CONTRACTS.sepolia.marketplace, MARKETPLACE_ABI, p);
    }
    loadAllTokens();
    loadActivity();
}

/**
 * Queries all minted tokens on Sepolia, hydrates them, and populates
 * Explore, Marketplace, and Portfolio grids seamlessly.
 */
async function loadAllTokens() {
    if (!nftContract) return;
    try {
        const supply = await nftContract.totalSupply();
        const total = Number(supply);
        const tokens = [];

        for (let i = 0; i < total; i++) {
            if (REMOVED_TOKEN_IDS.has(i.toString())) continue;
            const details = await getNFTDetails(i);
            if (details) tokens.push(details);
        }

        allTokensCache = tokens;
        updateStatsRibbon();
        renderExploreShowcase();
        renderMarketplace();
        renderPortfolio();
    } catch (err) {
        console.warn("loadAllTokens error:", err);
    }
}

function updateStatsRibbon() {
    const totalMinted = allTokensCache.length;
    const listed = allTokensCache.filter(t => t.listing.active).length;
    const unlisted = totalMinted - listed;
    const uniqueCreators = new Set(allTokensCache.map(t => t.creator.toLowerCase())).size;

    if (dom.statExploreTotalMinted) dom.statExploreTotalMinted.textContent = totalMinted;
    if (dom.statExploreListed) dom.statExploreListed.textContent = listed;
    if (dom.statExploreCreators) dom.statExploreCreators.textContent = uniqueCreators;

    if (dom.marketStatListed) dom.marketStatListed.textContent = listed;
    if (dom.marketStatUnlisted) dom.marketStatUnlisted.textContent = unlisted;
    if (dom.marketStatAll) dom.marketStatAll.textContent = totalMinted;
}

// ============================================================
// 13. EXPLORE TAB SHOWCASE
// ============================================================

function renderExploreShowcase() {
    if (!dom.exploreFeaturedGrid) return;
    dom.exploreFeaturedGrid.innerHTML = "";

    // In Featured Marketplace Listings, only showcase actively listed items
    const listedTokens = allTokensCache.filter(t => t.listing.active);

    if (listedTokens.length === 0) {
        dom.exploreFeaturedGrid.innerHTML = `
            <div class="state-msg" style="grid-column: 1 / -1; padding: 2.5rem 1.5rem;">
                <p style="font-size:1.1rem; font-weight:600;">No NFTs currently listed on the marketplace</p>
                <p class="hint">Mint a creation or list an unlisted NFT in your portfolio to get featured here!</p>
                <div style="display:flex; gap:0.75rem; justify-content:center; margin-top:1rem; flex-wrap:wrap;">
                    <button class="btn btn--primary btn--sm" data-tab-link="create-nft">🎨 Create & List NFT</button>
                    <button class="btn btn--secondary btn--sm" data-tab-link="my-nfts">🖼️ View My Portfolio</button>
                </div>
            </div>`;
        return;
    }

    // Display up to 3 spotlight listed NFTs
    const spotlight = listedTokens.slice(-3).reverse();
    for (const nft of spotlight) {
        dom.exploreFeaturedGrid.appendChild(createNFTCardElement(nft));
    }
}

// ============================================================
// 14. MARKETPLACE GALLERY
// ============================================================

function renderMarketplace() {
    if (!dom.marketGrid) return;
    dom.marketGrid.innerHTML = "";

    const query = (dom.marketSearchInput?.value || "").trim().toLowerCase();
    const hiddenTokens = getHiddenTokens();
    let filtered = allTokensCache.filter(t => !hiddenTokens.has(t.tokenId));

    // Search filter
    if (query) {
        filtered = filtered.filter(t => 
            t.name.toLowerCase().includes(query) ||
            t.tokenId.includes(query) ||
            t.description.toLowerCase().includes(query)
        );
    }

    // Category / State filter
    if (currentMarketFilter === "for-sale") {
        filtered = filtered.filter(t => t.listing.active);
    } else if (currentMarketFilter === "unlisted") {
        filtered = filtered.filter(t => !t.listing.active);
    } else if (currentMarketFilter === "owned" && currentAccount) {
        filtered = filtered.filter(t => t.owner.toLowerCase() === currentAccount.toLowerCase());
    } else if (currentMarketFilter === "created" && currentAccount) {
        filtered = filtered.filter(t => t.creator.toLowerCase() === currentAccount.toLowerCase());
    } // "all" keeps all non-hidden tokens

    // Sort
    if (currentMarketSort === "newest") {
        filtered.sort((a, b) => Number(b.tokenId) - Number(a.tokenId));
    } else if (currentMarketSort === "price-asc") {
        filtered.sort((a, b) => {
            const pA = a.listing.active ? Number(ethers.formatEther(a.listing.price)) : 999999;
            const pB = b.listing.active ? Number(ethers.formatEther(b.listing.price)) : 999999;
            return pA - pB;
        });
    } else if (currentMarketSort === "price-desc") {
        filtered.sort((a, b) => {
            const pA = a.listing.active ? Number(ethers.formatEther(a.listing.price)) : -1;
            const pB = b.listing.active ? Number(ethers.formatEther(b.listing.price)) : -1;
            return pB - pA;
        });
    } else if (currentMarketSort === "id-asc") {
        filtered.sort((a, b) => Number(a.tokenId) - Number(b.tokenId));
    }

    if (filtered.length === 0) {
        if (dom.marketEmpty) {
            dom.marketEmpty.hidden = false;
            if (currentMarketFilter === "for-sale") {
                if (dom.marketEmptyTitle) dom.marketEmptyTitle.textContent = "No NFTs currently listed for sale";
                if (dom.marketEmptySubtitle) dom.marketEmptySubtitle.textContent = "All NFTs are currently unlisted. Be the first to list an NFT on the marketplace!";
            } else if (currentMarketFilter === "unlisted") {
                if (dom.marketEmptyTitle) dom.marketEmptyTitle.textContent = "No non-listed NFTs found";
                if (dom.marketEmptySubtitle) dom.marketEmptySubtitle.textContent = "All NFTs are currently listed on the marketplace.";
            } else {
                if (dom.marketEmptyTitle) dom.marketEmptyTitle.textContent = "No NFTs match your search or filter";
                if (dom.marketEmptySubtitle) dom.marketEmptySubtitle.textContent = "Try adjusting your search keywords or filter criteria.";
            }
        }
        return;
    }
    if (dom.marketEmpty) dom.marketEmpty.hidden = true;

    for (const nft of filtered) {
        dom.marketGrid.appendChild(createNFTCardElement(nft));
    }
}

function createNFTCardElement(nft) {
    const card = document.createElement("div");
    card.className = "nft-card";

    const isListed = nft.listing.active;
    const isOwner = currentAccount && nft.owner.toLowerCase() === currentAccount.toLowerCase();
    const priceEth = isListed ? ethers.formatEther(nft.listing.price) : null;
    const hiddenTokens = getHiddenTokens();
    const isHidden = hiddenTokens.has(nft.tokenId);

    let badgeMarkup = `<span class="badge badge--offline">Unlisted</span>`;
    if (isListed) {
        badgeMarkup = `<span class="badge badge--success">🏷️ ${priceEth} SepoliaETH</span>`;
    } else if (isOwner) {
        badgeMarkup = `<span class="badge badge--accent">👤 You Own</span>`;
    }

    // Contextual action buttons
    let actionButtons = `<button class="btn btn--primary btn--sm view-btn">View Details</button>`;
    if (isListed && isOwner) {
        actionButtons = `
            <button class="btn btn--danger btn--sm delist-card-btn" data-delist-id="${nft.tokenId}" title="Remove from Marketplace">✕ Remove</button>
            <button class="btn btn--ghost btn--sm view-btn">Details</button>
        `;
    } else if (!isListed && isOwner) {
        if (isHidden) {
            actionButtons = `
                <button class="btn btn--secondary btn--sm unhide-card-btn" data-unhide-id="${nft.tokenId}">Unhide</button>
                <button class="btn btn--ghost btn--sm view-btn">Details</button>
            `;
        } else {
            actionButtons = `
                <button class="btn btn--primary btn--sm list-card-btn" data-list-id="${nft.tokenId}">🏷️ List</button>
                <button class="btn btn--ghost btn--sm view-btn">Details</button>
            `;
        }
    } else if (isListed && !isOwner) {
        actionButtons = `<button class="btn btn--primary btn--sm view-btn">Buy / Details</button>`;
    }

    card.innerHTML = `
        <div class="nft-img-container">
            <img src="${escapeHtml(nft.image)}" alt="${escapeHtml(nft.name)}" class="nft-img" loading="lazy" onerror="this.src='favicon.svg'">
            <div class="nft-badge-overlay">${badgeMarkup}</div>
            <span class="nft-category-tag">${escapeHtml(nft.category)}</span>
        </div>
        <div class="nft-info">
            <div class="nft-header-row">
                <span class="nft-title" title="${escapeHtml(nft.name)}">${escapeHtml(nft.name)}</span>
                <span class="nft-id-tag">#${nft.tokenId}</span>
            </div>
            <div class="nft-owner-row">
                <span>Owner: <code>${shortenAddress(nft.owner)}</code></span>
            </div>
            <div class="nft-price-row">
                <div class="nft-price-box">
                    <span class="nft-price-label">${isListed ? "Price" : "Status"}</span>
                    <span class="nft-price-value">${isListed ? `${priceEth} ETH` : (isOwner ? "In Wallet" : "Not Listed")}</span>
                </div>
                <div class="nft-card-actions">
                    ${actionButtons}
                </div>
            </div>
        </div>
    `;

    // Hook quick button events
    const delistBtn = card.querySelector(".delist-card-btn");
    if (delistBtn) {
        delistBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openDelistModal(nft.tokenId);
        });
    }

    const listBtn = card.querySelector(".list-card-btn");
    if (listBtn) {
        listBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            activeModalTokenId = nft.tokenId;
            dom.sellPriceInput.value = "";
            dom.sellModal.hidden = false;
        });
    }

    const unhideBtn = card.querySelector(".unhide-card-btn");
    if (unhideBtn) {
        unhideBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleHideToken(nft.tokenId);
        });
    }

    card.addEventListener("click", () => openNFTModal(nft.tokenId));
    return card;
}

// ============================================================
// 15. MY NFTS PORTFOLIO
// ============================================================

function renderPortfolio() {
    if (!dom.myNftsGrid) return;
    dom.myNftsGrid.innerHTML = "";

    if (!currentAccount) {
        dom.myNftsEmpty.hidden = false;
        dom.myNftsEmpty.querySelector("p").textContent = "Please connect your MetaMask wallet to view your NFT portfolio.";
        return;
    }

    const hiddenTokens = getHiddenTokens();
    const userOwnedAll = allTokensCache.filter(t => t.owner.toLowerCase() === currentAccount.toLowerCase());
    const ownedVisible = userOwnedAll.filter(t => !hiddenTokens.has(t.tokenId));
    const createdVisible = allTokensCache.filter(t => t.creator.toLowerCase() === currentAccount.toLowerCase() && !hiddenTokens.has(t.tokenId));
    const listed = ownedVisible.filter(t => t.listing.active);
    const hiddenList = userOwnedAll.filter(t => hiddenTokens.has(t.tokenId));

    if (dom.portStatOwned) dom.portStatOwned.textContent = ownedVisible.length;
    if (dom.portStatCreated) dom.portStatCreated.textContent = createdVisible.length;
    if (dom.portStatListed) dom.portStatListed.textContent = listed.length;
    if (dom.portStatHidden) dom.portStatHidden.textContent = hiddenList.length;

    let displayList = ownedVisible;
    if (currentPortfolioFilter === "created") displayList = createdVisible;
    if (currentPortfolioFilter === "listed") displayList = listed;
    if (currentPortfolioFilter === "hidden") displayList = hiddenList;

    if (displayList.length === 0) {
        dom.myNftsEmpty.hidden = false;
        dom.myNftsEmpty.querySelector("p").textContent = `No ${currentPortfolioFilter} NFTs found for this wallet.`;
        return;
    }

    dom.myNftsEmpty.hidden = true;
    for (const nft of displayList) {
        dom.myNftsGrid.appendChild(createNFTCardElement(nft));
    }
}

// ============================================================
// 16. BLOCKCHAIN ACTIVITY FEED (REAL SEPOLIA EVENTS)
// ============================================================

/**
 * Queries real on-chain events from BlockchainIdentityNFT and NFTMarketplace
 * starting safely from SEPOLIA_DEPLOYMENT_BLOCK.
 */
async function loadActivity() {
    if (!nftContract) return;
    if (dom.activityLoading) dom.activityLoading.hidden = false;
    if (dom.activityEmpty) dom.activityEmpty.hidden = true;
    if (dom.activityBody) dom.activityBody.hidden = true;
    if (dom.activityTableBody) dom.activityTableBody.innerHTML = "";

    try {
        const events = [];

        // 1. Query ERC-721 Transfer events (captures mints where from=0x0 and secondary transfers)
        const transferFilter = nftContract.filters.Transfer();
        const transferLogs = await getLogsInChunks(nftContract, transferFilter);

        for (const log of transferLogs) {
            const tokenId = log.args.tokenId.toString();
            if (REMOVED_TOKEN_IDS.has(tokenId)) continue;
            const from = log.args.from;
            const to   = log.args.to;
            const isMint = from === ZERO_ADDRESS;
            events.push({
                type: isMint ? "Mint" : "Transfer",
                tokenId: tokenId,
                from: isMint ? "Genesis" : from,
                to: to,
                price: "—",
                blockNumber: log.blockNumber,
                txHash: log.transactionHash
            });
        }

        // 2. Query Marketplace Events if contract exists
        if (marketContract) {
            const [listedLogs, soldLogs, cancelLogs] = await Promise.all([
                getLogsInChunks(marketContract, marketContract.filters.NFTListed(CONTRACTS.sepolia.nft)),
                getLogsInChunks(marketContract, marketContract.filters.NFTSold(CONTRACTS.sepolia.nft)),
                getLogsInChunks(marketContract, marketContract.filters.ListingCancelled(CONTRACTS.sepolia.nft))
            ]);

            for (const l of listedLogs) {
                const tokenId = l.args.tokenId.toString();
                if (REMOVED_TOKEN_IDS.has(tokenId)) continue;
                events.push({
                    type: "Listed",
                    tokenId: tokenId,
                    from: l.args.seller,
                    to: "Marketplace",
                    price: ethers.formatEther(l.args.price) + " ETH",
                    blockNumber: l.blockNumber,
                    txHash: l.transactionHash
                });
            }

            for (const s of soldLogs) {
                const tokenId = s.args.tokenId.toString();
                if (REMOVED_TOKEN_IDS.has(tokenId)) continue;
                events.push({
                    type: "Sale",
                    tokenId: tokenId,
                    from: s.args.seller,
                    to: s.args.buyer,
                    price: ethers.formatEther(s.args.price) + " ETH",
                    blockNumber: s.blockNumber,
                    txHash: s.transactionHash
                });
            }

            for (const c of cancelLogs) {
                const tokenId = c.args.tokenId.toString();
                if (REMOVED_TOKEN_IDS.has(tokenId)) continue;
                events.push({
                    type: "Cancel",
                    tokenId: tokenId,
                    from: c.args.seller,
                    to: "—",
                    price: "—",
                    blockNumber: c.blockNumber,
                    txHash: c.transactionHash
                });
            }
        }

        // Deduplicate & sort newest block first
        events.sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0));
        allActivityEvents = events;

        // Calculate Stats
        const mintsCount = events.filter(e => e.type === "Mint").length;
        const listingsCount = events.filter(e => e.type === "Listed").length;
        const salesCount = events.filter(e => e.type === "Sale").length;

        if (dom.actStatTotal) dom.actStatTotal.textContent = events.length;
        if (dom.actStatMints) dom.actStatMints.textContent = mintsCount;
        if (dom.actStatListings) dom.actStatListings.textContent = listingsCount;
        if (dom.actStatSales) dom.actStatSales.textContent = salesCount;

        // Calculate Total Sales Volume for Explore Hero
        const totalVolumeEth = events
            .filter(e => e.type === "Sale" && e.price.includes("ETH"))
            .reduce((acc, curr) => acc + parseFloat(curr.price), 0);
        if (dom.statExploreVolume) dom.statExploreVolume.textContent = `${totalVolumeEth.toFixed(2)} ETH`;

        renderActivityTable();
    } catch (err) {
        console.error("loadActivity error:", err);
        if (dom.activityLoading) dom.activityLoading.hidden = true;
        if (dom.activityEmpty) dom.activityEmpty.hidden = false;
    }
}

async function renderActivityTable() {
    if (!dom.activityTableBody) return;
    dom.activityTableBody.innerHTML = "";

    let filtered = allActivityEvents;
    if (currentActFilter !== "all") {
        filtered = filtered.filter(e => e.type === currentActFilter);
    }

    if (filtered.length === 0) {
        if (dom.activityLoading) dom.activityLoading.hidden = true;
        if (dom.activityEmpty) dom.activityEmpty.hidden = false;
        if (dom.activityBody) dom.activityBody.hidden = true;
        return;
    }

    if (dom.activityLoading) dom.activityLoading.hidden = true;
    if (dom.activityEmpty) dom.activityEmpty.hidden = true;
    if (dom.activityBody) dom.activityBody.hidden = false;

    // Limit to 50 most recent records
    const displayList = filtered.slice(0, 50);

    for (const ev of displayList) {
        const tr = document.createElement("tr");
        const badgeCls = {
            Mint: "act-badge--mint",
            Listed: "act-badge--list",
            Sale: "act-badge--sale",
            Transfer: "act-badge--transfer",
            Cancel: "act-badge--cancel"
        }[ev.type] || "act-badge--transfer";

        const icon = {
            Mint: "🎨 Minted",
            Listed: "🏷️ Listed",
            Sale: "💰 Sold",
            Transfer: "↔️ Transferred",
            Cancel: "❌ Cancelled"
        }[ev.type] || ev.type;

        const tokenCached = allTokensCache.find(t => t.tokenId === ev.tokenId);
        const itemName = tokenCached ? tokenCached.name : `BINFT #${ev.tokenId}`;

        tr.innerHTML = `
            <td><span class="act-badge ${badgeCls}">${icon}</span></td>
            <td>
                <span style="font-weight:600; cursor:pointer;" onclick="openNFTModal('${ev.tokenId}')">
                    ${escapeHtml(itemName)} <small style="color:var(--text-dim); font-family:var(--mono);">#${ev.tokenId}</small>
                </span>
            </td>
            <td><code>${ev.from === "Genesis" ? "Genesis (0x0)" : shortenAddress(ev.from)}</code></td>
            <td><code>${ev.to === "Marketplace" ? "Marketplace" : shortenAddress(ev.to)}</code></td>
            <td style="font-weight:700; font-family:var(--mono);">${ev.price}</td>
            <td class="act-time" id="time-${ev.txHash.slice(2, 10)}">Block #${ev.blockNumber}</td>
            <td>
                <a href="${ETHERSCAN_BASE_URL}/tx/${ev.txHash}" target="_blank" rel="noopener noreferrer" class="link">
                    ${ev.txHash.slice(0, 8)}… ↗
                </a>
            </td>
        `;
        dom.activityTableBody.appendChild(tr);

        // Fetch and format block time asynchronously
        getBlockTimestamp(ev.blockNumber).then(timestamp => {
            if (timestamp) {
                const timeEl = document.getElementById(`time-${ev.txHash.slice(2, 10)}`);
                if (timeEl) timeEl.textContent = formatTimeAgo(timestamp);
            }
        });
    }
}

// ============================================================
// 17. FUTURE REAL-TIME EVENT STREAMING
// ============================================================

function attachFutureEventListeners() {
    if (isFutureListenersAttached || !nftContract || !marketContract) return;
    isFutureListenersAttached = true;

    // Real-time Transfer & Mint detection
    nftContract.on("Transfer", (from, to, tokenId, event) => {
        console.log("⚡ Real-time Transfer on Sepolia:", { from, to, tokenId: tokenId.toString() });
        setTimeout(() => {
            loadActivity();
            loadAllTokens();
        }, 1500);
    });

    // Real-time Listing
    marketContract.on("NFTListed", (nftAddr, tokenId, seller, price, event) => {
        console.log("⚡ Real-time NFTListed on Sepolia:", { tokenId: tokenId.toString() });
        setTimeout(() => {
            loadActivity();
            loadAllTokens();
        }, 1500);
    });

    // Real-time Sale
    marketContract.on("NFTSold", (nftAddr, tokenId, seller, buyer, price, event) => {
        console.log("⚡ Real-time NFTSold on Sepolia:", { tokenId: tokenId.toString(), buyer });
        setTimeout(() => {
            loadActivity();
            loadAllTokens();
        }, 1500);
    });

    // Real-time Cancel
    marketContract.on("ListingCancelled", (nftAddr, tokenId, seller, event) => {
        console.log("⚡ Real-time ListingCancelled on Sepolia:", { tokenId: tokenId.toString() });
        setTimeout(() => {
            loadActivity();
            loadAllTokens();
        }, 1500);
    });
}

// ============================================================
// 18. NFT MINTING (CREATOR STUDIO)
// ============================================================

async function mintNFT() {
    if (!window.ethereum) { showNoMetaMask(); return; }
    if (!currentAccount) {
        showError("Please connect your MetaMask wallet first.");
        await connectWallet();
        return;
    }
    if (!isSepoliaActive()) { showError("Switch to Sepolia network first."); return; }
    if (!nftContractsConfigured()) { showError("NFT contract address not configured."); return; }

    let metadataURI = "";

    if (metadataMode === "auto") {
        const name  = dom.nftNameInput.value.trim();
        const desc  = dom.nftDescInput.value.trim();
        const img   = dom.nftImageInput.value.trim();
        const cat   = dom.nftCategoryInput.value.trim() || "Art";

        let ok = true;
        if (!name) { dom.nftNameError.textContent = "NFT title is required."; dom.nftNameError.hidden = false; ok = false; }
        else dom.nftNameError.hidden = true;

        if (!desc) { dom.nftDescError.textContent = "Description is required."; dom.nftDescError.hidden = false; ok = false; }
        else dom.nftDescError.hidden = true;

        if (!img) { dom.nftImageError.textContent = "Artwork image URI is required."; dom.nftImageError.hidden = false; ok = false; }
        else dom.nftImageError.hidden = true;

        if (!ok) return;

        // Build standard ERC-721 metadata JSON as base64 data URI
        const metadata = {
            name,
            description: desc,
            image: img,
            category: cat,
            attributes: [
                { trait_type: "Creator", value: currentAccount },
                { trait_type: "Category", value: cat }
            ]
        };
        metadataURI = "data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(metadata))));
    } else {
        metadataURI = dom.manualUriInput.value.trim();
        if (!metadataURI) {
            dom.manualUriError.textContent = "Metadata URI is required.";
            dom.manualUriError.hidden = false;
            return;
        }
        dom.manualUriError.hidden = true;
    }

    // Step UI progression
    dom.step1Node.className = "step-node completed";
    dom.step2Node.className = "step-node completed";
    dom.step3Node.className = "step-node active";

    dom.mintBtn.disabled = true;
    dom.mintBtn.innerHTML = `<div class="spinner"></div> Confirming in MetaMask…`;
    dom.mintTxCard.hidden = false;
    dom.mintTxStatus.className = "tx-status is-pending";
    dom.mintTxStatus.innerHTML = `<div class="spinner"></div> Please confirm the mint transaction in MetaMask…`;

    try {
        const signerInstance = await getSigner();
        const nftWithSigner = new ethers.Contract(CONTRACTS.sepolia.nft, NFT_ABI, signerInstance);

        const tx = await nftWithSigner.mintNFT(metadataURI);
        dom.mintTxStatus.innerHTML = `<div class="spinner"></div> Mint transaction sent! Waiting for Sepolia block confirmation…`;

        const receipt = await tx.wait(1);
        dom.step3Node.className = "step-node completed";

        // Parse Token ID from logs
        let mintedTokenId = "0";
        for (const log of receipt.logs) {
            try {
                const parsed = nftContract.interface.parseLog(log);
                if (parsed && parsed.name === "Transfer") {
                    mintedTokenId = parsed.args.tokenId.toString();
                    break;
                }
            } catch {}
        }

        dom.mintTxStatus.className = "tx-status is-success";
        dom.mintTxStatus.innerHTML = `🎉 NFT Minted Successfully! Token #${mintedTokenId}`;
        dom.mintTokenId.textContent = `#${mintedTokenId}`;
        dom.mintTxHash.textContent = receipt.hash;
        dom.mintTxBlock.textContent = receipt.blockNumber;
        dom.mintEtherscanLink.href = `${ETHERSCAN_BASE_URL}/tx/${receipt.hash}`;
        dom.mintTxDetails.hidden = false;
        dom.mintTxActions.hidden = false;

        showSuccess(`Minted NFT #${mintedTokenId}!`);

        // Check if user set an initial listing price
        const initPrice = dom.nftInitialPriceInput?.value?.trim();
        if (initPrice && parseFloat(initPrice) > 0) {
            setTimeout(() => {
                promptImmediateListing(mintedTokenId, initPrice);
            }, 1500);
        }

        // Refresh data
        setTimeout(() => {
            loadAllTokens();
            loadActivity();
        }, 2000);
    } catch (err) {
        console.error("Mint error:", err);
        dom.mintTxStatus.className = "tx-status is-error";
        if (err.code === 4001 || err.code === "ACTION_REJECTED") {
            dom.mintTxStatus.textContent = "Transaction cancelled in MetaMask.";
        } else {
            dom.mintTxStatus.textContent = "Mint transaction failed: " + (err.message || "Unknown error");
        }
    } finally {
        dom.mintBtn.disabled = false;
        dom.mintBtn.innerHTML = `<span class="btn-icon">⚡</span> Mint NFT on Sepolia`;
    }
}

async function promptImmediateListing(tokenId, priceEth) {
    activeModalTokenId = tokenId;
    dom.sellPriceInput.value = priceEth;
    dom.sellModal.hidden = false;
    showToast(`Step 2: Confirm listing for Token #${tokenId}`, "🏷️");
}

// ============================================================
// 19. NFT DETAIL MODAL & INTERACTIONS
// ============================================================

async function openNFTModal(tokenId) {
    const nft = allTokensCache.find(t => t.tokenId === tokenId.toString()) || await getNFTDetails(tokenId);
    if (!nft) { showError("Could not load NFT details."); return; }

    activeModalTokenId = tokenId;
    dom.modalImage.src = nft.image;
    dom.modalCategory.textContent = nft.category || "Art";
    dom.modalName.textContent = nft.name;
    dom.modalTokenId.textContent = `Token #${nft.tokenId} · ERC-721`;
    dom.modalDesc.textContent = nft.description;
    dom.modalOwner.textContent = nft.owner;
    dom.modalCreator.textContent = nft.creator;
    dom.modalContract.textContent = CONTRACTS.sepolia.nft;
    dom.modalMetadataUri.textContent = nft.uri;

    const isOwner = currentAccount && nft.owner.toLowerCase() === currentAccount.toLowerCase();
    const isListed = nft.listing.active;

    if (isListed) {
        const price = ethers.formatEther(nft.listing.price);
        dom.modalListingStatus.innerHTML = `<span class="badge badge--success">Listed for Sale</span>`;
        dom.modalPrice.textContent = `${price} SepoliaETH`;
    } else {
        dom.modalListingStatus.innerHTML = `<span class="badge badge--offline">Not Listed</span>`;
        dom.modalPrice.textContent = "—";
    }

    // Build Contextual Action Buttons
    dom.modalActions.innerHTML = "";

    if (isListed && !isOwner) {
        const buyBtn = document.createElement("button");
        buyBtn.className = "btn btn--primary btn--lg";
        buyBtn.innerHTML = `🛒 Buy for ${ethers.formatEther(nft.listing.price)} ETH`;
        buyBtn.onclick = () => executeBuy(nft);
        dom.modalActions.appendChild(buyBtn);
    } else if (isOwner && !isListed) {
        const listBtn = document.createElement("button");
        listBtn.className = "btn btn--primary btn--lg";
        listBtn.innerHTML = `🏷️ List for Sale`;
        listBtn.onclick = () => { dom.nftModal.hidden = true; dom.sellModal.hidden = false; };
        dom.modalActions.appendChild(listBtn);

        const transferBtn = document.createElement("button");
        transferBtn.className = "btn btn--secondary btn--lg";
        transferBtn.innerHTML = `📤 Transfer`;
        transferBtn.onclick = () => { dom.nftModal.hidden = true; dom.transferModal.hidden = false; };
        dom.modalActions.appendChild(transferBtn);

        const hideTokens = getHiddenTokens();
        const isHidden = hideTokens.has(nft.tokenId);
        const hideBtn = document.createElement("button");
        hideBtn.className = "btn btn--ghost btn--sm";
        hideBtn.innerHTML = isHidden ? `👁️ Unhide NFT` : `🙈 Hide from View`;
        hideBtn.onclick = () => {
            toggleHideToken(nft.tokenId);
            dom.nftModal.hidden = true;
        };
        dom.modalActions.appendChild(hideBtn);
    } else if (isOwner && isListed) {
        const delistBtn = document.createElement("button");
        delistBtn.className = "btn btn--danger btn--lg";
        delistBtn.innerHTML = `✕ Remove from Marketplace`;
        delistBtn.onclick = () => {
            dom.nftModal.hidden = true;
            openDelistModal(nft.tokenId);
        };
        dom.modalActions.appendChild(delistBtn);
    }

    const etherscanBtn = document.createElement("a");
    etherscanBtn.className = "btn btn--ghost btn--sm";
    etherscanBtn.href = `${ETHERSCAN_BASE_URL}/token/${CONTRACTS.sepolia.nft}?a=${nft.tokenId}`;
    etherscanBtn.target = "_blank";
    etherscanBtn.rel = "noopener noreferrer";
    etherscanBtn.innerHTML = `Sepolia Etherscan ↗`;
    dom.modalActions.appendChild(etherscanBtn);

    dom.nftModal.hidden = false;
}

// Buy NFT Flow
async function executeBuy(nft) {
    if (!currentAccount) { showError("Please connect your wallet first."); return; }
    if (!isSepoliaActive()) { showError("Please switch to Sepolia."); return; }

    dom.modalTxStatus.hidden = false;
    dom.modalTxStatus.className = "tx-status is-pending";
    dom.modalTxStatus.innerHTML = `<div class="spinner"></div> Confirm purchase in MetaMask…`;

    try {
        const signerInstance = await getSigner();
        const marketWithSigner = new ethers.Contract(CONTRACTS.sepolia.marketplace, MARKETPLACE_ABI, signerInstance);

        const tx = await marketWithSigner.buyNFT(CONTRACTS.sepolia.nft, nft.tokenId, {
            value: nft.listing.price
        });
        dom.modalTxStatus.innerHTML = `<div class="spinner"></div> Purchase transaction sent! Waiting for block confirmation…`;

        const receipt = await tx.wait(1);
        dom.modalTxStatus.className = "tx-status is-success";
        dom.modalTxStatus.innerHTML = `🎉 Successfully purchased Token #${nft.tokenId}!`;
        showSuccess(`Purchased Token #${nft.tokenId}!`);

        setTimeout(() => {
            dom.nftModal.hidden = true;
            loadAllTokens();
            loadActivity();
        }, 2000);
    } catch (err) {
        console.error("Buy error:", err);
        dom.modalTxStatus.className = "tx-status is-error";
        dom.modalTxStatus.textContent = err.code === 4001 ? "Purchase cancelled." : "Purchase failed: " + (err.message || "");
    }
}

// List NFT Flow (handles ERC-721 approval if needed)
async function executeList() {
    if (!activeModalTokenId) return;
    const priceStr = dom.sellPriceInput.value.trim();
    if (!priceStr || parseFloat(priceStr) <= 0) {
        dom.sellPriceError.textContent = "Please enter a valid price in SepoliaETH.";
        dom.sellPriceError.hidden = false;
        return;
    }
    dom.sellPriceError.hidden = true;

    dom.sellConfirmBtn.disabled = true;
    dom.sellTxStatus.hidden = false;
    dom.sellTxStatus.className = "tx-status is-pending";
    dom.sellTxStatus.innerHTML = `<div class="spinner"></div> Checking marketplace approval…`;

    try {
        const signerInstance = await getSigner();
        const nftWithSigner = new ethers.Contract(CONTRACTS.sepolia.nft, NFT_ABI, signerInstance);
        const marketWithSigner = new ethers.Contract(CONTRACTS.sepolia.marketplace, MARKETPLACE_ABI, signerInstance);

        // 1. Check approval
        const approved = await nftWithSigner.getApproved(activeModalTokenId);
        if (approved.toLowerCase() !== CONTRACTS.sepolia.marketplace.toLowerCase()) {
            dom.sellTxStatus.innerHTML = `<div class="spinner"></div> Step 1/2: Approve marketplace in MetaMask…`;
            const approveTx = await nftWithSigner.approve(CONTRACTS.sepolia.marketplace, activeModalTokenId);
            await approveTx.wait(1);
        }

        // 2. List
        dom.sellTxStatus.innerHTML = `<div class="spinner"></div> Step 2/2: Confirm listing in MetaMask…`;
        const priceWei = ethers.parseEther(priceStr);
        const listTx = await marketWithSigner.listNFT(CONTRACTS.sepolia.nft, activeModalTokenId, priceWei);
        await listTx.wait(1);

        dom.sellTxStatus.className = "tx-status is-success";
        dom.sellTxStatus.textContent = `NFT #${activeModalTokenId} listed for ${priceStr} SepoliaETH!`;
        showSuccess(`NFT #${activeModalTokenId} listed!`);

        setTimeout(() => {
            dom.sellModal.hidden = true;
            loadAllTokens();
            loadActivity();
        }, 1800);
    } catch (err) {
        console.error("Listing error:", err);
        dom.sellTxStatus.className = "tx-status is-error";
        dom.sellTxStatus.textContent = err.code === 4001 ? "Listing cancelled." : "Listing failed: " + (err.message || "");
    } finally {
        dom.sellConfirmBtn.disabled = false;
    }
}

// ============================================================
// DELIST FLOW (REMOVE FROM MARKETPLACE)
// ============================================================

function openDelistModal(tokenId) {
    const nft = allTokensCache.find(t => t.tokenId === tokenId.toString());
    if (!nft) return;
    activeDelistTokenId = tokenId.toString();

    if (dom.delistTokenDisplay) dom.delistTokenDisplay.textContent = `#${nft.tokenId} — ${nft.name}`;
    if (dom.delistPriceDisplay) {
        const price = nft.listing?.price ? ethers.formatEther(nft.listing.price) : "—";
        dom.delistPriceDisplay.textContent = `${price} SepoliaETH`;
    }
    if (dom.delistTxStatus) {
        dom.delistTxStatus.hidden = true;
        dom.delistTxStatus.className = "tx-status";
        dom.delistTxStatus.innerHTML = "";
    }
    if (dom.delistConfirmBtn) dom.delistConfirmBtn.disabled = false;
    if (dom.delistModal) dom.delistModal.hidden = false;
}

async function executeRemoveFromMarketplace() {
    if (!activeDelistTokenId) return;
    const tokenId = activeDelistTokenId;

    if (!dom.delistConfirmBtn || !dom.delistTxStatus) return;
    dom.delistConfirmBtn.disabled = true;
    dom.delistTxStatus.hidden = false;
    dom.delistTxStatus.className = "tx-status is-pending";
    dom.delistTxStatus.innerHTML = `<div class="spinner"></div> Confirm removal in MetaMask…`;

    try {
        const signerInstance = await getSigner();
        const marketWithSigner = new ethers.Contract(CONTRACTS.sepolia.marketplace, MARKETPLACE_ABI, signerInstance);

        const tx = await marketWithSigner.cancelListing(CONTRACTS.sepolia.nft, tokenId);
        dom.delistTxStatus.innerHTML = `<div class="spinner"></div> Removing from Sepolia marketplace…`;
        await tx.wait(1);

        dom.delistTxStatus.className = "tx-status is-success";
        dom.delistTxStatus.textContent = `NFT #${tokenId} removed from marketplace!`;
        showSuccess(`NFT #${tokenId} removed from marketplace!`);

        // Immediately update cached state
        const cached = allTokensCache.find(t => t.tokenId === tokenId);
        if (cached) {
            cached.listing = { active: false, price: 0n, seller: ZERO_ADDRESS };
        }

        setTimeout(() => {
            if (dom.delistModal) dom.delistModal.hidden = true;
            updateStatsRibbon();
            renderExploreShowcase();
            renderMarketplace();
            renderPortfolio();
            loadActivity();
        }, 1200);
    } catch (err) {
        console.error("Delist error:", err);
        dom.delistTxStatus.className = "tx-status is-error";
        dom.delistTxStatus.textContent = err.code === 4001 || err.code === "ACTION_REJECTED"
            ? "Removal cancelled in MetaMask."
            : "Failed to remove from marketplace: " + (err.message || "");
    } finally {
        if (dom.delistConfirmBtn) dom.delistConfirmBtn.disabled = false;
    }
}

// Transfer NFT Flow
async function executeTransfer() {
    if (!activeModalTokenId) return;
    const recipient = dom.transferAddressInput.value.trim();
    if (!ethers.isAddress(recipient)) {
        dom.transferAddressError.textContent = "Please enter a valid Ethereum address.";
        dom.transferAddressError.hidden = false;
        return;
    }
    dom.transferAddressError.hidden = true;

    dom.transferConfirmBtn.disabled = true;
    dom.transferTxStatus.hidden = false;
    dom.transferTxStatus.className = "tx-status is-pending";
    dom.transferTxStatus.innerHTML = `<div class="spinner"></div> Confirm transfer in MetaMask…`;

    try {
        const signerInstance = await getSigner();
        const nftWithSigner = new ethers.Contract(CONTRACTS.sepolia.nft, NFT_ABI, signerInstance);

        const tx = await nftWithSigner.transferFrom(currentAccount, recipient, activeModalTokenId);
        dom.transferTxStatus.innerHTML = `<div class="spinner"></div> Transferring NFT on Sepolia…`;
        await tx.wait(1);

        dom.transferTxStatus.className = "tx-status is-success";
        dom.transferTxStatus.textContent = `NFT transferred to ${shortenAddress(recipient)}!`;
        showSuccess("NFT Transferred!");

        setTimeout(() => {
            dom.transferModal.hidden = true;
            loadAllTokens();
            loadActivity();
        }, 1800);
    } catch (err) {
        console.error("Transfer error:", err);
        dom.transferTxStatus.className = "tx-status is-error";
        dom.transferTxStatus.textContent = err.code === 4001 ? "Transfer rejected." : "Transfer failed: " + (err.message || "");
    } finally {
        dom.transferConfirmBtn.disabled = false;
    }
}

// ============================================================
// 20. BLOCKCHAIN IDENTITY (USERSTORAGE)
// ============================================================

async function loadUserData() {
    if (!contract || !currentAccount || !isSepoliaActive()) return;
    if (dom.identityLoading) dom.identityLoading.hidden = false;
    if (dom.identityEmpty) dom.identityEmpty.hidden = true;
    if (dom.identityData) dom.identityData.hidden = true;

    try {
        const [name, role] = await contract.getUser(currentAccount);
        if (dom.identityLoading) dom.identityLoading.hidden = true;

        if (name === "" && role === "") {
            if (dom.identityEmpty) dom.identityEmpty.hidden = false;
            dom.formTitle.textContent = "📝 Save Identity on Blockchain";
            dom.inputName.value = "";
            dom.inputRole.value = "";
            dom.submitBtn.textContent = "Save to Blockchain";
        } else {
            if (dom.identityData) dom.identityData.hidden = false;
            dom.displayName.textContent = name;
            dom.displayRole.textContent = role;
            dom.displayWallet.textContent = currentAccount;
            dom.formTitle.textContent = "📝 Update Identity on Blockchain";
            dom.inputName.value = name;
            dom.inputRole.value = role;
            dom.submitBtn.textContent = "Update on Blockchain";
        }
    } catch (err) {
        console.warn("loadUserData warning:", err);
        if (dom.identityLoading) dom.identityLoading.hidden = true;
        if (dom.identityEmpty) dom.identityEmpty.hidden = false;
    }
}

async function storeUserData() {
    if (!window.ethereum) { showNoMetaMask(); return; }
    if (!currentAccount) {
        showError("Please connect your MetaMask wallet first.");
        await connectWallet();
        return;
    }
    if (!isSepoliaActive()) { showError("Please switch to Sepolia."); return; }

    const name = dom.inputName.value.trim();
    const role = dom.inputRole.value.trim();

    let ok = true;
    if (!name) { dom.nameError.textContent = "Name is required."; dom.nameError.hidden = false; ok = false; }
    else dom.nameError.hidden = true;

    if (!role) { dom.roleError.textContent = "Role is required."; dom.roleError.hidden = false; ok = false; }
    else dom.roleError.hidden = true;

    if (!ok) return;

    dom.submitBtn.disabled = true;
    dom.txCard.hidden = false;
    dom.txStatus.className = "tx-status is-pending";
    dom.txStatus.innerHTML = `<div class="spinner"></div> Confirm identity transaction in MetaMask…`;

    try {
        const signerInstance = await getSigner();
        const contractWithSigner = new ethers.Contract(USER_STORAGE_ADDRESS, USER_STORAGE_ABI, signerInstance);

        const tx = await contractWithSigner.storeUser(name, role);
        dom.txStatus.innerHTML = `<div class="spinner"></div> Identity update sent! Waiting for Sepolia block confirmation…`;

        const receipt = await tx.wait(1);
        dom.txStatus.className = "tx-status is-success";
        dom.txStatus.textContent = "Identity saved on Ethereum Sepolia ✓";
        dom.txHash.textContent = receipt.hash;
        dom.txBlock.textContent = receipt.blockNumber;
        dom.txResult.textContent = "Success";
        dom.etherscanTxLink.href = `${ETHERSCAN_BASE_URL}/tx/${receipt.hash}`;
        dom.txDetails.hidden = false;
        dom.txActions.hidden = false;

        showSuccess("Identity saved to blockchain!");
        loadUserData();
    } catch (err) {
        console.error("storeUserData error:", err);
        dom.txStatus.className = "tx-status is-error";
        dom.txStatus.textContent = err.code === 4001 ? "Transaction cancelled in MetaMask." : "Failed to save identity.";
    } finally {
        dom.submitBtn.disabled = false;
    }
}

// ============================================================
// 21. TAB NAVIGATION
// ============================================================

function switchTab(tabKey) {
    activeTab = tabKey;
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tab === tabKey);
    });

    const tabMap = {
        "explore":     "tabExplore",
        "marketplace": "tabMarketplace",
        "create-nft":  "tabCreateNft",
        "my-nfts":     "tabMyNfts",
        "identity":    "tabIdentity",
        "activity":    "tabActivity"
    };

    document.querySelectorAll(".tab-content").forEach(tc => {
        tc.classList.toggle("active", tc.id === tabMap[tabKey]);
    });

    if (tabKey === "marketplace") renderMarketplace();
    if (tabKey === "my-nfts") renderPortfolio();
    if (tabKey === "activity") loadActivity();
}

// ============================================================
// 22. LIVE PREVIEW IN CREATOR STUDIO
// ============================================================

function updateLivePreview() {
    const name = dom.nftNameInput?.value?.trim() || "Untitled Creation";
    const desc = dom.nftDescInput?.value?.trim() || "Description will appear here…";
    const img  = dom.nftImageInput?.value?.trim() || "favicon.svg";
    const cat  = dom.nftCategoryInput?.value?.trim() || "Art";
    const price= dom.nftInitialPriceInput?.value?.trim();

    if (dom.previewTitle) dom.previewTitle.textContent = name;
    if (dom.previewDesc) dom.previewDesc.textContent = desc;
    if (dom.previewCategory) dom.previewCategory.textContent = cat;
    if (dom.previewImg) dom.previewImg.src = img;
    if (dom.previewPrice) dom.previewPrice.textContent = price ? `${price} SepoliaETH` : "— SepoliaETH";
}

// ============================================================
// 23. EVENT LISTENERS & INITIALISATION
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    // Navigation
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    document.querySelectorAll("[data-tab-link]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            switchTab(btn.dataset.tabLink);
        });
    });

    if (dom.logoLink) {
        dom.logoLink.addEventListener("click", () => switchTab("explore"));
    }

    // Wallet & Drawer
    dom.connectBtn.addEventListener("click", () => {
        if (currentAccount) {
            dom.walletDrawer.hidden = !dom.walletDrawer.hidden;
        } else {
            connectWallet();
        }
    });

    if (dom.closeWalletDrawer) dom.closeWalletDrawer.addEventListener("click", () => dom.walletDrawer.hidden = true);
    if (dom.disconnectBtn) dom.disconnectBtn.addEventListener("click", () => {
        currentAccount = null;
        dom.walletDrawer.hidden = true;
        updateWalletUI();
        showToast("Disconnected", "🔌");
    });
    if (dom.drawerCopyBtn) dom.drawerCopyBtn.addEventListener("click", () => {
        if (currentAccount) navigator.clipboard.writeText(currentAccount).then(() => showSuccess("Address copied!"));
    });

    // Mobile Navigation Toggle
    if (dom.mobileNavToggle) {
        dom.mobileNavToggle.addEventListener("click", () => {
            document.querySelector(".header").classList.toggle("nav-mobile-open");
        });
    }

    // Network
    if (dom.switchNetworkBtn) dom.switchNetworkBtn.addEventListener("click", switchToSepolia);

    // Marketplace Toolbar
    if (dom.marketSearchInput) dom.marketSearchInput.addEventListener("input", () => renderMarketplace());
    if (dom.marketSortSelect) dom.marketSortSelect.addEventListener("change", (e) => {
        currentMarketSort = e.target.value;
        renderMarketplace();
    });

    document.querySelectorAll("[data-market-filter]").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("[data-market-filter]").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentMarketFilter = btn.dataset.marketFilter;
            renderMarketplace();
        });
    });

    // Portfolio Toolbar
    document.querySelectorAll("[data-portfolio-filter]").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("[data-portfolio-filter]").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentPortfolioFilter = btn.dataset.portfolioFilter;
            renderPortfolio();
        });
    });

    if (dom.refreshMyNftsBtn) dom.refreshMyNftsBtn.addEventListener("click", () => loadAllTokens());

    // Activity Toolbar
    document.querySelectorAll("[data-act-filter]").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("[data-act-filter]").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentActFilter = btn.dataset.actFilter;
            renderActivityTable();
        });
    });

    if (dom.refreshActivityBtn) dom.refreshActivityBtn.addEventListener("click", () => loadActivity());

    // Creator Studio: Live Preview Inputs
    [dom.nftNameInput, dom.nftDescInput, dom.nftImageInput, dom.nftCategoryInput, dom.nftInitialPriceInput].forEach(inp => {
        if (inp) {
            inp.addEventListener("input", updateLivePreview);
            inp.addEventListener("change", updateLivePreview);
        }
    });

    // Sample Art Buttons
    if (dom.sampleArt1) dom.sampleArt1.addEventListener("click", () => {
        dom.nftNameInput.value = "Cyber Punk Samurai #01";
        dom.nftDescInput.value = "Futuristic decentralized digital identity from the Neo-Tokyo Sepolia district.";
        dom.nftImageInput.value = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800";
        dom.nftCategoryInput.value = "Cyberpunk";
        updateLivePreview();
    });
    if (dom.sampleArt2) dom.sampleArt2.addEventListener("click", () => {
        dom.nftNameInput.value = "Cosmic Nebula Genesis";
        dom.nftDescInput.value = "Interstellar generative cosmic dust captured across Ethereum block boundaries.";
        dom.nftImageInput.value = "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800";
        dom.nftCategoryInput.value = "Generative Space";
        updateLivePreview();
    });
    if (dom.sampleArt3) dom.sampleArt3.addEventListener("click", () => {
        dom.nftNameInput.value = "Sovereign Identity Badge";
        dom.nftDescInput.value = "Verifiable cryptographic credential minted on Sepolia for decentralized authentication.";
        dom.nftImageInput.value = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800";
        dom.nftCategoryInput.value = "Identity Badge";
        updateLivePreview();
    });

    // Mode Toggle
    if (dom.modeAutoBtn) dom.modeAutoBtn.addEventListener("click", () => {
        metadataMode = "auto";
        dom.modeAutoBtn.className = "btn btn--sm btn--primary";
        dom.modeManualBtn.className = "btn btn--sm btn--ghost";
        dom.autoMetadataFields.hidden = false;
        dom.manualMetadataFields.hidden = true;
    });
    if (dom.modeManualBtn) dom.modeManualBtn.addEventListener("click", () => {
        metadataMode = "manual";
        dom.modeManualBtn.className = "btn btn--sm btn--primary";
        dom.modeAutoBtn.className = "btn btn--sm btn--ghost";
        dom.autoMetadataFields.hidden = true;
        dom.manualMetadataFields.hidden = false;
    });

    // Mint Action
    if (dom.mintBtn) dom.mintBtn.addEventListener("click", mintNFT);

    // Identity Actions
    if (dom.storeForm) dom.storeForm.addEventListener("submit", (e) => { e.preventDefault(); storeUserData(); });
    if (dom.refreshBtn) dom.refreshBtn.addEventListener("click", loadUserData);

    // Modals Close
    if (dom.modalClose) dom.modalClose.addEventListener("click", () => dom.nftModal.hidden = true);
    if (dom.sellModalClose) dom.sellModalClose.addEventListener("click", () => dom.sellModal.hidden = true);
    if (dom.transferModalClose) dom.transferModalClose.addEventListener("click", () => dom.transferModal.hidden = true);
    if (dom.delistModalClose) dom.delistModalClose.addEventListener("click", () => dom.delistModal.hidden = true);
    if (dom.delistCancelBtn) dom.delistCancelBtn.addEventListener("click", () => dom.delistModal.hidden = true);

    // Modal Actions
    if (dom.sellConfirmBtn) dom.sellConfirmBtn.addEventListener("click", executeList);
    if (dom.transferConfirmBtn) dom.transferConfirmBtn.addEventListener("click", executeTransfer);
    if (dom.delistConfirmBtn) dom.delistConfirmBtn.addEventListener("click", executeRemoveFromMarketplace);

    // Contract Copy Buttons
    if (dom.copyContractBtn) dom.copyContractBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(CONTRACTS.sepolia.identity).then(() => showSuccess("Identity contract copied!"));
    });
    if (dom.copyNftContractBtn) dom.copyNftContractBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(CONTRACTS.sepolia.nft).then(() => showSuccess("NFT contract copied!"));
    });
    if (dom.copyMarketplaceBtn) dom.copyMarketplaceBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(CONTRACTS.sepolia.marketplace).then(() => showSuccess("Marketplace contract copied!"));
    });

    // Boot
    init();
});
