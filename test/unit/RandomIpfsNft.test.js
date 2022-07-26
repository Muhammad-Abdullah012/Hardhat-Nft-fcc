const { expect } = require("chai");
const { ethers, deployments, network } = require("hardhat");
const {
    RANDOM_IPFS_NFT,
    VRFCOORDINATORV2_MOCK,
} = require("../../constants/constants");
const { developmentChains } = require("../../helper-hardhat-config");

(developmentChains.includes(network.name) ? describe : describe.skip)(
    RANDOM_IPFS_NFT,
    function () {
        let randomIpfs, deployer, vrfCoordinator;
        let MINT_FEE;
        beforeEach(async function () {
            await deployments.fixture(["main", "mocks"]);
            randomIpfs = await ethers.getContract(RANDOM_IPFS_NFT);
            vrfCoordinator = await ethers.getContract(VRFCOORDINATORV2_MOCK);
            deployer = (await ethers.getSigners())[0];
            MINT_FEE = (await randomIpfs.getMintFee()).toString();
            // console.log(deployer);
        });

        describe("constructor", function () {
            it("Should set right owner", async function () {
                expect((await randomIpfs.owner()).toString()).to.be.equal(
                    deployer.address.toString()
                );
            });
        });
        describe("requestNft", function () {
            it("Should revert, when enough ETH are not send", async function () {
                await expect(randomIpfs.requestNft()).to.be.revertedWith(
                    "RandomIpfsNft__NotEnoughETH"
                );
            });
            it("Should emit NftRequest event", async function () {
                const txResponse = await randomIpfs.requestNft({
                    value: MINT_FEE,
                });
                const txReceipt = await txResponse.wait(1);
                expect(txReceipt).to.emit(randomIpfs, "NftRequested");
                expect(txReceipt).to.emit(randomIpfs, "NftMinted");
            });
            it("Should update token counter", async function () {
                let initialTokenCounter = await randomIpfs.getTokenCounter();
                expect(initialTokenCounter.toNumber()).to.be.equal(0);

                let txResponse = await randomIpfs.requestNft({
                    value: MINT_FEE,
                });
                let txReceipt = await txResponse.wait(1);
                expect(txReceipt).to.emit(randomIpfs, "NftMinted");
                randomIpfs.once("NftMinted", async () => {
                    let finalTokenCounter = await randomIpfs.getTokenCounter();
                    expect(finalTokenCounter.toNumber()).to.be.equal(1);
                });

                initialTokenCounter = await randomIpfs.getTokenCounter();
                txResponse = await randomIpfs.requestNft({
                    value: MINT_FEE,
                });
                await txResponse.wait(1);
                randomIpfs.once("NftMinted", async () => {
                    let finalTokenCounter = await randomIpfs.getTokenCounter();
                    expect(finalTokenCounter.toNumber()).to.be.greaterThan(
                        initialTokenCounter
                    );
                });
            });
        });

        describe("dogTokenUri", function () {
            it("Should fail for out of bound values", async function () {
                await expect(randomIpfs.getDogTokenUri(3)).to.be.revertedWith(
                    "RandomIpfsNft__RangeOutOfBounds"
                );
            });
            it("Should set correct dogTokenUris", async function () {
                const tokenUri0 = await randomIpfs.getDogTokenUri(0);
                const tokenUri1 = await randomIpfs.getDogTokenUri(1);
                const tokenUri2 = await randomIpfs.getDogTokenUri(2);
                expect(tokenUri0).to.be.equal(
                    "ipfs://bafyreiffrfcog33kylznfeqjdf4lsy5t3cjaxyvdam3v7d35znmwuxfcze/metadata.json"
                );
                expect(tokenUri1).to.be.equal(
                    "ipfs://bafyreidpch6s3eocgwiwp6as2xwshpyz7k3rss3ri7fe4rykyhczctpwyi/metadata.json"
                );
                expect(tokenUri2).to.be.equal(
                    "ipfs://bafyreibwwvy5kubfe45hyx5njem7oje7hb7nmtoja3stujngtlmrwsjsym/metadata.json"
                );
            });
        });

        describe("Withdraw", function () {
            it("Should revert if someone else try to withdraw funds", async function () {
                const unknown = (await ethers.getSigners()).slice(1);
                for (let i = 0; i < unknown.length; ++i) {
                    const connectedRandomIpfsNft = await randomIpfs.connect(
                        unknown[i]
                    );
                    await expect(
                        connectedRandomIpfsNft.withdraw()
                    ).to.be.revertedWith("Ownable: caller is not the owner");
                }
            });

            it("Should withdraw all funds", async function () {
                // Connect to contract, mint NFTs
                const unknown = (await ethers.getSigners()).slice(1);
                for (let i = 0; i < unknown.length; ++i) {
                    const connectedRandomIpfsNft = await randomIpfs.connect(
                        unknown[i]
                    );
                    connectedRandomIpfsNft.requestNft({ value: MINT_FEE });
                }
                const balance = (await randomIpfs.getBalance()).toString();
                expect(await randomIpfs.withdraw()).to.changeEtherBalances(
                    [deployer, randomIpfs],
                    [balance, -balance]
                );
            });
        });

        describe("getChanceArray", function () {
            it("Should return correct array", async function () {
                const chanceArray = await randomIpfs.getChanceArray();
                expect(chanceArray.toString()).to.be.equal(
                    [10, 30, 100].toString()
                );
            });
        });

        describe("getBreed", function () {
            it("Should return correct breed", async function () {
                await expect(randomIpfs.getBreed(101)).to.be.revertedWith(
                    "RandomIpfsNft__RangeOutOfBounds"
                );

                for (let i = 0; i <= 10; ++i) {
                    expect(
                        (await randomIpfs.getBreed(0)).toString()
                    ).to.be.equal("0");
                }

                for (let i = 11; i <= 30; ++i) {
                    expect(
                        (await randomIpfs.getBreed(i)).toString()
                    ).to.be.equal("1");
                }

                for (let i = 31; i <= 100; ++i) {
                    expect(
                        (await randomIpfs.getBreed(i)).toString()
                    ).to.be.equal("2");
                }
            });
        });
    }
);
