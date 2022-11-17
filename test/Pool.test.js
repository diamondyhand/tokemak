const {expect} = require("chai");
const timeMachine = require("ganache-time-traveler");
const {artifacts, ethers, waffle, upgrades} = require("hardhat");
const {AddressZero: ZERO_ADDRESS} = ethers.constants;
const {deployMockContract} = waffle;
const ERC20 = artifacts.require("ERC20");
const IManager = artifacts.require("IManager");
const IFxStateSender = artifacts.require("IFxStateSender");

describe("Test Pool", () => {
    let underlyingToken;
    let pool;
    let managerContract;
    let snapshotId;
    let deployer;
    let user1;
    let user2;
    let destinationOnL2;
    let fxStateSender;
    let poolFactory;
    let rebalancer;
    let replacementRebalancer;

    beforeEach(async () => {
        let snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    before(async () => {
        [deployer, user1, user2, destinationOnL2, rebalancer, replacementRebalancer] = await ethers.getSigners();
        underlyingToken = await deployMockContract(deployer, ERC20.abi);
        managerContract = await deployMockContract(deployer, IManager.abi);
        fxStateSender = await deployMockContract(deployer, IFxStateSender.abi);
        await underlyingToken.mock.allowance.returns(0);
        await underlyingToken.mock.approve.returns(true);
        await underlyingToken.mock.decimals.returns(12);

        poolFactory = await ethers.getContractFactory("Pool");
        pool = await upgrades.deployProxy(
            poolFactory,
            [underlyingToken.address, managerContract.address, "TOKE ASSET", "fAsset", rebalancer.address],
            {unsafeAllow: ["constructor"]}
        );
        await pool.deployed();
    });

    describe("Test Initializer", async () => {
        it("Test defaults", async () => {
            const underlyer = await pool.underlyer();
            const manager = await pool.manager();
            const poolRebalancer = await pool.rebalancer();
            const name = await pool.name();
            const symbol = await pool.symbol();
            const decimals = await pool.decimals();

            expect(underlyer).to.equal(underlyingToken.address);
            expect(manager).to.equal(managerContract.address);
            expect(poolRebalancer).to.equal(rebalancer.address);
            expect(name).to.equal("TOKE ASSET");
            expect(symbol).to.equal("fAsset");
            expect(decimals).to.equal(12);
        });

        it("should revert if underlyer address is zero", async () => {
            await expect(
                upgrades.deployProxy(
                    poolFactory,
                    [ethers.constants.AddressZero, managerContract.address, "TOKE ASSET", "fAsset", rebalancer.address],
                    {unsafeAllow: ["constructor"]}
                )
            ).to.revertedWith("ZERO_ADDRESS");
        });

        it("should revert if manager address is zero", async () => {
            await expect(
                upgrades.deployProxy(
                    poolFactory,
                    [underlyingToken.address, ethers.constants.AddressZero, "TOKE ASSET", "fAsset", rebalancer.address],
                    {unsafeAllow: ["constructor"]}
                )
            ).to.revertedWith("ZERO_ADDRESS");
        });

        it("Reverts when rebalancer is zero address", async () => {
            await expect(
                upgrades.deployProxy(
                    poolFactory,
                    [
                        underlyingToken.address,
                        managerContract.address,
                        "TOKE ASSET",
                        "fAsset",
                        ethers.constants.AddressZero,
                    ],
                    {unsafeAllow: ["constructor"]}
                )
            ).to.be.revertedWith("ZERO_ADDRESS");
        });
    });

    describe("Test setRebalancer()", () => {
        it("Reverts on non-owner", async () => {
            await expect(pool.connect(user1).setRebalancer(replacementRebalancer.address)).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });

        it("Reverts on zero address", async () => {
            await expect(pool.connect(deployer).setRebalancer(ethers.constants.AddressZero)).to.be.revertedWith(
                "ZERO_ADDRESS"
            );
        });

        it("Sets rebalancer and emits event", async () => {
            const tx = await pool.connect(deployer).setRebalancer(replacementRebalancer.address);
            const receipt = await tx.wait();

            expect(await pool.rebalancer()).to.equal(replacementRebalancer.address);
            expect(receipt.events[0].args.rebalancer).to.equal(replacementRebalancer.address);
        });
    });

    describe("Test Deposit", async () => {
        it("Test deposit reverts on 0 amount", async () => {
            await expect(pool.connect(user1).deposit(0)).to.be.revertedWith("INVALID_AMOUNT");
        });

        it("Test deposit is successful", async () => {
            await underlyingToken.mock.transferFrom.returns(true);

            await expect(pool.connect(user1).deposit(10))
                .to.emit(pool, "Transfer")
                .withArgs(ZERO_ADDRESS, user1.address, 10);

            const totalSupply = await pool.totalSupply();
            expect(totalSupply).to.equal(10);
        });

        it("Deposits blocked when paused", async () => {
            await underlyingToken.mock.transferFrom.returns(true);

            await pool.connect(deployer).pause();
            await expect(pool.connect(user1).deposit(10)).to.be.revertedWith("Pausable: paused");
            await pool.connect(deployer).unpause();

            await expect(pool.connect(user1).deposit(10))
                .to.emit(pool, "Transfer")
                .withArgs(ZERO_ADDRESS, user1.address, 10);
        });

        it("Deposits blocked when deposits paused", async () => {
            await underlyingToken.mock.transferFrom.returns(true);

            await pool.connect(deployer).pauseDeposit();
            await expect(pool.connect(user1).deposit(10)).to.be.revertedWith("DEPOSITS_PAUSED");
            await pool.connect(deployer).unpauseDeposit();

            await expect(pool.connect(user1).deposit(10))
                .to.emit(pool, "Transfer")
                .withArgs(ZERO_ADDRESS, user1.address, 10);
        });

        it("Test multiple deposits from various addresses is successful", async () => {
            await underlyingToken.mock.transferFrom.returns(true);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).deposit(5);
            await pool.connect(user2).deposit(20);

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
            await underlyingToken.mock.transferFrom.returns(true);

            await expect(pool.connect(user1).depositFor(user1.address, 10))
                .to.emit(pool, "Transfer")
                .withArgs(ZERO_ADDRESS, user1.address, 10);

            const totalSupply = await pool.totalSupply();
            expect(totalSupply).to.equal(10);
        });

        it("Deposits blocked when paused", async () => {
            await underlyingToken.mock.transferFrom.returns(true);

            await pool.connect(deployer).pause();
            await expect(pool.connect(user1).depositFor(user1.address, 10)).to.be.revertedWith("Pausable: paused");
            await pool.connect(deployer).unpause();

            await expect(pool.connect(user1).depositFor(user1.address, 10))
                .to.emit(pool, "Transfer")
                .withArgs(ZERO_ADDRESS, user1.address, 10);
        });

        it("Test multiple deposits from various addresses is successful", async () => {
            await underlyingToken.mock.transferFrom.returns(true);

            await pool.connect(user1).depositFor(user1.address, 10);
            await pool.connect(user1).depositFor(user1.address, 5);
            await pool.connect(user2).depositFor(user2.address, 20);

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
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getCurrentCycle.returns(1);
            await pool.connect(user1).deposit(10);
            await expect(pool.connect(user1).requestWithdrawal(0)).to.be.revertedWith("INVALID_AMOUNT");
        });

        it("reverts on insufficient user balance", async () => {
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getCurrentCycle.returns(1);
            await pool.connect(user1).deposit(10);
            await expect(pool.requestWithdrawal(11)).to.be.revertedWith("INSUFFICIENT_BALANCE");
        });

        it("withdraw request is successful", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(6);

            const withheld = await pool.connect(user1).requestedWithdrawals(user1.address);
            const withheldLiquidity = await pool.connect(user1).withheldLiquidity();
            expect(withheld[0]).to.equal(2); // min cycle
            expect(withheld[1]).to.equal(6); //amount
            expect(withheldLiquidity).to.equal(6);
        });

        it("second withdraw request overwrites prior request", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

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
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(6);
            await managerContract.mock.getCurrentCycleIndex.returns(2);
            await pool.connect(user1).requestWithdrawal(10);

            const withheld = await pool.connect(user1).requestedWithdrawals(user1.address);
            const withheldLiquidity = await pool.connect(user1).withheldLiquidity();
            expect(withheld[0]).to.equal(3); // min cycle
            expect(withheld[1]).to.equal(10); //amount
            expect(withheldLiquidity).to.equal(10);
        });

        it("should set minCycle +2 if rollover is in progress", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getRolloverStatus.returns(true);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

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
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.balanceOf.returns(10);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(6);
            // move the cycle forward
            await managerContract.mock.getCurrentCycleIndex.returns(2);
            await expect(pool.connect(user1).withdraw(10)).to.be.revertedWith("INSUFFICIENT_BALANCE");
        });

        it("withdraw is unsuccessful when amount is 0", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.balanceOf.returns(10);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(6);
            await managerContract.mock.getCurrentCycleIndex.returns(2);
            await expect(pool.connect(user1).withdraw(0)).to.be.revertedWith("NO_WITHDRAWAL");
        });

        it("withdraw is unsuccessful for an invalid cycle", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.balanceOf.returns(10);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(6);
            await expect(pool.connect(user1).withdraw(6)).to.be.revertedWith("INVALID_CYCLE");
        });

        it("a partial withdraw is successful when the pool has sufficient balance", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.balanceOf.returns(10);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(6);

            // move the cycle forward
            await managerContract.mock.getCurrentCycleIndex.returns(2);

            await pool.connect(user1).withdraw(3);
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

        it("a partial withdraw is unsuccessful when the pool has insufficient balance for the requested amount", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.balanceOf.returns(3);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(6);

            // move the cycle forward
            await managerContract.mock.getCurrentCycleIndex.returns(2);

            await expect(pool.connect(user1).withdraw(6)).to.be.revertedWith("INSUFFICIENT_POOL_BALANCE");
        });

        it("a full withdraw is successful when the pool balance is sufficient", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.balanceOf.returns(6);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(6);

            // move the cycle forward
            await managerContract.mock.getCurrentCycleIndex.returns(2);

            await pool.connect(user1).withdraw(6);
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

        it.skip("a withdraw is allowed even when contract paused", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.balanceOf.returns(6);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await pool.connect(user1).deposit(10);
            await pool.connect(deployer).pause();
            await pool.connect(user1).requestWithdrawal(6);

            // move the cycle forward
            await managerContract.mock.getCurrentCycleIndex.returns(2);

            await expect(pool.connect(user1).withdraw(6)).to.be.revertedWith("PAUSED");
        });
    });

    describe("Test manager approval", async () => {
        it("Test approve manager not by owner", async () => {
            await expect(pool.connect(user1).approveManager(10)).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Test approve manager by owner", async () => {
            //usage of safe approve does an allowance check
            await underlyingToken.mock.allowance.returns(0);
            await underlyingToken.mock.approve.returns(true);
            await pool.connect(deployer).approveManager(10);
        });
    });

    describe("Test rebalancer approval", () => {
        it("Reverts when non-owner calls", async () => {
            await expect(pool.connect(user1).approveRebalancer(10)).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });

        it("Correctly approves rebalancer", async () => {
            await underlyingToken.mock.allowance.returns(0);
            await underlyingToken.mock.approve.returns(true);
            await expect(pool.connect(deployer).approveRebalancer(10)).to.not.be.reverted;
        });
    });

    describe("Pool ERC20 transfers", async () => {
        it("Decrements withdraw amount able to be requested", async () => {
            await underlyingToken.mock.transferFrom.returns(true);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).transfer(user2.address, 8);

            await expect(pool.connect(user1).requestWithdrawal(10)).to.be.revertedWith("INSUFFICIENT_BALANCE");
        });

        it("Removes withdraw request when amount has been wiped by transfer", async () => {
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.balanceOf.returns(100);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(8);
            await pool.connect(user1).transfer(user2.address, 10);

            const postWithdrawAmount = await pool.connect(user1).requestedWithdrawals(user1.address);

            expect(postWithdrawAmount[0]).to.equal(0);
            expect(postWithdrawAmount[1]).to.equal(0);
        });

        it("Decrements withdraw requests already in progress", async () => {
            await underlyingToken.mock.transferFrom.returns(true);

            await pool.connect(user1).deposit(10);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);
            await pool.connect(user1).requestWithdrawal(8);
            await managerContract.mock.getCurrentCycleIndex.returns(2);

            await pool.connect(user1).transfer(user2.address, 6);

            await expect(pool.connect(user1).withdraw(8)).to.be.revertedWith("INSUFFICIENT_BALANCE");
        });

        it("Decrements withdraw requests already in progress but allows remaining", async () => {
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.balanceOf.returns(100);

            const poolTokensTransferredAway = 2;

            await pool.connect(user1).deposit(10);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);
            await pool.connect(user1).requestWithdrawal(8);
            await managerContract.mock.getCurrentCycleIndex.returns(2);

            const preTransferAmount = await pool.connect(user1).requestedWithdrawals(user1.address);

            await pool.connect(user1).transfer(user2.address, poolTokensTransferredAway);
            await pool.connect(user1).withdraw(6);

            const postWithdrawAmount = await pool.connect(user1).requestedWithdrawals(user1.address);

            const balance = await pool.connect(user1).balanceOf(user1.address);

            expect(balance).to.equal(poolTokensTransferredAway);
            expect(preTransferAmount[1]).to.equal(8);
            expect(postWithdrawAmount[1]).to.equal(0);
        });

        it("Frees up total withheld liquidity", async () => {
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.balanceOf.returns(100);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

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
    });

    describe("Pool ERC20 transferFroms", async () => {
        it("Decrements withdraw amount able to be requested", async () => {
            await underlyingToken.mock.transferFrom.returns(true);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).approve(user1.address, 8);
            await pool.connect(user1).transferFrom(user1.address, user2.address, 8);

            await expect(pool.connect(user1).requestWithdrawal(10)).to.be.revertedWith("INSUFFICIENT_BALANCE");
        });

        it("Removes withdraw request when amount has been wiped by transfer", async () => {
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.balanceOf.returns(100);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await pool.connect(user1).deposit(10);
            await pool.connect(user1).requestWithdrawal(8);
            await pool.connect(user1).approve(user1.address, 10);
            await pool.connect(user1).transferFrom(user1.address, user2.address, 10);

            const postWithdrawAmount = await pool.connect(user1).requestedWithdrawals(user1.address);

            expect(postWithdrawAmount[0]).to.equal(0);
            expect(postWithdrawAmount[1]).to.equal(0);
        });

        it("Decrements withdraw requests already in progress", async () => {
            await underlyingToken.mock.transferFrom.returns(true);

            await pool.connect(user1).deposit(10);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);
            await pool.connect(user1).requestWithdrawal(8);
            await managerContract.mock.getCurrentCycleIndex.returns(2);

            await pool.connect(user1).approve(user1.address, 6);
            await pool.connect(user1).transferFrom(user1.address, user2.address, 6);

            await expect(pool.connect(user1).withdraw(8)).to.be.revertedWith("INSUFFICIENT_BALANCE");
        });

        it("Decrements withdraw requests already in progress but allows remaining", async () => {
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.balanceOf.returns(100);

            const poolTokensTransferredAway = 2;

            await pool.connect(user1).deposit(10);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);
            await pool.connect(user1).requestWithdrawal(8);
            await managerContract.mock.getCurrentCycleIndex.returns(2);

            const preTransferAmount = await pool.connect(user1).requestedWithdrawals(user1.address);

            await pool.connect(user1).approve(user1.address, poolTokensTransferredAway);
            await pool.connect(user1).transferFrom(user1.address, user2.address, poolTokensTransferredAway);
            await pool.connect(user1).withdraw(6);

            const postWithdrawAmount = await pool.connect(user1).requestedWithdrawals(user1.address);

            const balance = await pool.connect(user1).balanceOf(user1.address);

            expect(balance).to.equal(poolTokensTransferredAway);
            expect(preTransferAmount[1]).to.equal(8);
            expect(postWithdrawAmount[1]).to.equal(0);
        });

        it("Frees up total witheld liquidity", async () => {
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.balanceOf.returns(100);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

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
    });

    describe("Test Set Destination", () => {
        it("Reverts on non owner call", async () => {
            await expect(
                pool.connect(user1).setDestinations(fxStateSender.address, destinationOnL2.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Reverts when destination on L1 is zero address", async () => {
            await expect(
                pool.connect(deployer).setDestinations(ZERO_ADDRESS, destinationOnL2.address)
            ).to.be.revertedWith("INVALID_ADDRESS");
        });

        it("Reverts when destination on L2 address is 0", async () => {
            await expect(
                pool.connect(deployer).setDestinations(fxStateSender.address, ZERO_ADDRESS)
            ).to.be.revertedWith("INVALID_ADDRESS");
        });

        it("Correctly stores all data", async () => {
            await pool.connect(deployer).setDestinations(fxStateSender.address, destinationOnL2.address);

            let destinationsStruct = await pool.destinations();
            expect(destinationsStruct.fxStateSender).to.equal(fxStateSender.address);
            expect(destinationsStruct.destinationOnL2).to.equal(destinationOnL2.address);
        });

        it("Emits an event with correct args", async () => {
            const tx = await pool.connect(deployer).setDestinations(fxStateSender.address, destinationOnL2.address);
            const receipt = await tx.wait();

            let eventArgs = receipt.events[0].args;
            expect(eventArgs.fxStateSender).to.equal(fxStateSender.address);
            expect(eventArgs.destinationOnL2).to.equal(destinationOnL2.address);
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
            await pool.connect(deployer).setDestinations(fxStateSender.address, destinationOnL2.address);

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
            expect(receipt.events[0].args.burner).to.equal(user1.address);
            expect(receipt.events[0].args.allowed).to.equal(true);
        });

        describe("controlledBurn()", () => {
            beforeEach(async () => {
                await underlyingToken.mock.transferFrom.returns(true);
                await underlyingToken.mock.approve.returns(true);
                await underlyingToken.mock.balanceOf.returns(10);
                await managerContract.mock.getRolloverStatus.returns(false);
                await managerContract.mock.getCurrentCycleIndex.returns(1);

                await pool.connect(deployer).registerBurner(user2.address, true);
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

            it("Reverts on zero address", async () => {
                await expect(pool.connect(user2).controlledBurn(10, ZERO_ADDRESS)).to.be.revertedWith(
                    "INVALID_ADDRESS"
                );
            });

            it("Reverts when burn amount exceeds balance", async () => {
                await expect(pool.connect(user2).controlledBurn(12, user2.address)).to.be.revertedWith(
                    "INSUFFICIENT_BALANCE"
                );
            });

            it("Works properly", async () => {
                const tx = await pool.connect(user2).controlledBurn(6, user2.address);
                const receipt = await tx.wait();

                expect(receipt.events[0].args.from).to.equal(user2.address);
                expect(receipt.events[0].args.to).to.equal(ZERO_ADDRESS);
                expect(receipt.events[0].args.value).to.equal(6);

                expect(receipt.events[1].args.account).to.equal(user2.address);
                expect(receipt.events[1].args.burner).to.equal(user2.address);
                expect(receipt.events[1].args.amount).to.equal(6);
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
                await pool.connect(user1).deposit(10);
                await pool.connect(user1).approve(user2.address, 10);
                expect(await pool.allowance(user1.address, user2.address)).to.equal(10);
                await pool.connect(user2).controlledBurn(4, user1.address);
                expect(await pool.allowance(user1.address, user2.address)).to.equal(6);
            });
        });
    });
});
