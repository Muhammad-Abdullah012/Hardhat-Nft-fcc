const { network } = require("hardhat");
const {
    VRFCOORDINATORV2_MOCK,
    V3AGGREGATOR_MOCK,
} = require("../constants/constants");
const { developmentChains } = require("../helper-hardhat-config");

/** @dev Per request cost is 0.25 Link / Oracle gas*/
const BASE_FEE = ethers.utils.parseEther("0.25");

/**
 * @dev This is calculated value, based on gas price of the chain.
 * e.g Link per gas
 * value changes based on gas price of the chain.
 */
const GAS_PRICE_LINK = 1e9;
const DECIMALS = "18";
const INITIAL_PRICE = "200000000000000000000"; // = 200 ETH

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    if (developmentChains.includes(network.name)) {
        log("Local network detected...... Deploying mocks..");
        await deploy(VRFCOORDINATORV2_MOCK, {
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK],
        });
        log("Mocks deployed!");
        log("------------------------------");
        log("MockV3Aggregator");
        await deploy(V3AGGREGATOR_MOCK, {
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_PRICE],
        });
        log("-------------------------------");
    }
};

module.exports.tags = ["all", "mocks"];
