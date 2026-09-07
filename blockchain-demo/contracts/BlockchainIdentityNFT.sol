// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
// BlockchainIdentityNFT — ERC-721 NFT Contract
// ============================================================
//
// What is an NFT?
//   A Non-Fungible Token is a unique digital asset on the blockchain.
//   Each NFT has a unique "token ID" and an owner (a wallet address).
//
// What is ERC-721?
//   A standard interface for NFTs on Ethereum.  It defines functions
//   like ownerOf(), transferFrom(), approve(), etc. so that all NFT
//   contracts speak the same language.
//
// What is metadata?
//   A JSON object describing the NFT (name, description, image URL).
//   We store a URI pointing to that JSON — usually on IPFS — instead
//   of storing the JSON itself on-chain (which would be expensive).
//
// Gas optimisations in this contract:
//   • No ERC721Enumerable — saves ~50k gas per mint by avoiding
//     expensive storage arrays.  We discover tokens via Transfer
//     events on the client side instead.
//   • Simple uint256 counter instead of OpenZeppelin Counters
//     (which was removed in OZ v5 anyway).
//   • Metadata stored off-chain (IPFS / data URI) — only the URI
//     string is stored on-chain.
// ============================================================

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract BlockchainIdentityNFT is ERC721, ERC721URIStorage {

    /// @notice Auto-incrementing token ID counter (starts at 0).
    uint256 private _nextTokenId;

    /// @notice Records the original creator of each token.
    mapping(uint256 => address) public tokenCreators;

    /// @notice Emitted when a new NFT is minted.
    event NFTMinted(
        address indexed creator,
        uint256 indexed tokenId,
        string  tokenURI
    );

    constructor() ERC721("BlockchainIdentityNFT", "BINFT") {}

    // --------------------------------------------------------
    // MINT
    // --------------------------------------------------------

    /// @notice Mint a new NFT to the caller's wallet.
    /// @param metadataURI  The token metadata URI (IPFS or data URI).
    /// @return tokenId     The newly minted token's ID.
    function mintNFT(string memory metadataURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataURI);
        tokenCreators[tokenId] = msg.sender;

        emit NFTMinted(msg.sender, tokenId, metadataURI);
        return tokenId;
    }

    // --------------------------------------------------------
    // VIEWS
    // --------------------------------------------------------

    /// @notice Returns the total number of NFTs minted so far.
    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }

    // --------------------------------------------------------
    // REQUIRED OVERRIDES (ERC721 + ERC721URIStorage)
    // --------------------------------------------------------

    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
