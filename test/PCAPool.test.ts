import {ethers, waffle, artifacts, upgrades} from "hardhat";
import {expect} from "chai";
import {deployMockContract, MockContract} from "ethereum-waffle";
import * as timeMachine from "ganache-time-traveler";
import {PCAEthPool__factory, PCAPool, PCAPool__factory} from "../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

const ZERO_ADDRESS = ethers.constants.AddressZero;
const ERC20_ABI = artifacts.require("ERC20").abi;
const POOL_ABI = artifacts.require("Pool").abi;

const pcaPoolTest = (factory: string, text: string) => {
    const isEthPool = factory === "PCAEthPool";

    describe("PCAPool unit tests" + text, () => {
        let deployer: SignerWithAddress;
        let user1: SignerWithAddress;
        let user2: SignerWithAddress;
        let user3: SignerWithAddress;
        let pcaPool: PCAPool;
        let pool: MockContract;
        let underlyer: MockContract;
        let pcaFactory: PCAPool__factory | PCAEthPool__factory;
        const name = "Tokemak pAsset";
        const symbol = "TPA";
        let snapshotId: string;
        let addressRegistry: MockContract;

        beforeEach(async () => {
            const snapshot = await timeMachine.takeSnapshot();
            snapshotId = snapshot["result"];
        });

        afterEach(async () => {
            await timeMachine.revertToSnapshot(snapshotId);
        });

        before(async () => {
            [deployer, user1, user2, user3] = await ethers.getSigners();

            const addressRegistryArtifact = artifacts.require("AddressRegistry");
            addressRegistry = await deployMockContract(deployer, addressRegistryArtifact.abi);

            pool = await deployMockContract(deployer, POOL_ABI);
            underlyer = await deployMockContract(deployer, ERC20_ABI);

            await addressRegistry.mock.weth.returns(underlyer.address);

            pcaFactory = (await ethers.getContractFactory(factory)) as unknown as
                | PCAPool__factory
                | PCAEthPool__factory;
        });

        describe("Test initializer", () => {
            it("Reverts on zero address for pool", async () => {
                let params = [ZERO_ADDRESS, name, symbol];

                if (isEthPool) {
                    params = [addressRegistry.address, ...params];
                }

                await expect(
                    upgrades.deployProxy(pcaFactory, params, {
                        unsafeAllow: ["constructor"],
                    })
                ).to.be.revertedWith("ZERO_ADDRESS");
            });

            it("Reverts when underlyer doesn't exist", async () => {
                let params = [pool.address, name, symbol];

                if (isEthPool) {
                    params = [addressRegistry.address, ...params];
                }

                await pool.mock.underlyer.returns(ZERO_ADDRESS);
                await expect(
                    upgrades.deployProxy(pcaFactory, params, {
                        unsafeAllow: ["constructor"],
                    })
                ).to.be.revertedWith("POOL_DNE");
            });

            if (isEthPool) {
                it("Reverts when underlyer is not weth", async () => {
                    await pool.mock.underlyer.returns(underlyer.address);
                    await addressRegistry.mock.weth.returns(user2.address);

                    await expect(
                        upgrades.deployProxy(pcaFactory, [addressRegistry.address, pool.address, name, symbol], {
                            unsafeAllow: ["constructor"],
                        })
                    ).to.be.revertedWith("INVALID_WETH_ADDRESS");
                });
            }
        });

        describe("Other tests", () => {
            before(async () => {
                let params = [pool.address, name, symbol];

                if (isEthPool) {
                    params = [addressRegistry.address, ...params];
                }

                await pool.mock.underlyer.returns(underlyer.address);
                await addressRegistry.mock.weth.returns(underlyer.address);
                await underlyer.mock.decimals.returns(12);

                pcaPool = (await upgrades.deployProxy(pcaFactory, params, {
                    unsafeAllow: ["constructor"],
                })) as PCAPool;
            });

            describe("Test decimals", () => {
                it("Returns correct amount of decimals", async () => {
                    expect(await pcaPool.decimals()).to.equal(12);
                });
            });

            describe("Pausability", () => {
                before(async () => {
                    await underlyer.mock.balanceOf.returns(10);
                    await underlyer.mock.transferFrom.returns(true);
                    await underlyer.mock.transfer.returns(true);
                    await pool.mock.transferFrom.returns(true);
                    await pool.mock.controlledBurn.returns();
                    await pool.mock.balanceOf.returns(10);
                    await pcaPool.connect(user2).approve(user1.address, 10);
                });

                it("All functions with pausbility in execution path should revert when paused", async () => {
                    await pcaPool.connect(deployer).pause();
                    expect(await pcaPool.paused()).to.equal(true);

                    await expect(pcaPool.connect(user1).depositAsset(user1.address, 5)).to.be.revertedWith(
                        "Pausable: paused"
                    );
                    await expect(pcaPool.connect(user1).depositPoolAsset(user1.address, 5)).to.be.revertedWith(
                        "Pausable: paused"
                    );
                    await expect(pcaPool.connect(user1).transfer(user2.address, 5)).to.be.revertedWith(
                        "ERC20Pausable: token transfer while paused"
                    );
                    await expect(
                        pcaPool.connect(user1).transferFrom(user2.address, user3.address, 5)
                    ).to.be.revertedWith("ERC20Pausable: token transfer while paused");
                });

                it("All fucntions are able to run properly on unpause", async () => {
                    expect(await pcaPool.paused()).to.equal(false);

                    await expect(pcaPool.connect(user1).depositAsset(user1.address, 5)).to.not.be.reverted;
                    await expect(pcaPool.connect(user1).transfer(user2.address, 5)).to.not.be.reverted;
                    await expect(pcaPool.connect(user1).depositPoolAsset(user1.address, 5)).to.not.be.reverted;
                    await expect(pcaPool.connect(user1).transferFrom(user2.address, user3.address, 5)).to.not.be
                        .reverted;
                });

                it("Unpause works correctly", async () => {
                    await pcaPool.connect(deployer).pause();
                    expect(await pcaPool.paused()).to.equal(true);

                    await pcaPool.connect(deployer).unpause();
                    expect(await pcaPool.paused()).to.equal(false);
                });
            });

            describe("Depositing pool asset", () => {
                before(async () => {
                    await underlyer.mock.balanceOf.withArgs(deployer.address).returns(10);
                    await underlyer.mock.transferFrom.returns(true);
                    await underlyer.mock.transfer.returns(true);
                });

                it("Reverts on 0 address", async () => {
                    await expect(pcaPool.connect(deployer).depositAsset(ZERO_ADDRESS, 10)).to.be.revertedWith(
                        "INVALID_ADDRESS"
                    );
                });

                it("Reverts on 0 amount", async () => {
                    await expect(pcaPool.connect(deployer).depositAsset(deployer.address, 0)).to.be.revertedWith(
                        "INVALID_AMOUNT"
                    );
                });

                it("Desposit for self", async () => {
                    const tx = await pcaPool.connect(deployer).depositAsset(deployer.address, 4);
                    const receipt = await tx.wait();

                    expect(await pcaPool.balanceOf(deployer.address)).to.equal(4);
                    expect(receipt.events![0].args!.from).to.equal(ZERO_ADDRESS);
                    expect(receipt.events![0].args!.to).to.equal(deployer.address);
                    expect(receipt.events![0].args!.value).to.equal(4);
                });

                it("Deposit for other", async () => {
                    const tx = await pcaPool.connect(deployer).depositAsset(user1.address, 6);
                    const receipt = await tx.wait();

                    expect(await pcaPool.balanceOf(user1.address)).to.equal(6);
                    expect(receipt.events![0].args!.from).to.equal(ZERO_ADDRESS);
                    expect(receipt.events![0].args!.to).to.equal(user1.address);
                    expect(receipt.events![0].args!.value).to.equal(6);
                });
            });

            describe("Depositing tAsset", () => {
                before(async () => {
                    await pool.mock.balanceOf.returns(10);
                    await pool.mock.transferFrom.returns(true);
                    await pool.mock.controlledBurn.returns();
                });

                it("Reverts on 0 address", async () => {
                    await expect(pcaPool.connect(deployer).depositPoolAsset(ZERO_ADDRESS, 10)).to.be.revertedWith(
                        "INVALID_ADDRESS"
                    );
                });

                it("Reverts on 0 amount", async () => {
                    await expect(pcaPool.connect(deployer).depositPoolAsset(deployer.address, 0)).to.be.revertedWith(
                        "INVALID_AMOUNT"
                    );
                });

                it("Deposits for self", async () => {
                    const tx = await pcaPool.connect(deployer).depositPoolAsset(deployer.address, 3);
                    const receipt = await tx.wait();

                    expect(await pcaPool.balanceOf(deployer.address)).to.equal(3);
                    expect(receipt.events![0].args!.from).to.equal(ZERO_ADDRESS);
                    expect(receipt.events![0].args!.to).to.equal(deployer.address);
                    expect(receipt.events![0].args!.value).to.equal(3);
                });

                it("Deposit for other", async () => {
                    const tx = await pcaPool.connect(deployer).depositPoolAsset(user1.address, 7);
                    const receipt = await tx.wait();

                    expect(await pcaPool.balanceOf(user1.address)).to.equal(7);
                    expect(receipt.events![0].args!.from).to.equal(ZERO_ADDRESS);
                    expect(receipt.events![0].args!.to).to.equal(user1.address);
                    expect(receipt.events![0].args!.value).to.equal(7);
                });
            });

            describe("Setting new pool address", async () => {
                let fakePool: MockContract;
                let fakeUnderlyer: MockContract;

                before(async () => {
                    fakePool = await deployMockContract(deployer, POOL_ABI);
                    fakeUnderlyer = await deployMockContract(deployer, ERC20_ABI);
                });

                it("Reverts on zero address", async () => {
                    await expect(pcaPool.connect(deployer).updatePool(ZERO_ADDRESS)).to.be.revertedWith(
                        "INVALID_ADDRESS"
                    );
                });

                it("Reverts on non-owner", async () => {
                    await expect(pcaPool.connect(user1).updatePool(fakePool.address)).to.be.revertedWith(
                        "Ownable: caller is not the owner"
                    );
                });

                it("Reverts on incorrect underlyer", async () => {
                    await pool.mock.underlyer.returns(underlyer.address);
                    await fakePool.mock.underlyer.returns(fakeUnderlyer.address);
                    await expect(pcaPool.connect(deployer).updatePool(fakePool.address)).to.be.revertedWith(
                        "UNDERLYER_MISMATCH"
                    );
                });

                it("Runs properly", async () => {
                    await pool.mock.underlyer.returns(underlyer.address);
                    await fakePool.mock.underlyer.returns(underlyer.address);
                    const tx = await pcaPool.connect(deployer).updatePool(fakePool.address);
                    const receipt = await tx.wait();

                    expect(await pcaPool.pool()).to.equal(fakePool.address);
                    expect(receipt.events![0].args!.newPool).to.equal(fakePool.address);
                });
            });

            describe("Transfer", () => {
                before(async () => {
                    await underlyer.mock.balanceOf.returns(10);
                    await underlyer.mock.transferFrom.returns(true);
                    await underlyer.mock.transfer.returns(true);
                    await pcaPool.connect(deployer).depositAsset(deployer.address, 10);
                });

                it("Reverts on overage", async () => {
                    await expect(pcaPool.connect(deployer).transfer(user1.address, 12)).to.be.reverted;
                });

                it("Runs properly", async () => {
                    const tx = await pcaPool.connect(deployer).transfer(user1.address, 7);
                    const receipt = await tx.wait();

                    expect(await pcaPool.balanceOf(deployer.address)).to.equal(3);
                    expect(await pcaPool.balanceOf(user1.address)).to.equal(7);
                    expect(receipt.events![0].args!.from).to.equal(deployer.address);
                    expect(receipt.events![0].args!.to).to.equal(user1.address);
                    expect(receipt.events![0].args!.value).to.equal(7);
                });
            });

            describe("TransferFrom", () => {
                before(async () => {
                    await underlyer.mock.balanceOf.returns(10);
                    await underlyer.mock.transferFrom.returns(true);
                    await underlyer.mock.transfer.returns(true);
                    await pcaPool.connect(deployer).depositAsset(deployer.address, 10);
                    await pcaPool.connect(deployer).approve(user1.address, 10);
                });

                it("Reverts on overage", async () => {
                    await expect(pcaPool.connect(user1).transferFrom(deployer.address, user2.address, 15)).to.be
                        .reverted;
                });

                it("Runs properly", async () => {
                    const tx = await pcaPool.connect(user1).transferFrom(deployer.address, user2.address, 6);
                    const receipt = await tx.wait();

                    expect(await pcaPool.balanceOf(user2.address)).to.equal(6);
                    expect(receipt.events![0].args!.from).to.equal(deployer.address);
                    expect(receipt.events![0].args!.to).to.equal(user2.address);
                    expect(receipt.events![0].args!.value).to.equal(6);
                });
            });
        });
    });
};
pcaPoolTest("PCAPool", " regular pool");
pcaPoolTest("PCAEthPool", " eth pool");
