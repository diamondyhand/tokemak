import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import {deployMockContract, MockContract} from "ethereum-waffle";
import timeMachine from "ganache-time-traveler";
import {artifacts, ethers, upgrades} from "hardhat";
import WETHabi from "../abis/WETH.json";
import {ERC20, EthPool, EthPool__factory, IWETH, Manager} from "../typechain";

const {AddressZero: ZERO_ADDRESS, MaxUint256} = ethers.constants;
const POLYGON_STATE_SENDER = "0x28e4F3a7f651294B9564800b2D01f35189A5bFbE";
const FAKE_L2_DESTINATION = "0x2ec7df91995a956c0652Ffb1BB24A016E2c6E34F";

describe("ETH Pool Test", () => {
    let wethContract: ERC20 & IWETH;
    let poolFactory: EthPool__factory;
    let pool: EthPool;
    let managerContract: Manager;
    let snapshotId: string;
    let deployer: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;
    let rebalancer: SignerWithAddress;
    let rebalancerReplacement: SignerWithAddress;
    let addressRegistry: MockContract;

    const CYCLE_DURATION = 1;

    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    before(async () => {
        [deployer, user1, user2, user3, rebalancer, rebalancerReplacement] = await ethers.getSigners();

        const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
        // Deploy Manager
        const managerFactory = await ethers.getContractFactory("Manager");
        managerContract = (await upgrades.deployProxy(managerFactory, [CYCLE_DURATION, currentTime + 10], {
            unsafeAllow: ["delegatecall", "constructor", "state-variable-assignment", "state-variable-immutable"],
        })) as Manager;

        await managerContract.connect(deployer).setNextCycleStartTime(currentTime + 60);
        await timeMachine.advanceTime(400);

        await managerContract.deployed();
        await managerContract.connect(deployer).completeRollover(""); //Initialize to cycle 1

        wethContract = (await ethers.getContractAt(WETHabi, "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2")) as ERC20 &
            IWETH;

        const addressRegistryArtifact = artifacts.require("AddressRegistry");
        addressRegistry = await deployMockContract(deployer, addressRegistryArtifact.abi);
        await addressRegistry.mock.weth.returns(wethContract.address);

        poolFactory = await ethers.getContractFactory("EthPool");

        pool = (await upgrades.deployProxy(
            poolFactory,
            [managerContract.address, addressRegistry.address, "TOKE ASSET", "fAsset", rebalancer.address],
            {unsafeAllow: ["constructor"]}
        )) as EthPool;

        // OBTAIN WETH
        await wethContract.connect(user1).deposit({value: "5000000000000000000"});
        await wethContract.connect(user2).deposit({value: "5000000000000000000"});
    });

    describe("Test Initializer", async () => {
        it("Test defaults", async () => {
            const underlyer = await pool.weth();
            const manager = await pool.manager();
            const rebalancerPool = await pool.rebalancer();
            const name = await pool.name();
            const symbol = await pool.symbol();

            expect(underlyer.toLowerCase()).to.equal(wethContract.address);
            expect(manager).to.equal(managerContract.address);
            expect(rebalancerPool).to.equal(rebalancer.address);
            expect(name).to.equal("TOKE ASSET");
            expect(symbol).to.equal("fAsset");
        });

        it("should revert if  manager is zero", async () => {
            await expect(
                upgrades.deployProxy(
                    poolFactory,
                    [ethers.constants.AddressZero, addressRegistry.address, "TOKE ASSET", "fAsset", rebalancer.address],
                    {
                        unsafeAllow: ["constructor"],
                    }
                )
            ).to.revertedWith("ZERO_ADDRESS");
        });

        it("should revert if address registry address is zero", async () => {
            await expect(
                upgrades.deployProxy(
                    poolFactory,
                    [managerContract.address, ethers.constants.AddressZero, "TOKE ASSET", "fAsset", rebalancer.address],
                    {
                        unsafeAllow: ["constructor"],
                    }
                )
            ).to.revertedWith("ZERO_ADDRESS");
        });

        it("Reverts when rebalancer is zero address", async () => {
            await expect(
                upgrades.deployProxy(
                    poolFactory,
                    [
                        managerContract.address,
                        addressRegistry.address,
                        "TOKE ASSET",
                        "fAsset",
                        ethers.constants.AddressZero,
                    ],
                    {
                        unsafeAllow: ["constructor"],
                    }
                )
            ).to.revertedWith("ZERO_ADDRESS");
        });
    });

    describe("Test setRebalancer()", () => {
        it("Reverts on non-owner call", async () => {
            await expect(pool.connect(user1).setRebalancer(rebalancerReplacement.address)).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });

        it("Reverts on zero address", async () => {
            await expect(pool.connect(deployer).setRebalancer(ethers.constants.AddressZero)).to.be.revertedWith(
                "ZERO_ADDRESS"
            );
        });

        it("Sets rebalancer, emits event", async () => {
            const tx = await pool.connect(deployer).setRebalancer(rebalancerReplacement.address);
            const receipt = await tx.wait();

            expect(await pool.rebalancer()).to.equal(rebalancerReplacement.address);
            expect(receipt.events![0].args!.rebalancer).to.equal(rebalancerReplacement.address);
        });
    });

    describe("Test Deposit", async () => {
        it("Test deposit reverts on 0 amount", async () => {
            await expect(pool.connect(user1).deposit(0)).to.be.revertedWith("INVALID_AMOUNT");
        });

        it("Test deposit is successful", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await expect(pool.connect(user1).deposit(10))
                .to.emit(pool, "Transfer")
                .withArgs(ZERO_ADDRESS, user1.address, 10);

            const totalSupply = await pool.totalSupply();
            expect(totalSupply).to.equal(10);
        });

        it("Deposits blocked when paused", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await pool.connect(deployer).pause();
            await expect(pool.connect(user1).deposit(10)).to.be.revertedWith("Pausable: paused");
            await pool.connect(deployer).unpause();

            await expect(pool.connect(user1).deposit(10))
                .to.emit(pool, "Transfer")
                .withArgs(ZERO_ADDRESS, user1.address, 10);
        });

        it("Test eth deposit is successful", async () => {
            await expect(pool.connect(user1).deposit(10, {value: 10}))
                .to.emit(pool, "Transfer")
                .withArgs(ZERO_ADDRESS, user1.address, 10);

            const totalSupply = await pool.totalSupply();
            expect(totalSupply).to.equal(10);
        });

        it("Test eth deposit is fails if amount and value are mismatched", async () => {
            await expect(pool.connect(user1).deposit(10, {value: 5})).to.be.revertedWith("AMT_VALUE_MISMATCH");
        });

        it("Test multiple deposits from various addresses is successful", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);
            await wethContract.connect(user2).approve(pool.address, MaxUint256);

            await pool.connect(user1).deposit(10, {value: 10});
            await pool.connect(user1).deposit(5, {value: 5});
            await pool.connect(user2).deposit(20, {value: 20});

            const user1Bal = await pool.connect(user1).balanceOf(user1.address);
            const user2Bal = await pool.connect(user1).balanceOf(user2.address);
            const totalSupply = await pool.connect(user1).totalSupply();

            expect(user1Bal).to.equal(15);
            expect(user2Bal).to.equal(20);
            expect(totalSupply).to.equal(35);
        });
    });

    describe("Test Deposit For", async () => {
        it("Test deposit reverts on 0 amount", async () => {
            await expect(pool.connect(user1).depositFor(user1.address, 0)).to.be.revertedWith("INVALID_AMOUNT");
        });

        it("Test deposit reverts on zero address", async () => {
            await expect(pool.connect(user1).depositFor(ZERO_ADDRESS, 10)).to.be.revertedWith("INVALID_ADDRESS");
        });

        it("Test deposit is successful", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await expect(pool.connect(user1).depositFor(user1.address, 10))
                .to.emit(pool, "Transfer")
                .withArgs(ZERO_ADDRESS, user1.address, 10);

            const totalSupply = await pool.totalSupply();
            expect(totalSupply).to.equal(10);
        });

        it("Deposits blocked when paused", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await pool.connect(deployer).pause();
            await expect(pool.connect(user1).depositFor(user1.address, 10)).to.be.revertedWith("Pausable: paused");
            await pool.connect(deployer).unpause();

            await expect(pool.connect(user1).depositFor(user1.address, 10))
                .to.emit(pool, "Transfer")
                .withArgs(ZERO_ADDRESS, user1.address, 10);
        });

        it("Test deposit is successful on behalf of another", async () => {
            await wethContract.connect(user2).approve(pool.address, MaxUint256);

            await expect(pool.connect(user2).depositFor(user1.address, 10))
                .to.emit(pool, "Transfer")
                .withArgs(ZERO_ADDRESS, user1.address, 10);

            const totalSupply = await pool.totalSupply();
            expect(totalSupply).to.equal(10);
        });

        it("Test deposit is unsuccessful on behalf of another user without prior approval", async () => {
            //await wethContract.connect(user2).approve(pool.address, MaxUint256);

            await expect(pool.connect(user2).depositFor(user1.address, 10)).to.be.reverted;
        });

        it("Test eth deposit is successful", async () => {
            await expect(pool.connect(user1).depositFor(user1.address, 10, {value: 10}))
                .to.emit(pool, "Transfer")
                .withArgs(ZERO_ADDRESS, user1.address, 10);

            const totalSupply = await pool.totalSupply();
            expect(totalSupply).to.equal(10);
        });

        it("Test eth deposit is fails if amount and value are mismatched", async () => {
            await expect(pool.connect(user1).depositFor(user1.address, 10, {value: 5})).to.be.revertedWith(
                "AMT_VALUE_MISMATCH"
            );
        });

        it("Test multiple deposits from various addresses is successful", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);
            await wethContract.connect(user2).approve(pool.address, MaxUint256);

            await pool.connect(user1).depositFor(user1.address, 10, {value: 10});
            await pool.connect(user1).depositFor(user1.address, 5, {value: 5});
            await pool.connect(user2).depositFor(user2.address, 20, {value: 20});

            const user1Bal = await pool.connect(user1).balanceOf(user1.address);
            const user2Bal = await pool.connect(user1).balanceOf(user2.address);
            const totalSupply = await pool.connect(user1).totalSupply();

            expect(user1Bal).to.equal(15);
            expect(user2Bal).to.equal(20);
            expect(totalSupply).to.equal(35);
        });
    });

    describe("Request Withdrawal", async () => {
        it("reverts on 0 amount", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);
            await pool.connect(user1).deposit(10);
            await expect(pool.connect(user1).requestWithdrawal(0)).to.be.revertedWith("INVALID_AMOUNT");
        });

        it("reverts on insufficient user balance", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);
            await pool.connect(user1).deposit(10);
            await expect(pool.requestWithdrawal(11)).to.be.revertedWith("INSUFFICIENT_BALANCE");
        });

        it("withdraw request is successful", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(6);

            const withheld = await pool.connect(user1).requestedWithdrawals(user1.address);
            const withheldLiquidity = await pool.connect(user1).withheldLiquidity();
            expect(withheld[0]).to.equal(2); // min cycle
            expect(withheld[1]).to.equal(6); //amount
            expect(withheldLiquidity).to.equal(6);
        });

        it("second withdraw request overwrites prior request", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(6);
            await pool.connect(user1).requestWithdrawal(10);

            const withheld = await pool.connect(user1).requestedWithdrawals(user1.address);
            const withheldLiquidity = await pool.connect(user1).withheldLiquidity();
            expect(withheld[0]).to.equal(2); // min cycle
            expect(withheld[1]).to.equal(10); //amount
            expect(withheldLiquidity).to.equal(10);
        });

        it("second withdraw request overwrites prior request after cycle moves forward", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(6);
            await managerContract.connect(deployer).completeRollover("");
            await pool.connect(user1).requestWithdrawal(10);

            const withheld = await pool.connect(user1).requestedWithdrawals(user1.address);
            const withheldLiquidity = await pool.connect(user1).withheldLiquidity();
            expect(withheld[0]).to.equal(3); // min cycle
            expect(withheld[1]).to.equal(10); //amount
            expect(withheldLiquidity).to.equal(10);
        });

        it("should set minCycle +2 if rollover is in progress", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await managerContract.connect(deployer).startCycleRollover();
            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(6);

            const withheld = await pool.connect(user1).requestedWithdrawals(user1.address);
            const withheldLiquidity = await pool.connect(user1).withheldLiquidity();
            expect(withheld[0]).to.equal(3); // min cycle = cycle + 2
            expect(withheld[1]).to.equal(6); //amount
            expect(withheldLiquidity).to.equal(6);
        });
    });

    describe("Withdrawal", async () => {
        it("withdraw is unsuccessful when attempting to withdraw more than was requested", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(6);
            // move the cycle forward
            await managerContract.connect(deployer).completeRollover("");
            await expect(pool.connect(user1).withdraw(10, false)).to.be.revertedWith("INSUFFICIENT_BALANCE");
        });

        it("withdraw is unsuccessful when amount is 0", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(6);
            await managerContract.connect(deployer).completeRollover("");
            await expect(pool.connect(user1).withdraw(0, false)).to.be.revertedWith("NO_WITHDRAWAL");
        });

        it("withdraw is unsuccessful for an invalid cycle", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(6);
            await expect(pool.connect(user1).withdraw(6, false)).to.be.revertedWith("INVALID_CYCLE");
        });

        it("a partial withdraw is successful when the pool has sufficient balance", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(6);

            // move the cycle forward
            await managerContract.connect(deployer).completeRollover("");

            await pool.connect(user1).withdraw(3, false);
            const withheld = await pool.connect(user1).requestedWithdrawals(user1.address);
            const withheldLiquidity = await pool.connect(user1).withheldLiquidity();
            const user1Bal = await pool.connect(user1).balanceOf(user1.address);
            const totalSupply = await pool.connect(user1).totalSupply();
            expect(withheld[0]).to.equal(2); // min cycle
            expect(withheld[1]).to.equal(3); //amount
            expect(withheldLiquidity).to.equal(3);
            expect(user1Bal).to.equal(7);
            expect(totalSupply).to.equal(7);
        });

        it("a full withdraw is successful when the pool balance is sufficient", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(6);

            // move the cycle forward
            await managerContract.connect(deployer).completeRollover("");

            await pool.connect(user1).withdraw(6, false);
            const withheld = await pool.connect(user1).requestedWithdrawals(user1.address);
            const withheldLiquidity = await pool.connect(user1).withheldLiquidity();
            const user1Bal = await pool.connect(user1).balanceOf(user1.address);
            const totalSupply = await pool.connect(user1).totalSupply();

            // ensure the withheld liquidity for user is cleared
            expect(withheld[0]).to.equal(0); // min cycle
            expect(withheld[1]).to.equal(0); //amount
            expect(withheldLiquidity).to.equal(0);
            expect(user1Bal).to.equal(4);
            expect(totalSupply).to.equal(4);
        });

        it.skip("a withdraw is allowed event when contract is paused", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await pool.connect(user1).deposit(10);
            await pool.connect(deployer).pause();
            await pool.connect(user1).requestWithdrawal(6);

            // move the cycle forward
            await managerContract.connect(deployer).completeRollover("");

            await expect(pool.connect(user1).withdraw(6, false)).to.be.revertedWith("PAUSED");
        });

        it("a full withdraw in eth is successful when the pool balance is sufficient", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(6);

            await timeMachine.advanceBlock();

            // move the cycle forward
            await managerContract.connect(deployer).completeRollover("");

            await pool.connect(user1).withdraw(6, true);
            const withheld = await pool.connect(user1).requestedWithdrawals(user1.address);
            const withheldLiquidity = await pool.connect(user1).withheldLiquidity();
            // const user1Bal = await pool.connect(user1).balanceOf(user1.address);
            const totalSupply = await pool.connect(user1).totalSupply();

            // ensure the withheld liquidity for user is cleared
            expect(withheld[0]).to.equal(0); // min cycle
            expect(withheld[1]).to.equal(0); //amount
            expect(withheldLiquidity).to.equal(0);
            // expect(user1Bal).to.equal(4);
            expect(totalSupply).to.equal(4);
        });

        it("Withdraw is reverted when pool balance is insufficient", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await pool.connect(deployer).approveManager(MaxUint256);
            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(6);

            await timeMachine.advanceBlock();

            await managerContract.connect(deployer).registerPool(pool.address);
            await managerContract.connect(deployer).startCycleRollover();
            let poolBalance = await wethContract.connect(deployer).balanceOf(pool.address);
            poolBalance = poolBalance.sub(1);

            const cycleData = {
                poolData: [{pool: pool.address, amount: poolBalance}],
                cycleSteps: [],
                poolsForWithdraw: [],
                complete: true,
                rewardsIpfsHash: "X",
            };

            await managerContract.connect(deployer).executeRollover(cycleData);

            await expect(pool.connect(user1).withdraw(6, true)).to.be.revertedWith("INSUFFICIENT_POOL_BALANCE");
        });
    });

    describe("Manage Approval", async () => {
        it("Test approve manager not by owner", async () => {
            await expect(pool.connect(user1).approveManager(10)).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Test approve manager by owner", async () => {
            await expect(pool.connect(deployer).approveManager(10)).to.not.be.reverted;
        });

        it("Can set allowance to 0", async () => {
            await pool.connect(deployer).approveManager(100);
            const startingAllowance = await wethContract
                .connect(user2)
                .allowance(pool.address, managerContract.address);
            await pool.connect(deployer).approveManager(0);
            const endingAllowance = await wethContract.connect(user2).allowance(pool.address, managerContract.address);

            expect(startingAllowance).to.be.gt(endingAllowance);
            expect(endingAllowance).to.be.equal(0);
        });

        it("Can set allowance to max", async () => {
            await pool.connect(deployer).approveManager(100);
            const startingAllowance = await wethContract
                .connect(user2)
                .allowance(pool.address, managerContract.address);
            await pool.connect(deployer).approveManager(0);
            const zeroAllowance = await wethContract.connect(user2).allowance(pool.address, managerContract.address);
            await pool.connect(deployer).approveManager(MaxUint256);
            const endingAllowance = await wethContract.connect(user2).allowance(pool.address, managerContract.address);

            expect(startingAllowance).to.be.gt(zeroAllowance);
            expect(zeroAllowance).to.be.equal(0);
            expect(endingAllowance).to.be.equal(MaxUint256);
        });

        it("Can increase allowance", async () => {
            await pool.connect(deployer).approveManager(100);
            const startingAllowance = await wethContract
                .connect(user2)
                .allowance(pool.address, managerContract.address);
            await pool.connect(deployer).approveManager(0);
            const zeroAllowance = await wethContract.connect(user2).allowance(pool.address, managerContract.address);
            await pool.connect(deployer).approveManager(100);
            const endingAllowance = await wethContract.connect(user2).allowance(pool.address, managerContract.address);

            expect(startingAllowance).to.be.gt(zeroAllowance);
            expect(zeroAllowance).to.be.equal(0);
            expect(endingAllowance).to.be.equal(100);
        });

        it("Can decrease allowance", async () => {
            await pool.connect(deployer).approveManager(MaxUint256);
            const startingAllowance = await wethContract
                .connect(user2)
                .allowance(pool.address, managerContract.address);
            await pool.connect(deployer).approveManager(startingAllowance.sub(100));
            const endingAllowance = await wethContract.connect(user2).allowance(pool.address, managerContract.address);
            expect(endingAllowance).to.be.equal(startingAllowance.sub(100));
        });

        it("Can set allowance to itself", async () => {
            await pool.connect(deployer).approveManager(MaxUint256);
            const startingAllowance = await wethContract
                .connect(user2)
                .allowance(pool.address, managerContract.address);
            await pool.connect(deployer).approveManager(startingAllowance.sub(100));
            const endingAllowance = await wethContract.connect(user2).allowance(pool.address, managerContract.address);
            await pool.connect(deployer).approveManager(endingAllowance);
            const noChangeAllowance = await wethContract
                .connect(user2)
                .allowance(pool.address, managerContract.address);

            expect(endingAllowance).to.be.equal(startingAllowance.sub(100));
            expect(endingAllowance).to.be.equal(noChangeAllowance);
        });
    });

    describe("Test approveRebalancer()", () => {
        it("reverts on non-owner", async () => {
            await expect(pool.connect(user1).approveRebalancer(10)).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });

        it("Raises approval", async () => {
            await pool.connect(deployer).approveRebalancer(10);
            expect(await wethContract.allowance(pool.address, rebalancer.address)).to.equal(10);
        });
    });

    describe("Pool ERC20 transfers", async () => {
        it("Decrements withdraw amount able to be requested", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);
            await pool.connect(user1).deposit(10);
            await pool.connect(user1).transfer(user2.address, 8);

            await expect(pool.connect(user1).requestWithdrawal(10)).to.be.revertedWith("INSUFFICIENT_BALANCE");
        });

        it("Removes withdraw request when amount has been wiped by transfer", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(8);
            await pool.connect(user1).transfer(user2.address, 10);

            const postWithdrawAmount = await pool.connect(user1).requestedWithdrawals(user1.address);

            expect(postWithdrawAmount[0]).to.equal(0);
            expect(postWithdrawAmount[1]).to.equal(0);
        });

        it("Decrements withdraw requests already in progress", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(8);
            await managerContract.connect(deployer).completeRollover("");

            await pool.connect(user1).transfer(user2.address, 6);

            await expect(pool.connect(user1).withdraw(8, false)).to.be.revertedWith("INSUFFICIENT_BALANCE");
        });

        it("Decrements withdraw requests already in progress but allows remaining", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            const poolTokensTransferredAway = 2;

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(8);
            await managerContract.connect(deployer).completeRollover("");

            const preTransferAmount = await pool.connect(user1).requestedWithdrawals(user1.address);

            await pool.connect(user1).transfer(user2.address, poolTokensTransferredAway);
            await pool.connect(user1).withdraw(6, false);

            const postWithdrawAmount = await pool.connect(user1).requestedWithdrawals(user1.address);

            const balance = await pool.connect(user1).balanceOf(user1.address);

            expect(balance).to.equal(poolTokensTransferredAway);
            expect(preTransferAmount[1]).to.equal(8);
            expect(postWithdrawAmount[1]).to.equal(0);
        });

        it("Frees up total witheld liquidity", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);
            const poolTokensTransferredAway = 2;

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(8);

            const preTransferWithheld = await pool.connect(user1).withheldLiquidity();

            await pool.connect(user1).transfer(user2.address, poolTokensTransferredAway);

            const postTransferWithheld = await pool.connect(user1).withheldLiquidity();

            expect(parseFloat(postTransferWithheld.toString())).to.be.lessThan(
                parseFloat(preTransferWithheld.toString())
            );
            expect(parseFloat(preTransferWithheld.sub(postTransferWithheld).toString())).to.equal(
                poolTokensTransferredAway
            );
        });

        it("Blocks transfers when paused", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);
            await pool.connect(user1).deposit(10);

            await pool.connect(deployer).pause();

            await expect(pool.connect(deployer).transfer(user2.address, 10)).to.be.revertedWith("Pausable: paused");
        });
    });

    describe("Pool ERC20 transferFroms", async () => {
        it("Decrements withdraw amount able to be requested", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).approve(user1.address, 8);
            await pool.connect(user1).transferFrom(user1.address, user2.address, 8);

            await expect(pool.connect(user1).requestWithdrawal(10)).to.be.revertedWith("INSUFFICIENT_BALANCE");
        });

        it("Removes withdraw request when amount has been wiped by transfer", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(8);
            await pool.connect(user1).approve(user1.address, 10);
            await pool.connect(user1).transferFrom(user1.address, user2.address, 10);

            const postWithdrawAmount = await pool.connect(user1).requestedWithdrawals(user1.address);

            expect(postWithdrawAmount[0]).to.equal(0);
            expect(postWithdrawAmount[1]).to.equal(0);
        });

        it("Decrements withdraw requests already in progress", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await pool.connect(user1).deposit(10);

            await pool.connect(user1).requestWithdrawal(8);
            await managerContract.connect(deployer).completeRollover("");

            await pool.connect(user1).approve(user1.address, 6);
            await pool.connect(user1).transferFrom(user1.address, user2.address, 6);

            await expect(pool.connect(user1).withdraw(8, false)).to.be.revertedWith("INSUFFICIENT_BALANCE");
        });

        it("Decrements withdraw requests already in progress but allows remaining", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            const poolTokensTransferredAway = 2;

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(8);
            await managerContract.connect(deployer).completeRollover("");

            const preTransferAmount = await pool.connect(user1).requestedWithdrawals(user1.address);

            await pool.connect(user1).approve(user1.address, poolTokensTransferredAway);
            await pool.connect(user1).transferFrom(user1.address, user2.address, poolTokensTransferredAway);
            await pool.connect(user1).withdraw(6, false);

            const postWithdrawAmount = await pool.connect(user1).requestedWithdrawals(user1.address);

            const balance = await pool.connect(user1).balanceOf(user1.address);

            expect(balance).to.equal(poolTokensTransferredAway);
            expect(preTransferAmount[1]).to.equal(8);
            expect(postWithdrawAmount[1]).to.equal(0);
        });

        it("Frees up total witheld liquidity", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            const poolTokensTransferredAway = 2;

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(8);

            const preTransferWithheld = await pool.connect(user1).withheldLiquidity();

            await pool.connect(user1).approve(user1.address, poolTokensTransferredAway);
            await pool.connect(user1).transferFrom(user1.address, user2.address, poolTokensTransferredAway);

            const postTransferWithheld = await pool.connect(user1).withheldLiquidity();

            expect(parseFloat(postTransferWithheld.toString())).to.be.lessThan(
                parseFloat(preTransferWithheld.toString())
            );
            expect(parseFloat(preTransferWithheld.sub(postTransferWithheld).toString())).to.equal(
                poolTokensTransferredAway
            );
        });

        it("Blocks transferFroms when paused", async () => {
            await wethContract.connect(user1).approve(pool.address, MaxUint256);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).approve(user2.address, MaxUint256);
            await pool.connect(deployer).pause();

            await expect(pool.connect(user2).transferFrom(user1.address, user3.address, 10)).to.be.revertedWith(
                "Pausable: paused"
            );
        });
    });

    describe("Test Set Destination", () => {
        it("Reverts on non owner call", async () => {
            await expect(
                pool.connect(user1).setDestinations(POLYGON_STATE_SENDER, FAKE_L2_DESTINATION)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Reverts when destination on L1 is zero address", async () => {
            await expect(pool.connect(deployer).setDestinations(ZERO_ADDRESS, FAKE_L2_DESTINATION)).to.be.revertedWith(
                "INVALID_ADDRESS"
            );
        });

        it("Reverts when destination on L2 address is 0", async () => {
            await expect(pool.connect(deployer).setDestinations(POLYGON_STATE_SENDER, ZERO_ADDRESS)).to.be.revertedWith(
                "INVALID_ADDRESS"
            );
        });

        it("Correctly stores all data", async () => {
            await pool.connect(deployer).setDestinations(POLYGON_STATE_SENDER, FAKE_L2_DESTINATION);

            const destinationsStruct = await pool.destinations();
            expect(destinationsStruct.fxStateSender).to.equal(POLYGON_STATE_SENDER);
            expect(destinationsStruct.destinationOnL2).to.equal(FAKE_L2_DESTINATION);
        });

        it("Emits an event with correct args", async () => {
            await expect(pool.connect(deployer).setDestinations(POLYGON_STATE_SENDER, FAKE_L2_DESTINATION))
                .to.emit(pool, "DestinationsSet")
                .withArgs(POLYGON_STATE_SENDER, FAKE_L2_DESTINATION);
        });
    });

    describe("Test Set Event Send", () => {
        it("Reverts on non owner call", async () => {
            await expect(pool.connect(user1).setEventSend(true)).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Reverts if destinations are not set", async () => {
            await expect(pool.connect(deployer).setEventSend(true)).to.be.revertedWith("DESTINATIONS_NOT_SET");
        });

        it("Properly stores the boolean", async () => {
            await pool.connect(deployer).setDestinations(POLYGON_STATE_SENDER, FAKE_L2_DESTINATION);

            await pool.connect(deployer).setEventSend(true);
            expect(await pool._eventSend()).to.equal(true);
        });
    });

    describe("Test burning functionality", () => {
        it("Reverts when a non-owner calls registerBurner", async () => {
            await expect(pool.connect(user1).registerBurner(user2.address, true)).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });

        it("Reverts on zero address", async () => {
            await expect(pool.connect(deployer).registerBurner(ZERO_ADDRESS, true)).to.be.revertedWith(
                "INVALID_ADDRESS"
            );
        });

        it("Successfully registers a burner", async () => {
            const tx = await pool.connect(deployer).registerBurner(user1.address, true);
            const receipt = await tx.wait();

            expect(await pool.registeredBurners(user1.address)).to.equal(true);
            expect(receipt.events![0].args!.burner).to.equal(user1.address);
            expect(receipt.events![0].args!.allowed).to.equal(true);
        });

        describe("controlledBurn()", () => {
            beforeEach(async () => {
                await pool.connect(deployer).registerBurner(user2.address, true);
                await wethContract.connect(user2).approve(pool.address, MaxUint256);
                await pool.connect(user2).deposit(10);
                await pool.connect(user2).approve(user2.address, 10);
            });

            it("Reverts on non-registered burner", async () => {
                await expect(pool.connect(user1).controlledBurn(10, user2.address)).to.be.revertedWith(
                    "NOT_REGISTERED_BURNER"
                );
            });

            it("Reverts when paused", async () => {
                await pool.connect(deployer).pause();
                await expect(pool.connect(user2).controlledBurn(10, user2.address)).to.be.revertedWith(
                    "Pausable: paused"
                );
            });

            it("Reverts on 0 amount", async () => {
                await expect(pool.connect(user2).controlledBurn(0, user2.address)).to.be.revertedWith("INVALID_AMOUNT");
            });

            it("Reverts when address is 0", async () => {
                await expect(pool.connect(user2).controlledBurn(1, ZERO_ADDRESS)).to.be.revertedWith("INVALID_ADDRESS");
            });

            it("Reverts when burn amount exceeds balance", async () => {
                await expect(pool.connect(user2).controlledBurn(12, user2.address)).to.be.revertedWith(
                    "INSUFFICIENT_BALANCE"
                );
            });

            it("Works properly", async () => {
                const tx = await pool.connect(user2).controlledBurn(6, user2.address);
                const receipt = await tx.wait();

                expect(receipt.events![0].args!.from).to.equal(user2.address);
                expect(receipt.events![0].args!.to).to.equal(ZERO_ADDRESS);
                expect(receipt.events![0].args!.value).to.equal(6);

                expect(receipt.events![1].args!.account).to.equal(user2.address);
                expect(receipt.events![1].args!.burner).to.equal(user2.address);
                expect(receipt.events![1].args!.amount).to.equal(6);
            });

            it("Properly updates withhelds and requests on burn greater than request", async () => {
                await pool.connect(user2).requestWithdrawal(4);
                expect(await pool.withheldLiquidity()).to.equal(4);
                await pool.connect(user2).controlledBurn(10, user2.address);

                expect(await pool.withheldLiquidity()).to.equal(0);
                expect((await pool.requestedWithdrawals(user2.address)).amount).to.equal(0);
            });

            it("Properly updates withhelds and requests on burn less than request", async () => {
                await pool.connect(user2).requestWithdrawal(8);
                expect(await pool.withheldLiquidity()).to.equal(8);
                await pool.connect(user2).controlledBurn(6, user2.address);

                expect(await pool.withheldLiquidity()).to.equal(4);
                expect((await pool.requestedWithdrawals(user2.address)).amount).to.equal(4);
            });

            it("Burn greater than request but not full balance", async () => {
                await pool.connect(user2).requestWithdrawal(3);
                expect(await pool.withheldLiquidity()).to.equal(3);
                await pool.connect(user2).controlledBurn(8, user2.address);

                expect(await pool.withheldLiquidity()).to.equal(2);
                expect((await pool.requestedWithdrawals(user2.address)).amount).to.equal(2);
            });

            // Checking for requests and withhelds across multiple burns and withdrawal requests
            it("Proper request and withheld tracking across multiple burns", async () => {
                await pool.connect(user2).requestWithdrawal(2);
                expect(await pool.withheldLiquidity()).to.equal(2);
                await pool.connect(user2).controlledBurn(4, user2.address);

                expect(await pool.withheldLiquidity()).to.equal(2);
                expect((await pool.requestedWithdrawals(user2.address)).amount).to.equal(2);

                await pool.connect(user2).requestWithdrawal(6);
                expect(await pool.withheldLiquidity()).to.equal(6);
                expect((await pool.requestedWithdrawals(user2.address)).amount).to.equal(6);

                await pool.connect(user2).controlledBurn(4, user2.address);
                expect(await pool.withheldLiquidity()).to.equal(2);
                expect((await pool.requestedWithdrawals(user2.address)).amount).to.equal(2);
            });

            it("Allowance doesn't update when burner is also msg sender", async () => {
                expect(await pool.allowance(user2.address, user2.address)).to.equal(10);
                await pool.connect(user2).controlledBurn(6, user2.address);
                expect(await pool.allowance(user2.address, user2.address)).to.equal(10);
            });

            it("Allowance updates when account != msg.sender", async () => {
                await wethContract.connect(user1).deposit({value: 10});
                await wethContract.connect(user1).approve(pool.address, 10);
                await pool.connect(user1).deposit(10);
                await pool.connect(user1).approve(user2.address, 10);
                expect(await pool.allowance(user1.address, user2.address)).to.equal(10);
                await pool.connect(user2).controlledBurn(4, user1.address);
                expect(await pool.allowance(user1.address, user2.address)).to.equal(6);
            });
        });
    });
});
