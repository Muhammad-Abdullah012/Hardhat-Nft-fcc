const { network } = require("hardhat");
const {
    VERIFICATION_BLOCK_CONFIRMATIONS,
    developmentChains,
} = require("../helper-hardhat-config.js");
const { verify } = require("../utils/verify");

const { BASIC_NFT } = require("../constants/constants");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    let wait = false;
    if (developmentChains.includes(network.name)) {
        wait = false;
    } else {
        wait = true;
    }

    log("-------------------------------");
    let arguments = [];
    const basicNft = await deploy(BASIC_NFT, {
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
        log("Contract Address: ", basicNft.address);
        log("Arguments: ", arguments);
        log("Verifying...");
        await verify(basicNft.address, arguments);
    }
};

module.exports.tags = ["all", "basicnft", "main"];
