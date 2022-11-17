const {expect} = require("chai");
const timeMachine = require("ganache-time-traveler");
const {upgrades, ethers, artifacts} = require("hardhat");
const {ZERO_ADDRESS} = require("@openzeppelin/test-helpers/src/constants");
const {deployMockContract} = require("ethereum-waffle");
const IFxStateSender = artifacts.require("IFxStateSender");

describe("Test Manager", () => {
    let manager;
    let snapshotId;
    let deployer;
    let user1;
    let user2;
    let randomAccount;
    let fxStateSender;
    let destinationOnL2;
    let cycleStartTimeInitializer;
    const CYCLE_DURATION = 90; // seconds

    before(async () => {
        [deployer, user1, user2, randomAccount, destinationOnL2] = await ethers.getSigners();

        cycleStartTimeInitializer = (await ethers.provider.getBlock("latest")).timestamp + 30;
        fxStateSender = await deployMockContract(deployer, IFxStateSender.abi);

        const managerFactory = await ethers.getContractFactory("Manager");
        manager = await upgrades.deployProxy(managerFactory, [CYCLE_DURATION, cycleStartTimeInitializer], {
            unsafeAllow: ["delegatecall", "constructor", "state-variable-assignment", "state-variable-immutable"],
        });
        await manager.deployed();
    });

    beforeEach(async () => {
        let snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];

        const timestamp = (await ethers.provider.getBlock()).timestamp;
        await manager.connect(deployer).setNextCycleStartTime(timestamp + 10);
        await timeMachine.advanceTime(10);
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    describe("Test Initializer", async () => {
        it("Test defaults", async () => {
            const nextCycleStartTime = await manager.nextCycleStartTime();
            const cycleDuration = await manager.cycleDuration();
            const cycleIndex = await manager.currentCycleIndex();
            const rollover = await manager.rolloverStarted();

            expect(nextCycleStartTime).to.be.within(cycleStartTimeInitializer - 30, cycleStartTimeInitializer + 30);
            expect(cycleDuration).to.equal(CYCLE_DURATION);
            expect(cycleIndex).to.equal(0);
            expect(rollover).to.equal(false);
        });
    });

    describe("Register Controller", async () => {
        it("register controller fails when not by admin", async () => {
            await expect(
                manager.connect(user1).registerController(ethers.utils.formatBytes32String(""), ZERO_ADDRESS)
            ).to.be.revertedWith("NOT_ADMIN_ROLE");
        });

        it("Register fails when address already exists", async () => {
            const controllerId = ethers.utils.formatBytes32String("1");
            await manager.connect(deployer).registerController(controllerId, user1.address);
            await expect(manager.connect(deployer).registerController(controllerId, user1.address)).to.be.revertedWith(
                "ADD_FAIL"
            );
        });

        it("register controller successfully", async () => {
            const controllerId = ethers.utils.formatBytes32String("Controller1");
            await expect(manager.connect(deployer).registerController(controllerId, randomAccount.address))
                .to.emit(manager, "ControllerRegistered")
                .withArgs(controllerId, randomAccount.address);
            const controllerAddress = await manager.registeredControllers(controllerId);
            expect(controllerAddress).to.equal(randomAccount.address);
        });
    });

    describe("Unregister Controller", async () => {
        it("unregister controller fails when not by admin", async () => {
            await expect(
                manager.connect(user1).unRegisterController(ethers.utils.formatBytes32String(""))
            ).to.be.revertedWith("NOT_ADMIN_ROLE");
        });

        it("Fails when address not present", async () => {
            const controllerId = ethers.utils.formatBytes32String("1");
            await expect(manager.connect(deployer).unRegisterController(controllerId)).to.be.revertedWith(
                "REMOVE_FAIL"
            );
        });

        it("unregister controller successfully", async () => {
            const controllerId = ethers.utils.formatBytes32String("Controller1");
            await manager.connect(deployer).registerController(controllerId, randomAccount.address);
            await expect(manager.connect(deployer).unRegisterController(controllerId))
                .to.emit(manager, "ControllerUnregistered")
                .withArgs(controllerId, randomAccount.address);
            const controllerAddress = await manager.registeredControllers(controllerId);
            expect(controllerAddress).to.equal(ZERO_ADDRESS);
        });

        it("updates controller registery", async () => {
            const controller1Id = ethers.utils.formatBytes32String("Controller1");
            const controller2Id = ethers.utils.formatBytes32String("Controller2");
            await manager.connect(deployer).registerController(controller1Id, randomAccount.address);
            await manager.connect(deployer).registerController(controller2Id, randomAccount.address);
            const preControllerIds = await manager.connect(deployer).getControllers();
            await manager.connect(deployer).unRegisterController(controller2Id);
            const postControllerIds = await manager.connect(deployer).getControllers();

            expect(preControllerIds.length).to.equal(2);
            expect(postControllerIds.length).to.equal(1);
        });
    });

    describe("Register Pool", async () => {
        it("regiser pool fails when not by admin", async () => {
            await expect(manager.connect(user1).registerPool(user2.address)).to.be.revertedWith("NOT_ADMIN_ROLE");
        });

        it("register a duplicate pool fails", async () => {
            await expect(manager.connect(deployer).registerPool(user2.address));
            await expect(manager.connect(deployer).registerPool(user2.address)).to.be.revertedWith("ADD_FAIL");
        });

        it("register pool successfully", async () => {
            await expect(manager.connect(deployer).registerPool(user1.address))
                .to.emit(manager, "PoolRegistered")
                .withArgs(user1.address);
            const pools = await manager.getPools();
            expect(pools.length).to.equal(1);
            expect(pools[0]).to.equal(user1.address);
        });
    });

    describe("Unregister Pool", async () => {
        it("unregiser pool fails when not by admin", async () => {
            await expect(manager.connect(user1).unRegisterPool(user2.address)).to.be.revertedWith("NOT_ADMIN_ROLE");
        });

        it("unregister a pool that does not exist fails", async () => {
            await expect(manager.connect(deployer).unRegisterPool(user2.address)).to.be.revertedWith("REMOVE_FAIL");
        });

        it("unregister pool successfully", async () => {
            await manager.connect(deployer).registerPool(user2.address);
            await expect(manager.connect(deployer).unRegisterPool(user2.address))
                .to.emit(manager, "PoolUnregistered")
                .withArgs(user2.address);
            const pools = await manager.getPools();
            expect(pools.length).to.equal(0);
        });
    });

    describe("Cycle Duration", async () => {
        it("set cycle duration fails when not by admin", async () => {
            await expect(manager.connect(user1).setCycleDuration(90)).to.be.revertedWith("NOT_ADMIN_ROLE");
        });

        it("Fails when cycle time too short", async () => {
            await expect(manager.connect(deployer).setCycleDuration(1)).to.be.revertedWith("CYCLE_TOO_SHORT");
        });

        it("set cycle duration successfully", async () => {
            await expect(manager.connect(deployer).setCycleDuration(90))
                .to.emit(manager, "CycleDurationSet")
                .withArgs(90);

            const duration = await manager.cycleDuration();
            expect(duration).to.equal(90);
        });
    });

    describe("Next Cycle Start", () => {
        let cycleStartTime;

        beforeEach(async () => {
            cycleStartTime = (await ethers.provider.getBlock("latest")).timestamp;
        });

        it("Reverts on non-admin roll caller", async () => {
            await expect(manager.connect(user1).setNextCycleStartTime(cycleStartTime)).to.be.revertedWith(
                "NOT_ADMIN_ROLE"
            );
        });

        it("Reverts on time in past", async () => {
            await expect(manager.connect(deployer).setNextCycleStartTime(cycleStartTime - 30)).to.be.revertedWith(
                "MUST_BE_FUTURE"
            );
        });

        it("Correctly sets the nextCycleStartTime variable", async () => {
            const cycleTimeSet = cycleStartTime + 30;
            await manager.connect(deployer).setNextCycleStartTime(cycleTimeSet);

            const timeReturned = await manager.nextCycleStartTime();
            expect(timeReturned).to.equal(cycleTimeSet);
        });

        it("Returns an event with the proper name and args", async () => {
            const cycleSetTime = (await ethers.provider.getBlock("latest")).timestamp + 30;
            const tx = await manager.connect(deployer).setNextCycleStartTime(cycleSetTime);
            const receipt = await tx.wait();

            expect(receipt.events[0].event).to.equal("NextCycleStartSet");
            expect(receipt.events[0].args[0]).to.equal(cycleSetTime);
        });
    });

    describe("Cycle Completion", async () => {
        it("complete rollover fails when not by rollover role", async () => {
            await expect(manager.connect(user1).completeRollover("X")).to.be.revertedWith("NOT_ROLLOVER_ROLE");
        });

        it("prevents premature execution", async () => {
            const cycleDuration = 90;
            await manager.connect(deployer).setCycleDuration(cycleDuration);
            await manager.connect(deployer).completeRollover("X");
            await expect(manager.connect(deployer).completeRollover("X")).to.be.revertedWith("PREMATURE_EXECUTION");
        });

        it("allows properly timed execution", async () => {
            await manager.connect(deployer).completeRollover("X");
            await timeMachine.advanceTime(100);
            await expect(manager.connect(deployer).completeRollover("X")).to.not.be.revertedWith("PREMATURE_EXECUTION");
        });

        it("sets current cycle to current block", async () => {
            const originalCycle = await manager.connect(deployer).getCurrentCycle();
            await timeMachine.advanceBlock();
            await manager.connect(deployer).completeRollover("X");
            const newCycle = await manager.connect(deployer).getCurrentCycle();
            expect(newCycle.gt(originalCycle)).to.be.true;
        });

        it("increment currentCycleIndex", async () => {
            await manager.connect(deployer).completeRollover("X");
            const cycleIndex = await manager.getCurrentCycleIndex();
            expect(cycleIndex).to.be.equal(1);
        });

        it("to emit cycle rollover complete event", async () => {
            await expect(manager.connect(deployer).completeRollover("X")).to.emit(manager, "CycleRolloverComplete");
        });
    });

    describe("Starting Cycle Rollover", () => {
        it("set the rolloverStarted flag to true", async () => {
            await timeMachine.advanceTime(30);

            await manager.connect(deployer).startCycleRollover();
            const flag = await manager.getRolloverStatus();
            expect(flag).to.equal(true);
        });

        it("Rejects on non-start-rollover role", async () => {
            await expect(manager.connect(user1).startCycleRollover()).to.be.revertedWith("NOT_START_ROLLOVER_ROLE");
        });

        it("Rejects on invalid cycle start time", async () => {
            const timestamp = (await ethers.provider.getBlock()).timestamp;
            await manager.connect(deployer).setNextCycleStartTime(timestamp + 100);
            await expect(manager.connect(deployer).startCycleRollover()).to.be.revertedWith("PREMATURE_EXECUTION");
        });
    });

    describe("Execute Maintenance", async () => {
        it("Call fails when user doesn't have proper role", async () => {
            await expect(
                manager.connect(user1).executeMaintenance({
                    cycleSteps: [],
                })
            ).to.be.revertedWith("NOT_MID_CYCLE_ROLE");
        });
        it("Call succeeds when user has proper role", async () => {
            const role = await manager.MID_CYCLE_ROLE();
            await manager.connect(deployer).grantRole(role, user1.address);
            await expect(
                manager.connect(user1).executeMaintenance({
                    cycleSteps: [],
                })
            ).to.not.be.reverted;
        });
    });

    describe("Test Set Destination", () => {
        it("Reverts on non owner call", async () => {
            await expect(
                manager.connect(user1).setDestinations(fxStateSender.address, destinationOnL2.address)
            ).to.be.revertedWith("NOT_ADMIN_ROLE");
        });

        it("Reverts when fxStateSender is zero address", async () => {
            await expect(
                manager.connect(deployer).setDestinations(ZERO_ADDRESS, destinationOnL2.address)
            ).to.be.revertedWith("INVALID_ADDRESS");
        });

        it("Reverts when destination on L2 address is 0", async () => {
            await expect(
                manager.connect(deployer).setDestinations(fxStateSender.address, ZERO_ADDRESS)
            ).to.be.revertedWith("INVALID_ADDRESS");
        });

        it("Correctly stores all data", async () => {
            await manager.connect(deployer).setDestinations(fxStateSender.address, destinationOnL2.address);

            let destinationsStruct = await manager.destinations();
            expect(destinationsStruct.fxStateSender).to.equal(fxStateSender.address);
            expect(destinationsStruct.destinationOnL2).to.equal(destinationOnL2.address);
        });

        it("Emits an event with correct args", async () => {
            const tx = await manager.connect(deployer).setDestinations(fxStateSender.address, destinationOnL2.address);
            const receipt = await tx.wait();

            let eventArgs = receipt.events[0].args;
            expect(eventArgs.fxStateSender).to.equal(fxStateSender.address);
            expect(eventArgs.destinationOnL2).to.equal(destinationOnL2.address);
        });
    });

    describe("Test Set Event Send", () => {
        it("Reverts on non owner call", async () => {
            await expect(manager.connect(user1).setEventSend(true)).to.be.revertedWith("NOT_ADMIN_ROLE");
        });

        it("Reverts if destinations are not set", async () => {
            await expect(manager.connect(deployer).setEventSend(true)).to.be.revertedWith("DESTINATIONS_NOT_SET");
        });

        it("Properly stores the boolean", async () => {
            await manager.connect(deployer).setDestinations(fxStateSender.address, destinationOnL2.address);

            await manager.connect(deployer).setEventSend(true);
            expect(await manager._eventSend()).to.equal(true);
        });
    });

    describe("getting cycle duration", () => {
        it("Doesn't revert", async () => {
            await expect(manager.getCycleDuration()).to.not.be.reverted;
        });
    });

    describe("Test setupRole", () => {
        it("doesnt revert", async () => {
            await expect(manager.connect(deployer).setupRole(ethers.utils.formatBytes32String("role", user1.address)))
                .to.not.be.reverted;
        });
    });
});
