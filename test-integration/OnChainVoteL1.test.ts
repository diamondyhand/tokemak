import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import * as timeMachine from "ganache-time-traveler";
import {ethers, upgrades, artifacts} from "hardhat";
import {BigNumberish} from "@ethersproject/bignumber";
import {EventProxy, IStateReceiver, OnChainVoteL1, VoteTracker} from "../typechain";
import type {BaseContract} from "ethers";

import PolygonStateSenderAbi from "../abis/PolygonStateSender.json";
import {deployMockContract} from "@ethereum-waffle/mock-contract";
import {MockContract} from "ethereum-waffle";
import {getTokenMultiplier, VoteAmount, VoteTokenMultiplier} from "./utilities/vote";
import {PolygonChain} from "./utilities/polygonChain";

const POLYGON_FX_ROOT = "0xfe5e5D361b2ad62c541bAb87C45a0B9B018389a2";
const POLYGON_FX_CHILD = "0x8397259c983751DAf40400790063935a11afa28a";
const POLYGON_STATE_SENDER = "0x28e4F3a7f651294B9564800b2D01f35189A5bFbE";

const ERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/ERC20.sol");

describe("Test OnChainVoteL1", () => {
    let polygonChain!: PolygonChain;

    let onChainVoteL1: OnChainVoteL1;
    let stateSender: BaseContract;
    let stateReceiver: IStateReceiver;
    let eventProxy: EventProxy;
    let voteTracker: VoteTracker;

    let balanceTracker: MockContract;
    let asset1: MockContract;
    let asset2: MockContract;

    let snapshotId: string;

    let deployer: SignerWithAddress;
    let polygonDeployer: SignerWithAddress;
    let user1: SignerWithAddress;
    let voteToken1: SignerWithAddress;
    let voteToken2: SignerWithAddress;

    const multiplier1 = 1;
    const multiplier2 = 0.5;
    let voteMultiplier1: VoteTokenMultiplier;
    let voteMultiplier2: VoteTokenMultiplier;

    const initialVoteSession: string = ethers.utils.formatBytes32String("1");
    const reactor1Key: string = ethers.utils.formatBytes32String("token1");
    const reactor2Key: string = ethers.utils.formatBytes32String("token2");

    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    before(async () => {
        // start polygon chain
        polygonChain = new PolygonChain(
            47853,
            "https://polygon-mainnet.g.alchemy.com/v2/" + process.env.ALCHEMY_API_KEY_POLYGON,
            137
        );
        await polygonChain.start();

        [deployer, user1] = await ethers.getSigners();

        // Get L1 state sender
        stateSender = await ethers.getContractAt(PolygonStateSenderAbi, POLYGON_STATE_SENDER);

        // Setup L1 Vote contract
        const onChainVoteL1Factory = await ethers.getContractFactory("OnChainVoteL1");
        onChainVoteL1 = (await upgrades.deployProxy(onChainVoteL1Factory)) as OnChainVoteL1;

        // Get L2 state receiver
        const stateReceiverArtifact = polygonChain.hre.artifacts.require("IStateReceiver");
        stateReceiver = (await polygonChain.ethers.getContractAt(
            stateReceiverArtifact.abi,
            POLYGON_FX_CHILD
        )) as unknown as IStateReceiver;

        // Set up polygon bridge
        await polygonChain.setupBridge(stateReceiver, stateSender);

        [polygonDeployer, voteToken1, voteToken2] = await polygonChain.ethers.getSigners();

        // Set up Event Proxy on L2
        const eventProxyFactory = await polygonChain.ethers.getContractFactory("EventProxy");
        eventProxy = (await polygonChain.hre.upgrades.deployProxy(eventProxyFactory, [POLYGON_FX_CHILD])) as EventProxy;

        // Deploy mock of BalanceTracker
        const IBalanceTracker = polygonChain.hre.artifacts.require("IBalanceTracker");
        balanceTracker = await deployMockContract(polygonDeployer, IBalanceTracker.abi);

        // Set up VoteTracker contract on L2
        voteMultiplier1 = getTokenMultiplier(voteToken1.address, multiplier1);
        voteMultiplier2 = getTokenMultiplier(voteToken2.address, multiplier2);
        asset1 = await deployMockContract(polygonDeployer, ERC20.abi);
        asset2 = await deployMockContract(polygonDeployer, ERC20.abi);

        const voteTrackerFactory = await polygonChain.ethers.getContractFactory("VoteTracker");
        voteTracker = (await polygonChain.hre.upgrades.deployProxy(
            voteTrackerFactory,
            [eventProxy.address, initialVoteSession, balanceTracker.address, 1, [voteMultiplier1, voteMultiplier2]],
            {
                unsafeAllow: ["state-variable-assignment", "state-variable-immutable"],
            }
        )) as VoteTracker;

        // Plug L2 contracts together
        await voteTracker.connect(polygonDeployer).setReactorKeys(
            [
                {token: asset1.address, key: reactor1Key},
                {token: asset2.address, key: reactor2Key},
            ],
            true
        );

        await eventProxy.connect(polygonDeployer).setSenderRegistration(onChainVoteL1.address, true);

        await eventProxy.registerDestinations([
            {
                sender: onChainVoteL1.address,
                eventType: ethers.utils.formatBytes32String("Vote"),
                destinations: [voteTracker.address],
            },
        ]);
    });

    after(async () => {
        await polygonChain.stop();
    });

    it("Vote emits from L1 contract is saved in L2 contract", async () => {
        await mockBalanceTrackerWithGivenAmounts(VoteAmount(200), 0);

        const account = user1.address;
        const goodVote = getGoodVote(account);

        onChainVoteL1.connect(deployer);
        await onChainVoteL1.setDestinations(POLYGON_FX_ROOT, eventProxy.address);

        await onChainVoteL1.setEventSend(true);

        //Get a new block so we can be sure the next command in the only event in there
        await ethers.provider.send("evm_mine", []);

        //Will emit event, will be only event in block
        await onChainVoteL1.connect(user1).vote(goodVote);

        //End the block
        await ethers.provider.send("evm_mine", []);

        //Get the latest block
        const latestBlock = await ethers.provider.getBlock("latest");

        await polygonChain.transferEvent(latestBlock.number - 1);

        const userVoteDetails = await voteTracker.getUserVotes(account);

        expect(userVoteDetails.details.totalUsedVotes).to.be.equal(VoteAmount(60));
    });

    const mockBalanceTrackerWithGivenAmounts = async (vote1Amount: BigNumberish, vote2Amount: BigNumberish) => {
        await balanceTracker.mock.getBalance.returns([
            {token: voteToken1.address, amount: vote1Amount},
            {token: voteToken2.address, amount: vote2Amount},
        ]);
    };

    function getGoodVote(account: string) {
        return {
            account,
            voteSessionKey: ethers.utils.formatBytes32String("1"),
            nonce: 0,
            chainId: 137,
            totalVotes: ethers.utils.parseUnits("60", 18).toString(),
            allocations: [
                {
                    reactorKey: reactor1Key,
                    amount: VoteAmount(60),
                },
            ],
        };
    }
});
