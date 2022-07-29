// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @notice This contract uses randrom numbers to generate random NFTs 
            using that random number, we'll get random NFT
            There will be three types of NFTs, i.e 
        *    Pug super rare
        *    Shiba sort of rare
        *    St. bernard common
 * @notice Users have to pay ETH to mint NFT, to pay artists,
           the owner can withdraw payments.

*/
error RandomIpfsNft__RangeOutOfBounds();
error RandomIpfsNft__NotEnoughETH();
error RandomIpfsNft__TransferFailed();
error RandomIpfsNft__InvalidRequestId();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    // address private immutable i_owner;

    // VRF Chainlink variables
    uint64 private immutable i_subscriptionId;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_keyHash;
    uint32 private immutable i_callbackGasLimit;

    uint32 constant NUM_OF_WORDS_TO_REQUEST = 1;
    uint16 constant CONFIRMATIONS = 5;

    mapping(uint256 => address) private s_requestToSender;

    enum Breed {
        PUB,
        SHIBA_INU,
        ST_BERNARD
    }

    // NFT variables
    uint256 private s_TokenCounter;
    uint256 internal constant MAX_CHANCE = 100;
    string[3] private s_dogTokenUri;

    uint256 internal immutable i_mintFee;

    // Events
    event NftRequested(uint256 indexed requestId, address requestSender);
    event NftMinted(Breed dogBreed, address minter);

    constructor(
        address vrfCoordinator,
        uint64 subscriptionId,
        bytes32 keyHash,
        uint32 callbackGasLimit,
        string[3] memory dogTokenUri,
        uint256 mintFee
    ) VRFConsumerBaseV2(vrfCoordinator) ERC721("RandomIpfsNft", "RIN") {
        i_subscriptionId = subscriptionId;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_keyHash = keyHash;
        i_callbackGasLimit = callbackGasLimit;
        s_TokenCounter = 0;
        s_dogTokenUri = dogTokenUri;
        i_mintFee = mintFee;
    }

    function requestNft() public payable returns (uint256 requestId) {
        if (msg.value < i_mintFee) {
            revert RandomIpfsNft__NotEnoughETH();
        }

        // Will revert if subscription is not set and funded.
        requestId = i_vrfCoordinator.requestRandomWords(
            i_keyHash,
            i_subscriptionId,
            CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_OF_WORDS_TO_REQUEST
        );
        s_requestToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        address dogOwner = s_requestToSender[requestId];
        if (dogOwner == address(0)) {
            revert RandomIpfsNft__InvalidRequestId();
        }
        uint256 newTokenId = s_TokenCounter;

        s_TokenCounter = newTokenId + 1;

        Breed dogBreed = getBreed(randomWords[0] % MAX_CHANCE);
        _safeMint(dogOwner, newTokenId);
        _setTokenURI(newTokenId, s_dogTokenUri[uint256(dogBreed)]);

        emit NftMinted(dogBreed, dogOwner);
    }

    /**
   @notice If number is between 0 - 10 (both included), Breed(0) is returned
           if number is between 11 - 30 (both included), Breed(1) is returned
           if number is between 31 - 100 (both included), Breed(2) is returned
 */
    function getBreed(uint256 moddedRandomNft) public pure returns (Breed) {
        uint256 previousRange = 0;
        uint256[3] memory chancesArray = getChanceArray();
        // if moddedRandomNft is 0, set it to 1, so that it is also included
        if (moddedRandomNft == 0) {
            moddedRandomNft = 1;
        }
        for (uint256 i = 0; i < chancesArray.length; ++i) {
            if (
                moddedRandomNft > previousRange &&
                moddedRandomNft <= chancesArray[i]
            ) {
                return Breed(i);
            }
            previousRange = chancesArray[i];
        }
        revert RandomIpfsNft__RangeOutOfBounds();
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert RandomIpfsNft__TransferFailed();
        }
    }

    /**
     * @dev value[0] means chance of rarest nft, if value is between 0 - 10
            value[1] means chance of rare nft, if value is between 11 - 30
            value[2] means chance of common nft, if value is between 31 - MAX_CHANCE i.e 31 - 100 
     */
    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 30, MAX_CHANCE];
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getDogTokenUri(uint256 index) public view returns (string memory) {
        if (index < 0 || index >= 3) {
            revert RandomIpfsNft__RangeOutOfBounds();
        }
        return s_dogTokenUri[index];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_TokenCounter;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
