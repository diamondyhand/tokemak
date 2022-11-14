import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import {ethers, upgrades} from "hardhat";
import * as timeMachine from "ganache-time-traveler";

import {EventProxy, IStateReceiver, CycleRolloverTracker, Manager} from "../typechain";

import PolygonStateSenderAbi from "../abis/PolygonStateSender.json";

import {PolygonChain} from "./utilities/polygonChain";

const POLYGON_FX_ROOT = "0xfe5e5D361b2ad62c541bAb87C45a0B9B018389a2";
const POLYGON_FX_CHILD = "0x8397259c983751DAf40400790063935a11afa28a";
const POLYGON_STATE_SENDER = "0x28e4F3a7f651294B9564800b2D01f35189A5bFbE";
const CYCLE_DURATION = 1;

describe("Test DelegateFunction and BalanceTracker integration", () => {
    let polygonChain!: PolygonChain;
    let snapshotId: string;

    let manager: Manager;
    let eventProxy: EventProxy;
    let cycleRolloverTracker: CycleRolloverTracker;

    let deployer: SignerWithAddress;
    let polygonDeployer: SignerWithAddress;

    before(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];

        [deployer] = await ethers.getSigners();
        manager = await deployL1Manager();

        // start polygon chain
        polygonChain = new PolygonChain(
            47853,
            "https://polygon-mainnet.g.alchemy.com/v2/" + process.env.ALCHEMY_API_KEY_POLYGON,
            137
        );
        await polygonChain.start();

        [polygonDeployer] = await polygonChain.ethers.getSigners();

        await setupBridge();

        eventProxy = await deployL2EventProxy();

        cycleRolloverTracker = await deployL2CycleRolloverTracker(eventProxy.address);

        eventProxy = await setupL2EventProxyDestinations(eventProxy, polygonDeployer, manager.address, [
            cycleRolloverTracker.address,
        ]);

        await manager.setDestinations(POLYGON_FX_ROOT, eventProxy.address);
        await manager.setEventSend(true);
    });

    after(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
        if (polygonChain) {
            await polygonChain.stop();
        }
    });

    it("It should capture Manager CycleRolloverStart event", async () => {
        const nextCycleStartTime = await manager.nextCycleStartTime();
        const nextTimestamp = nextCycleStartTime.toNumber();
        const now = Date.now();
        await timeMachine.advanceTime(Math.abs(nextTimestamp - now) + 10000);
        await timeMachine.advanceBlock();

        const tx = await manager.connect(deployer).startCycleRollover();
        await polygonChain.transferEvent(tx.blockNumber!);
        const logs = await cycleRolloverTracker.queryFilter(
            cycleRolloverTracker.filters["CycleRolloverStart(uint256,uint256,uint256)"]()
        );

        expect(logs[0].address).to.be.eq(cycleRolloverTracker.address);
        expect(logs[0].event).to.be.eq("CycleRolloverStart");
    });

    it("It should capture Manager CycleRolloverComplete event", async () => {
        //Get a new block so we can be sure the next command in the only event in there
        await ethers.provider.send("evm_mine", []);
        const tx = await manager.connect(deployer).completeRollover("x");
        await polygonChain.transferEvent(tx.blockNumber!);
        const logs = await cycleRolloverTracker.queryFilter(
            cycleRolloverTracker.filters["CycleRolloverComplete(uint256,uint256,uint256)"]()
        );

        expect(logs[0].address).to.be.eq(cycleRolloverTracker.address);
        expect(logs[0].event).to.be.eq("CycleRolloverComplete");
    });

    async function deployL1Manager(): Promise<Manager> {
        const lastBlockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

        // Deploy Manager
        const managerFactory = await ethers.getContractFactory("Manager");
        const managerContract = (await upgrades.deployProxy(managerFactory, [CYCLE_DURATION, lastBlockTimestamp + 10], {
            unsafeAllow: ["delegatecall", "constructor", "state-variable-assignment", "state-variable-immutable"],
        })) as Manager;
        await managerContract.deployed();

        return managerContract;
    }

    async function deployL2EventProxy(): Promise<EventProxy> {
        // Set up Event Proxy on L2
        const eventProxyFactory = await polygonChain.ethers.getContractFactory("EventProxy");
        const eventProxy = (await polygonChain.hre.upgrades.deployProxy(eventProxyFactory, [
            POLYGON_FX_CHILD,
        ])) as EventProxy;

        return eventProxy;
    }

    async function setupL2EventProxyDestinations(
        eventProxy: EventProxy,
        polygonDeployer: SignerWithAddress,
        l1Sender: string,
        l2Destinations: string[]
    ): Promise<EventProxy> {
        await eventProxy.connect(polygonDeployer).setSenderRegistration(l1Sender, true);

        await eventProxy.registerDestinations([
            {
                sender: l1Sender,
                eventType: ethers.utils.formatBytes32String("Cycle Rollover Start"),
                destinations: l2Destinations,
            },
            {
                sender: l1Sender,
                eventType: ethers.utils.formatBytes32String("Cycle Complete"),
                destinations: l2Destinations,
            },
        ]);

        return eventProxy;
    }

    async function deployL2CycleRolloverTracker(eventProxy: string): Promise<CycleRolloverTracker> {
        const cycleRolloverTrackerFactory = await polygonChain.ethers.getContractFactory("CycleRolloverTracker");
        return cycleRolloverTrackerFactory.deploy(eventProxy);
    }

    async function setupBridge(): Promise<void> {
        // Get L1 state sender
        const stateSender = await ethers.getContractAt(PolygonStateSenderAbi, POLYGON_STATE_SENDER);

        // Get L2 state receiver
        const stateReceiverArtifact = polygonChain.hre.artifacts.require("IStateReceiver");

        const stateReceiver = (await polygonChain.ethers.getContractAt(
            stateReceiverArtifact.abi,
            POLYGON_FX_CHILD
        )) as unknown as IStateReceiver;

        // Set up polygon bridge
        await polygonChain.setupBridge(stateReceiver, stateSender);
    }
});
