const { expect } = require("chai");
const { ethers, deployments, network } = require("hardhat");
const { BASIC_NFT } = require("../../constants/constants");
const { developmentChains } = require("../../helper-hardhat-config");

(developmentChains.includes(network.name) ? describe : describe.skip)(
    "BasicNft",
    function () {
        let basicNft, deployer;
        beforeEach(async function () {
            await deployments.fixture("all");
            basicNft = await ethers.getContract(BASIC_NFT);
            deployer = (await ethers.getSigners())[0].address;
            console.log(deployer);
        });

        describe("constructor", function () {
            it("Should initialize counter to zero", async function () {
                const initialTokenCount = await basicNft.getTokenCounter();
                expect(initialTokenCount.toNumber()).to.be.equal(0);
            });
        });

        describe("mintNft", function () {
            it("Should update counter", async function () {
                const txResponse = await basicNft.mintNft();
                await txResponse.wait(1);

                const count = await basicNft.getTokenCounter();
                expect(count.toNumber()).to.be.equal(1);
            });
            it("Should emit transfer event", async function () {
                const txResponse = await basicNft.mintNft();
                const txReceipt = await txResponse.wait(1);

                expect(txReceipt).to.emit(basicNft, "Transfer");
            });
            it("Should update owners of nfts", async function () {
                const txResponse = await basicNft.mintNft();
                await txResponse.wait(1);

                const owner = await basicNft.ownerOf(0);
                expect(owner.toString()).to.be.equal(deployer.toString());

                const accounts = await ethers.getSigners();

                for (let i = 1; i < 20; ++i) {
                    const connectedBasicNft = await basicNft.connect(
                        accounts[i]
                    );
                    const txResponse = await connectedBasicNft.mintNft();
                    await txResponse.wait(1);

                    const owner = await connectedBasicNft.ownerOf(i);
                    expect(owner.toString()).to.be.equal(accounts[i].address);
                }
            });
        });
    }
);
