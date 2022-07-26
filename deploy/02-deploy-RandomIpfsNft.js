const { network, ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const {
    RANDOM_IPFS_NFT,
    VRFCOORDINATORV2_MOCK,
} = require("../constants/constants");
const {
    NETWORK_CONFIG,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../helper-hardhat-config");
const { developmentChains } = require("../helper-hardhat-config");

const { uploadToIpfs } = require("../utils/uploadToIpfs");
const { verify } = require("../utils/verify");

const URL_FILE_PATH = path.join(__dirname, "..", "randomNftURL.json");
const readStream = fs.createReadStream(URL_FILE_PATH, {
    encoding: "utf-8",
    flags: "r",
});

const readData = () => {
    return new Promise((resolve, reject) => {
        readStream.on("data", (chunk) => {
            let DogTokenUri = [];
            const data = JSON.parse(chunk);
            for (property in data) {
                DogTokenUri.push(data[property]);
            }
            resolve(DogTokenUri);
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

    let wait;
    let vrfCoordinatorV2Address, subscriptionId;
    if (developmentChains.includes(network.name)) {
        const amount = ethers.utils.parseEther("100");
        const vrfCoordinatorV2Mock = await ethers.getContract(
            VRFCOORDINATORV2_MOCK
        );
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;

        const tx = await vrfCoordinatorV2Mock.createSubscription();
        const txReceipt = await tx.wait(1);

        subscriptionId = txReceipt.events[0].args.subId;
        const txFund = await vrfCoordinatorV2Mock.fundSubscription(
            subscriptionId,
            amount
        );
        await txFund.wait(1);
        console.log( "Subscription is : ",
            (
                await vrfCoordinatorV2Mock.getSubscription(subscriptionId)
            ).toString()
        );
        wait = false;
    } else {
        vrfCoordinatorV2Address =
            NETWORK_CONFIG[chainId].vrfCoordinatorV2Address;
        subscriptionId = NETWORK_CONFIG[chainId].subscriptionId;
        wait = true;
    }

    if (process.env.UPLOAD_TO_IPFS === "true") {
        await uploadToIpfs();
    } else {
        console.log("Not uploading to Ipfs, because upload is set to false.");
    }
    let DogTokenUri = await readData();
    // console.log("DogTokenUri : ", DogTokenUri);

    log("Deploying RandomIpfsNft....");

    let arguments = [
        vrfCoordinatorV2Address,
        subscriptionId,
        NETWORK_CONFIG[chainId].keyHash,
        NETWORK_CONFIG[chainId].callbackGasLimit,
        DogTokenUri,
        NETWORK_CONFIG[chainId].mintFee,
    ];
    const RandomIpfsNft = await deploy(RANDOM_IPFS_NFT, {
        from: deployer,
        log: true,
        args: arguments,
        waitConfirmations: wait ? VERIFICATION_BLOCK_CONFIRMATIONS : undefined,
    });

    log("Deployed successfully....");
    log("---------------------------");
    // Verify the deployment
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Contract Address: ", RandomIpfsNft.address);
        log("Arguments: ", arguments);
        log("Verifying...");
        await verify(RandomIpfsNft.address, arguments);
    }
};

module.exports.tags = ["all", "randomIpfs", "main"];
