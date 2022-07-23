// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "base64-sol/base64.sol";

error DynamicSvgNft__NonExistentTokenId();

contract DynamicSvgNft is ERC721 {
    AggregatorV3Interface internal immutable i_priceFeed;

    uint256 private s_TokenCounter;
    string private constant base64EncodedPrefix = "data:image/svg+xml;base64,";
    string private s_lowImageUri;
    string private s_highImageUri;
    mapping(uint256 => int256) public tokenIdToHighValue;

    event CreatedNFT(uint256 indexed tokenId, int256 highValue);

    constructor(
        address _priceFeed,
        string memory lowSvg,
        string memory highSvg
    ) ERC721("Dynamic SVG NFT", "DSN") {
        s_TokenCounter = 0;
        s_lowImageUri = svgToImageUri(lowSvg);
        s_highImageUri = svgToImageUri(highSvg);
        i_priceFeed = AggregatorV3Interface(_priceFeed);
    }

    function mintNft(int256 highValue) public {
        uint256 tokenCounter = s_TokenCounter;
        tokenIdToHighValue[tokenCounter] = highValue;
        _safeMint(msg.sender, tokenCounter);
        s_TokenCounter = tokenCounter + 1;
        emit CreatedNFT(tokenCounter, highValue);
    }

    function svgToImageUri(string memory svg)
        public
        pure
        returns (string memory)
    {
        string memory base64Encoded = Base64.encode(abi.encodePacked(svg));
        return string(abi.encodePacked(base64EncodedPrefix, base64Encoded));
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        if (!_exists(tokenId)) {
            revert DynamicSvgNft__NonExistentTokenId();
        }

        (, int256 price, , , ) = i_priceFeed.latestRoundData();

        string memory imageUri;

        if (price >= tokenIdToHighValue[tokenId]) {
            imageUri = s_highImageUri;
        } else {
            imageUri = s_lowImageUri;
        }

        bytes memory json = abi.encodePacked(
            '{"name":"',
            name(),
            '","Description":"An NFT that changes on base of chainlink price feed!",',
            '"Attributes":[{"trait_type":"coolness","value":100}],',
            '"image":"',
            imageUri,
            '"}'
        );
        return string(abi.encodePacked(_baseURI(), Base64.encode(json)));
    }

    function getTokenCounter() public view returns (uint256) {
        return s_TokenCounter;
    }
}
