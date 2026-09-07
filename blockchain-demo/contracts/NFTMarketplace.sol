// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
// NFTMarketplace — Decentralised NFT Marketplace Contract
// ============================================================
//
// This contract lets users:
//   1. LIST   an ERC-721 NFT for sale at a fixed price.
//   2. CANCEL a listing they created.
//   3. BUY    a listed NFT by sending the exact listing price.
//
// Design decisions:
//   • Non-custodial: the NFT stays in the seller's wallet until
//     a buyer purchases it.  The seller must approve this
//     contract to transfer the NFT on their behalf.
//   • Mapping-based storage: listings are keyed by
//     (nftContract, tokenId) — O(1) lookups, no loops.
//   • Events for discovery: NFTListed / NFTSold / ListingCancelled
//     events let the frontend discover activity without expensive
//     on-chain enumeration.
//   • ReentrancyGuard protects the buy function against
//     reentrancy attacks during ETH transfer.
//   • Checks-Effects-Interactions pattern: state is updated
//     (listing deleted) BEFORE external calls (NFT transfer,
//     ETH transfer).
//
// Security:
//   • No admin/owner functions — fully permissionless.
//   • No hidden withdrawal backdoors.
//   • Validates ownership, approval, listing status, price,
//     and buyer ≠ seller on every operation.
// ============================================================

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTMarketplace is ReentrancyGuard {

    // --------------------------------------------------------
    // DATA STRUCTURES
    // --------------------------------------------------------

    struct Listing {
        address seller;     // Who listed the NFT
        uint256 price;      // Sale price in wei
        bool    active;     // Whether the listing is live
    }

    /// @notice nftContract => tokenId => Listing
    mapping(address => mapping(uint256 => Listing)) public listings;

    // --------------------------------------------------------
    // EVENTS
    // --------------------------------------------------------

    event NFTListed(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );

    event NFTSold(
        address indexed nftContract,
        uint256 indexed tokenId,
        address         seller,
        address indexed buyer,
        uint256         price
    );

    event ListingCancelled(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed seller
    );

    // --------------------------------------------------------
    // LIST
    // --------------------------------------------------------

    /// @notice List an NFT for sale.
    /// @dev    Caller must own the NFT and have approved this contract.
    function listNFT(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external {
        require(price > 0, "Price must be greater than 0");

        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "You don't own this NFT");
        require(
            nft.getApproved(tokenId) == address(this) ||
            nft.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved to transfer this NFT"
        );
        require(!listings[nftContract][tokenId].active, "Already listed");

        listings[nftContract][tokenId] = Listing({
            seller: msg.sender,
            price:  price,
            active: true
        });

        emit NFTListed(nftContract, tokenId, msg.sender, price);
    }

    // --------------------------------------------------------
    // CANCEL
    // --------------------------------------------------------

    /// @notice Cancel an existing listing. Only the seller can cancel.
    function cancelListing(
        address nftContract,
        uint256 tokenId
    ) external {
        Listing storage listing = listings[nftContract][tokenId];
        require(listing.active, "Not currently listed");
        require(listing.seller == msg.sender, "Only the seller can cancel");

        delete listings[nftContract][tokenId];
        emit ListingCancelled(nftContract, tokenId, msg.sender);
    }

    // --------------------------------------------------------
    // BUY
    // --------------------------------------------------------

    /// @notice Buy a listed NFT by sending the exact listing price.
    /// @dev    Uses checks-effects-interactions and ReentrancyGuard.
    function buyNFT(
        address nftContract,
        uint256 tokenId
    ) external payable nonReentrant {
        Listing memory listing = listings[nftContract][tokenId];
        require(listing.active, "Not currently listed");
        require(msg.value == listing.price, "Send the exact listing price");
        require(msg.sender != listing.seller, "Cannot buy your own NFT");

        // --- Effects: clear listing BEFORE interactions ---
        delete listings[nftContract][tokenId];

        // --- Interactions ---
        // Transfer NFT from seller to buyer
        IERC721(nftContract).safeTransferFrom(
            listing.seller,
            msg.sender,
            tokenId
        );

        // Transfer ETH to seller
        (bool success, ) = payable(listing.seller).call{value: msg.value}("");
        require(success, "ETH payment to seller failed");

        emit NFTSold(
            nftContract,
            tokenId,
            listing.seller,
            msg.sender,
            listing.price
        );
    }

    // --------------------------------------------------------
    // VIEW
    // --------------------------------------------------------

    /// @notice Get the listing details for an NFT.
    function getListing(
        address nftContract,
        uint256 tokenId
    ) external view returns (
        address seller,
        uint256 price,
        bool    active
    ) {
        Listing memory l = listings[nftContract][tokenId];
        return (l.seller, l.price, l.active);
    }
}
