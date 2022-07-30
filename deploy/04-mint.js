const { ethers, network } = require("hardhat");
const {
    BASIC_NFT,
    RANDOM_IPFS_NFT,
    DYNAMIC_SVG_NFT,
    VRFCOORDINATORV2_MOCK,
    RANDOM_WORDS_REQUESTED,
} = require("../constants/constants");
const { NETWORK_CONFIG } = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts }) => {
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    // const basicNft = await ethers.getContract(BASIC_NFT, deployer);
    const randomIpfs = await ethers.getContract(RANDOM_IPFS_NFT, deployer);
    // const dynamicSvgNft = await ethers.getContract(DYNAMIC_SVG_NFT, deployer);

    // const basicMintTx = await basicNft.mintNft();
    // await basicMintTx.wait(1);
    // console.log(`Basic NFT index 0 tokenURI: ${await basicNft.tokenURI(0)}`);

    const mintFee = (await randomIpfs.getMintFee()).toString();
    const randomIpfsTx = await randomIpfs.requestNft({ value: mintFee, gasLimit: "5000000" });
    const randomIpfsTxReceipt = await randomIpfsTx.wait(1);

    // const highValue = ethers.utils.parseEther("4000");
    // const dynamicSvgNftMintTx = await dynamicSvgNft.mintNft(highValue);
    // await dynamicSvgNftMintTx.wait(1);
    // console.log(
    //     `Dynamic SVG NFT index 0 tokenURI: ${await dynamicSvgNft.tokenURI(0)}`
    // );

    await new Promise(async (resolve) => {
        randomIpfs.once("NftMinted", async () => {
            console.log(
                `Random IPFS NFT index 0 tokenURI: ${await randomIpfs.tokenURI(
                    0
                )}`
            );
            resolve();
        });
        if (chainId == 31337) {
            const requestId =
                randomIpfsTxReceipt.events[1].args.requestId.toString();
            const vrfCoordinatorV2Mock = await ethers.getContract(
                VRFCOORDINATORV2_MOCK,
                deployer
            );

            vrfCoordinatorV2Mock.once(RANDOM_WORDS_REQUESTED, async () => {
                await vrfCoordinatorV2Mock.fulfillRandomWords(
                    requestId,
                    randomIpfs.address
                );
            });
        }
    });
};

module.exports.tags = ["all", "mint"];
