import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import {ethers, upgrades, artifacts} from "hardhat";
import * as timeMachine from "ganache-time-traveler";
import {deployMockContract} from "ethereum-waffle";
import {getTokenMultiplier} from "./utilities/vote";
import {
    EventProxy,
    IStateReceiver,
    DelegateFunction,
    IWETH,
    ERC20,
    EthPool,
    BalanceTracker,
    VoteTracker,
} from "../typechain";

import PolygonStateSenderAbi from "../abis/PolygonStateSender.json";
import WETHabi from "../abis/WETH.json";

import {PolygonChain} from "./utilities/polygonChain";
import {Signer} from "crypto";

const POLYGON_FX_ROOT = "0xfe5e5D361b2ad62c541bAb87C45a0B9B018389a2";
const POLYGON_FX_CHILD = "0x8397259c983751DAf40400790063935a11afa28a";
const POLYGON_STATE_SENDER = "0x28e4F3a7f651294B9564800b2D01f35189A5bFbE";

const votingFunctionKey = ethers.utils.formatBytes32String("voting");
const user1InitialDeposit = 100;
const user2InitialDeposit = 200;
const user3InitialDeposit = 400;

describe("Test DelegateFunction VoteTracker and BalanceTracker integration", () => {
    let polygonChain!: PolygonChain;
    let snapshotId: string;

    let manager: SignerWithAddress;
    let weth: ERC20 & IWETH;
    let ethPool: EthPool;
    let delegateFunction: DelegateFunction;
    let eventProxy: EventProxy;
    let balanceTracker: BalanceTracker;
    let voteTracker: VoteTracker;

    let startingBlock: number;

    let deployer: SignerWithAddress;
    let polygonDeployer: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;
    let rebalancer: SignerWithAddress;

    let supportedTokens: string[];

    const {MaxUint256} = ethers.constants;

    before(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];

        // start polygon chain
        polygonChain = new PolygonChain(
            47853,
            "https://polygon-mainnet.g.alchemy.com/v2/" + process.env.ALCHEMY_API_KEY_POLYGON,
            137
        );
        await polygonChain.start();

        [deployer, user1, user2, user3, manager, rebalancer] = await ethers.getSigners();
        [polygonDeployer] = await polygonChain.ethers.getSigners();

        const addressRegistryArtifact = artifacts.require("AddressRegistry");
        const addressRegistry = await deployMockContract(deployer, addressRegistryArtifact.abi);

        await setupBridge();

        weth = await deployL1WEthPool();
        await addressRegistry.mock.weth.returns(weth.address);

        ethPool = await deployL1EthPool(manager.address, addressRegistry.address, rebalancer.address);
        supportedTokens = [ethPool.address];
        eventProxy = await deployL2EventProxy();
        delegateFunction = await deployL1DelegateFunction(deployer);
        balanceTracker = await deployL2BalancerTracker(eventProxy.address, supportedTokens);
        voteTracker = await deployL2VoteTracker();
        eventProxy = await setupL2EventProxyDestinations(
            eventProxy,
            polygonDeployer,
            ethPool.address,
            delegateFunction.address,
            [balanceTracker.address, voteTracker.address]
        );

        await ethPool.setDestinations(POLYGON_FX_ROOT, eventProxy.address);
        await ethPool.setEventSend(true);

        await delegateFunction.setDestinations(POLYGON_FX_ROOT, eventProxy.address);
        await delegateFunction.setEventSend(true);

        // OBTAIN WETH
        await weth.connect(user1).deposit({value: "5000000000000000000"});
        await weth.connect(user2).deposit({value: "5000000000000000000"});
        await weth.connect(user3).deposit({value: "5000000000000000000"});
        await weth.connect(user1).approve(ethPool.address, MaxUint256);
        await weth.connect(user2).approve(ethPool.address, MaxUint256);
        await weth.connect(user3).approve(ethPool.address, MaxUint256);
    });

    after(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
        await polygonChain.stop();
    });

    beforeEach(async () => {
        //Get a new block so we can be sure the next command in the only event in there
        await ethers.provider.send("evm_mine", []);
        startingBlock = (await ethers.provider.getBlock("latest")).number;
    });

    afterEach(async () => {
        // await timeMachine.revertToSnapshot(snapshotId);
    });

    describe("Test Balance Tracker", () => {
        it("It should capture users balances after deposit", async () => {
            /**
             * user1 deposit 100
             * user2 deposit 200
             * user3 deposit 400
             */

            await ethPool.connect(user1).deposit(user1InitialDeposit);
            await ethPool.connect(user2).deposit(user2InitialDeposit);
            await ethPool.connect(user3).deposit(user3InitialDeposit);

            await polygonChain.transferEvent(startingBlock);

            const u1Balances = await balanceTracker.getActualBalance(user1.address, supportedTokens);
            const u2Balances = await balanceTracker.getActualBalance(user2.address, supportedTokens);
            const u3Balances = await balanceTracker.getActualBalance(user3.address, supportedTokens);
            expect(u1Balances[0].amount).to.equal(user1InitialDeposit);
            expect(u2Balances[0].amount).to.equal(user2InitialDeposit);
            expect(u3Balances[0].amount).to.equal(user3InitialDeposit);
        });

        it("It should capture users balances after delegation", async () => {
            /**
             * user1 who has 100 delegates voting to user2
             * user3 who has 200 delegates voting to user2
             * user2 who has 400 becomes delegatee of user1 and user3 and not has 700
             */

            await delegateFunction.connect(user1).delegate([
                {
                    functionId: votingFunctionKey,
                    otherParty: user2.address,
                    mustRelinquish: false,
                },
            ]);
            await delegateFunction.connect(user3).delegate([
                {
                    functionId: votingFunctionKey,
                    otherParty: user2.address,
                    mustRelinquish: false,
                },
            ]);
            await delegateFunction.connect(user2).acceptDelegation([
                {originalParty: user1.address, functionId: votingFunctionKey},
                {originalParty: user3.address, functionId: votingFunctionKey},
            ]);

            await polygonChain.transferEvent(startingBlock);

            const u1Balances = await balanceTracker.getActualBalance(user1.address, supportedTokens);
            const u2Balances = await balanceTracker.getActualBalance(user2.address, supportedTokens);
            const u3Balances = await balanceTracker.getActualBalance(user3.address, supportedTokens);

            expect(u1Balances[0].amount).to.equal(user1InitialDeposit);
            expect(u2Balances[0].amount).to.equal(user2InitialDeposit + user1InitialDeposit + user3InitialDeposit);
            expect(u3Balances[0].amount).to.equal(user3InitialDeposit);
        });

        it("It should return Balance with amout = 0 when calling getBalance() on an account who's delegated", async () => {
            /**
             * user3 who has 200 has delegated voting to user2
             */

            const u3Balances = await balanceTracker.getBalance(user3.address, supportedTokens);
            expect(u3Balances[0].amount).to.equal(0);
        });

        it("It should capture users balances after delegation has been disabled", async () => {
            /**
             * user1 who has 100 removes voting delegation to user2
             * user3 who has 200 has delegated voting to user2
             * user2 who has 400 is now only delegatee of user3 and has 600
             */

            await delegateFunction.connect(user1).removeDelegation([votingFunctionKey]);

            await polygonChain.transferEvent(startingBlock);

            const u1Balances = await balanceTracker.getActualBalance(user1.address, supportedTokens);
            const u2Balances = await balanceTracker.getActualBalance(user2.address, supportedTokens);
            const u3Balances = await balanceTracker.getActualBalance(user3.address, supportedTokens);

            expect(u1Balances[0].amount).to.equal(user1InitialDeposit);
            expect(u2Balances[0].amount).to.equal(user2InitialDeposit + user3InitialDeposit);
            expect(u3Balances[0].amount).to.equal(user3InitialDeposit);
        });

        it("It should update users balances and delegatee balances when delegator make a deposit", async () => {
            /**
             * user1 has 100 (and has removed voting delegation to user2)
             * user3 who has 200 and has delegated voting to user2 deposits 800 and now has 1000
             * user2 who has 400 and is a delegatee of user3 now has 1400
             */

            const user3NewDeposit = 800;

            await ethPool.connect(user3).deposit(user3NewDeposit);

            await polygonChain.transferEvent(startingBlock);

            const u1Balances = await balanceTracker.getActualBalance(user1.address, supportedTokens);
            const u2Balances = await balanceTracker.getActualBalance(user2.address, supportedTokens);
            const u3Balances = await balanceTracker.getActualBalance(user3.address, supportedTokens);

            expect(u1Balances[0].amount).to.equal(user1InitialDeposit);
            expect(u2Balances[0].amount).to.equal(user2InitialDeposit + user3InitialDeposit + user3NewDeposit);
            expect(u3Balances[0].amount).to.equal(user3InitialDeposit + user3NewDeposit);
        });
    });

    describe("VoteTracker Delegation Tests", () => {
        it("Correctly delegates votes on delegation event received in VoteTracker", async () => {
            /**
             * user1 100
             * user2 200
             * user3 1200
             */

            await delegateFunction.connect(user3).removeDelegation([votingFunctionKey]); // Remove existing delegation for tests
            await delegateFunction.connect(user1).delegate([
                {
                    functionId: votingFunctionKey,
                    otherParty: user2.address,
                    mustRelinquish: false,
                },
            ]);
            await delegateFunction.connect(user2).acceptDelegation([
                {
                    originalParty: user1.address,
                    functionId: votingFunctionKey,
                },
            ]);

            await polygonChain.transferEvent(startingBlock);

            const user1Available = (await voteTracker.getUserVotes(user1.address)).details.totalAvailableVotes;
            const user2Available = (await voteTracker.getUserVotes(user2.address)).details.totalAvailableVotes;
            expect(user1Available).to.equal(0);
            expect(user2Available).to.equal(300);
        });
    });

    async function deployL1WEthPool(): Promise<ERC20 & IWETH> {
        const wethContract = (await ethers.getContractAt(
            WETHabi,
            "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
        )) as ERC20 & IWETH;

        return wethContract;
    }

    async function deployL1EthPool(manager: string, addressRegistry: string, rebalancer: string): Promise<EthPool> {
        const poolFactory = await ethers.getContractFactory("EthPool");

        const pool = (await upgrades.deployProxy(
            poolFactory,
            [manager, addressRegistry, "TOKE ASSET", "fAsset", rebalancer],
            {unsafeAllow: ["constructor"]}
        )) as EthPool;
        return pool;
    }

    async function deployL1DelegateFunction(deployer: SignerWithAddress): Promise<DelegateFunction> {
        const delegateFunctionFactory = await ethers.getContractFactory("DelegateFunction", deployer);

        const rewardsFunctionKey = ethers.utils.formatBytes32String("rewards");
        const votingFunctionKey = ethers.utils.formatBytes32String("voting");

        const delegateFunction = (await upgrades.deployProxy(delegateFunctionFactory, [], {
            unsafeAllow: ["state-variable-assignment", "state-variable-immutable"],
        })) as DelegateFunction;

        const tx = await delegateFunction
            .connect(deployer)
            .setAllowedFunctions([{id: rewardsFunctionKey}, {id: votingFunctionKey}]);
        await tx.wait();

        return delegateFunction;
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
        l1PoolSender: string,
        l1DelegationFunctionSender: string,
        l2Destinations: string[]
    ): Promise<EventProxy> {
        await eventProxy.connect(polygonDeployer).setSenderRegistration(l1PoolSender, true);

        await eventProxy.connect(polygonDeployer).setSenderRegistration(l1DelegationFunctionSender, true);

        await eventProxy.registerDestinations([
            {
                sender: l1PoolSender,
                eventType: ethers.utils.formatBytes32String("Withdraw"),
                destinations: l2Destinations,
            },
            {
                sender: l1PoolSender,
                eventType: ethers.utils.formatBytes32String("Deposit"),
                destinations: l2Destinations,
            },
            {
                sender: l1DelegationFunctionSender,
                eventType: ethers.utils.formatBytes32String("DelegationEnabled"),
                destinations: l2Destinations,
            },
            {
                sender: l1DelegationFunctionSender,
                eventType: ethers.utils.formatBytes32String("DelegationDisabled"),
                destinations: l2Destinations,
            },
        ]);

        return eventProxy;
    }

    async function deployL2BalancerTracker(eventProxy: string, supportedTokens: string[]): Promise<BalanceTracker> {
        const balanceTrackerFactory = await polygonChain.ethers.getContractFactory("BalanceTracker");
        const balanceTracker = (await polygonChain.hre.upgrades.deployProxy(balanceTrackerFactory, [
            eventProxy,
        ])) as BalanceTracker;

        await balanceTracker.addSupportedTokens(supportedTokens);

        return balanceTracker;
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

    async function deployL2VoteTracker(): Promise<VoteTracker> {
        const voteTrackerFactory = await polygonChain.ethers.getContractFactory("VoteTracker");
        const tracker = (await polygonChain.hre.upgrades.deployProxy(
            voteTrackerFactory,
            [
                eventProxy.address,
                ethers.utils.formatBytes32String("1"),
                balanceTracker.address,
                1,
                [getTokenMultiplier(ethPool.address, 1)],
            ],
            {unsafeAllow: ["state-variable-immutable", "state-variable-assignment"]}
        )) as VoteTracker;

        await tracker.connect(polygonDeployer).setReactorKeys(
            [
                {
                    token: ethPool.address,
                    key: ethers.utils.formatBytes32String("token1"),
                },
            ],
            true
        );

        return tracker;
    }
});
