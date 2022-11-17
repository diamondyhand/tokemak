const {expect} = require("chai");
const timeMachine = require("ganache-time-traveler");
const {artifacts, ethers, waffle, upgrades} = require("hardhat");
const {deployMockContract} = waffle;
const IERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20");
const IManager = artifacts.require("IManager");
const IFxStateSender = artifacts.require("IFxStateSender");
const ZERO_ADDRESS = ethers.constants.AddressZero;

describe("Test Staking", () => {
    let underlyingToken;
    let stakingContract;
    let managerContract;
    let snapshotId;
    let deployer;
    let user1;
    let user2;
    let user3;
    let treasury;
    let treasuryAddress;
    let fxStateSender;
    let destinationOnL2;
    let notionalAddress1;
    let notionalAddress2;
    let notionalAddress3;

    before(async () => {
        [
            deployer,
            user1,
            user2,
            user3,
            treasury,
            destinationOnL2,
            notionalAddress1,
            notionalAddress2,
            notionalAddress3,
        ] = await ethers.getSigners();
        treasuryAddress = treasury.address;
        underlyingToken = await deployMockContract(deployer, IERC20.abi);
        managerContract = await deployMockContract(deployer, IManager.abi);
        fxStateSender = await deployMockContract(deployer, IFxStateSender.abi);
        const stakingContractFactory = await ethers.getContractFactory("Staking");
        stakingContract = await upgrades.deployProxy(stakingContractFactory, [
            underlyingToken.address,
            managerContract.address,
            treasuryAddress,
            notionalAddress1.address,
        ]);
        await stakingContract.deployed();
    });

    beforeEach(async () => {
        let snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    describe("Deposit", async () => {
        it("Test deposit reverts on 0 amount", async () => {
            await expect(stakingContract.connect(user1)["deposit(uint256,uint256)"](0, 0)).to.be.revertedWith(
                "INVALID_AMOUNT"
            );
        });

        it("Updates initial amounts on staking schedules", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            const staks = await stakingContract.connect(user1).getStakes(user1.address);
            const stak = staks[0];
            const balance = await stakingContract.connect(user1).balanceOf(user1.address);

            expect(stak.initial).to.equal(10);
            expect(balance).to.equal(10);
        });

        it("Amounts deposited to 0 schedule are immediately staked", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            const balance = await stakingContract.connect(user1).vested(user1.address, 0);

            expect(balance).to.equal(10);
        });

        it("Amounts deposited to 0 schedule are immediately available for withdrawal", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            const balance = await stakingContract.connect(user1).availableForWithdrawal(user1.address, 0);

            expect(balance).to.equal(10);
        });

        it("Are blocked when contract is paused", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);

            await stakingContract.connect(deployer).pause();
            await expect(stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0)).to.be.revertedWith(
                "Pausable: paused"
            );
            await stakingContract.connect(deployer).unpause();
            await expect(stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0)).to.not.be.reverted;

            const balance = await stakingContract.connect(user1).availableForWithdrawal(user1.address, 0);

            expect(balance).to.equal(10);
        });
    });

    describe("Deposit directly to zero schedule", () => {
        beforeEach(async () => {
            await underlyingToken.mock.transferFrom.returns(true);
        });

        it("Does not revert on deposit", async () => {
            await expect(stakingContract.connect(user1)["deposit(uint256)"](10)).to.not.be.reverted;
        });
    });

    describe("Withdrawal", async () => {
        it("withdraw is unsuccessful when attempting to withdraw more than was requested", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.balanceOf.returns(10);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            await stakingContract.connect(user1).requestWithdrawal(6, 0);
            // move the cycle forward
            await managerContract.mock.getCurrentCycleIndex.returns(2);
            await expect(stakingContract.connect(user1)["withdraw(uint256,uint256)"](10, 0)).to.be.revertedWith(
                "INSUFFICIENT_AVAILABLE"
            );
        });

        it("withdraw is unsuccessful when amount is 0", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.balanceOf.returns(10);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            await stakingContract.connect(user1).requestWithdrawal(6, 0);
            await managerContract.mock.getCurrentCycleIndex.returns(2);
            await expect(stakingContract.connect(user1)["withdraw(uint256,uint256)"](0, 0)).to.be.revertedWith(
                "NO_WITHDRAWAL"
            );
        });

        it("withdraw is unsuccessful for an invalid cycle", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.balanceOf.returns(10);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            await stakingContract.connect(user1).requestWithdrawal(6, 0);
            await expect(stakingContract.connect(user1)["withdraw(uint256,uint256)"](6, 0)).to.be.revertedWith(
                "INVALID_CYCLE"
            );
        });

        it("a partial withdraw is successful when the stakingContract has sufficient balance", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.balanceOf.returns(10);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            await stakingContract.connect(user1).requestWithdrawal(6, 0);

            // move the cycle forward
            await managerContract.mock.getCurrentCycleIndex.returns(2);

            await stakingContract.connect(user1)["withdraw(uint256,uint256)"](3, 0);
            const withheld = await stakingContract.connect(user1).withdrawalRequestsByIndex(user1.address, 0);
            const user1Bal = await stakingContract.connect(user1).balanceOf(user1.address);

            expect(withheld[0]).to.equal(2); // min cycle
            expect(withheld[1]).to.equal(3); //amount
            expect(user1Bal).to.equal(7);
        });

        it("a full withdraw is successful when the stakingContract balance is sufficient", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.balanceOf.returns(6);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            await stakingContract.connect(user1).requestWithdrawal(6, 0);

            // move the cycle forward
            await managerContract.mock.getCurrentCycleIndex.returns(2);

            await stakingContract.connect(user1)["withdraw(uint256,uint256)"](6, 0);
            const withheld = await stakingContract.connect(user1).requestedWithdrawals(user1.address);
            const withheldLiquidity = await stakingContract.connect(user1).withheldLiquidity();
            const user1Bal = await stakingContract.connect(user1).balanceOf(user1.address);

            // ensure the withheld liquidity for user is cleared
            expect(withheld[0]).to.equal(0); // min cycle
            expect(withheld[1]).to.equal(0); //amount
            expect(withheldLiquidity).to.equal(0);
            expect(user1Bal).to.equal(4);
        });

        it("Does not allow a withdrawal when paused", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.balanceOf.returns(6);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            await stakingContract.connect(user1).requestWithdrawal(6, 0);

            await managerContract.mock.getCurrentCycleIndex.returns(2);
            await stakingContract.connect(deployer).pause();

            await expect(stakingContract.connect(user1)["withdraw(uint256,uint256)"](6, 0)).to.be.revertedWith(
                "Pausable: paused"
            );
        });
    });

    // Only checking pausable and 0 amount because private function checks done above
    describe("Withdraw from schedule 0", async () => {
        beforeEach(async () => {
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.transfer.returns(true);
            await managerContract.mock.getCurrentCycleIndex.returns(1);
            await managerContract.mock.getRolloverStatus.returns(false);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            await stakingContract.connect(user1).requestWithdrawal(10, 0);
            await managerContract.mock.getCurrentCycleIndex.returns(3);
        });

        it("Doesn't allow withdrawals when paused", async () => {
            await stakingContract.connect(deployer).pause();
            await expect(stakingContract.connect(user1)["withdraw(uint256)"](10)).to.be.revertedWith(
                "Pausable: paused"
            );
        });

        it("Reverts on 0 amount", async () => {
            await expect(stakingContract.connect(user1)["withdraw(uint256)"](0)).to.be.revertedWith("INVALID_AMOUNT");
        });

        it("Runs correctly", async () => {
            await expect(stakingContract.connect(user1)["withdraw(uint256)"](5)).to.not.be.reverted;
        });
    });

    describe("Request Withdrawal", async () => {
        it("reverts on 0 amount", async () => {
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getCurrentCycle.returns(1);
            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            await expect(stakingContract.connect(user1).requestWithdrawal(0, 0)).to.be.revertedWith("INVALID_AMOUNT");
        });

        it("Reverts on invalid scheduleIdx", async () => {
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getCurrentCycleIndex.returns(1);
            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            await expect(stakingContract.connect(user1).requestWithdrawal(10, 1)).to.be.revertedWith(
                "INVALID_SCHEDULE"
            );
        });

        it("reverts on insufficient user balance", async () => {
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getCurrentCycle.returns(1);
            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            await expect(stakingContract.requestWithdrawal(11, 0)).to.be.revertedWith("INSUFFICIENT_AVAILABLE");
        });

        it("withdraw request is successful", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            await stakingContract.connect(user1).requestWithdrawal(6, 0);

            const withheld = await stakingContract.connect(user1).withdrawalRequestsByIndex(user1.address, 0);
            expect(withheld[0]).to.equal(2); // min cycle
            expect(withheld[1]).to.equal(6); //amount
        });

        it("second withdraw request overwrites prior request", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            await stakingContract.connect(user1).requestWithdrawal(6, 0);
            await stakingContract.connect(user1).requestWithdrawal(10, 0);

            const withheld = await stakingContract.connect(user1).withdrawalRequestsByIndex(user1.address, 0);
            expect(withheld[0]).to.equal(2); // min cycle
            expect(withheld[1]).to.equal(10); //amount
        });

        it("second withdraw request overwrites prior request after cycle moves forward", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            await stakingContract.connect(user1).requestWithdrawal(6, 0);
            await managerContract.mock.getCurrentCycleIndex.returns(2);
            await stakingContract.connect(user1).requestWithdrawal(10, 0);

            const withheld = await stakingContract.connect(user1).withdrawalRequestsByIndex(user1.address, 0);
            expect(withheld[0]).to.equal(3); // min cycle
            expect(withheld[1]).to.equal(10); //amount
        });
    });

    describe("Adding Schedules", async () => {
        it("Increments index", async () => {
            let cliff = 0;
            const duration = 1;
            const interval = 1;
            const setup = true;
            const isActive = true;
            const hardStart = 1;

            cliff = 1;
            let firstSchedule = [cliff, duration, interval, setup, isActive, hardStart, true];
            await expect(stakingContract.connect(deployer).addSchedule(firstSchedule, notionalAddress1.address))
                .to.emit(stakingContract, "ScheduleAdded")
                .withArgs(1, cliff, duration, interval, setup, isActive, hardStart, notionalAddress1.address);
            const firstQueried = await stakingContract.connect(user1).schedules(1);
            expect(firstQueried.cliff).to.equal(1);

            cliff = 2;
            let secondSchedule = [cliff, duration, interval, setup, isActive, hardStart, true];
            await expect(stakingContract.connect(deployer).addSchedule(secondSchedule, notionalAddress2.address))
                .to.emit(stakingContract, "ScheduleAdded")
                .withArgs(2, cliff, duration, interval, setup, isActive, hardStart, notionalAddress2.address);
            const secondQueried = await stakingContract.connect(user1).schedules(2);
            expect(secondQueried.cliff).to.equal(2);
        });

        it("Forces setup to always be true", async () => {
            let cliff = 0;
            const duration = 1;
            const interval = 1;
            const setup = false;
            const isActive = true;
            const hardStart = 1;

            cliff = 1;
            let firstSchedule = [cliff, duration, interval, setup, isActive, hardStart, true];
            await stakingContract.connect(deployer).addSchedule(firstSchedule, notionalAddress1.address);
            const firstQueried = await stakingContract.connect(user1).schedules(1);
            expect(firstQueried.setup).to.equal(true);
        });

        it("Enforces minimum duration", async () => {
            const cliff = 0;
            const duration = 0;
            const interval = 1;
            const setup = false;
            const isActive = true;
            const hardStart = 1;

            let firstSchedule = [cliff, duration, interval, setup, isActive, hardStart, true];
            await expect(
                stakingContract.connect(deployer).addSchedule(firstSchedule, notionalAddress1.address)
            ).to.be.revertedWith("INVALID_DURATION");
        });

        it("Enforces minimum interval", async () => {
            const cliff = 0;
            const duration = 1;
            const interval = 0;
            const setup = false;
            const isActive = true;
            const hardStart = 1;

            let firstSchedule = [cliff, duration, interval, setup, isActive, hardStart, true];
            await expect(
                stakingContract.connect(deployer).addSchedule(firstSchedule, notionalAddress1.address)
            ).to.be.revertedWith("INVALID_INTERVAL");
        });
    });

    describe("Removing Schedules", async () => {
        it("Manages internal structures", async () => {
            let secondSchedule = [2, 2, 2, true, true, 0];
            let thirdSchedule = [3, 3, 3, true, true, 0];

            await stakingContract.connect(deployer).addSchedule(secondSchedule, notionalAddress2.address);
            await stakingContract.connect(deployer).addSchedule(thirdSchedule, notionalAddress3.address);
            const schedules = await stakingContract.connect(user1).getSchedules();

            expect(schedules[0].schedule.cliff).to.equal(0);
            expect(schedules[0].index).to.equal(0);
            expect(schedules[1].schedule.cliff).to.equal(2);
            expect(schedules[1].index).to.equal(1);
            expect(schedules[2].schedule.cliff).to.equal(3);
            expect(schedules[2].index).to.equal(2);
            expect(schedules[2].schedule.cliff).to.equal(3);
            expect(schedules[2].index).to.equal(2);
        });

        it("Reverts when notional address is 0 address", async () => {
            let firstSchedule = [1, 1, 1, true, true, 0];

            await expect(stakingContract.connect(deployer).addSchedule(firstSchedule, ZERO_ADDRESS)).to.be.revertedWith(
                "INVALID_ADDRESS"
            );
        });
    });

    describe("Long Term Staking", async () => {
        it("Has 0 staked if before the cliff", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);

            const cliff = 1000;
            const duration = 1;
            const interval = 1;
            const setup = true;
            const isActive = true;
            const hardStart = 0;
            const amount = 100;

            let firstSchedule = [cliff, duration, interval, setup, isActive, hardStart, true];
            await stakingContract.connect(deployer).addSchedule(firstSchedule, notionalAddress1.address);
            await stakingContract.connect(user1)["deposit(uint256,uint256)"](amount, 1);

            await timeMachine.advanceTime(cliff / 2);
            await timeMachine.advanceBlock();
            const availableBeforeCliff = await stakingContract.connect(user1).vested(user1.address, 1);

            await timeMachine.advanceTime(cliff / 2 + (duration + interval) * 2);
            await timeMachine.advanceBlock();
            const availableAfterCliff = await stakingContract.connect(user1).vested(user1.address, 1);

            expect(availableBeforeCliff).to.equal(0);
            expect(availableAfterCliff).to.equal(amount);
        });

        it("Stakes completely after the cliff and duration", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);

            const cliff = 1000;
            const duration = 1000;
            const interval = 1;
            const setup = true;
            const isActive = true;
            const hardStart = 0;
            const amount = 100;

            let firstSchedule = [cliff, duration, interval, setup, isActive, hardStart, true];
            await stakingContract.connect(deployer).addSchedule(firstSchedule, notionalAddress1.address);
            await stakingContract.connect(user1)["deposit(uint256,uint256)"](amount, 1);

            await timeMachine.advanceTime(cliff);
            await timeMachine.advanceBlock();
            const availableBeforeCliff = await stakingContract.connect(user1).vested(user1.address, 1);

            await timeMachine.advanceTime(duration);
            await timeMachine.advanceBlock();
            const availableAfterCliff = await stakingContract.connect(user1).vested(user1.address, 1);

            expect(availableBeforeCliff).to.equal(0);
            expect(availableAfterCliff).to.equal(amount);
        });

        it("Stakes allowed to a future hardStart", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);

            const block = await ethers.provider.getBlock("latest");
            const timestamp = block.timestamp;
            const secondsUntilStart = 10000;

            const cliff = 1000;
            const duration = 1000;
            const interval = 1;
            const setup = true;
            const isActive = true;
            const hardStart = timestamp + secondsUntilStart;
            const amount = 100;

            let firstSchedule = [cliff, duration, interval, setup, isActive, hardStart, true];
            await stakingContract.connect(deployer).addSchedule(firstSchedule, notionalAddress1.address);
            await stakingContract.connect(user1)["deposit(uint256,uint256)"](amount, 1);

            let vested = await stakingContract.vested(user1.address, 1);
            expect(vested).to.be.equal(0);

            await timeMachine.advanceTime(secondsUntilStart + cliff + duration / 2);
            await timeMachine.advanceBlock();

            vested = await stakingContract.vested(user1.address, 1);
            expect(Number(vested.toString())).to.be.equal(amount / 2);
        });

        it("Stakes according to interval", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);

            const cliff = 1000;
            const duration = 1000;
            const interval = 100;
            const setup = true;
            const isActive = true;
            const hardStart = 0;
            const amount = 100;

            let firstSchedule = [cliff, duration, interval, setup, isActive, hardStart, true];
            await stakingContract.connect(deployer).addSchedule(firstSchedule, notionalAddress1.address);
            await stakingContract.connect(user1)["deposit(uint256,uint256)"](amount, 1);

            await timeMachine.advanceTime(cliff);
            await timeMachine.advanceBlock();
            const availableBeforeCliff = await stakingContract.connect(user1).vested(user1.address, 1);

            await timeMachine.advanceTime(interval);
            await timeMachine.advanceBlock();
            const availableAfterFirstInterval = await stakingContract.connect(user1).vested(user1.address, 1);

            await timeMachine.advanceTime(interval);
            await timeMachine.advanceBlock();
            const availableAfterSecondInterval = await stakingContract.connect(user1).vested(user1.address, 1);

            await timeMachine.advanceTime(interval * 7);
            await timeMachine.advanceBlock();
            const availableAfter90PctInterval = await stakingContract.connect(user1).vested(user1.address, 1);

            await timeMachine.advanceTime(interval);
            await timeMachine.advanceBlock();
            const availableAfter100 = await stakingContract.connect(user1).vested(user1.address, 1);

            expect(availableBeforeCliff).to.equal(0);
            expect(availableAfterFirstInterval).to.equal(10);
            expect(availableAfterSecondInterval).to.equal(20);
            expect(availableAfter90PctInterval).to.equal(90);
            expect(availableAfter100).to.equal(100);
        });
    });

    describe("Long Term Staking and Withdrawals", async () => {
        it("Blocks request if 0 staked", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);

            const cliff = 1000;
            const duration = 1;
            const interval = 1;
            const setup = true;
            const isActive = true;
            const hardStart = 0;
            const amount = 100;

            let firstSchedule = [cliff, duration, interval, setup, isActive, hardStart, true];
            await stakingContract.connect(deployer).addSchedule(firstSchedule, notionalAddress1.address);
            await stakingContract.connect(user1)["deposit(uint256,uint256)"](amount, 1);

            await timeMachine.advanceTime(cliff / 2);
            await timeMachine.advanceBlock();
            const availableBeforeCliff = await stakingContract.connect(user1).vested(user1.address, 1);

            expect(availableBeforeCliff).to.equal(0);
            await expect(stakingContract.connect(user1).requestWithdrawal(amount, 1)).to.be.revertedWith(
                "INSUFFICIENT_AVAILABLE"
            );
        });

        it("Allows request of partially staked amounts", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            const cliff = 1000;
            const duration = 1000;
            const interval = 100;
            const setup = true;
            const isActive = true;
            const hardStart = 0;
            const amount = 100;

            let firstSchedule = [cliff, duration, interval, setup, isActive, hardStart, true];
            await stakingContract.connect(deployer).addSchedule(firstSchedule, notionalAddress1.address);
            await stakingContract.connect(user1)["deposit(uint256,uint256)"](amount, 1);

            await timeMachine.advanceTime(cliff + interval);
            await timeMachine.advanceBlock();
            const availabelAt10Pct = await stakingContract.connect(user1).vested(user1.address, 1);

            expect(availabelAt10Pct).to.equal(10);
            await expect(stakingContract.connect(user1).requestWithdrawal(10, 1))
                .to.emit(stakingContract, "WithdrawalRequested")
                .withArgs(user1.address, 1, 10);
        });

        it("Allows request of partially staked amounts across multiple schedules", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            const cliff = 1000;
            const duration = 1000;
            const interval = 100;
            const setup = true;
            const isActive = true;
            const hardStart = 0;
            const immediateStakingAmount = 100;
            const longStakingAmount = 100;

            let firstSchedule = [cliff, duration, interval, setup, isActive, hardStart, true];
            await stakingContract.connect(deployer).addSchedule(firstSchedule, notionalAddress1.address);
            await stakingContract.connect(user1)["deposit(uint256,uint256)"](immediateStakingAmount, 0);
            await stakingContract.connect(user1)["deposit(uint256,uint256)"](longStakingAmount, 1);

            await timeMachine.advanceTime(cliff + interval * 2);
            await timeMachine.advanceBlock();
            const availabelAt20Pct = await stakingContract.connect(user1).vested(user1.address, 1);

            expect(availabelAt20Pct).to.equal(20);
            await expect(stakingContract.connect(user1).requestWithdrawal(100, 0))
                .to.emit(stakingContract, "WithdrawalRequested")
                .withArgs(user1.address, 0, 100);
        });

        it("Withdraw of partially staked amounts across multiple schedules is tracked", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            const cliff = 1000;
            const duration = 1000;
            const interval = 100;
            const setup = true;
            const isActive = true;
            const hardStart = 0;
            const immediateStakingAmount = 100;
            const longStakingAmount = 100;

            let firstSchedule = [cliff, duration, interval, setup, isActive, hardStart, true];
            await stakingContract.connect(deployer).addSchedule(firstSchedule, notionalAddress1.address);
            await stakingContract.connect(deployer).addSchedule(firstSchedule, notionalAddress1.address);
            await stakingContract.connect(user1)["deposit(uint256,uint256)"](immediateStakingAmount, 0);
            await stakingContract.connect(user1)["deposit(uint256,uint256)"](longStakingAmount, 2);

            await timeMachine.advanceTime(cliff + interval * 2);
            await timeMachine.advanceBlock();
            const availabelAt20Pct = await stakingContract.connect(user1).vested(user1.address, 2);

            expect(availabelAt20Pct).to.equal(20);
            await expect(stakingContract.connect(user1).requestWithdrawal(100, 0))
                .to.emit(stakingContract, "WithdrawalRequested")
                .withArgs(user1.address, 0, 100);

            await managerContract.mock.getCurrentCycleIndex.returns(2);

            await stakingContract.connect(user1)["withdraw(uint256,uint256)"](100, 0);

            const stakings = await stakingContract.connect(user1).getStakes(user1.address);

            expect(stakings[0].withdrawn).to.equal(100);
            expect(stakings[1].withdrawn).to.equal(0);
        });
    });

    describe("Slashing", async () => {
        it("Enforces valid amount", async () => {
            await expect(stakingContract.connect(deployer).slash([user1.address], [0], 0)).to.be.revertedWith(
                "INVALID_AMOUNT"
            );
        });

        it("Enforces valid schedule", async () => {
            await expect(stakingContract.connect(deployer).slash([user1.address], [11], 10)).to.be.revertedWith(
                "INVALID_SCHEDULE"
            );
        });

        it("Enforces equal array lengths", async () => {
            await expect(
                stakingContract.connect(deployer).slash([user1.address, user2.address], [1], 0)
            ).to.be.revertedWith("LENGTH_MISMATCH");
        });

        it("Can only slash when a deposit was made first", async () => {
            await expect(stakingContract.connect(deployer).slash([user1.address], [10], 0)).to.be.revertedWith(
                "NO_VESTING"
            );
        });

        it("Checks the stak has sufficient initial balance", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);

            await expect(stakingContract.connect(deployer).slash([user1.address], [11], 0)).to.be.revertedWith(
                "INSUFFICIENT_AVAILABLE"
            );
        });

        it("Adjusts withdrawal request amount", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            await stakingContract.connect(user1).requestWithdrawal(10, 0);

            const requestAmountBefore = await stakingContract.withdrawalRequestsByIndex(user1.address, 0);
            expect(requestAmountBefore.amount).to.equal(10);

            await stakingContract.connect(deployer).slash([user1.address], [7], 0);

            const requestAmountAfter = await stakingContract.withdrawalRequestsByIndex(user1.address, 0);
            expect(requestAmountAfter.amount).to.equal(3);
        });

        it("Withdrawn amounts cannot be slashed", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            await stakingContract.connect(user1).requestWithdrawal(5, 0);

            await managerContract.mock.getCurrentCycleIndex.returns(2);

            await stakingContract.connect(user1)["withdraw(uint256,uint256)"](5, 0);

            await expect(stakingContract.connect(deployer).slash([user1.address], [10], 0)).to.be.revertedWith(
                "INSUFFICIENT_AVAILABLE"
            );
            await expect(stakingContract.connect(deployer).slash([user1.address], [5], 0))
                .to.emit(stakingContract, "Slashed")
                .withArgs(user1.address, 5, 0);

            const stakings = await stakingContract.connect(user1).getStakes(user1.address);

            expect(stakings[0].initial).to.equal(10);
            expect(stakings[0].withdrawn).to.equal(5);
            expect(stakings[0].slashed).to.equal(5);

            const available = await stakingContract.connect(user1).availableForWithdrawal(user1.address, 0);
            expect(available).to.equal(0);
        });

        it("Slashed tracking is additive", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);

            await expect(stakingContract.connect(deployer).slash([user1.address], [2], 0))
                .to.emit(stakingContract, "Slashed")
                .withArgs(user1.address, 2, 0);

            let stakings = await stakingContract.connect(user1).getStakes(user1.address);

            expect(stakings[0].slashed).to.equal(2);

            await expect(stakingContract.connect(deployer).slash([user1.address], [3], 0))
                .to.emit(stakingContract, "Slashed")
                .withArgs(user1.address, 3, 0);

            stakings = await stakingContract.connect(user1).getStakes(user1.address);

            expect(stakings[0].slashed).to.equal(5);
        });

        it("Withdraw requests are slashable before they're executed", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            await stakingContract.connect(user1).requestWithdrawal(8, 0);

            await managerContract.mock.getCurrentCycleIndex.returns(2);

            await expect(stakingContract.connect(deployer).slash([user1.address], [5], 0))
                .to.emit(stakingContract, "Slashed")
                .withArgs(user1.address, 5, 0);

            //await stakingContract.connect(user1).withdraw(5);

            await expect(stakingContract.connect(user1)["withdraw(uint256,uint256)"](8, 0)).to.be.revertedWith(
                "INSUFFICIENT_AVAILABLE"
            );

            let available = await stakingContract.connect(user1).availableForWithdrawal(user1.address, 0);
            expect(available).to.equal(5);

            await expect(stakingContract.connect(user1)["withdraw(uint256,uint256)"](3, 0))
                .to.emit(stakingContract, "WithdrawCompleted")
                .withArgs(user1.address, 0, 3);

            const stakings = await stakingContract.connect(user1).getStakes(user1.address);

            expect(stakings[0].initial).to.equal(10);
            expect(stakings[0].withdrawn).to.equal(3);
            expect(stakings[0].slashed).to.equal(5);

            available = await stakingContract.connect(user1).availableForWithdrawal(user1.address, 0);
            expect(available).to.equal(2);
        });

        it("Slashed amounts cannot be withdrawn", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getRolloverStatus.returns(false);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            await expect(stakingContract.connect(deployer).slash([user1.address], [5], 0))
                .to.emit(stakingContract, "Slashed")
                .withArgs(user1.address, 5, 0);

            await expect(stakingContract.connect(user1).requestWithdrawal(10, 0)).to.be.revertedWith(
                "INSUFFICIENT_AVAILABLE"
            );

            await stakingContract.connect(user1).requestWithdrawal(5, 0);

            await managerContract.mock.getCurrentCycleIndex.returns(2);

            await stakingContract.connect(user1)["withdraw(uint256,uint256)"](5, 0);

            const stakings = await stakingContract.connect(user1).getStakes(user1.address);

            expect(stakings[0].initial).to.equal(10);
            expect(stakings[0].withdrawn).to.equal(5);
            expect(stakings[0].slashed).to.equal(5);

            const available = await stakingContract.connect(user1).availableForWithdrawal(user1.address, 0);
            expect(available).to.equal(0);
        });

        it("Slashing decreases your balance", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);

            let balance = await stakingContract.connect(user1).balanceOf(user1.address);
            expect(balance).to.equal(10);

            await expect(stakingContract.connect(deployer).slash([user1.address], [5], 0))
                .to.emit(stakingContract, "Slashed")
                .withArgs(user1.address, 5, 0);

            balance = await stakingContract.connect(user1).balanceOf(user1.address);
            expect(balance).to.equal(5);
        });

        it("Slashing does not decrease your staking amounts", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);

            const cliff = 1000;
            const duration = 1000;
            const interval = 100;
            const setup = true;
            const isActive = true;
            const hardStart = 0;
            const amount = 100;

            let firstSchedule = [cliff, duration, interval, setup, isActive, hardStart, true];
            await stakingContract.connect(deployer).addSchedule(firstSchedule, notionalAddress1.address);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](amount, 1);

            await timeMachine.advanceTime(cliff + interval * 2);
            await timeMachine.advanceBlock();

            let staked = await stakingContract.connect(user1).vested(user1.address, 1);
            let unstaked = await stakingContract.connect(user1).unvested(user1.address, 1);
            expect(staked).to.equal(20);
            expect(unstaked).to.equal(80);

            await expect(stakingContract.connect(deployer).slash([user1.address], [5], 1))
                .to.emit(stakingContract, "Slashed")
                .withArgs(user1.address, 5, 1);

            staked = await stakingContract.connect(user1).vested(user1.address, 1);
            unstaked = await stakingContract.connect(user1).unvested(user1.address, 1);
            expect(staked).to.equal(20);
            expect(unstaked).to.equal(80);
        });

        it("Slashing your entire amount before it vests won't underflow availableForWithdrawal", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);

            const cliff = 1000;
            const duration = 1000;
            const interval = 100;
            const setup = true;
            const isActive = true;
            const hardStart = 0;
            const amount = 100;

            let firstSchedule = [cliff, duration, interval, setup, isActive, hardStart, true];
            await stakingContract.connect(deployer).addSchedule(firstSchedule, notionalAddress1.address);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](amount, 1);

            await timeMachine.advanceTime(cliff + interval * 2);
            await timeMachine.advanceBlock();

            await expect(stakingContract.connect(deployer).slash([user1.address], [amount], 1))
                .to.emit(stakingContract, "Slashed")
                .withArgs(user1.address, amount, 1);

            const balance = await stakingContract.connect(user1).availableForWithdrawal(user1.address, 1);

            expect(balance).to.equal(0);
        });

        it("Slashing updates for multiple accounts", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);

            const cliff = 1000;
            const duration = 1000;
            const interval = 100;
            const setup = true;
            const isActive = true;
            const hardStart = 0;
            const amountUser1 = 100;
            const amountUser2 = 150;

            let firstSchedule = [cliff, duration, interval, setup, isActive, hardStart, true];
            await stakingContract.connect(deployer).addSchedule(firstSchedule, notionalAddress1.address);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](amountUser1, 1);
            await stakingContract.connect(user2)["deposit(uint256,uint256)"](amountUser2, 1);

            const user1InfoBefore = (await stakingContract.getStakes(user1.address))[0];
            const user2InfoBefore = (await stakingContract.getStakes(user2.address))[0];

            expect(user1InfoBefore.initial).to.equal(amountUser1);
            expect(user1InfoBefore.slashed).to.equal(0);
            expect(user2InfoBefore.initial).to.equal(amountUser2);
            expect(user2InfoBefore.slashed).to.equal(0);

            await timeMachine.advanceTime(cliff + interval * 2);
            await timeMachine.advanceBlock();

            await expect(
                stakingContract.connect(deployer).slash([user1.address, user2.address], [amountUser1, amountUser2], 1)
            ).to.not.be.reverted;

            const user1InfoAfter = (await stakingContract.getStakes(user1.address))[0];
            const user2InfoAfter = (await stakingContract.getStakes(user2.address))[0];

            expect(user1InfoAfter.slashed).to.equal(amountUser1);
            expect(user2InfoAfter.slashed).to.equal(amountUser2);
        });

        it("Slashing is not allowed when the contract is paused", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);

            const cliff = 1000;
            const duration = 1000;
            const interval = 100;
            const setup = true;
            const isActive = true;
            const hardStart = 0;
            const amount = 100;

            let firstSchedule = [cliff, duration, interval, setup, isActive, hardStart, true];
            await stakingContract.connect(deployer).addSchedule(firstSchedule, notionalAddress1.address);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](amount, 1);

            await timeMachine.advanceTime(cliff + interval * 2);
            await timeMachine.advanceBlock();

            await stakingContract.connect(deployer).pause();
            await expect(stakingContract.connect(deployer).slash([user1.address], [amount], 1)).to.be.revertedWith(
                "Pausable: paused"
            );
        });
    });

    describe("Withdraw Requests During Rollover", async () => {
        it("Is allowed but has to wait 2x cycles", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getRolloverStatus.returns(true);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            await stakingContract.connect(user1).requestWithdrawal(5, 0);

            await managerContract.mock.getCurrentCycleIndex.returns(2);

            await expect(stakingContract.connect(user1)["withdraw(uint256,uint256)"](5, 0)).to.be.revertedWith(
                "INVALID_CYCLE"
            );

            await managerContract.mock.getCurrentCycleIndex.returns(3);

            await expect(stakingContract.connect(user1)["withdraw(uint256,uint256)"](5, 0))
                .to.emit(stakingContract, "WithdrawCompleted")
                .withArgs(user1.address, 0, 5);
        });
    });

    describe("Overriding Users Schdules", async () => {
        it("Emits UserSchedulesSet event", async () => {
            await expect(stakingContract.connect(deployer).setUserSchedules(user1.address, [0]))
                .to.emit(stakingContract, "UserSchedulesSet")
                .withArgs(user1.address, [0]);
        });

        it("Does not allow an invalid schedule", async () => {
            await expect(stakingContract.connect(deployer).setUserSchedules(user1.address, [0, 9])).to.be.revertedWith(
                "INVALID_SCHEDULE"
            );
        });
    });

    describe("Permissioned Schedules", async () => {
        it("Emits PermissionedDepositorSet event", async () => {
            await expect(stakingContract.connect(deployer).setPermissionedDepositor(user1.address, true))
                .to.emit(stakingContract, "PermissionedDepositorSet")
                .withArgs(user1.address, true);
        });

        it("Blocks not permitted callers", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);

            const cliff = 1000;
            const duration = 1000;
            const interval = 100;
            const setup = true;
            const isActive = true;
            const hardStart = 0;
            const amount = 100;

            let firstSchedule = [cliff, duration, interval, setup, isActive, hardStart, false];
            await stakingContract.connect(deployer).addSchedule(firstSchedule, notionalAddress1.address);

            await expect(stakingContract.connect(user1)["deposit(uint256,uint256)"](amount, 1)).to.be.revertedWith(
                "PERMISSIONED_SCHEDULE"
            );

            await stakingContract.connect(deployer).setPermissionedDepositor(user1.address, true);

            await expect(stakingContract.connect(user1)["deposit(uint256,uint256)"](amount, 1)).to.not.be.revertedWith(
                "PERMISSIONED_SCHEDULE"
            );

            await stakingContract.connect(deployer).setPermissionedDepositor(user1.address, false);

            await expect(stakingContract.connect(user1)["deposit(uint256,uint256)"](amount, 1)).to.be.revertedWith(
                "PERMISSIONED_SCHEDULE"
            );
        });

        it("Depositors permissions can be removed", async () => {
            //Make sure it doesn't have to be true first
            await stakingContract.connect(deployer).setPermissionedDepositor(user1.address, false);

            let currentValue = await stakingContract.connect(deployer).permissionedDepositors(user1.address);

            expect(currentValue).to.equal(false);

            await stakingContract.connect(deployer).setPermissionedDepositor(user1.address, true);

            currentValue = await stakingContract.connect(deployer).permissionedDepositors(user1.address);

            expect(currentValue).to.equal(true);

            await stakingContract.connect(deployer).setPermissionedDepositor(user1.address, false);

            currentValue = await stakingContract.connect(deployer).permissionedDepositors(user1.address);

            expect(currentValue).to.equal(false);
        });
    });

    describe("Test setScehduleStatus()", () => {
        it("Should set isActive boolean", async () => {
            const schedule = await stakingContract.schedules(0);
            expect(schedule.isActive).to.equal(true);

            await stakingContract.setScheduleStatus(0, false);
            const scheduleAfterFlip = await stakingContract.schedules(0);
            expect(scheduleAfterFlip.isActive).to.equal(false);
        });
        it("Should ensure schedule is valid", async () => {
            const schedule = await stakingContract.schedules(0);
            expect(schedule.isActive).to.equal(true);

            await expect(stakingContract.setScheduleStatus(9, false)).to.be.revertedWith("INVALID_SCHEDULE");
        });
        it("Emits ScheduleStatusSet event", async () => {
            await expect(stakingContract.connect(deployer).setScheduleStatus(0, false))
                .to.emit(stakingContract, "ScheduleStatusSet")
                .withArgs(0, false);
        });
    });

    describe("Test setScheduleHardStart()", () => {
        it("Reverts on non-existant hard start", async () => {
            await expect(stakingContract.setScheduleHardStart(0, new Date().getTime())).to.be.revertedWith(
                "HARDSTART_NOT_SET"
            );
        });
        it("Reverts if hard start does not increase", async () => {
            const hardStart = new Date().getTime();
            let scheduleIdx1 = [0, 1, 1, true, true, hardStart, true];
            await stakingContract.connect(deployer).addSchedule(scheduleIdx1, notionalAddress1.address);

            await expect(stakingContract.setScheduleHardStart(1, hardStart)).to.be.revertedWith("HARDSTART_MUST_BE_GT");
        });
        it("Reverts id schedule is not valid", async () => {
            await expect(stakingContract.setScheduleHardStart(9, new Date().getTime())).to.be.revertedWith(
                "INVALID_SCHEDULE"
            );
        });
        it("Should update hard start successfully", async () => {
            const currentDate = new Date();
            const futureDate = new Date(new Date().setMonth(currentDate.getMonth() + 1));
            let scheduleIdx1 = [0, 1, 1, true, true, currentDate.getTime(), true];
            await stakingContract.connect(deployer).addSchedule(scheduleIdx1, notionalAddress1.address);

            await expect(stakingContract.setScheduleHardStart(1, futureDate.getTime()))
                .to.emit(stakingContract, "ScheduleHardStartSet")
                .withArgs(1, futureDate.getTime());
        });
    });

    describe("Test updateScheduleStart()", () => {
        it("Reverts id schedule is not valid", async () => {
            await expect(stakingContract.updateScheduleStart([user1.address], 9)).to.be.revertedWith(
                "INVALID_SCHEDULE"
            );
        });

        it("Updates users schedule details", async () => {
            await underlyingToken.mock.transfer.returns(true);
            await underlyingToken.mock.transferFrom.returns(true);

            const currentDate = new Date();
            const futureDate = new Date(new Date().setMonth(currentDate.getMonth() + 1));
            let scheduleIdx1 = [0, 1, 1, true, true, currentDate.getTime(), true];

            await stakingContract.connect(deployer).addSchedule(scheduleIdx1, notionalAddress1.address);
            await stakingContract.setUserSchedules(user1.address, [1]);
            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 1);

            console.log(futureDate.getTime());

            await stakingContract.setScheduleHardStart(1, futureDate.getTime());
            stakingContract.updateScheduleStart([user1.address], 1);

            const stacks = await stakingContract.getStakes(user1.address);
            expect(futureDate.getTime().toString()).to.equal(stacks[1].started.toString());
        });
    });

    describe("Test Set Destination", () => {
        it("Reverts on non owner call", async () => {
            await expect(
                stakingContract.connect(user1).setDestinations(fxStateSender.address, destinationOnL2.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Reverts when destination on L1 is zero address", async () => {
            await expect(
                stakingContract.connect(deployer).setDestinations(ZERO_ADDRESS, destinationOnL2.address)
            ).to.be.revertedWith("INVALID_ADDRESS");
        });

        it("Reverts when destination on L2 address is 0", async () => {
            await expect(
                stakingContract.connect(deployer).setDestinations(fxStateSender.address, ZERO_ADDRESS)
            ).to.be.revertedWith("INVALID_ADDRESS");
        });

        it("Correctly stores all data", async () => {
            await stakingContract.connect(deployer).setDestinations(fxStateSender.address, destinationOnL2.address);

            let destinationsStruct = await stakingContract.destinations();
            expect(destinationsStruct.fxStateSender).to.equal(fxStateSender.address);
            expect(destinationsStruct.destinationOnL2).to.equal(destinationOnL2.address);
        });

        it("Emits an event with correct args", async () => {
            const tx = await stakingContract
                .connect(deployer)
                .setDestinations(fxStateSender.address, destinationOnL2.address);
            const receipt = await tx.wait();

            let eventArgs = receipt.events[0].args;
            expect(eventArgs.fxStateSender).to.equal(fxStateSender.address);
            expect(eventArgs.destinationOnL2).to.equal(destinationOnL2.address);
        });
    });

    describe("Test Set Event Send", () => {
        it("Reverts on non owner call", async () => {
            await expect(stakingContract.connect(user1).setEventSend(true)).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });

        it("Reverts if destinations are not set", async () => {
            await expect(stakingContract.connect(deployer).setEventSend(true)).to.be.revertedWith(
                "DESTINATIONS_NOT_SET"
            );
        });

        it("Properly stores the boolean", async () => {
            await stakingContract.connect(deployer).setDestinations(fxStateSender.address, destinationOnL2.address);

            await stakingContract.connect(deployer).setEventSend(true);
            expect(await stakingContract._eventSend()).to.equal(true);
        });
    });

    describe("transferring stake to other user", () => {
        beforeEach(async () => {
            await underlyingToken.mock.transferFrom.returns(true);
            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            await managerContract.mock.getCurrentCycleIndex.returns(1);
            await managerContract.mock.getRolloverStatus.returns(false);
            await stakingContract.connect(deployer).setTransferApprover(user2.address);
        });

        it("Reverts on amount being zero", async () => {
            await stakingContract.connect(user1).requestWithdrawal(10, 0);
            await managerContract.mock.getCurrentCycleIndex.returns(3);
            await expect(stakingContract.connect(user1).queueTransfer(0, 0, 0, user2.address)).to.be.revertedWith(
                "INVALID_AMOUNT"
            );
        });

        it("Reverts on address 0", async () => {
            await stakingContract.connect(user1).requestWithdrawal(10, 0);
            await managerContract.mock.getCurrentCycleIndex.returns(3);
            await expect(stakingContract.connect(user1).queueTransfer(0, 0, 10, ZERO_ADDRESS)).to.be.revertedWith(
                "INVALID_ADDRESS"
            );
        });

        it("Reverts on to being msg.sender address", async () => {
            await stakingContract.connect(user1).requestWithdrawal(10, 0);
            await expect(stakingContract.connect(user1).queueTransfer(0, 0, 1, user1.address)).to.be.revertedWith(
                "CANNOT_BE_SELF"
            );
        });

        it("Reverts on scheduleIdxTo that is not setup", async () => {
            await stakingContract.connect(user1).requestWithdrawal(10, 0);
            await managerContract.mock.getCurrentCycleIndex.returns(3);
            await expect(stakingContract.connect(user1).queueTransfer(0, 1, 10, user2.address)).to.be.revertedWith(
                "MUST_BE_SETUP"
            );
        });

        it("Reverts when contract is paused", async () => {
            await stakingContract.connect(deployer).pause();

            await expect(stakingContract.connect(user1).queueTransfer(0, 0, 10, user2.address)).to.be.revertedWith(
                "Pausable: paused"
            );
        });

        it("Reverts when schedule is not active", async () => {
            let scheduleIdx1 = [0, 1, 1, true, false, 0, true];
            await stakingContract.connect(deployer).addSchedule(scheduleIdx1, notionalAddress1.address);
            await stakingContract.connect(user1).requestWithdrawal(10, 0);
            await managerContract.mock.getCurrentCycleIndex.returns(3);
            await expect(stakingContract.connect(user1).queueTransfer(0, 1, 1, user2.address)).to.be.revertedWith(
                "MUST_BE_ACTIVE"
            );
        });

        it("Reverts on scheduleTo cliff being earlier than scheduleFrom", async () => {
            let scheduleIdx1 = [2, 1, 1, true, true, 0, true];

            await stakingContract.connect(deployer).addSchedule(scheduleIdx1, notionalAddress1.address);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 1);
            await timeMachine.advanceTime(20);
            await stakingContract.connect(user1).requestWithdrawal(10, 1);
            await managerContract.mock.getCurrentCycleIndex.returns(3);
            await expect(stakingContract.connect(user1).queueTransfer(1, 0, 10, user2.address)).to.be.revertedWith(
                "CLIFF_MUST_BE_GTE"
            );
        });

        it("Reverts on scheduleTo total staking time being less than scheduleFrom", async () => {
            let scheduleIdx1 = [1, 2, 1, true, true, 0, true];
            let scheduleIdx2 = [1, 1, 1, true, true, 0, true];

            await stakingContract.connect(deployer).addSchedule(scheduleIdx1, notionalAddress1.address);
            await stakingContract.connect(deployer).addSchedule(scheduleIdx2, notionalAddress2.address);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 1);
            await timeMachine.advanceTime(20);
            await stakingContract.connect(user1).requestWithdrawal(10, 1);
            await managerContract.mock.getCurrentCycleIndex.returns(3);
            await expect(stakingContract.connect(user1).queueTransfer(1, 2, 10, user2.address)).to.be.revertedWith(
                "SCHEDULE_MUST_BE_GTE"
            );
        });

        it("Reverts on transfer amount > initial deposit", async () => {
            await stakingContract.connect(user1).requestWithdrawal(10, 0);
            await managerContract.mock.getCurrentCycleIndex.returns(3);
            await expect(stakingContract.connect(user1).queueTransfer(0, 0, 20, user2.address)).to.be.revertedWith(
                "INSUFFICIENT_AVAILABLE"
            );
        });

        it("Reverts on transfer amount being > total left in contract for address", async () => {
            await managerContract.mock.getRolloverStatus.returns(false);
            await underlyingToken.mock.transfer.returns(true);
            await managerContract.mock.getCurrentCycleIndex.returns(1);

            await stakingContract.connect(user1).requestWithdrawal(10, 0);
            await stakingContract.connect(user1).requestWithdrawal(3, 0);
            await managerContract.mock.getCurrentCycleIndex.returns(3);
            await stakingContract.connect(user1)["withdraw(uint256,uint256)"](3, 0);
            await stakingContract.connect(deployer).slash([user1.address], [4], 0);

            // Should be 3 left
            await expect(stakingContract.connect(user1).queueTransfer(0, 0, 4, user2.address)).to.be.revertedWith(
                "INSUFFICIENT_AVAILABLE"
            );
        });

        it("A second transfer cannot be queued for a schedule until first is complete", async () => {
            await managerContract.mock.getCurrentCycleIndex.returns(3);
            const user1Initialbefore = (await stakingContract.userStakings(user1.address, 0)).initial;
            expect(user1Initialbefore).to.equal(10);

            await stakingContract.connect(user1).queueTransfer(0, 0, 1, user2.address);

            await expect(stakingContract.connect(user1).queueTransfer(0, 0, 1, user3.address)).to.be.revertedWith(
                "TRANSFER_QUEUED"
            );
        });

        it("Initial stake is reduced during transfer", async () => {
            await managerContract.mock.getCurrentCycleIndex.returns(3);
            const user1Initialbefore = (await stakingContract.userStakings(user1.address, 0)).initial;
            expect(user1Initialbefore).to.equal(10);

            await stakingContract.connect(user1).queueTransfer(0, 0, 3, user2.address);

            await managerContract.mock.getCurrentCycleIndex.returns(4);

            await stakingContract.connect(user2).approveQueuedTransfer(user1.address, 0, 0, 3, user2.address);

            const userInitialAfter = (await stakingContract.userStakings(user1.address, 0)).initial;
            expect(userInitialAfter).to.equal(7);
        });

        it("Min cycle is enforced during transfers", async () => {
            await managerContract.mock.getCurrentCycleIndex.returns(3);
            const user1Initialbefore = (await stakingContract.userStakings(user1.address, 0)).initial;
            expect(user1Initialbefore).to.equal(10);

            await stakingContract.connect(user1).queueTransfer(0, 0, 3, user2.address);

            await expect(
                stakingContract.connect(user2).approveQueuedTransfer(user1.address, 0, 0, 3, user2.address)
            ).to.be.revertedWith("INVALID_CYCLE");
        });

        it("Ensure funds marked by withdrawal request cannot be transferred", async () => {
            // User has 10, will request 8, and try to transfer to 3

            await managerContract.mock.getCurrentCycleIndex.returns(3);
            const user1Initialbefore = (await stakingContract.userStakings(user1.address, 0)).initial;
            expect(user1Initialbefore).to.equal(10);

            await stakingContract.connect(user1).requestWithdrawal(8, 0);

            await expect(stakingContract.connect(user1).queueTransfer(0, 0, 3, user2.address)).to.be.revertedWith(
                "INSUFFICIENT_AVAILABLE"
            );
        });

        it("Ensure funds marked by transfer cannot be requested for withdrawal", async () => {
            // User has 10, will queue 8 for transfer, and try to request 3

            await managerContract.mock.getCurrentCycleIndex.returns(3);
            const user1Initialbefore = (await stakingContract.userStakings(user1.address, 0)).initial;
            expect(user1Initialbefore).to.equal(10);

            await stakingContract.connect(user1).queueTransfer(0, 0, 8, user2.address);

            await expect(stakingContract.connect(user1).requestWithdrawal(3, 0)).to.be.revertedWith(
                "INSUFFICIENT_AVAILABLE"
            );
        });

        it("Cannot transfer more than you have", async () => {
            await managerContract.mock.getCurrentCycleIndex.returns(3);
            const user1Initialbefore = (await stakingContract.userStakings(user1.address, 0)).initial;
            expect(user1Initialbefore).to.equal(10);

            await expect(stakingContract.connect(user1).queueTransfer(0, 0, 11, user2.address)).to.be.revertedWith(
                "INSUFFICIENT_AVAILABLE"
            );
        });

        it("Correctly populates new user StakingDetails", async () => {
            await managerContract.mock.getCurrentCycleIndex.returns(3);
            await stakingContract.connect(user1).queueTransfer(0, 0, 7, user2.address);

            await managerContract.mock.getCurrentCycleIndex.returns(4);

            await stakingContract.connect(user2).approveQueuedTransfer(user1.address, 0, 0, 7, user2.address);

            const timestamp = (await ethers.provider.getBlock()).timestamp;

            const user2StakingDetails = await stakingContract.userStakings(user2.address, 0);
            expect(user2StakingDetails.initial).to.equal(7);
            expect(user2StakingDetails.withdrawn).to.equal(0);
            expect(user2StakingDetails.slashed).to.equal(0);
            expect(user2StakingDetails.scheduleIx).to.equal(0);
            expect(user2StakingDetails.started).to.be.gte(timestamp);
        });

        it("Waits for approval to correctly populates new user StakingDetails", async () => {
            await managerContract.mock.getCurrentCycleIndex.returns(3);
            await stakingContract.connect(user1).queueTransfer(0, 0, 7, user2.address);

            const user2StakingDetails = await stakingContract.userStakings(user2.address, 0);
            expect(user2StakingDetails.initial).to.equal(0);
            expect(user2StakingDetails.withdrawn).to.equal(0);
            expect(user2StakingDetails.slashed).to.equal(0);
            expect(user2StakingDetails.scheduleIx).to.equal(0);
            expect(user2StakingDetails.started).to.be.gte(0);
        });

        it("Adds scheduleIdx to userStakingSchedules correctly", async () => {
            let scheduleIdx1 = [0, 1, 1, true, true, 0, true];
            await stakingContract.connect(deployer).addSchedule(scheduleIdx1, notionalAddress1.address);

            await managerContract.mock.getCurrentCycleIndex.returns(3);
            await stakingContract.connect(user1).queueTransfer(0, 1, 10, user2.address);

            await managerContract.mock.getCurrentCycleIndex.returns(4);

            await stakingContract.connect(user2).approveQueuedTransfer(user1.address, 0, 1, 10, user2.address);

            const user2StakingScheduleIdx0 = await stakingContract.userStakingSchedules(user2.address, 0);
            expect(user2StakingScheduleIdx0).to.equal(1);
        });

        it("Queue transfer emits event with correct args", async () => {
            await managerContract.mock.getCurrentCycleIndex.returns(3);
            const tx = await stakingContract.connect(user1).queueTransfer(0, 0, 10, user2.address);
            const receipt = await tx.wait();

            const event = receipt.events[0];
            expect(event.event).to.equal("TransferQueued");
            expect(event.args.from).to.equal(user1.address);
            expect(event.args.scheduleFrom).to.equal(0);
            expect(event.args.scheduleTo).to.equal(0);
            expect(event.args.amount).to.equal(10);
            expect(event.args.to).to.equal(user2.address);
            expect(event.args.minCycle).to.equal(4);
        });

        it("Approval emits event with correct args", async () => {
            let scheduleIdx1 = [0, 1, 1, true, true, 0, true];
            await stakingContract.connect(deployer).addSchedule(scheduleIdx1, notionalAddress1.address);

            await managerContract.mock.getCurrentCycleIndex.returns(3);
            await stakingContract.connect(user1).queueTransfer(0, 1, 10, user2.address);

            await managerContract.mock.getCurrentCycleIndex.returns(4);

            const tx = await stakingContract
                .connect(user2)
                .approveQueuedTransfer(user1.address, 0, 1, 10, user2.address);

            const receipt = await tx.wait();

            const event = receipt.events[0];
            expect(event.event).to.equal("StakeTransferred");
            expect(event.args.from).to.equal(user1.address);
            expect(event.args.scheduleFrom).to.equal(0);
            expect(event.args.scheduleTo).to.equal(1);
            expect(event.args.amount).to.equal(10);
            expect(event.args.to).to.equal(user2.address);
        });

        it("Queued transfer is only executable once", async () => {
            let scheduleIdx1 = [0, 1, 1, true, true, 0, true];
            await stakingContract.connect(deployer).addSchedule(scheduleIdx1, notionalAddress1.address);

            await managerContract.mock.getCurrentCycleIndex.returns(3);
            await stakingContract.connect(user1).queueTransfer(0, 1, 1, user2.address);

            await managerContract.mock.getCurrentCycleIndex.returns(4);

            await stakingContract.connect(user2).approveQueuedTransfer(user1.address, 0, 1, 1, user2.address);

            await expect(stakingContract.connect(user2).approveQueuedTransfer(user1.address, 0, 1, 1, user2.address)).to
                .be.reverted;
        });

        it("Approve only callable by transfer approver", async () => {
            await managerContract.mock.getCurrentCycleIndex.returns(3);

            await stakingContract.connect(user1).queueTransfer(0, 0, 3, user2.address);

            await expect(
                stakingContract.connect(user1).approveQueuedTransfer(user1.address, 0, 0, 3, user2.address)
            ).to.be.revertedWith("NOT_APPROVER");
        });

        it("Approval re-validates to schedule is active", async () => {
            let scheduleIdx1 = [0, 1, 1, true, true, 0, true];
            await stakingContract.connect(deployer).addSchedule(scheduleIdx1, notionalAddress1.address);

            let scheduleIdx2 = [0, 1, 1, true, true, 0, true];
            await stakingContract.connect(deployer).addSchedule(scheduleIdx2, notionalAddress1.address);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 1);

            await managerContract.mock.getCurrentCycleIndex.returns(3);

            await stakingContract.connect(user1).queueTransfer(1, 2, 3, user2.address);

            await stakingContract.connect(deployer).setScheduleStatus(2, false);

            await managerContract.mock.getCurrentCycleIndex.returns(4);

            await expect(
                stakingContract.connect(user2).approveQueuedTransfer(user1.address, 1, 2, 3, user2.address)
            ).to.be.revertedWith("MUST_BE_ACTIVE");
        });

        describe("Removing a queued Transfer", async () => {
            beforeEach(async () => {
                await underlyingToken.mock.transferFrom.returns(true);
                await managerContract.mock.getCurrentCycleIndex.returns(1);
                await managerContract.mock.getRolloverStatus.returns(false);

                await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
                await stakingContract.connect(user1).requestWithdrawal(10, 0);

                await managerContract.mock.getCurrentCycleIndex.returns(3);
                await stakingContract.connect(user1).queueTransfer(0, 0, 10, user2.address);
            });

            it("reverts when contract paused", async () => {
                await stakingContract.connect(deployer).pause();
                await expect(stakingContract.connect(user1).removeQueuedTransfer(0)).to.be.revertedWith(
                    "Pausable: paused"
                );
            });

            it("Deletes queued transfer", async () => {
                const queuedBefore = await stakingContract.queuedTransfers(user1.address, 0);
                expect(queuedBefore.from).to.equal(user1.address);
                expect(queuedBefore.scheduleIdxFrom).to.equal(0);
                expect(queuedBefore.scheduleIdxTo).to.equal(0);
                expect(queuedBefore.amount).to.equal(10);
                expect(queuedBefore.to).to.equal(user2.address);

                await stakingContract.connect(user1).removeQueuedTransfer(0);

                const queuedAfter = await stakingContract.queuedTransfers(user1.address, 0);
                expect(queuedAfter.scheduleIdxFrom).to.equal(0);
                expect(queuedAfter.scheduleIdxTo).to.equal(0);
                expect(queuedAfter.amount).to.equal(0);
                expect(queuedAfter.to).to.equal(ZERO_ADDRESS);
            });

            it("Emits event correctly", async () => {
                const tx = await stakingContract.connect(user1).removeQueuedTransfer(0);
                const receipt = await tx.wait();
                const event = receipt.events[0];

                expect(event.event).to.equal("QueuedTransferRemoved");
                expect(event.args.from).to.equal(user1.address);
                expect(event.args.scheduleFrom).to.equal(0);
                expect(event.args.scheduleTo).to.equal(0);
                expect(event.args.amount).to.equal(10);
                expect(event.args.to).to.equal(user2.address);
            });
        });
    });

    describe("Test Modify Notional Addresses", () => {
        it("Reverts on mismatching array lengths", async () => {
            await expect(
                stakingContract.connect(deployer).setNotionalAddresses([0, 1], [user1.address])
            ).to.be.revertedWith("MISMATCH_LENGTH");
        });

        it("Reverts on non-owner call", async () => {
            await expect(
                stakingContract.connect(user1).setNotionalAddresses([0], [deployer.address])
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Reverts on zero address", async () => {
            await expect(
                stakingContract.connect(deployer).setNotionalAddresses([0], [ZERO_ADDRESS])
            ).to.be.revertedWith("INVALID_ADDRESS");
        });

        it("Reverts on non-exisatent schedule index", async () => {
            await expect(
                stakingContract.connect(deployer).setNotionalAddresses([65], [user1.address])
            ).to.be.revertedWith("INDEX_DOESNT_EXIST");
        });

        it("Stored notional addresses correctly", async () => {
            await stakingContract.connect(deployer).setNotionalAddresses([0], [user1.address]);

            expect(await stakingContract.notionalAddresses(0)).to.equal(user1.address);
        });

        it("Emits event correctly", async () => {
            const tx = await stakingContract.connect(deployer).setNotionalAddresses([0], [user1.address]);
            const receipt = await tx.wait();

            expect(receipt.events[0].event).to.equal("NotionalAddressesSet");
            expect(receipt.events[0].args.scheduleIdxs[0]).to.equal(0);
            expect(receipt.events[0].args.addresses[0]).to.equal(user1.address);
        });
    });

    describe("Test sweepToScheduleZero()", () => {
        beforeEach(async () => {
            let scheduleIdx1 = [0, 1, 1, true, true, 0, true];
            await stakingContract.connect(deployer).addSchedule(scheduleIdx1, notionalAddress1.address);
            await underlyingToken.mock.transferFrom.returns(true);
            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 1);
        });

        it("Reverts on 0 amount", async () => {
            await expect(stakingContract.connect(user1).sweepToScheduleZero(1, 0)).to.be.revertedWith("INVALID_AMOUNT");
        });

        it("Reverts on trying to transfer from the 0 schedule", async () => {
            await expect(stakingContract.connect(user1).sweepToScheduleZero(0, 10)).to.be.revertedWith("NOT_ZERO");
        });

        it("reverts when contract paused", async () => {
            await stakingContract.connect(deployer).pause();
            await expect(stakingContract.connect(user1).sweepToScheduleZero(1, 10)).to.be.revertedWith(
                "Pausable: paused"
            );
        });

        it("Reverts on incorrect scheduleIdx", async () => {
            await expect(stakingContract.connect(user1).sweepToScheduleZero(3, 10)).to.be.revertedWith("INVALID_INDEX");
        });

        it("Reverts on amount that is more than vested amount", async () => {
            await expect(stakingContract.connect(user1).sweepToScheduleZero(1, 13)).to.be.revertedWith(
                "INSUFFICIENT_BALANCE"
            );
        });

        it("stakeFrom.withdrawn subtracts correctly", async () => {
            await stakingContract.connect(user1).sweepToScheduleZero(1, 3);
            const stakingDetails = await stakingContract.userStakings(user1.address, 1);
            expect(stakingDetails.withdrawn).to.equal(3);
        });

        it("Adds correct amount stakeTo.initial", async () => {
            await stakingContract.connect(user1).sweepToScheduleZero(1, 4);
            const stakingDetails = await stakingContract.userStakings(user1.address, 0);
            expect(stakingDetails.initial).to.equal(4);
        });

        it("Adds index to userStakingSchedules", async () => {
            await stakingContract.connect(user1).sweepToScheduleZero(1, 10);
            const userStakingSchedule = await stakingContract.userStakingSchedules(user1.address, 1);
            expect(userStakingSchedule).to.equal(0);
        });

        it("Properly sets up a schedule 0 when one does not exist", async () => {
            await stakingContract.connect(user1).sweepToScheduleZero(1, 4);
            const timestamp = (await ethers.provider.getBlock()).timestamp;

            const user1Schedule0 = await stakingContract.userStakings(user1.address, 0);
            expect(user1Schedule0.initial).to.equal(4);
            expect(user1Schedule0.withdrawn).to.equal(0);
            expect(user1Schedule0.slashed).to.equal(0);
            expect(user1Schedule0.started).to.be.gte(timestamp);
        });

        it("Will only update initial balance if schedule already exists", async () => {
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.transfer.returns(true);
            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            await managerContract.mock.getCurrentCycleIndex.returns(1);
            await managerContract.mock.getRolloverStatus.returns(false);
            await stakingContract.connect(user1).requestWithdrawal(3, 0);
            await managerContract.mock.getCurrentCycleIndex.returns(3);
            await stakingContract.connect(user1)["withdraw(uint256,uint256)"](3, 0);
            await stakingContract.connect(deployer).slash([user1.address], [2], 0);

            const schedule0Before = await stakingContract.userStakings(user1.address, 0);

            expect(schedule0Before.initial).to.equal(10);
            expect(schedule0Before.withdrawn).to.equal(3);
            expect(schedule0Before.slashed).to.equal(2);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 1); // Redepositing to schedule 1
            await stakingContract.connect(user1).sweepToScheduleZero(1, 3);

            const schedule0After = await stakingContract.userStakings(user1.address, 0);

            expect(schedule0After.initial).to.equal(13);
            expect(schedule0After.withdrawn).to.equal(3);
            expect(schedule0After.slashed).to.equal(2);
        });

        it("Updates withdrawalRequests on schedule swept from properly", async () => {
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.transfer.returns(true);
            await managerContract.mock.getCurrentCycleIndex.returns(1);
            await managerContract.mock.getRolloverStatus.returns(false);

            await stakingContract.connect(user1).requestWithdrawal(10, 1);
            const requestBefore = await stakingContract.withdrawalRequestsByIndex(user1.address, 1);
            expect(requestBefore.amount).to.equal(10);

            await stakingContract.connect(user1).sweepToScheduleZero(1, 6);
            const requestAfter = await stakingContract.withdrawalRequestsByIndex(user1.address, 1);
            expect(requestAfter.amount).to.equal(4);
        });

        it("Ensures slashed amounts cannot be swept", async () => {
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.transfer.returns(true);
            await managerContract.mock.getCurrentCycleIndex.returns(1);
            await managerContract.mock.getRolloverStatus.returns(false);

            await stakingContract.connect(deployer).slash([user1.address], [5], 1);

            // Has 10, slashed 5, tries to sweep 6. 1 over
            await expect(stakingContract.connect(user1).sweepToScheduleZero(1, 6)).to.be.revertedWith(
                "INSUFFICIENT_BALANCE"
            );

            // Has 10, slashed 5, tries to sweep 5. good to go
            await expect(stakingContract.connect(user1).sweepToScheduleZero(1, 5)).to.not.be.reverted;
        });

        it("Trying to sweep when you've been slashed more than your vesting fails appropriately", async () => {
            await underlyingToken.mock.transferFrom.returns(true);
            await underlyingToken.mock.transfer.returns(true);
            await managerContract.mock.getCurrentCycleIndex.returns(1);
            await managerContract.mock.getRolloverStatus.returns(false);

            const cliff = 1000;
            const duration = 1000;
            const interval = 100;
            const setup = true;
            const isActive = true;
            const hardStart = 0;
            const amount = 100;

            let secondSchedule = [cliff, duration, interval, setup, isActive, hardStart, true];
            await stakingContract.connect(deployer).addSchedule(secondSchedule, notionalAddress2.address);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](amount, 2);

            await timeMachine.advanceTime(cliff + interval * 2);
            await timeMachine.advanceBlock();

            // We're at 20/80 vested/unvested
            // Slash 50 of it
            await stakingContract.connect(deployer).slash([user1.address], [50], 2);

            // Has 20 vested, but 50 is slashed, so nothing is available
            await expect(stakingContract.connect(user1).sweepToScheduleZero(2, 1)).to.be.revertedWith(
                "INSUFFICIENT_BALANCE"
            );

            // Advanced 4 more interals so we should be at 60/40
            await timeMachine.advanceTime(interval * 4);

            // Has 60 vested, but 50 is slashed, so only 10 is available
            // Requesting 11 so it'll still fail
            await expect(stakingContract.connect(user1).sweepToScheduleZero(2, 11)).to.be.revertedWith(
                "INSUFFICIENT_BALANCE"
            );

            // Same point in time but only requesting 10
            // 60 vested - 50 slashed = 10, good to go
            await expect(stakingContract.connect(user1).sweepToScheduleZero(2, 10)).to.not.be.reverted;

            // Should have nothing left
            await expect(stakingContract.connect(user1).sweepToScheduleZero(2, 1)).to.be.revertedWith(
                "INSUFFICIENT_BALANCE"
            );
        });

        it("Emits event with correct args", async () => {
            const tx = await stakingContract.connect(user1).sweepToScheduleZero(1, 9);
            const receipt = await tx.wait();

            const event = receipt.events[0];
            expect(event.event).to.equal("ZeroSweep");
            expect(event.args.user).to.equal(user1.address);
            expect(event.args.amount).to.equal(9);
            expect(event.args.scheduleFrom).to.equal(1);
        });
    });

    describe("Set Transfer Approver", () => {
        it("Only allows the owner to call it", async () => {
            await expect(stakingContract.connect(user1).setTransferApprover(deployer.address)).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });
        it("Does not allow a zero address", async () => {
            await expect(stakingContract.connect(deployer).setTransferApprover(ZERO_ADDRESS)).to.be.revertedWith(
                "INVALID_ADDRESS"
            );
        });
        it("Emits a TransferApproverSet event", async () => {
            await expect(stakingContract.connect(deployer).setTransferApprover(deployer.address))
                .to.emit(stakingContract, "TransferApproverSet")
                .withArgs(deployer.address);
        });
        it("Stores the new approver in the public transferApprove variable", async () => {
            const before = await stakingContract.transferApprover();
            await stakingContract.connect(deployer).setTransferApprover(deployer.address);
            const after = await stakingContract.transferApprover();
            expect(before).to.be.equal(ZERO_ADDRESS);
            expect(after).to.be.equal(deployer.address);
        });
    });

    describe("Test rejectQueuedTransfer()", async () => {
        beforeEach(async () => {
            await underlyingToken.mock.transferFrom.returns(true);
            await managerContract.mock.getCurrentCycleIndex.returns(1);
            await managerContract.mock.getRolloverStatus.returns(false);

            await stakingContract.connect(user1)["deposit(uint256,uint256)"](10, 0);
            await managerContract.mock.getCurrentCycleIndex.returns(3);

            await stakingContract.connect(user1).queueTransfer(0, 0, 8, user3.address);

            await stakingContract.connect(deployer).setTransferApprover(user2.address);
        });

        it("reverts when contract paused", async () => {
            await stakingContract.connect(deployer).pause();
            await expect(stakingContract.connect(user2).rejectQueuedTransfer(user1.address, 0)).to.be.revertedWith(
                "Pausable: paused"
            );
        });

        it("reverts on incorrect caller", async () => {
            await expect(stakingContract.connect(deployer).rejectQueuedTransfer(user1.address, 0)).to.be.revertedWith(
                "NOT_APPROVER"
            );
        });

        it("Reverts on QueuedTransfer that isn't set up", async () => {
            await expect(stakingContract.connect(user2).rejectQueuedTransfer(user3.address, 0)).to.be.revertedWith(
                "NO_TRANSFER_QUEUED"
            );
        });

        it("Deletes QueuedTransfer struct", async () => {
            const queuedBefore = await stakingContract.queuedTransfers(user1.address, 0);
            expect(queuedBefore.amount).to.equal(8);
            expect(queuedBefore.from).to.equal(user1.address);

            await stakingContract.connect(user2).rejectQueuedTransfer(user1.address, 0);

            const queuedAfter = await stakingContract.queuedTransfers(user1.address, 0);
            expect(queuedAfter.amount).to.equal(0);
            expect(queuedAfter.from).to.equal(ZERO_ADDRESS);
        });

        it("Emits event correctly", async () => {
            const tx = await stakingContract.connect(user2).rejectQueuedTransfer(user1.address, 0);
            const receipt = await tx.wait();
            const event = receipt.events[0];

            expect(event.event).to.equal("QueuedTransferRejected");
            expect(event.args.from).to.equal(user1.address);
            expect(event.args.scheduleFrom).to.equal(0);
            expect(event.args.scheduleTo).to.equal(0);
            expect(event.args.amount).to.equal(8);
            expect(event.args.to).to.equal(user3.address);
            expect(event.args.rejectedBy).to.equal(user2.address);
        });
    });
});
