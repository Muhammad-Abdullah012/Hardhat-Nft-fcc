const { network, ethers } = require("hardhat");
const {
    VERIFICATION_BLOCK_CONFIRMATIONS,
    developmentChains,
    NETWORK_CONFIG,
} = require("../helper-hardhat-config.js");
const { verify } = require("../utils/verify");
const {
    DYNAMIC_SVG_NFT,
    V3AGGREGATOR_MOCK,
} = require("../constants/constants");
const fs = require("fs");
const path = require("path");

const readImageFile = (file) => {
    const readStream = fs.createReadStream(file, { encoding: "utf-8" });
    return new Promise((resolve, reject) => {
        readStream.on("data", (chunk) => {
            resolve(chunk.toString());
        });
        readStream.on("error", (err) => {
            reject(err);
        });
    });
};

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    let wait = false;
    let v3AggregatorMock, priceFeedAddress;
    if (developmentChains.includes(network.name)) {
        wait = false;
        v3AggregatorMock = await ethers.getContract(V3AGGREGATOR_MOCK);
        priceFeedAddress = v3AggregatorMock.address;
    } else {
        wait = true;
        priceFeedAddress = NETWORK_CONFIG[chainId].priceFeed;
    }

    const lowSvg = await readImageFile(
        path.join(__dirname, "..", "images", "dynamicNft", "frown.svg")
    );
    const highSvg = await readImageFile(
        path.join(__dirname, "..", "images", "dynamicNft", "happy.svg")
    );
    let arguments = [priceFeedAddress, lowSvg, highSvg];
    const DynamicSvgNft = await deploy(DYNAMIC_SVG_NFT, {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: wait ? VERIFICATION_BLOCK_CONFIRMATIONS : undefined,
    });

    // Verify the deployment
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Contract Address: ", DynamicSvgNft.address);
        log("Arguments: ", arguments);
        log("Verifying...");
        await verify(DynamicSvgNft.address, arguments);
    }
};

module.exports.tags = ["all", "dynamicsvg", "main"];
