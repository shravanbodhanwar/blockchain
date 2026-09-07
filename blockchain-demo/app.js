// ============================================================
// BLOCKCHAIN IDENTITY & NFT MARKETPLACE — app.js
// ============================================================
//
// Architecture:  Website → ethers.js → MetaMask → Ethereum Sepolia
//
// This single file powers:
//   • Blockchain Identity  (UserStorage contract)
//   • NFT Minting          (BlockchainIdentityNFT contract — ERC-721)
//   • NFT Marketplace      (NFTMarketplace contract)
//
// Key Web3 concepts:
//   • PROVIDER  – read-only connection to the blockchain.
//   • SIGNER    – backed by MetaMask; signs transactions.
//                 Private key NEVER leaves MetaMask.
//   • CONTRACT  – JS wrapper around a deployed smart contract.
//   • READ calls (view/pure) are FREE — no gas, no MetaMask popup.
//   • WRITE calls create real transactions — require gas + confirmation.
//
// What is an NFT?
//   A Non-Fungible Token is a unique digital asset on the blockchain.
//   Each has a unique token ID and owner tracked by the ERC-721 contract.
//
// What is ERC-721?
//   The Ethereum standard for NFTs.  Defines ownerOf(), transferFrom(),
//   approve(), tokenURI(), etc.
//
// What is IPFS?
//   InterPlanetary File System — a decentralised storage network.
//   NFT images/metadata can be stored on IPFS and referenced by URI.
//
// What is a transaction receipt?
//   After a transaction is mined, the receipt contains the block number,
//   gas used, status, and event logs.
//
// Why localStorage is NOT blockchain storage:
//   localStorage is browser-local and ephemeral.  The blockchain is a
//   permanent, globally-shared ledger.  This DApp uses the blockchain
//   as the sole source of truth.
// ============================================================


// ============================================================
// 1. CONFIGURATION
// ============================================================

/**
 * CONTRACTS Configuration
 * Decentralized contracts on Ethereum Sepolia (Chain ID: 11155111).
 * Identity is pre-deployed; NFT & Marketplace are populated after deployment.
 */
const CONTRACTS = {
    sepolia: {
        identity:    "0x33F5422Dc7fca52D844a8e382A885C6832E72E60",
        nft:         "0x7aF25E48e8F80De26DA27b29659e661eA438Da93",
        marketplace: "0x284eF61ce8e59959249D1Be80d7FadB9F3E58e11"
    }
};

// Contract Address References
const USER_STORAGE_ADDRESS = CONTRACTS.sepolia.identity;
const CONTRACT_ADDRESS     = USER_STORAGE_ADDRESS; // Backward-compatibility alias
const NFT_CONTRACT_ADDRESS = CONTRACTS.sepolia.nft;
const MARKETPLACE_ADDRESS  = CONTRACTS.sepolia.marketplace;

// ============================================================
// CONTRACT ABIs — Separate, strongly-typed ABIs for each contract
// ============================================================

/**
 * 1. UserStorage Contract ABI (Ethereum Sepolia: 0x33F5422Dc7fca52D844a8e382A885C6832E72E60)
 */
const USER_STORAGE_ABI = [
    "function storeUser(string memory _name, string memory _role) public",
    "function getUser(address _user) public view returns (string memory, string memory)",
    "event UserStored(address indexed user, string name, string role)"
];
const CONTRACT_ABI = USER_STORAGE_ABI; // Backward-compatibility alias

/**
 * 2. BlockchainIdentityNFT Contract ABI (ERC-721 + ERC721URIStorage)
 * Generated from contracts/BlockchainIdentityNFT.sol compilation artifact
 */
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
    "function safeTransferFrom(address from, address to, uint256 tokenId) public",
    "function transferFrom(address from, address to, uint256 tokenId) public",
    "function balanceOf(address owner) public view returns (uint256)",
    "function supportsInterface(bytes4 interfaceId) public view returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "event NFTMinted(address indexed creator, uint256 indexed tokenId, string tokenURI)",
    "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
    "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)"
];

/**
 * 3. NFTMarketplace Contract ABI
 * Generated from contracts/NFTMarketplace.sol compilation artifact
 */
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

const SEPOLIA_CHAIN_ID     = "11155111";
const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";
const ETHERSCAN_BASE_URL   = "https://sepolia.etherscan.io";
const IPFS_GATEWAY         = "https://ipfs.io/ipfs/";
const MAX_INPUT_LENGTH     = 100;
const ZERO_ADDRESS         = "0x0000000000000000000000000000000000000000";


// ============================================================
// 2. DOM REFERENCES
// ============================================================

const dom = {
    connectBtn:       el("connectBtn"),
    networkBadge:     el("networkBadge"),
    noMetamaskCard:   el("noMetamaskCard"),
    wrongNetworkCard: el("wrongNetworkCard"),
    switchNetworkBtn: el("switchNetworkBtn"),
    setupCard:        el("setupCard"),
    mainNav:          el("mainNav"),
    welcomeCard:      el("welcomeCard"),
    welcomeConnectBtn:el("welcomeConnectBtn"),
    // Wallet
    walletCard:       el("walletCard"),
    walletShort:      el("walletShort"),
    walletNetwork:    el("walletNetwork"),
    walletBalance:    el("walletBalance"),
    copyAddressBtn:   el("copyAddressBtn"),
    copyFeedback:     el("copyFeedback"),
    statNftsOwned:    el("statNftsOwned"),
    // Dashboard
    identityPreview:  el("identityPreview"),
    identityPreviewText: el("identityPreviewText"),
    nftStatsCard:     el("nftStatsCard"),
    statTotalMinted:  el("statTotalMinted"),
    statMyNfts:       el("statMyNfts"),
    statListedCount:  el("statListedCount"),
    refreshAllBtn:    el("refreshAllBtn"),
    // Identity
    identityCard:     el("identityCard"),
    identityLoading:  el("identityLoading"),
    identityEmpty:    el("identityEmpty"),
    identityData:     el("identityData"),
    displayName:      el("displayName"),
    displayRole:      el("displayRole"),
    displayWallet:    el("displayWallet"),
    refreshBtn:       el("refreshBtn"),
    formCard:         el("formCard"),
    formTitle:        el("formTitle"),
    storeForm:        el("storeForm"),
    inputName:        el("inputName"),
    inputRole:        el("inputRole"),
    nameError:        el("nameError"),
    roleError:        el("roleError"),
    submitBtn:        el("submitBtn"),
    txCard:           el("txCard"),
    txStatus:         el("txStatus"),
    txDetails:        el("txDetails"),
    txHash:           el("txHash"),
    txBlock:          el("txBlock"),
    txResult:         el("txResult"),
    txActions:        el("txActions"),
    etherscanTxLink:  el("etherscanTxLink"),
    detailsCard:      el("detailsCard"),
    copyContractBtn:  el("copyContractBtn"),
    nftContractDisplay: el("nftContractDisplay"),
    marketplaceContractDisplay: el("marketplaceContractDisplay"),
    copyNftContractBtn: el("copyNftContractBtn"),
    copyMarketplaceBtn: el("copyMarketplaceBtn"),
    debugWalletStatus:  el("debugWalletStatus"),
    debugNetworkStatus: el("debugNetworkStatus"),
    debugIdentityStatus:el("debugIdentityStatus"),
    debugNftStatus:     el("debugNftStatus"),
    debugMarketStatus:  el("debugMarketStatus"),
    nftExplorerLinkWrap:el("nftExplorerLinkWrap"),
    nftExplorerLink:    el("nftExplorerLink"),
    marketExplorerLinkWrap: el("marketExplorerLinkWrap"),
    marketExplorerLink: el("marketExplorerLink"),
    // Create NFT
    modeAutoBtn:      el("modeAutoBtn"),
    modeManualBtn:    el("modeManualBtn"),
    autoMetadataFields: el("autoMetadataFields"),
    manualMetadataFields: el("manualMetadataFields"),
    nftNameInput:     el("nftNameInput"),
    nftDescInput:     el("nftDescInput"),
    nftImageInput:    el("nftImageInput"),
    nftCategoryInput: el("nftCategoryInput"),
    nftNameError:     el("nftNameError"),
    nftDescError:     el("nftDescError"),
    nftImageError:    el("nftImageError"),
    manualUriInput:   el("manualUriInput"),
    manualUriError:   el("manualUriError"),
    mintBtn:          el("mintBtn"),
    mintTxCard:       el("mintTxCard"),
    mintTxStatus:     el("mintTxStatus"),
    mintTxDetails:    el("mintTxDetails"),
    mintTokenId:      el("mintTokenId"),
    mintTxHash:       el("mintTxHash"),
    mintTxBlock:      el("mintTxBlock"),
    mintTxResult:     el("mintTxResult"),
    mintTxActions:    el("mintTxActions"),
    mintEtherscanLink:el("mintEtherscanLink"),
    // My NFTs
    myNftsLoading:    el("myNftsLoading"),
    myNftsEmpty:      el("myNftsEmpty"),
    myNftsGrid:       el("myNftsGrid"),
    refreshMyNftsBtn: el("refreshMyNftsBtn"),
    // Marketplace
    marketLoading:    el("marketLoading"),
    marketEmpty:      el("marketEmpty"),
    marketGrid:       el("marketGrid"),
    refreshMarketBtn: el("refreshMarketBtn"),
    // Activity
    activityLoading:  el("activityLoading"),
    activityEmpty:    el("activityEmpty"),
    activityBody:     el("activityBody"),
    activityTableBody:el("activityTableBody"),
    refreshActivityBtn:el("refreshActivityBtn"),
    // NFT Detail Modal
    nftModal:         el("nftModal"),
    modalClose:       el("modalClose"),
    modalImage:       el("modalImage"),
    modalName:        el("modalName"),
    modalDesc:        el("modalDesc"),
    modalTokenId:     el("modalTokenId"),
    modalOwner:       el("modalOwner"),
    modalCreator:     el("modalCreator"),
    modalListingStatus:el("modalListingStatus"),
    modalPrice:       el("modalPrice"),
    modalContract:    el("modalContract"),
    modalMetadataUri: el("modalMetadataUri"),
    modalTxStatus:    el("modalTxStatus"),
    modalActions:     el("modalActions"),
    // Sell Modal
    sellModal:        el("sellModal"),
    sellModalClose:   el("sellModalClose"),
    sellPriceInput:   el("sellPriceInput"),
    sellPriceError:   el("sellPriceError"),
    sellTxStatus:     el("sellTxStatus"),
    sellConfirmBtn:   el("sellConfirmBtn"),
    // Transfer Modal
    transferModal:    el("transferModal"),
    transferModalClose:el("transferModalClose"),
    transferAddressInput:el("transferAddressInput"),
    transferAddressError:el("transferAddressError"),
    transferTxStatus: el("transferTxStatus"),
    transferConfirmBtn:el("transferConfirmBtn"),
};

function el(id) { return document.getElementById(id); }


// ============================================================
// 3. GLOBAL STATE
// ============================================================

let currentAccount    = null;
let provider          = null;
let signer            = null;
let contract          = null;   // UserStorage (read)
let nftContract       = null;   // BlockchainIdentityNFT (read)
let nftContractWrite  = null;   // NFT (write via signer)
let marketContract    = null;   // NFTMarketplace (read)
let marketContractWrite = null; // Marketplace (write via signer)
let currentChainId    = null;
let metadataMode      = "auto"; // "auto" | "manual"
let activeModalTokenId = null;  // token ID shown in detail modal
let activeModalNft     = null;  // cached NFT data for active modal

// Idempotent lifecycle & polling state
let isMetaMaskListenersRegistered = false;
let isConnecting                  = false;
let isInitialized                 = false;
let accountsPollInterval          = null;
let chainPollInterval             = null;

/**
 * Singleton BrowserProvider — prevents creating multiple provider instances
 * that attach redundant EventEmitter stream listeners to window.ethereum.
 */
function getProvider() {
    if (!provider && window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
    }
    return provider;
}

/**
 * Derives or refreshes the JsonRpcSigner from the singleton provider.
 */
async function getSigner() {
    const p = getProvider();
    if (!p) throw new Error("MetaMask is not available.");
    signer = await p.getSigner();
    return signer;
}


// ============================================================
// 4. HELPERS
// ============================================================

function shortenAddress(addr) {
    if (!addr) return "—";
    return addr.slice(0, 6) + "…" + addr.slice(-4);
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

/**
 * Granular Startup & Setup Diagnostic Check
 * Validates connection, network, and contract reachability on Ethereum Sepolia,
 * and updates developer-friendly connection badges.
 */
async function checkContractSetup() {
    // Update Wallet debug status
    if (dom.debugWalletStatus) {
        dom.debugWalletStatus.textContent = currentAccount ? `Wallet: ${shortenAddress(currentAccount)}` : "Wallet: Disconnected";
        dom.debugWalletStatus.className = currentAccount ? "badge badge--success" : "badge badge--offline";
    }

    // Update Network debug status
    if (dom.debugNetworkStatus) {
        if (!currentAccount) {
            dom.debugNetworkStatus.textContent = "Network: Disconnected";
            dom.debugNetworkStatus.className = "badge badge--offline";
        } else if (isSepoliaActive()) {
            dom.debugNetworkStatus.textContent = "Network: Sepolia (11155111)";
            dom.debugNetworkStatus.className = "badge badge--success";
        } else {
            dom.debugNetworkStatus.textContent = `Network: Wrong (${currentChainId || "?"})`;
            dom.debugNetworkStatus.className = "badge badge--danger";
        }
    }

    // Identity is always configured
    if (dom.debugIdentityStatus) {
        dom.debugIdentityStatus.textContent = "Identity: Connected ✓";
        dom.debugIdentityStatus.className = "badge badge--success";
    }

    // 1. Is wallet connected?
    if (!currentAccount) {
        if (nftContractsConfigured()) {
            if (dom.debugNftStatus) { dom.debugNftStatus.textContent = "NFT: Configured (Sepolia) ✓"; dom.debugNftStatus.className = "badge badge--success"; }
            if (dom.debugMarketStatus) { dom.debugMarketStatus.textContent = "Marketplace: Configured (Sepolia) ✓"; dom.debugMarketStatus.className = "badge badge--success"; }
            hideSetupNotice();
            return true;
        }
        if (dom.debugNftStatus) { dom.debugNftStatus.textContent = "NFT: Not Configured"; dom.debugNftStatus.className = "badge badge--warning"; }
        if (dom.debugMarketStatus) { dom.debugMarketStatus.textContent = "Marketplace: Not Configured"; dom.debugMarketStatus.className = "badge badge--warning"; }
        showSetupNotice(
            "⚙️ NFT Contracts Setup Required",
            "The NFT and Marketplace smart contracts have not been deployed yet. Deploy them to Ethereum Sepolia to enable NFT features."
        );
        return false;
    }

    // 2. Is network Sepolia?
    if (!isSepoliaActive()) {
        if (dom.debugNftStatus) { dom.debugNftStatus.textContent = "NFT: Wrong Network"; dom.debugNftStatus.className = "badge badge--danger"; }
        if (dom.debugMarketStatus) { dom.debugMarketStatus.textContent = "Marketplace: Wrong Network"; dom.debugMarketStatus.className = "badge badge--danger"; }
        showSetupNotice(
            "🔴 Wrong Network",
            "Please switch MetaMask to Ethereum Sepolia (Chain ID: 11155111)."
        );
        return false;
    }

    // 3. Is NFT contract address configured?
    if (!CONTRACTS.sepolia.nft || !ethers.isAddress(CONTRACTS.sepolia.nft)) {
        if (dom.debugNftStatus) { dom.debugNftStatus.textContent = "NFT: Not Configured"; dom.debugNftStatus.className = "badge badge--warning"; }
        showSetupNotice(
            "⚙️ NFT Contract Not Configured",
            "NFT contract address is not configured. Deploy BlockchainIdentityNFT to Sepolia, then update CONTRACTS.sepolia.nft in app.js."
        );
        return false;
    }

    // 4. Is Marketplace contract address configured?
    if (!CONTRACTS.sepolia.marketplace || !ethers.isAddress(CONTRACTS.sepolia.marketplace)) {
        if (dom.debugMarketStatus) { dom.debugMarketStatus.textContent = "Marketplace: Not Configured"; dom.debugMarketStatus.className = "badge badge--warning"; }
        showSetupNotice(
            "⚙️ Marketplace Contract Not Configured",
            "Marketplace contract address is not configured. Deploy NFTMarketplace to Sepolia, then update CONTRACTS.sepolia.marketplace in app.js."
        );
        return false;
    }

    // 5. Can contracts be read on-chain? Verify bytecode on Sepolia
    try {
        const p = getProvider();
        if (p) {
            const [nftCode, marketCode] = await Promise.all([
                p.getCode(CONTRACTS.sepolia.nft),
                p.getCode(CONTRACTS.sepolia.marketplace)
            ]);
            if (!nftCode || nftCode === "0x") {
                if (dom.debugNftStatus) { dom.debugNftStatus.textContent = "NFT: Unreachable on Sepolia"; dom.debugNftStatus.className = "badge badge--danger"; }
                showSetupNotice(
                    "⚠️ NFT Contract Not Found",
                    `NFT contract could not be reached on Sepolia at ${shortenAddress(CONTRACTS.sepolia.nft)}. Please verify this address on Sepolia Etherscan.`
                );
                return false;
            }
            if (!marketCode || marketCode === "0x") {
                if (dom.debugMarketStatus) { dom.debugMarketStatus.textContent = "Marketplace: Unreachable on Sepolia"; dom.debugMarketStatus.className = "badge badge--danger"; }
                showSetupNotice(
                    "⚠️ Marketplace Contract Not Found",
                    `Marketplace contract could not be reached on Sepolia at ${shortenAddress(CONTRACTS.sepolia.marketplace)}. Please verify this address on Sepolia Etherscan.`
                );
                return false;
            }
        }
    } catch (err) {
        console.warn("Contract reachability check warning:", err);
    }

    // All checks passed!
    if (dom.debugNftStatus) { dom.debugNftStatus.textContent = "NFT: Connected ✓"; dom.debugNftStatus.className = "badge badge--success"; }
    if (dom.debugMarketStatus) { dom.debugMarketStatus.textContent = "Marketplace: Connected ✓"; dom.debugMarketStatus.className = "badge badge--success"; }
    if (dom.nftExplorerLinkWrap && dom.nftExplorerLink) {
        dom.nftExplorerLinkWrap.hidden = false;
        dom.nftExplorerLink.href = `${ETHERSCAN_BASE_URL}/address/${CONTRACTS.sepolia.nft}`;
    }
    if (dom.marketExplorerLinkWrap && dom.marketExplorerLink) {
        dom.marketExplorerLinkWrap.hidden = false;
        dom.marketExplorerLink.href = `${ETHERSCAN_BASE_URL}/address/${CONTRACTS.sepolia.marketplace}`;
    }

    hideSetupNotice();
    return true;
}

function showSetupNotice(title, message) {
    if (!dom.setupCard) return;
    dom.setupCard.hidden = false;
    const titleEl = document.getElementById("setupCardTitle");
    const msgEl   = document.getElementById("setupCardMessage");
    if (titleEl) titleEl.textContent = title;
    if (msgEl)   msgEl.textContent   = message;
}

function hideSetupNotice() {
    if (dom.setupCard) dom.setupCard.hidden = true;
}

function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
}

/** Placeholder image SVG for NFTs with broken/missing images */
const PLACEHOLDER_IMG = "data:image/svg+xml," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="#1a2235" width="200" height="200"/><text x="100" y="105" text-anchor="middle" fill="#64748b" font-size="14" font-family="sans-serif">No Image</text></svg>'
);


// ============================================================
// 5. WALLET CONNECTION
// ============================================================

async function connectWallet() {
    if (!window.ethereum) { showNoMetaMask(); return; }
    try {
        dom.connectBtn.disabled = true;
        dom.connectBtn.textContent = "Connecting…";
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (accounts.length === 0) { showError("No accounts returned."); resetConnectButton(); return; }
        currentAccount = accounts[0];
        await postConnection();
    } catch (err) {
        handleConnectionError(err);
        resetConnectButton();
    }
}

async function postConnection() {
    if (isConnecting) return;
    isConnecting = true;
    try {
        updateWalletUI();
        await checkNetwork();
        if (isSepoliaActive()) {
            await initializeBlockchain();
            showConnectedUI();
            await Promise.all([loadUserData(), loadBalance()]);
            if (nftContractsConfigured()) {
                await loadNFTStats();
                // Pre-load for current tab / all view
                const tab = document.querySelector(".tab-btn.active")?.dataset.tab;
                if (tab === "all" || !tab) {
                    await Promise.allSettled([loadMyNFTs(), loadMarketplace(), loadActivity()]);
                } else if (tab === "my-nfts") {
                    await loadMyNFTs();
                } else if (tab === "marketplace") {
                    await loadMarketplace();
                } else if (tab === "activity") {
                    await loadActivity();
                }
            }
        }
    } finally {
        isConnecting = false;
    }
}

function resetConnectButton() {
    dom.connectBtn.disabled = false;
    dom.connectBtn.innerHTML = '<span class="btn-icon" aria-hidden="true">🦊</span> Connect Wallet';
}


// ============================================================
// 6. NETWORK HANDLING
// ============================================================

async function checkNetwork() {
    const hex = await window.ethereum.request({ method: "eth_chainId" });
    currentChainId = parseInt(hex, 16).toString();
    updateNetworkBadge();
    if (!isSepoliaActive()) showWrongNetwork(); else hideWrongNetwork();
}

function isSepoliaActive() { return currentChainId === SEPOLIA_CHAIN_ID; }

async function switchToSepolia() {
    try {
        await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }] });
    } catch (err) {
        if (err.code === 4902) {
            try {
                await window.ethereum.request({ method: "wallet_addEthereumChain", params: [{
                    chainId: SEPOLIA_CHAIN_ID_HEX, chainName: "Ethereum Sepolia",
                    nativeCurrency: { name: "SepoliaETH", symbol: "SepoliaETH", decimals: 18 },
                    rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com", "https://rpc.sepolia.ethpandaops.io"],
                    blockExplorerUrls: [ETHERSCAN_BASE_URL]
                }] });
            } catch { showError("Could not add Sepolia network."); }
        } else if (err.code === 4001) { showError("Network switch cancelled."); }
        else { showError("Could not switch network."); }
    }
}


// ============================================================
// 7. PROVIDER & CONTRACT INITIALISATION
// ============================================================

async function initializeBlockchain() {
    const p = getProvider();
    if (!p) return;
    signer = await getSigner();

    // 1. Initialize UserStorage Contract
    try {
        contract = new ethers.Contract(USER_STORAGE_ADDRESS, USER_STORAGE_ABI, p);
        if (dom.debugIdentityStatus) {
            dom.debugIdentityStatus.textContent = "Identity: Connected ✓";
            dom.debugIdentityStatus.className = "badge badge--success";
        }
    } catch (err) {
        console.error("UserStorage initialization error:", err);
        if (dom.debugIdentityStatus) {
            dom.debugIdentityStatus.textContent = "Identity: Init Failed";
            dom.debugIdentityStatus.className = "badge badge--danger";
        }
    }

    // 2. Perform setup & diagnostic checks
    const isSetupValid = await checkContractSetup();

    // 3. Initialize NFT and Marketplace contracts if configured
    if (isSetupValid) {
        try {
            nftContract         = new ethers.Contract(CONTRACTS.sepolia.nft, NFT_ABI, p);
            nftContractWrite    = new ethers.Contract(CONTRACTS.sepolia.nft, NFT_ABI, signer);
            marketContract      = new ethers.Contract(CONTRACTS.sepolia.marketplace, MARKETPLACE_ABI, p);
            marketContractWrite = new ethers.Contract(CONTRACTS.sepolia.marketplace, MARKETPLACE_ABI, signer);

            // Health check: actual view function calls on-chain
            const [nftName, nftSymbol] = await Promise.all([
                nftContract.name(),
                nftContract.symbol()
            ]);
            console.log(`✅ Connected to NFT Contract: ${nftName} (${nftSymbol}) at ${CONTRACTS.sepolia.nft}`);

            // Marketplace health check
            await marketContract.getListing(CONTRACTS.sepolia.nft, 0);
            console.log(`✅ Connected to NFT Marketplace at ${CONTRACTS.sepolia.marketplace}`);

            if (dom.debugNftStatus) {
                dom.debugNftStatus.textContent = `NFT: Connected (${nftSymbol}) ✓`;
                dom.debugNftStatus.className = "badge badge--success";
            }
            if (dom.debugMarketStatus) {
                dom.debugMarketStatus.textContent = "Marketplace: Connected ✓";
                dom.debugMarketStatus.className = "badge badge--success";
            }

            if (dom.nftContractDisplay) {
                dom.nftContractDisplay.innerHTML = `<a href="${ETHERSCAN_BASE_URL}/address/${CONTRACTS.sepolia.nft}" target="_blank" rel="noopener noreferrer" class="link">${CONTRACTS.sepolia.nft} ↗</a>`;
            }
            if (dom.marketplaceContractDisplay) {
                dom.marketplaceContractDisplay.innerHTML = `<a href="${ETHERSCAN_BASE_URL}/address/${CONTRACTS.sepolia.marketplace}" target="_blank" rel="noopener noreferrer" class="link">${CONTRACTS.sepolia.marketplace} ↗</a>`;
            }
        } catch (healthErr) {
            console.warn("Contract health check warning:", healthErr);
            if (dom.debugNftStatus) {
                dom.debugNftStatus.textContent = "NFT: Health Check Failed";
                dom.debugNftStatus.className = "badge badge--danger";
            }
        }
    }
}


// ============================================================
// 8. IDENTITY — READ
// ============================================================

async function loadUserData() {
    if (!contract || !currentAccount || !isSepoliaActive()) return;
    showIdentityLoading();
    try {
        const [name, role] = await contract.getUser(currentAccount);
        if (name === "" && role === "") {
            showIdentityEmpty(); setFormMode("create");
            dom.identityPreviewText.textContent = "No identity stored yet.";
        } else {
            showIdentityData(name, role); setFormMode("update", name, role);
            dom.identityPreviewText.innerHTML = `<strong>${escapeHtml(name)}</strong> — ${escapeHtml(role)}`;
        }
    } catch (err) {
        console.error("loadUserData:", err);
        showIdentityEmpty(); setFormMode("create");
        showError("Unable to read identity from the blockchain.");
    }
}

async function loadBalance() {
    const p = getProvider();
    if (!p || !currentAccount) return;
    try {
        const wei = await p.getBalance(currentAccount);
        dom.walletBalance.textContent = parseFloat(ethers.formatEther(wei)).toFixed(4) + " SepoliaETH";
    } catch { dom.walletBalance.textContent = "—"; }
}


// ============================================================
// 9. IDENTITY — WRITE
// ============================================================

async function storeUserData() {
    if (!window.ethereum) { showNoMetaMask(); return; }
    if (!currentAccount) {
        showError("Please connect your MetaMask wallet first.");
        await connectWallet();
        return;
    }
    if (!isSepoliaActive()){ showError("Switch to Sepolia."); return; }
    const name = dom.inputName.value.trim();
    const role = dom.inputRole.value.trim();
    if (!validateIdentityInputs(name, role)) return;
    try {
        const s = await getSigner();
        const wc = new ethers.Contract(USER_STORAGE_ADDRESS, USER_STORAGE_ABI, s);
        showTxPending("Waiting for wallet confirmation…");
        dom.submitBtn.disabled = true;
        dom.submitBtn.textContent = "Waiting for MetaMask…";
        const tx = await wc.storeUser(name, role);
        showTxPending("Transaction submitted. Waiting for blockchain confirmation…");
        dom.submitBtn.textContent = "Mining…";
        const receipt = await tx.wait();
        showTxConfirmed(receipt);
        await loadUserData();
        await loadBalance();
        showSuccess("Identity saved to the blockchain!");
    } catch (err) { handleTransactionError(err); }
    finally { dom.submitBtn.disabled = false; updateSubmitButtonText(); }
}

// ============================================================
// 10. IDENTITY — VALIDATION
// ============================================================

function validateIdentityInputs(name, role) {
    let ok = true; clearIdentityErrors();
    if (!name) { fieldError(dom.inputName, dom.nameError, "Please enter your name."); ok = false; }
    else if (name.length > MAX_INPUT_LENGTH) { fieldError(dom.inputName, dom.nameError, "Too long."); ok = false; }
    if (!role) { fieldError(dom.inputRole, dom.roleError, "Please enter your role."); ok = false; }
    else if (role.length > MAX_INPUT_LENGTH) { fieldError(dom.inputRole, dom.roleError, "Too long."); ok = false; }
    return ok;
}
function fieldError(input, errEl, msg) { input.classList.add("is-invalid"); errEl.textContent = msg; errEl.hidden = false; }
function clearIdentityErrors() {
    dom.inputName.classList.remove("is-invalid"); dom.nameError.hidden = true;
    dom.inputRole.classList.remove("is-invalid"); dom.roleError.hidden = true;
}


// ============================================================
// 11. TRANSACTION UI (identity)
// ============================================================

function showTxPending(msg) {
    dom.txCard.hidden = false; dom.txDetails.hidden = true; dom.txActions.hidden = true;
    dom.txStatus.className = "tx-status is-pending";
    dom.txStatus.innerHTML = `<div class="spinner"></div> ${escapeHtml(msg)}`;
}
function showTxConfirmed(receipt) {
    const ok = receipt.status === 1;
    dom.txStatus.className = "tx-status is-success";
    dom.txStatus.textContent = ok ? "Transaction confirmed ✓" : "Transaction failed ✗";
    dom.txHash.textContent = receipt.hash;
    dom.txBlock.textContent = receipt.blockNumber;
    dom.txResult.textContent = ok ? "Success" : "Failed";
    dom.etherscanTxLink.href = `${ETHERSCAN_BASE_URL}/tx/${receipt.hash}`;
    dom.txDetails.hidden = false; dom.txActions.hidden = false;
}


// ============================================================
// 12. UI STATE MANAGEMENT
// ============================================================

function updateWalletUI() {
    if (!currentAccount) return;
    dom.walletShort.textContent   = shortenAddress(currentAccount);
    dom.displayWallet.textContent = shortenAddress(currentAccount);
    dom.connectBtn.innerHTML      = `<span class="btn-icon">🦊</span> ${shortenAddress(currentAccount)}`;
    dom.connectBtn.disabled       = true;
}

function showConnectedUI() {
    if (dom.welcomeCard) dom.welcomeCard.hidden = true;
    dom.walletCard.hidden = false;
    dom.identityPreview.hidden = false;
    dom.nftStatsCard.hidden = false;
    dom.wrongNetworkCard.hidden = true;
    dom.mainNav.hidden = false;
}

function hideConnectedUI() {
    if (dom.welcomeCard) dom.welcomeCard.hidden = false;
    dom.walletCard.hidden = true;
    dom.identityPreview.hidden = true;
    dom.nftStatsCard.hidden = true;
    dom.txCard.hidden = true;
    dom.mintTxCard.hidden = true;
}

function showNoMetaMask() { dom.noMetamaskCard.hidden = false; hideConnectedUI(); }

function showWrongNetwork() {
    dom.wrongNetworkCard.hidden = false;
    hideConnectedUI();
    if (currentAccount) { dom.walletCard.hidden = false; }
}
function hideWrongNetwork() { dom.wrongNetworkCard.hidden = true; }

function updateNetworkBadge() {
    if (!currentAccount) { dom.networkBadge.textContent = "Not Connected"; dom.networkBadge.className = "badge badge--offline"; return; }
    if (isSepoliaActive()) {
        dom.networkBadge.textContent = "Ethereum Sepolia"; dom.networkBadge.className = "badge badge--success";
        dom.walletNetwork.textContent = "Ethereum Sepolia";
    } else {
        dom.networkBadge.textContent = "Wrong Network"; dom.networkBadge.className = "badge badge--danger";
        dom.walletNetwork.textContent = "Wrong Network";
    }
}

function showIdentityLoading() { dom.identityLoading.hidden = false; dom.identityEmpty.hidden = true; dom.identityData.hidden = true; }
function showIdentityEmpty()   { dom.identityLoading.hidden = true;  dom.identityEmpty.hidden = false; dom.identityData.hidden = true; }
function showIdentityData(name, role) {
    dom.identityLoading.hidden = true; dom.identityEmpty.hidden = true; dom.identityData.hidden = false;
    dom.displayName.textContent = name; dom.displayRole.textContent = role;
}

function setFormMode(mode, name, role) {
    if (mode === "update") {
        dom.formTitle.textContent = "📝 Update Information on Blockchain";
        dom.inputName.value = name || ""; dom.inputRole.value = role || "";
    } else {
        dom.formTitle.textContent = "📝 Store Information on Blockchain";
        dom.inputName.value = ""; dom.inputRole.value = "";
    }
    updateSubmitButtonText();
}
function updateSubmitButtonText() {
    const has = dom.displayName.textContent !== "" && !dom.identityData.hidden;
    dom.submitBtn.textContent = has ? "Update on Blockchain" : "Save to Blockchain";
}


// ============================================================
// 13. TAB NAVIGATION
// ============================================================

function switchTab(tabName) {
    // Update nav buttons
    document.querySelectorAll(".tab-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.tab === tabName);
    });
    // Update content areas
    const tabMap = {
        "dashboard":  "tabDashboard",
        "identity":   "tabIdentity",
        "create-nft": "tabCreateNft",
        "my-nfts":    "tabMyNfts",
        "marketplace":"tabMarketplace",
        "activity":   "tabActivity"
    };
    document.querySelectorAll(".tab-content").forEach(tc => {
        tc.classList.toggle("active", tabName === "all" || tc.id === tabMap[tabName]);
    });
    // Lazy-load data for NFT tabs
    if (!nftContractsConfigured() || !currentAccount || !isSepoliaActive()) return;
    if (tabName === "my-nfts" || tabName === "all") loadMyNFTs();
    if (tabName === "marketplace" || tabName === "all") loadMarketplace();
    if (tabName === "activity" || tabName === "all") loadActivity();
}


// ============================================================
// 14. NFT — MINTING
// ============================================================

async function mintNFT() {
    if (!window.ethereum) { showNoMetaMask(); return; }
    if (!currentAccount) {
        showError("Please connect your MetaMask wallet first.");
        await connectWallet();
        return;
    }
    if (!isSepoliaActive()) { showError("Switch to Sepolia first."); return; }
    if (!nftContractsConfigured()) { showError("NFT contracts are not yet configured. Please deploy them first."); return; }

    let metadataURI;
    if (metadataMode === "auto") {
        // Validate auto fields
        const name = dom.nftNameInput.value.trim();
        const desc = dom.nftDescInput.value.trim();
        const img  = dom.nftImageInput.value.trim();
        const cat  = dom.nftCategoryInput.value.trim();
        let ok = true;
        [dom.nftNameError, dom.nftDescError, dom.nftImageError].forEach(e => e.hidden = true);
        [dom.nftNameInput, dom.nftDescInput, dom.nftImageInput].forEach(i => i.classList.remove("is-invalid"));
        if (!name) { fieldError(dom.nftNameInput, dom.nftNameError, "NFT name is required."); ok = false; }
        if (!desc)  { fieldError(dom.nftDescInput, dom.nftDescError, "Description is required."); ok = false; }
        if (!img)   { fieldError(dom.nftImageInput, dom.nftImageError, "Image URI is required."); ok = false; }
        if (!ok) return;

        // Build ERC-721 metadata JSON
        const metadata = {
            name: name,
            description: desc,
            image: img,
            attributes: [
                { trait_type: "Creator", value: currentAccount }
            ]
        };
        if (cat) metadata.attributes.push({ trait_type: "Category", value: cat });

        // Encode as data URI (Option A — self-contained, no IPFS dependency)
        const json = JSON.stringify(metadata);
        metadataURI = "data:application/json;base64," + btoa(unescape(encodeURIComponent(json)));
    } else {
        // Manual mode — user pastes URI
        const uri = dom.manualUriInput.value.trim();
        dom.manualUriError.hidden = true;
        dom.manualUriInput.classList.remove("is-invalid");
        if (!uri) { fieldError(dom.manualUriInput, dom.manualUriError, "Metadata URI is required."); return; }
        metadataURI = uri;
    }

    try {
        const s = await getSigner();
        const wc = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, s);

        // Show mint tx card
        dom.mintTxCard.hidden = false;
        dom.mintTxDetails.hidden = true; dom.mintTxActions.hidden = true;
        dom.mintTxStatus.className = "tx-status is-pending";
        dom.mintTxStatus.innerHTML = '<div class="spinner"></div> Waiting for MetaMask confirmation…';
        dom.mintBtn.disabled = true;
        dom.mintBtn.textContent = "Waiting for MetaMask…";

        const tx = await wc.mintNFT(metadataURI);

        dom.mintTxStatus.innerHTML = '<div class="spinner"></div> Transaction submitted. Waiting for blockchain confirmation…';
        dom.mintBtn.textContent = "Minting…";

        const receipt = await tx.wait();

        // Extract token ID from NFTMinted event
        let tokenId = "?";
        const iface = new ethers.Interface(NFT_ABI);
        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog({ topics: log.topics, data: log.data });
                if (parsed && parsed.name === "NFTMinted") {
                    tokenId = parsed.args.tokenId.toString();
                    break;
                }
            } catch {}
        }

        // Show success
        const ok = receipt.status === 1;
        dom.mintTxStatus.className = "tx-status is-success";
        dom.mintTxStatus.textContent = ok ? "NFT Minted Successfully ✓" : "Mint failed ✗";
        dom.mintTokenId.textContent = "#" + tokenId;
        dom.mintTxHash.textContent = receipt.hash;
        dom.mintTxBlock.textContent = receipt.blockNumber;
        dom.mintTxResult.textContent = ok ? "Success" : "Failed";
        dom.mintEtherscanLink.href = `${ETHERSCAN_BASE_URL}/tx/${receipt.hash}`;
        dom.mintTxDetails.hidden = false; dom.mintTxActions.hidden = false;

        // Refresh NFT data
        const p = getProvider();
        if (p) nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, p);
        await loadNFTStats();
        await loadBalance();
        showSuccess("NFT minted on the blockchain!");
    } catch (err) {
        handleMintError(err);
    } finally {
        dom.mintBtn.disabled = !nftContractsConfigured();
        dom.mintBtn.textContent = "Mint NFT on Blockchain";
    }
}

function handleMintError(err) {
    console.error("Mint error:", err);
    dom.mintTxCard.hidden = false;
    dom.mintTxStatus.className = "tx-status is-error";
    const code = err.code || err?.info?.error?.code;
    const msg  = err.message || "";
    if (code === "ACTION_REJECTED" || code === 4001) dom.mintTxStatus.textContent = "❌ Minting cancelled in MetaMask.";
    else if (msg.includes("insufficient funds") || msg.includes("INSUFFICIENT_FUNDS")) dom.mintTxStatus.textContent = "❌ Not enough Sepolia ETH for gas.";
    else dom.mintTxStatus.textContent = "❌ Minting failed. Please try again.";
    dom.mintTxDetails.hidden = true; dom.mintTxActions.hidden = true;
}


// ============================================================
// 15. NFT — READING & DISCOVERY
// ============================================================
//
// We do NOT use ERC721Enumerable (expensive on-chain storage).
// Instead, we discover minted tokens by querying Transfer events
// where `from == address(0)` (= mint events).  Then we verify
// current ownership with ownerOf().
//
// This is a blockchain event — a log entry created when the
// smart contract emits an event.  Events are indexed and
// queryable but don't cost storage gas.

async function loadNFTStats() {
    if (!nftContract) return;
    try {
        const total = await nftContract.totalSupply();
        dom.statTotalMinted.textContent = total.toString();
        if (currentAccount) {
            const bal = await nftContract.balanceOf(currentAccount);
            dom.statMyNfts.textContent = bal.toString();
            dom.statNftsOwned.textContent = bal.toString();
        }
    } catch (err) { console.error("loadNFTStats:", err); }
}

async function loadMyNFTs() {
    if (!nftContract || !currentAccount) return;
    dom.myNftsLoading.hidden = false; dom.myNftsEmpty.hidden = true; dom.myNftsGrid.hidden = true;
    dom.myNftsGrid.innerHTML = "";
    try {
        const tokenIds = await discoverOwnedTokens(currentAccount);
        if (tokenIds.length === 0) {
            dom.myNftsLoading.hidden = true; dom.myNftsEmpty.hidden = false; return;
        }
        const nfts = await Promise.all(tokenIds.map(id => getNFTDetails(id)));
        dom.myNftsLoading.hidden = true; dom.myNftsGrid.hidden = false;
        nfts.filter(Boolean).forEach(nft => renderNFTCard(nft, dom.myNftsGrid, true));
    } catch (err) {
        console.error("loadMyNFTs:", err);
        dom.myNftsLoading.hidden = true; dom.myNftsEmpty.hidden = false;
    }
}

async function discoverOwnedTokens(owner) {
    const owned = [];
    const ownerLower = owner.toLowerCase();

    // 1. Direct on-chain check using totalSupply() and ownerOf(id)
    // BlockchainIdentityNFT mints tokens starting from 0 to totalSupply() - 1.
    // This is 100% accurate, fast, and immune to public RPC queryFilter block-range limit errors.
    try {
        const total = await nftContract.totalSupply();
        const totalNum = Number(total);
        if (totalNum <= 200) {
            const checks = [];
            for (let i = 0; i < totalNum; i++) {
                checks.push(
                    nftContract.ownerOf(i)
                        .then(o => { if (o.toLowerCase() === ownerLower) owned.push(i); })
                        .catch(() => {})
                );
            }
            await Promise.all(checks);
            return owned.sort((a, b) => Number(a) - Number(b));
        }
    } catch (err) {
        console.warn("Direct totalSupply discovery check:", err);
    }

    // 2. Query Transfer events TO owner as fallback
    try {
        const filter = nftContract.filters.Transfer(null, owner);
        const logs = await nftContract.queryFilter(filter);
        const candidateIds = [...new Set(logs.map(l => l.args.tokenId.toString()))];
        for (const id of candidateIds) {
            try {
                const o = await nftContract.ownerOf(id);
                if (o.toLowerCase() === ownerLower && !owned.includes(id)) owned.push(id);
            } catch {}
        }
    } catch (err) {
        console.warn("Event query error in discoverOwnedTokens:", err);
    }
    return owned.sort((a, b) => Number(a) - Number(b));
}

async function getNFTDetails(tokenId) {
    try {
        const [owner, uri, creator] = await Promise.all([
            nftContract.ownerOf(tokenId),
            nftContract.tokenURI(tokenId),
            nftContract.tokenCreators(tokenId)
        ]);
        const metadata = await fetchMetadata(uri);
        let listing = { active: false, price: 0n, seller: ZERO_ADDRESS };
        if (marketContract) {
            try {
                const [s, p, a] = await marketContract.getListing(NFT_CONTRACT_ADDRESS, tokenId);
                listing = { seller: s, price: p, active: a };
            } catch {}
        }
        return {
            tokenId: tokenId.toString(),
            owner, creator, uri,
            name: metadata?.name || `BINFT #${tokenId}`,
            description: metadata?.description || "",
            image: metadata?.image || "",
            attributes: metadata?.attributes || [],
            listing
        };
    } catch (err) { console.error(`getNFTDetails(${tokenId}):`, err); return null; }
}

async function fetchMetadata(uri) {
    try {
        if (uri.startsWith("data:application/json;base64,")) {
            const json = atob(uri.split(",")[1]);
            return JSON.parse(json);
        }
        if (uri.startsWith("data:application/json,")) {
            return JSON.parse(decodeURIComponent(uri.split(",")[1]));
        }
        const url = ipfsToHttp(uri);
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
    } catch { return null; }
}


// ============================================================
// 16. NFT — MARKETPLACE
// ============================================================

async function loadMarketplace() {
    if (!marketContract || !nftContract) return;
    dom.marketLoading.hidden = false; dom.marketEmpty.hidden = true; dom.marketGrid.hidden = true;
    dom.marketGrid.innerHTML = "";
    try {
        // Find all NFTListed events, then check which are still active
        const filter = marketContract.filters.NFTListed(NFT_CONTRACT_ADDRESS);
        let logs = [];
        try { logs = await marketContract.queryFilter(filter, 0, "latest"); } catch { }
        const seenIds = new Set();
        const activeListings = [];
        // Check from newest to oldest for efficiency
        for (let i = logs.length - 1; i >= 0; i--) {
            const id = logs[i].args.tokenId;
            if (seenIds.has(id.toString())) continue;
            seenIds.add(id.toString());
            try {
                const [s, p, a] = await marketContract.getListing(NFT_CONTRACT_ADDRESS, id);
                if (a) activeListings.push(id);
            } catch {}
        }
        // Fallback: If no event logs were returned or RPC limits were hit, query listings directly up to totalSupply()
        if (activeListings.length === 0) {
            try {
                const total = await nftContract.totalSupply();
                const totalNum = Number(total);
                for (let i = 0; i < totalNum; i++) {
                    if (seenIds.has(i.toString())) continue;
                    try {
                        const [s, p, a] = await marketContract.getListing(NFT_CONTRACT_ADDRESS, i);
                        if (a) {
                            seenIds.add(i.toString());
                            activeListings.push(i);
                        }
                    } catch {}
                }
            } catch (_) {}
        }

        if (activeListings.length === 0) {
            dom.marketLoading.hidden = true; dom.marketEmpty.hidden = false; return;
        }
        const nfts = await Promise.all(activeListings.map(id => getNFTDetails(id)));
        dom.marketLoading.hidden = true; dom.marketGrid.hidden = false;
        let count = 0;
        nfts.filter(Boolean).forEach(nft => {
            if (nft.listing.active) { renderNFTCard(nft, dom.marketGrid, false); count++; }
        });
        dom.statListedCount.textContent = count;
        if (count === 0) { dom.marketGrid.hidden = true; dom.marketEmpty.hidden = false; }
    } catch (err) {
        console.error("loadMarketplace:", err);
        dom.marketLoading.hidden = true; dom.marketEmpty.hidden = false;
    }
}

// --- Approve marketplace for a specific NFT ---
async function approveForMarketplace(tokenId) {
    const s = await getSigner();
    const wc = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, s);
    const tx = await wc.approve(MARKETPLACE_ADDRESS, tokenId);
    await tx.wait();
}

// --- Check if marketplace is approved ---
async function isApprovedForToken(tokenId) {
    const approved = await nftContract.getApproved(tokenId);
    if (approved.toLowerCase() === MARKETPLACE_ADDRESS.toLowerCase()) return true;
    const approvedAll = await nftContract.isApprovedForAll(currentAccount, MARKETPLACE_ADDRESS);
    return approvedAll;
}

// --- List NFT ---
async function listNFT(tokenId, priceEth) {
    const priceWei = ethers.parseEther(priceEth);
    dom.sellTxStatus.hidden = false;
    dom.sellTxStatus.className = "tx-status is-pending";

    // Check & do approval
    const approved = await isApprovedForToken(tokenId);
    if (!approved) {
        dom.sellTxStatus.innerHTML = '<div class="spinner"></div> Approving marketplace (transaction 1/2)…';
        await approveForMarketplace(tokenId);
    }

    // List
    dom.sellTxStatus.innerHTML = '<div class="spinner"></div> Listing NFT… Confirm in MetaMask.';
    const s = await getSigner();
    const wc = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, s);
    const tx = await wc.listNFT(NFT_CONTRACT_ADDRESS, tokenId, priceWei);
    dom.sellTxStatus.innerHTML = '<div class="spinner"></div> Waiting for confirmation…';
    await tx.wait();
    dom.sellTxStatus.className = "tx-status is-success";
    dom.sellTxStatus.textContent = "NFT Listed Successfully ✓";
    showSuccess("NFT listed on marketplace!");
    setTimeout(() => { dom.sellModal.hidden = true; }, 1500);
    await refreshAfterNFTChange();
}

// --- Cancel listing ---
async function cancelListing(tokenId) {
    setModalTxStatus("pending", "Cancelling listing… Confirm in MetaMask.");
    const s = await getSigner();
    const wc = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, s);
    const tx = await wc.cancelListing(NFT_CONTRACT_ADDRESS, tokenId);
    setModalTxStatus("pending", "Waiting for confirmation…");
    await tx.wait();
    setModalTxStatus("success", "Listing cancelled ✓");
    showSuccess("Listing cancelled.");
    await refreshAfterNFTChange();
    dom.nftModal.hidden = true;
}

// --- Buy NFT ---
async function buyNFT(tokenId, priceWei) {
    setModalTxStatus("pending", "Confirm purchase in MetaMask…");
    const s = await getSigner();
    const wc = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, s);
    const tx = await wc.buyNFT(NFT_CONTRACT_ADDRESS, tokenId, { value: priceWei });
    setModalTxStatus("pending", "Waiting for blockchain confirmation…");
    const receipt = await tx.wait();
    setModalTxStatus("success", "Purchase Successful ✓");
    showSuccess("NFT purchased!");
    // Show etherscan link in modal
    const link = document.createElement("a");
    link.href = `${ETHERSCAN_BASE_URL}/tx/${receipt.hash}`;
    link.target = "_blank"; link.rel = "noopener noreferrer";
    link.className = "btn btn--primary btn--sm"; link.textContent = "View on Etherscan ↗";
    dom.modalActions.appendChild(link);
    await refreshAfterNFTChange();
    await loadBalance();
}

function setModalTxStatus(type, msg) {
    dom.modalTxStatus.hidden = false;
    dom.modalTxStatus.className = `tx-status is-${type}`;
    if (type === "pending") dom.modalTxStatus.innerHTML = `<div class="spinner"></div> ${escapeHtml(msg)}`;
    else dom.modalTxStatus.textContent = msg;
}

async function refreshAfterNFTChange() {
    if (nftContractsConfigured()) {
        const p = getProvider();
        if (p) {
            nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, p);
            marketContract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, p);
        }
        await loadNFTStats();
    }
}


// ============================================================
// 17. NFT — TRANSFER
// ============================================================

async function transferNFT(tokenId, toAddress) {
    if (!ethers.isAddress(toAddress)) {
        fieldError(dom.transferAddressInput, dom.transferAddressError, "Invalid Ethereum address.");
        return;
    }
    dom.transferTxStatus.hidden = false;
    dom.transferTxStatus.className = "tx-status is-pending";
    dom.transferTxStatus.innerHTML = '<div class="spinner"></div> Confirm transfer in MetaMask…';

    const s = await getSigner();
    const wc = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, s);
    const tx = await wc.safeTransferFrom(currentAccount, toAddress, tokenId);
    dom.transferTxStatus.innerHTML = '<div class="spinner"></div> Waiting for confirmation…';
    await tx.wait();
    dom.transferTxStatus.className = "tx-status is-success";
    dom.transferTxStatus.textContent = "NFT Transferred ✓";
    showSuccess("NFT transferred successfully!");
    setTimeout(() => { dom.transferModal.hidden = true; }, 1500);
    await refreshAfterNFTChange();
}


// ============================================================
// 18. NFT — UI RENDERING
// ============================================================

function renderNFTCard(nft, container, isOwner) {
    const card = document.createElement("div");
    card.className = "nft-card";
    card.onclick = () => showNFTDetail(nft.tokenId);
    const imgSrc = ipfsToHttp(nft.image) || PLACEHOLDER_IMG;
    card.innerHTML = `
        <img class="nft-card-img" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(nft.name)}" onerror="this.src='${PLACEHOLDER_IMG}'">
        <div class="nft-card-body">
            <div class="nft-card-name">${escapeHtml(nft.name)}</div>
            <div class="nft-card-id">Token #${nft.tokenId}</div>
            <div class="nft-card-owner">${shortenAddress(nft.owner)}</div>
            ${nft.listing.active ? `<div class="nft-card-price">${ethers.formatEther(nft.listing.price)} ETH</div>` : ""}
        </div>
    `;
    container.appendChild(card);
}

async function showNFTDetail(tokenId) {
    if (!nftContract) return;
    dom.nftModal.hidden = false;
    dom.modalTxStatus.hidden = true;
    dom.modalActions.innerHTML = "";
    dom.modalImage.src = PLACEHOLDER_IMG;
    dom.modalName.textContent = "Loading…";
    dom.modalDesc.textContent = "";

    const nft = await getNFTDetails(BigInt(tokenId));
    if (!nft) { dom.modalName.textContent = "NFT not found"; return; }
    activeModalTokenId = tokenId;
    activeModalNft = nft;

    dom.modalImage.src = ipfsToHttp(nft.image) || PLACEHOLDER_IMG;
    dom.modalImage.onerror = function() { this.src = PLACEHOLDER_IMG; };
    dom.modalName.textContent = nft.name;
    dom.modalDesc.textContent = nft.description;
    dom.modalTokenId.textContent = "#" + nft.tokenId;
    dom.modalOwner.textContent = shortenAddress(nft.owner);
    dom.modalCreator.textContent = shortenAddress(nft.creator);
    dom.modalContract.textContent = shortenAddress(NFT_CONTRACT_ADDRESS);
    dom.modalMetadataUri.textContent = nft.uri.length > 60 ? nft.uri.substring(0, 60) + "…" : nft.uri;

    const isOwner = currentAccount && nft.owner.toLowerCase() === currentAccount.toLowerCase();

    if (nft.listing.active) {
        dom.modalListingStatus.textContent = "Listed for sale";
        dom.modalPrice.textContent = ethers.formatEther(nft.listing.price) + " SepoliaETH";
        if (isOwner) {
            addModalBtn("Cancel Listing", "btn--danger", () => wrapAsync(() => cancelListing(nft.tokenId)));
        } else {
            addModalBtn(`Buy for ${ethers.formatEther(nft.listing.price)} ETH`, "btn--success", () => wrapAsync(() => buyNFT(nft.tokenId, nft.listing.price)));
        }
    } else {
        dom.modalListingStatus.textContent = "Not listed";
        dom.modalPrice.textContent = "—";
        if (isOwner) {
            addModalBtn("Sell NFT", "btn--primary", () => openSellModal(nft.tokenId));
            addModalBtn("Transfer", "btn--ghost", () => openTransferModal(nft.tokenId));
        }
    }
    // Etherscan link
    addModalBtn("View Contract ↗", "btn--ghost btn--sm", () => window.open(`${ETHERSCAN_BASE_URL}/address/${NFT_CONTRACT_ADDRESS}`, "_blank"));
}

function addModalBtn(text, cls, handler) {
    const btn = document.createElement("button");
    btn.className = `btn ${cls}`; btn.textContent = text;
    btn.addEventListener("click", handler);
    dom.modalActions.appendChild(btn);
}

function wrapAsync(fn) {
    fn().catch(err => {
        console.error(err);
        const code = err.code || err?.info?.error?.code;
        const msg = err.message || "";
        if (code === "ACTION_REJECTED" || code === 4001) { setModalTxStatus("error", "Transaction cancelled."); }
        else if (msg.includes("insufficient funds")) { setModalTxStatus("error", "Not enough Sepolia ETH."); }
        else { setModalTxStatus("error", "Transaction failed."); }
    });
}

function openSellModal(tokenId) {
    activeModalTokenId = tokenId;
    dom.nftModal.hidden = true;
    dom.sellModal.hidden = false;
    dom.sellPriceInput.value = "";
    dom.sellPriceError.hidden = true;
    dom.sellTxStatus.hidden = true;
}

function openTransferModal(tokenId) {
    activeModalTokenId = tokenId;
    dom.nftModal.hidden = true;
    dom.transferModal.hidden = false;
    dom.transferAddressInput.value = "";
    dom.transferAddressError.hidden = true;
    dom.transferTxStatus.hidden = true;
}


// ============================================================
// 19. NFT — ACTIVITY
// ============================================================

async function loadActivity() {
    if (!nftContract) return;
    dom.activityLoading.hidden = false; dom.activityEmpty.hidden = true; dom.activityBody.hidden = true;
    dom.activityTableBody.innerHTML = "";
    try {
        const events = [];
        // Get Transfer events (includes mints where from=0x0)
        const transferFilter = nftContract.filters.Transfer();
        let tLogs = [];
        try { tLogs = await nftContract.queryFilter(transferFilter, 0, "latest"); } catch {}
        for (const log of tLogs) {
            const from = log.args.from;
            const isMint = from === ZERO_ADDRESS;
            events.push({
                type: isMint ? "Mint" : "Transfer",
                tokenId: log.args.tokenId.toString(),
                from: isMint ? "—" : shortenAddress(from),
                to: shortenAddress(log.args.to),
                price: "—",
                txHash: log.transactionHash,
                block: log.blockNumber
            });
        }
        // Marketplace events
        if (marketContract) {
            try {
                const listedLogs = await marketContract.queryFilter(marketContract.filters.NFTListed(NFT_CONTRACT_ADDRESS), 0, "latest");
                for (const l of listedLogs) {
                    events.push({ type: "Listed", tokenId: l.args.tokenId.toString(), from: shortenAddress(l.args.seller), to: "—", price: ethers.formatEther(l.args.price) + " ETH", txHash: l.transactionHash, block: l.blockNumber });
                }
            } catch {}
            try {
                const soldLogs = await marketContract.queryFilter(marketContract.filters.NFTSold(NFT_CONTRACT_ADDRESS), 0, "latest");
                for (const l of soldLogs) {
                    events.push({ type: "Sale", tokenId: l.args.tokenId.toString(), from: shortenAddress(l.args.seller), to: shortenAddress(l.args.buyer), price: ethers.formatEther(l.args.price) + " ETH", txHash: l.transactionHash, block: l.blockNumber });
                }
            } catch {}
            try {
                const cancelLogs = await marketContract.queryFilter(marketContract.filters.ListingCancelled(NFT_CONTRACT_ADDRESS), 0, "latest");
                for (const l of cancelLogs) {
                    events.push({ type: "Cancel", tokenId: l.args.tokenId.toString(), from: shortenAddress(l.args.seller), to: "—", price: "—", txHash: l.transactionHash, block: l.blockNumber });
                }
            } catch {}
        }
        // Sort by block descending
        events.sort((a, b) => (b.block || 0) - (a.block || 0));
        if (events.length === 0) {
            dom.activityLoading.hidden = true; dom.activityEmpty.hidden = false; return;
        }
        // Render (limit to 50 most recent)
        const display = events.slice(0, 50);
        for (const ev of display) {
            const badgeCls = { Mint: "mint", Sale: "sale", Listed: "list", Cancel: "cancel", Transfer: "transfer" }[ev.type] || "transfer";
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><span class="activity-badge activity-badge--${badgeCls}">${ev.type}</span></td>
                <td>#${ev.tokenId}</td>
                <td>${ev.from}</td>
                <td>${ev.to}</td>
                <td>${ev.price}</td>
                <td><a href="${ETHERSCAN_BASE_URL}/tx/${ev.txHash}" target="_blank" rel="noopener noreferrer" class="link">${ev.txHash.slice(0,10)}…</a></td>
            `;
            dom.activityTableBody.appendChild(tr);
        }
        dom.activityLoading.hidden = true; dom.activityBody.hidden = false;
    } catch (err) {
        console.error("loadActivity:", err);
        dom.activityLoading.hidden = true; dom.activityEmpty.hidden = false;
    }
}


// ============================================================
// 20. ERROR HANDLING
// ============================================================

function handleConnectionError(err) {
    if (err.code === 4001) showError("Connection rejected in MetaMask.");
    else if (err.code === -32002) showError("MetaMask connection pending — check MetaMask.");
    else { showError("Could not connect to MetaMask."); console.error(err); }
}

function handleTransactionError(err) {
    console.error("Transaction error:", err);
    const code = err.code || err?.info?.error?.code;
    const msg  = err.message || "";
    if (code === "ACTION_REJECTED" || code === 4001) showTxError("Transaction cancelled in MetaMask.");
    else if (msg.includes("insufficient funds") || msg.includes("INSUFFICIENT_FUNDS")) showTxError("Not enough Sepolia ETH for gas.");
    else if (code === "CALL_EXCEPTION") showTxError("Smart contract rejected the transaction.");
    else if (msg.includes("nonce")) showTxError("Nonce conflict — reset MetaMask account activity.");
    else if (code === "NETWORK_ERROR") showTxError("Network error — check your connection.");
    else showTxError("Transaction failed. Please try again.");
}

function showTxError(msg) {
    dom.txCard.hidden = false;
    dom.txStatus.className = "tx-status is-error";
    dom.txStatus.textContent = "❌ " + msg;
    dom.txDetails.hidden = true; dom.txActions.hidden = true;
}

function showError(msg)   { showNotification(msg, "error"); }
function showSuccess(msg) { showNotification(msg, "success"); }

function showNotification(message, type) {
    const el = document.createElement("div");
    el.setAttribute("role", "alert");
    el.style.cssText = `position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;max-width:380px;padding:.85rem 1.1rem;border-radius:10px;font-size:.88rem;font-weight:500;color:#fff;opacity:0;transform:translateY(10px);transition:opacity .25s,transform .25s;box-shadow:0 4px 24px rgba(0,0,0,.4);background:${type==="error"?"#dc2626":"#16a34a"}`;
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = "1"; el.style.transform = "translateY(0)"; });
    setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateY(10px)"; setTimeout(() => el.remove(), 300); }, 4500);
}


// ============================================================
// 21. EVENT LISTENERS
// ============================================================

dom.connectBtn.addEventListener("click", connectWallet);
if (dom.welcomeConnectBtn) dom.welcomeConnectBtn.addEventListener("click", connectWallet);
dom.switchNetworkBtn.addEventListener("click", switchToSepolia);
dom.storeForm.addEventListener("submit", e => { e.preventDefault(); storeUserData(); });
dom.mintBtn.addEventListener("click", mintNFT);

// Tab navigation
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});
// Tab links (buttons with data-tab-link)
document.addEventListener("click", e => {
    const link = e.target.closest("[data-tab-link]");
    if (link) { e.preventDefault(); switchTab(link.dataset.tabLink); }
});

// Refresh buttons
dom.refreshBtn.addEventListener("click", async () => {
    if (!isSepoliaActive()) { showError("Switch to Sepolia first."); return; }
    await loadUserData(); await loadBalance(); showSuccess("Data refreshed.");
});
dom.refreshAllBtn.addEventListener("click", async () => {
    if (!isSepoliaActive()) return;
    await Promise.all([loadUserData(), loadBalance()]);
    if (nftContractsConfigured()) await loadNFTStats();
    showSuccess("All data refreshed.");
});
dom.refreshMyNftsBtn.addEventListener("click", () => loadMyNFTs());
dom.refreshMarketBtn.addEventListener("click", () => loadMarketplace());
dom.refreshActivityBtn.addEventListener("click", () => loadActivity());

// Copy buttons
dom.copyAddressBtn.addEventListener("click", () => {
    if (!currentAccount) return;
    navigator.clipboard.writeText(currentAccount).then(() => { dom.copyFeedback.hidden = false; setTimeout(() => dom.copyFeedback.hidden = true, 2000); });
});
dom.copyContractBtn.addEventListener("click", () => { navigator.clipboard.writeText(CONTRACT_ADDRESS).then(() => showSuccess("Identity contract address copied!")); });
dom.copyNftContractBtn.addEventListener("click", () => { if (NFT_CONTRACT_ADDRESS) navigator.clipboard.writeText(NFT_CONTRACT_ADDRESS).then(() => showSuccess("NFT contract address copied!")); });
dom.copyMarketplaceBtn.addEventListener("click", () => { if (MARKETPLACE_ADDRESS) navigator.clipboard.writeText(MARKETPLACE_ADDRESS).then(() => showSuccess("Marketplace address copied!")); });

// Identity validation clearing
dom.inputName.addEventListener("input", () => { dom.inputName.classList.remove("is-invalid"); dom.nameError.hidden = true; });
dom.inputRole.addEventListener("input", () => { dom.inputRole.classList.remove("is-invalid"); dom.roleError.hidden = true; });

// Metadata mode toggle
dom.modeAutoBtn.addEventListener("click", () => {
    metadataMode = "auto";
    dom.modeAutoBtn.className = "btn btn--sm btn--primary";
    dom.modeManualBtn.className = "btn btn--sm btn--ghost";
    dom.autoMetadataFields.hidden = false; dom.manualMetadataFields.hidden = true;
});
dom.modeManualBtn.addEventListener("click", () => {
    metadataMode = "manual";
    dom.modeManualBtn.className = "btn btn--sm btn--primary";
    dom.modeAutoBtn.className = "btn btn--sm btn--ghost";
    dom.autoMetadataFields.hidden = true; dom.manualMetadataFields.hidden = false;
});

// Modals — close
dom.modalClose.addEventListener("click", () => dom.nftModal.hidden = true);
dom.sellModalClose.addEventListener("click", () => dom.sellModal.hidden = true);
dom.transferModalClose.addEventListener("click", () => dom.transferModal.hidden = true);
// Close modal on overlay click
[dom.nftModal, dom.sellModal, dom.transferModal].forEach(m => {
    m.addEventListener("click", e => { if (e.target === m) m.hidden = true; });
});

// Sell confirm
dom.sellConfirmBtn.addEventListener("click", () => {
    const price = dom.sellPriceInput.value.trim();
    dom.sellPriceError.hidden = true;
    if (!price || parseFloat(price) <= 0) {
        fieldError(dom.sellPriceInput, dom.sellPriceError, "Enter a valid price > 0.");
        return;
    }
    dom.sellConfirmBtn.disabled = true;
    listNFT(activeModalTokenId, price).catch(err => {
        console.error(err);
        dom.sellTxStatus.hidden = false;
        dom.sellTxStatus.className = "tx-status is-error";
        const code = err.code || err?.info?.error?.code;
        if (code === "ACTION_REJECTED" || code === 4001) dom.sellTxStatus.textContent = "❌ Cancelled.";
        else dom.sellTxStatus.textContent = "❌ Listing failed.";
    }).finally(() => dom.sellConfirmBtn.disabled = false);
});

// Transfer confirm
dom.transferConfirmBtn.addEventListener("click", () => {
    const addr = dom.transferAddressInput.value.trim();
    dom.transferAddressError.hidden = true;
    dom.transferAddressInput.classList.remove("is-invalid");
    if (!addr) { fieldError(dom.transferAddressInput, dom.transferAddressError, "Enter a wallet address."); return; }
    dom.transferConfirmBtn.disabled = true;
    transferNFT(activeModalTokenId, addr).catch(err => {
        console.error(err);
        dom.transferTxStatus.hidden = false;
        dom.transferTxStatus.className = "tx-status is-error";
        const code = err.code || err?.info?.error?.code;
        if (code === "ACTION_REJECTED" || code === 4001) dom.transferTxStatus.textContent = "❌ Cancelled.";
        else if (err.message?.includes("insufficient funds")) dom.transferTxStatus.textContent = "❌ Not enough Sepolia ETH.";
        else dom.transferTxStatus.textContent = "❌ Transfer failed.";
    }).finally(() => dom.transferConfirmBtn.disabled = false);
});


// ============================================================
// 22. METAMASK EVENT HANDLERS & IDEMPOTENT REGISTRATION
// ============================================================

function handleAccountsChanged(accounts) {
    if (!accounts || accounts.length === 0) {
        currentAccount      = null;
        signer              = null;
        contract            = null;
        nftContract         = null;
        nftContractWrite    = null;
        marketContract      = null;
        marketContractWrite = null;
        hideConnectedUI();
        resetConnectButton();
        updateNetworkBadge();
        return;
    }
    if (accounts[0] === currentAccount) return;
    currentAccount = accounts[0];
    postConnection();
}

function handleChainChanged(hex) {
    const newChainId = parseInt(hex, 16).toString();
    if (newChainId === currentChainId) return;
    currentChainId = newChainId;
    updateNetworkBadge();
    if (!isSepoliaActive()) {
        showWrongNetwork();
        return;
    }
    hideWrongNetwork();
    if (currentAccount) postConnection();
}

function handleDisconnect(error) {
    console.warn("MetaMask disconnected:", error);
    handleAccountsChanged([]);
}

/**
 * Safely unbinds a MetaMask provider event listener if previously registered.
 */
function safeOff(event, handler) {
    if (!window.ethereum) return;
    try {
        const fn = window.ethereum.removeListener;
        if (typeof fn === "function") {
            fn.call(window.ethereum, event, handler);
            return;
        }
    } catch (_) {}

    try {
        if (typeof window.ethereum.off === "function") {
            window.ethereum.off(event, handler);
            return;
        }
    } catch (_) {}

    if (event === "accountsChanged" && accountsPollInterval) {
        clearInterval(accountsPollInterval);
        accountsPollInterval = null;
    }
    if (event === "chainChanged" && chainPollInterval) {
        clearInterval(chainPollInterval);
        chainPollInterval = null;
    }
}

/**
 * Safe event listener registration with single-interval fallback to prevent
 * multiple timers and duplicate event listener warnings.
 */
function safeOn(event, handler) {
    if (!window.ethereum) return;

    try {
        const fn = window.ethereum.on;
        if (typeof fn === "function") {
            fn.call(window.ethereum, event, handler);
            return;
        }
    } catch (_) {}

    try {
        if (typeof window.ethereum.addListener === "function") {
            window.ethereum.addListener(event, handler);
            return;
        }
    } catch (_) {}

    // Fallback polling (clears previous interval to avoid duplicates)
    if (event === "accountsChanged") {
        if (accountsPollInterval) clearInterval(accountsPollInterval);
        accountsPollInterval = setInterval(async () => {
            try {
                const a = await window.ethereum.request({ method: "eth_accounts" });
                if ((a[0] || null) !== currentAccount) handleAccountsChanged(a);
            } catch (_) {}
        }, 2000);
    }
    if (event === "chainChanged") {
        if (chainPollInterval) clearInterval(chainPollInterval);
        chainPollInterval = setInterval(async () => {
            try {
                const c = await window.ethereum.request({ method: "eth_chainId" });
                const d = parseInt(c, 16).toString();
                if (d !== currentChainId) handleChainChanged(c);
            } catch (_) {}
        }, 2000);
    }
}

/**
 * Registers MetaMask event listeners exactly once across app lifecycle.
 */
function registerMetaMaskListeners() {
    if (isMetaMaskListenersRegistered || !window.ethereum) return;
    isMetaMaskListenersRegistered = true;
    safeOn("accountsChanged", handleAccountsChanged);
    safeOn("chainChanged", handleChainChanged);
    safeOn("disconnect", handleDisconnect);
}


// ============================================================
// 23. IDEMPOTENT INITIALISATION
// ============================================================

async function init() {
    if (isInitialized) return;
    isInitialized = true;

    registerMetaMaskListeners();

    if (!window.ethereum) {
        showNoMetaMask();
        return;
    }

    try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
            currentAccount = accounts[0];
            await postConnection();
        }
    } catch (err) {
        console.error("Init error:", err);
    }
}

init();
