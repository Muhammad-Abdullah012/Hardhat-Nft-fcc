const { ethers } = require("hardhat");

const developmentChains = ["hardhat", "localhost"];
const VERIFICATION_BLOCK_CONFIRMATIONS = 6;
const MINT_FEE = ethers.utils.parseEther("0.01").toString();

/**
 * @notice https://chainlist.org , for chainIds
 * @dev https://docs.chain.link/docs/vrf-contracts/
 *      for vrfCoordinatorV2Address, keyHash
 */

//
const NETWORK_CONFIG = {
    31337: {
        name: "hardhat",
        subscriptionId: 0,
        vrfCoordinatorV2Address: "",
        keyHash:
            "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
        callbackGasLimit: "50000",
        mintFee: MINT_FEE,
    },
    4: {
        name: "rinkeby",
        subscriptionId: 7888,
        vrfCoordinatorV2Address: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
        keyHash:
            "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
        callbackGasLimit: "50000",
        mintFee: MINT_FEE,
        priceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    },
    1: {
        //Ehtereum mainnet
        name: "mainnet",
    },
};

module.exports = {
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    NETWORK_CONFIG,
};
