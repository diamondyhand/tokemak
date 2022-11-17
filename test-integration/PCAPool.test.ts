import {artifacts, ethers, upgrades} from "hardhat";
import * as timeMachine from "ganache-time-traveler";
import {expect} from "chai";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {EthPool, PCAEthPool, IWETH, PCAPool, Pool, TestnetToken} from "../typechain";
import {Event} from "ethers";
import {deployMockContract, MockContract} from "ethereum-waffle";

const ZERO_ADDRESS = ethers.constants.AddressZero;
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

const pcaPoolTest = (factory: string, text: string) => {
    describe("PCAPool Integration tests" + text, () => {
        let deployer: SignerWithAddress;
        let user1: SignerWithAddress;
        let user2: SignerWithAddress;
        let manager: SignerWithAddress;
        let pool: Pool | EthPool;
        let poolFactoryString = "Pool";
        let underlyerFactoryString = "TestnetToken";
        let pcaPool: PCAPool | PCAEthPool;
        let underlyer: TestnetToken & IWETH;
        let snapshotId: string;
        let addressRegistry: MockContract;
        let rebalancer: SignerWithAddress;

        before(async () => {
            [deployer, user1, user2, manager, rebalancer] = await ethers.getSigners();

            const addressRegistryArtifact = artifacts.require("AddressRegistry");
            addressRegistry = await deployMockContract(deployer, addressRegistryArtifact.abi);
            await addressRegistry.mock.weth.returns(WETH_ADDRESS);

            if (factory == "PCAEthPool") {
                poolFactoryString = "EthPool";
                underlyerFactoryString = "WETH9";

                underlyer = (await ethers.getContractAt(
                    "contracts/interfaces/IWETH.sol:IWETH",
                    WETH_ADDRESS
                )) as IWETH & TestnetToken;
            } else {
                const underlyerFactory = await ethers.getContractFactory(underlyerFactoryString);
                underlyer = (await underlyerFactory.deploy("UnderlyerToken", "UT", 18)) as TestnetToken & IWETH;
                await underlyer.deployed();
            }

            const poolFactory = await ethers.getContractFactory(poolFactoryString);
            pool = (await upgrades.deployProxy(
                poolFactory,
                [
                    poolFactoryString === "EthPool" ? manager.address : underlyer.address,
                    poolFactoryString === "EthPool" ? addressRegistry.address : manager.address,
                    "tUnderlyerToken",
                    "tUT",
                    rebalancer.address,
                ],
                {unsafeAllow: ["constructor"]}
            )) as Pool | EthPool;
            await pool.deployed();

            const pcaPoolFactory = await ethers.getContractFactory(factory);
            pcaPool = (await upgrades.deployProxy(
                pcaPoolFactory,
                factory == "PCAEthPool"
                    ? [addressRegistry.address, pool.address, "pUnderlyerToken", "pUT"]
                    : [pool.address, "pUnderlyerToken", "pUT"],
                {
                    unsafeAllow: ["constructor"],
                }
            )) as PCAPool;
            await pcaPool.deployed();
        });

        beforeEach(async () => {
            const snapshot = await timeMachine.takeSnapshot();
            snapshotId = snapshot["result"];

            if (factory == "PCAEthPool") {
                await underlyer.connect(user1).deposit({value: 25});
            } else {
                await underlyer.connect(deployer).mint(user1.address, 25);
            }
        });

        afterEach(async () => {
            await timeMachine.revertToSnapshot(snapshotId);
        });

        describe("Test transfers", () => {
            beforeEach(async () => {
                await underlyer.connect(user1).approve(pcaPool.address, 10);
                await pcaPool.connect(user1).depositAsset(user1.address, 10);
            });

            it("Reverts on overage", async () => {
                await expect(pcaPool.connect(user1).transfer(deployer.address, 15)).to.be.reverted;
            });

            it("Transfers properly", async () => {
                const tx = await pcaPool.connect(user1).transfer(deployer.address, 7);
                const receipt = await tx.wait();

                expect(await pcaPool.balanceOf(deployer.address)).to.equal(7);
                expect(await pcaPool.balanceOf(user1.address)).to.equal(3);

                checkTransferEvent(receipt.events![0], user1.address, deployer.address, 7);
            });

            it("TransferFrom runs correctly", async () => {
                await pcaPool.connect(user1).approve(user2.address, 4);

                const tx = await pcaPool.connect(user2).transferFrom(user1.address, deployer.address, 4);
                const receipt = await tx.wait();

                expect(await pcaPool.balanceOf(deployer.address)).to.equal(4);
                expect(await pcaPool.balanceOf(user1.address)).to.equal(6);

                checkTransferEvent(receipt.events![0], user1.address, deployer.address, 4);
            });
        });

        describe("Depositing underlyer", () => {
            beforeEach(async () => {
                await underlyer.connect(user1).approve(pcaPool.address, 25);
            });

            it("Reverts on deposit overage", async () => {
                await expect(pcaPool.connect(user1).depositAsset(user1.address, 30)).to.be.reverted;
            });

            if (factory == "PCAPool") {
                it("Full run with checks", async () => {
                    const tx = await pcaPool.connect(user1).depositAsset(user1.address, 22);
                    const receipt = await tx.wait();

                    expect(await underlyer.balanceOf(pool.address)).to.equal(22);
                    expect(await underlyer.balanceOf(user1.address)).to.equal(3);
                    expect(await pcaPool.balanceOf(user1.address)).to.equal(22);

                    const event1 = receipt.events![0]; // Transfer, Mint zero address -> address
                    const event2 = receipt.events![1]; // Transfer, transferFrom address -> pool
                    const event3 = receipt.events![2]; // Approval, emitted on transferFrom()

                    checkTransferEvent(event1, ZERO_ADDRESS, user1.address, 22);
                    checkTransferEvent(event2, user1.address, pool.address, 22);
                    checkApprovalEvent(event3, pcaPool.address, user1.address, 3);
                });

                it("Full run depositFor functionality", async () => {
                    const tx = await pcaPool.connect(user1).depositAsset(user2.address, 22);
                    const receipt = await tx.wait();

                    expect(await underlyer.balanceOf(pool.address)).to.equal(22);
                    expect(await underlyer.balanceOf(user1.address)).to.equal(3);
                    expect(await pcaPool.balanceOf(user2.address)).to.equal(22);

                    const event1 = receipt.events![0]; // Transfer, Mint zero address -> address
                    const event2 = receipt.events![1]; // Transfer, transferFrom address -> pcaPool
                    const event3 = receipt.events![2]; // Approval, emitted during transferFrom

                    checkTransferEvent(event1, ZERO_ADDRESS, user2.address, 22);
                    checkTransferEvent(event2, user1.address, pool.address, 22);
                    checkApprovalEvent(event3, pcaPool.address, user1.address, 3);
                });
            }
        });

        describe("Depositing tAsset", () => {
            beforeEach(async () => {
                await underlyer.connect(user1).approve(pool.address, 25);
                await pool.connect(user1).deposit(25);
                await pool.connect(user1).approve(pcaPool.address, 25);
                await pool.connect(deployer).registerBurner(pcaPool.address, true);
            });

            it("Reverts on deposit overage", async () => {
                await expect(pcaPool.connect(user1).depositPoolAsset(user1.address, 30)).to.be.reverted;
            });

            if (factory == "PCAPool") {
                it("Full run", async () => {
                    const tx = await pcaPool.connect(user1).depositPoolAsset(user1.address, 22);
                    const receipt = await tx.wait();

                    expect(receipt.events!.length).to.equal(4);
                    expect(await pool.balanceOf(user1.address)).to.equal(3);
                    expect(await pool.totalSupply()).to.equal(3);
                    expect(await pool.balanceOf(pcaPool.address)).to.equal(0);
                    expect(await pcaPool.balanceOf(user1.address)).to.equal(22);

                    const event1 = receipt.events![0]; // Transfer, Mint zero address -> address
                    const event2 = receipt.events![1]; // Approval, emitted during controlledBurn()
                    const event3 = receipt.events![2]; // Transfer, controlledBurn()
                    const event4 = receipt.events![3]; // Burned, custom event

                    checkTransferEvent(event1, ZERO_ADDRESS, user1.address, 22);
                    checkApprovalEvent(event2, pcaPool.address, user1.address, 3);
                    checkTransferEvent(event3, user1.address, ZERO_ADDRESS, 22);
                    checkBurnedEvent(event4, user1.address, pcaPool.address, 22);
                });

                it("Full run depositFor", async () => {
                    const tx = await pcaPool.connect(user1).depositPoolAsset(user2.address, 22);
                    const receipt = await tx.wait();

                    expect(receipt.events!.length).to.equal(4);
                    expect(await pool.balanceOf(user1.address)).to.equal(3);
                    expect(await pool.totalSupply()).to.equal(3);
                    expect(await pool.balanceOf(pcaPool.address)).to.equal(0);
                    expect(await pcaPool.balanceOf(user2.address)).to.equal(22);

                    const event1 = receipt.events![0]; // Transfer, Mint zero address -> address
                    const event2 = receipt.events![1]; // Approval, emitted during controlledBurn()
                    const event3 = receipt.events![2]; // Transfer, controlledBurn()
                    const event4 = receipt.events![3]; // Burned, custom event

                    checkTransferEvent(event1, ZERO_ADDRESS, user2.address, 22);
                    checkApprovalEvent(event2, pcaPool.address, user1.address, 3);
                    checkTransferEvent(event3, user1.address, ZERO_ADDRESS, 22);
                    checkBurnedEvent(event4, user1.address, pcaPool.address, 22);
                });
            }
        });

        describe("Tests specific to PCAEthPool", async () => {
            const underlyerAmount = 25;

            if (factory == "PCAEthPool") {
                describe("depositAsset()", () => {
                    before(async () => {
                        await underlyer.connect(user1).approve(pcaPool.address, underlyerAmount);
                    });

                    it("Reverts on 0 ether and weth depositAsset()", async () => {
                        await expect(
                            pcaPool.connect(user1).depositAsset(user1.address, 0, {value: 0})
                        ).to.be.revertedWith("INVALID_AMOUNT");
                    });

                    it("Runs correctly when ether only is passed in depositAsset()", async () => {
                        const depositEth = 7;
                        const depositWeth = 0;
                        const tx = await pcaPool
                            .connect(user1)
                            .depositAsset(user1.address, depositWeth, {value: depositEth});
                        const receipt = await tx.wait();

                        expect(await pcaPool.balanceOf(user1.address)).to.equal(depositWeth + depositEth);
                        expect(await underlyer.balanceOf(pool.address)).to.equal(depositWeth + depositEth);

                        const event1 = receipt.events![0]; // Transfer, mint -> address account
                        const event2 = receipt.events![1]; // Depsoit, pcaPool
                        const event3 = receipt.events![2]; // Transfer, pcaPool -> pool

                        checkTransferEvent(event1, ZERO_ADDRESS, user1.address, depositEth + depositWeth);
                        checkDepositEvent(event2, pcaPool.address, depositEth);
                        checkTransferEvent(event3, pcaPool.address, pool.address, depositWeth + depositEth);
                    });

                    it("Runs correctly when only weth is passed in depositAsset()", async () => {
                        const depositWeth = 11;
                        const depositEth = 0;
                        const tx = await pcaPool
                            .connect(user1)
                            .depositAsset(user1.address, depositWeth, {value: depositEth});
                        const receipt = await tx.wait();

                        expect(await pcaPool.balanceOf(user1.address)).to.equal(depositWeth + depositEth);
                        expect(await underlyer.balanceOf(pool.address)).to.equal(depositWeth + depositEth);

                        const event1 = receipt.events![0]; // Transfer, mint -> address account
                        const event2 = receipt.events![1]; // Transfer, transferFrom msg.sender -> pool

                        checkTransferEvent(event1, ZERO_ADDRESS, user1.address, depositEth + depositWeth);
                        checkTransferEvent(event2, user1.address, pool.address, depositWeth);
                    });

                    it("Runs correctly when ether and weth are passed in depositAsset()", async () => {
                        const depositWeth = 13;
                        const depositEth = 5;
                        const tx = await pcaPool
                            .connect(user1)
                            .depositAsset(user1.address, depositWeth, {value: depositEth});
                        const receipt = await tx.wait();

                        expect(await pcaPool.balanceOf(user1.address)).to.equal(depositWeth + depositEth);
                        expect(await underlyer.balanceOf(pool.address)).to.equal(depositWeth + depositEth);

                        const event1 = receipt.events![0]; // Transfer, mint -> address account
                        const event2 = receipt.events![1]; // Transfer, transferFrom msg.sender -> pool
                        const event3 = receipt.events![2]; // Depsoit, pcaPool
                        const event4 = receipt.events![3]; // Transfer, msg.value pcaPool -> pool

                        checkTransferEvent(event1, ZERO_ADDRESS, user1.address, depositEth + depositWeth);
                        checkTransferEvent(event2, user1.address, pool.address, depositWeth);
                        checkDepositEvent(event3, pcaPool.address, depositEth);
                        checkTransferEvent(event4, pcaPool.address, pool.address, depositEth);
                    });

                    it("Runs correctly with depositFor functionality, eth and weth depositAsset()", async () => {
                        const depositWeth = 10;
                        const depositEth = 8;
                        const tx = await pcaPool
                            .connect(user1)
                            .depositAsset(user2.address, depositWeth, {value: depositEth});
                        const receipt = await tx.wait();

                        expect(await pcaPool.balanceOf(user2.address)).to.equal(depositWeth + depositEth);
                        expect(await underlyer.balanceOf(pool.address)).to.equal(depositWeth + depositEth);

                        const event1 = receipt.events![0]; // Transfer, mint -> address account
                        const event2 = receipt.events![1]; // Transfer, transferFrom msg.sender -> pool
                        const event3 = receipt.events![2]; // Depsoit, pcaPool
                        const event4 = receipt.events![3]; // Transfer, msg.value pcaPool -> pool

                        checkTransferEvent(event1, ZERO_ADDRESS, user2.address, depositEth + depositWeth);
                        checkTransferEvent(event2, user1.address, pool.address, depositWeth);
                        checkDepositEvent(event3, pcaPool.address, depositEth);
                        checkTransferEvent(event4, pcaPool.address, pool.address, depositEth);
                    });
                });

                describe("depositPoolAsset()", () => {
                    before(async () => {
                        await underlyer.connect(user1).deposit({value: underlyerAmount * 2});
                        await underlyer.connect(user1).approve(pool.address, underlyerAmount);
                        await pool.connect(user1).deposit(underlyerAmount);
                        await pool.connect(user1).approve(pcaPool.address, underlyerAmount);
                        await pool.connect(deployer).registerBurner(pcaPool.address, true);
                    });

                    it("Runs correctly when only ether is passed in depositPoolAsset()", async () => {
                        const ethDeposit = 7;
                        const tWethDeposit = 0;
                        const tx = await pcaPool.connect(user1).depositPoolAsset(user1.address, tWethDeposit, {
                            value: ethDeposit,
                        });
                        const receipt = await tx.wait();

                        expect(receipt.events!.length).to.equal(3);
                        expect(await underlyer.balanceOf(pool.address)).to.equal(underlyerAmount + ethDeposit);
                        expect(await pool.balanceOf(user1.address)).to.equal(underlyerAmount);
                        expect(await pool.totalSupply()).to.equal(underlyerAmount);
                        expect(await pool.balanceOf(pcaPool.address)).to.equal(0);
                        expect(await pcaPool.balanceOf(user1.address)).to.equal(ethDeposit);

                        const event1 = receipt.events![0]; // Transfer, zeroAddr -> address
                        const event2 = receipt.events![1]; // Deposit, weth -> pcaPool
                        const event3 = receipt.events![2]; // Transfer, pcaPool -> pool

                        checkTransferEvent(event1, ZERO_ADDRESS, user1.address, ethDeposit);
                        checkDepositEvent(event2, pcaPool.address, ethDeposit);
                        checkTransferEvent(event3, pcaPool.address, pool.address, ethDeposit);
                    });

                    it("Runs correctly when only tWeth is deposited", async () => {
                        const ethDeposit = 0;
                        const tWethDeposit = 12;
                        const tx = await pcaPool.connect(user1).depositPoolAsset(user1.address, tWethDeposit, {
                            value: ethDeposit,
                        });
                        const receipt = await tx.wait();

                        expect(receipt.events!.length).to.equal(4);
                        expect(await pool.balanceOf(user1.address)).to.equal(underlyerAmount - tWethDeposit);
                        expect(await pool.totalSupply()).to.equal(underlyerAmount - tWethDeposit);
                        expect(await pool.balanceOf(pcaPool.address)).to.equal(0);
                        expect(await pcaPool.balanceOf(user1.address)).to.equal(tWethDeposit);

                        const event1 = receipt.events![0]; // Transfer, zeroAddr -> address
                        const event2 = receipt.events![1]; // Approval
                        const event3 = receipt.events![2]; // Transfer, pool -> zeroAddr
                        const event4 = receipt.events![3]; // Burn, custom burn event

                        checkTransferEvent(event1, ZERO_ADDRESS, user1.address, tWethDeposit);
                        checkApprovalEvent(event2, pcaPool.address, user1.address, underlyerAmount - tWethDeposit);
                        checkTransferEvent(event3, user1.address, ZERO_ADDRESS, tWethDeposit);
                        checkBurnedEvent(event4, user1.address, pcaPool.address, tWethDeposit);
                    });

                    it("Runs correctly with both ether and weth deposited", async () => {
                        const ethDeposit = 5;
                        const tWethDeposit = 12;
                        const tx = await pcaPool.connect(user1).depositPoolAsset(user1.address, tWethDeposit, {
                            value: ethDeposit,
                        });
                        const receipt = await tx.wait();

                        expect(receipt.events!.length).to.equal(6);
                        expect(await underlyer.balanceOf(pool.address)).to.equal(underlyerAmount + ethDeposit);
                        expect(await pool.balanceOf(user1.address)).to.equal(underlyerAmount - tWethDeposit);
                        expect(await pool.totalSupply()).to.equal(underlyerAmount - tWethDeposit);
                        expect(await pool.balanceOf(pcaPool.address)).to.equal(0);
                        expect(await pcaPool.balanceOf(user1.address)).to.equal(tWethDeposit + ethDeposit);

                        const event1 = receipt.events![0]; // Transfer, mint
                        const event2 = receipt.events![1]; // Approval
                        const event3 = receipt.events![2]; // Transfer, Burn
                        const event4 = receipt.events![3]; // Burn custom event
                        const event5 = receipt.events![4]; // Deposit
                        const event6 = receipt.events![5]; // Transfer, pcaPool -> pool

                        checkTransferEvent(event1, ZERO_ADDRESS, user1.address, tWethDeposit + ethDeposit);
                        checkApprovalEvent(event2, pcaPool.address, user1.address, underlyerAmount - tWethDeposit);
                        checkTransferEvent(event3, user1.address, ZERO_ADDRESS, tWethDeposit);
                        checkBurnedEvent(event4, user1.address, pcaPool.address, tWethDeposit);
                        checkDepositEvent(event5, pcaPool.address, ethDeposit);
                        checkTransferEvent(event6, pcaPool.address, pool.address, ethDeposit);
                    });

                    it("Runs correctly on depositFor", async () => {
                        const ethDeposit = 5;
                        const tWethDeposit = 12;
                        const tx = await pcaPool.connect(user1).depositPoolAsset(user2.address, tWethDeposit, {
                            value: ethDeposit,
                        });
                        const receipt = await tx.wait();

                        expect(receipt.events!.length).to.equal(6);
                        expect(await underlyer.balanceOf(pool.address)).to.equal(underlyerAmount + ethDeposit);
                        expect(await pool.balanceOf(user1.address)).to.equal(underlyerAmount - tWethDeposit);
                        expect(await pool.totalSupply()).to.equal(underlyerAmount - tWethDeposit);
                        expect(await pool.balanceOf(pcaPool.address)).to.equal(0);
                        expect(await pcaPool.balanceOf(user2.address)).to.equal(tWethDeposit + ethDeposit);

                        const event1 = receipt.events![0]; // Transfer, mint
                        const event2 = receipt.events![1]; // Approval
                        const event3 = receipt.events![2]; // Transfer, Burn
                        const event4 = receipt.events![3]; // Burn custom event
                        const event5 = receipt.events![4]; // Deposit
                        const event6 = receipt.events![5]; // Transfer, pcaPool -> pool

                        checkTransferEvent(event1, ZERO_ADDRESS, user2.address, tWethDeposit + ethDeposit);
                        checkApprovalEvent(event2, pcaPool.address, user1.address, underlyerAmount - tWethDeposit);
                        checkTransferEvent(event3, user1.address, ZERO_ADDRESS, tWethDeposit);
                        checkBurnedEvent(event4, user1.address, pcaPool.address, tWethDeposit);
                        checkDepositEvent(event5, pcaPool.address, ethDeposit);
                        checkTransferEvent(event6, pcaPool.address, pool.address, ethDeposit);
                    });
                });

                describe("Sending ether directly to contract, invoking recieve function", async () => {
                    it("Runs", async () => {
                        const ethDepsoit = 5;
                        await user1.sendTransaction({
                            to: pcaPool.address,
                            value: ethDepsoit,
                        });

                        expect(await pcaPool.balanceOf(user1.address)).to.equal(ethDepsoit);
                        expect(await underlyer.balanceOf(pool.address)).to.equal(underlyerAmount + ethDepsoit);
                    });
                });
            }
        });
    });
};

function checkTransferEvent(event: Event, addressFrom: string, addressTo: string, value: number): void {
    expect(event.args!.from).to.equal(addressFrom);
    expect(event.args!.to).to.equal(addressTo);
    expect(event.args!.value).to.equal(value);
}

function checkApprovalEvent(event: Event, addressSpender: string, addressOwner: string, value: number): void {
    expect(event.args!.spender).to.equal(addressSpender);
    expect(event.args!.owner).to.equal(addressOwner);
    expect(event.args!.value).to.equal(value);
}

function checkDepositEvent(event: Event, dst: string, wad: number): void {
    const depositInterface = new ethers.utils.Interface(["event Deposit(address indexed dst, uint wad)"]);
    const depositEventArgs = depositInterface.decodeEventLog("Deposit", event.data, event.topics);
    expect(depositEventArgs.dst).to.equal(dst);
    expect(depositEventArgs.wad).to.equal(wad);
}

function checkBurnedEvent(event: Event, addressAccount: string, addressBurner: string, amount: number): void {
    const burnInterface = new ethers.utils.Interface([
        "event Burned(address indexed account, address indexed burner, uint256 amount)",
    ]);
    const burnEventArgs = burnInterface.decodeEventLog("Burned", event.data, event.topics);
    expect(burnEventArgs.account).to.equal(addressAccount);
    expect(burnEventArgs.burner).to.equal(addressBurner);
    expect(burnEventArgs.amount).to.equal(amount);
}

pcaPoolTest("PCAPool", " with regular pool");
pcaPoolTest("PCAEthPool", " with eth pool");
