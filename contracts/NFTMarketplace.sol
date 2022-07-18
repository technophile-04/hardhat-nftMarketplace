// SPDX-License-Identifier:MIT
pragma solidity 0.8.8;
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

error NFTMarketplace__PriceMustBeAboveZero();
error NFTMarketplace__NotApprovedForMarketplace();
error NFTMarketplace__NFTAlreadyListed(address nftContractAddress, uint256 tokenId);
error NFTMarketplace__NotOwner(address nftContractAddress, uint256 tokenId);
error NFTMarketplace__NotListed(address nftContractAddress, uint256 tokenId);
error NFTMarketplace__PriceNotMet(address nftContractAddress, uint256 tokenId, uint256 price);
error NFTMarketplace__NoProceeds();
error NFTMarketplace__FailedToTransferProceeds(address withdrawer, uint256 proceeds);

contract NFTMarketplace is ReentrancyGuard {
    /* Type declarations */
    struct Listing {
        uint256 price;
        address seller;
    }

    /* Events */
    event ItemListed(
        address indexed seller,
        address indexed nftContractAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemBought(
        address indexed buyer,
        address indexed nftContractAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemCanceled(
        address indexed seller,
        address indexed nftContractAddress,
        uint256 indexed tokenId
    );

    /* Storage variables */

    // NFT contract address -> (tokenId -> Listing)
    mapping(address => mapping(uint256 => Listing)) private s_listings;

    // Seller address -> amount earned
    mapping(address => uint256) private s_proceeds;

    ////////////////////
    // Modifiers      //
    ////////////////////
    modifier notListed(address nftContractAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftContractAddress][tokenId];
        if (listing.price > 0) {
            revert NFTMarketplace__NFTAlreadyListed(nftContractAddress, tokenId);
        }
        _;
    }

    modifier isOwner(
        address nftContractAddress,
        uint256 tokenId,
        address owner
    ) {
        IERC721 nftContract = IERC721(nftContractAddress);
        if (nftContract.ownerOf(tokenId) != owner) {
            revert NFTMarketplace__NotOwner(nftContractAddress, tokenId);
        }
        _;
    }

    modifier isListed(address nftContractAddress, uint256 tokenId) {
        Listing memory listedItem = s_listings[nftContractAddress][tokenId];
        if (listedItem.price <= 0) {
            revert NFTMarketplace__NotListed(nftContractAddress, tokenId);
        }
        _;
    }

    ////////////////////
    // Main Function  //
    ////////////////////

    /**
     * @notice Method for listing your NFT on marketplace
     * @param nftContractAddress : Address of ERC721 NFT contract to which NFT belongs
     * @param tokenId : Corresponding tokenId belonging to above NFT contract address
     * @param price :  price for which you want to list the NFT on marketplace
     */

    function listItem(
        address nftContractAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        notListed(nftContractAddress, tokenId)
        isOwner(nftContractAddress, tokenId, msg.sender)
    {
        if (price <= 0) {
            revert NFTMarketplace__PriceMustBeAboveZero();
        }

        IERC721 nftContract = IERC721(nftContractAddress);

        if (nftContract.getApproved(tokenId) != address(this)) {
            revert NFTMarketplace__NotApprovedForMarketplace();
        }

        s_listings[nftContractAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftContractAddress, tokenId, price);
    }

    /**
     * @notice Method for buying listed NFT from marketplace
     * @param nftContractAddress : Address of ERC721 NFT contract to which NFT belongs
     * @param tokenId :  Corresponding tokenId belonging to above NFT contract address
     */
    function buyItem(address nftContractAddress, uint256 tokenId)
        external
        payable
        nonReentrant
        isListed(nftContractAddress, tokenId)
    {
        Listing memory listedItem = s_listings[nftContractAddress][tokenId];
        if (msg.value < listedItem.price) {
            revert NFTMarketplace__PriceNotMet(nftContractAddress, tokenId, listedItem.price);
        }

        s_proceeds[listedItem.seller] += msg.value;
        delete (s_listings[nftContractAddress][tokenId]);
        IERC721(nftContractAddress).safeTransferFrom(listedItem.seller, msg.sender, tokenId);
        emit ItemBought(msg.sender, nftContractAddress, tokenId, listedItem.price);
    }

    /**
     * @notice Method for caceling listing of  NFT listed on marketplace
     * @param nftContractAddress : Address of ERC721 NFT contract to which NFT belongs
     * @param tokenId :  Corresponding tokenId belonging to above NFT contract address
     */
    function cancelListing(address nftContractAddress, uint256 tokenId)
        external
        isOwner(nftContractAddress, tokenId, msg.sender)
        isListed(nftContractAddress, tokenId)
    {
        delete (s_listings[nftContractAddress][tokenId]);
        emit ItemCanceled(msg.sender, nftContractAddress, tokenId);
    }

    /**
     * @notice Method for updating listing of  NFT listed on marketplace
     * @param nftContractAddress : Address of ERC721 NFT contract to which NFT belongs
     * @param tokenId : Corresponding tokenId belonging to above NFT contract address
     * @param newPrice : price to be updated
     */
    function updateListing(
        address nftContractAddress,
        uint256 tokenId,
        uint256 newPrice
    )
        external
        isListed(nftContractAddress, tokenId)
        isOwner(nftContractAddress, tokenId, msg.sender)
    {
        s_listings[nftContractAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftContractAddress, tokenId, newPrice);
    }

    /**
     * @notice withdraws accumulated funds from selling NFT's
     */

    function withDrawProceeds() external nonReentrant {
        uint256 proceeds = s_proceeds[msg.sender];

        if (proceeds <= 0) {
            revert NFTMarketplace__NoProceeds();
        }

        s_proceeds[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: proceeds}('');

        if (!success) {
            revert NFTMarketplace__FailedToTransferProceeds(msg.sender, proceeds);
        }
    }

    ///////////////////////
    // Getter Function  ///
    ///////////////////////

    function getListing(address nftContractAddress, uint256 tokenId)
        external
        view
        returns (Listing memory)
    {
        return s_listings[nftContractAddress][tokenId];
    }

    function getProceeds() external view returns (uint256) {
        return s_proceeds[msg.sender];
    }
}
