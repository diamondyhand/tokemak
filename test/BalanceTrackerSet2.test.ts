import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import {ethers, upgrades, artifacts} from "hardhat";
import {deployMockContract} from "ethereum-waffle";
import * as timeMachine from "ganache-time-traveler";

import {EventProxy, IStateReceiver, DelegateFunction, IWETH, ERC20, EthPool, BalanceTracker} from "../typechain";

import PolygonStateSenderAbi from "../abis/PolygonStateSender.json";
import WETHabi from "../abis/WETH.json";

import {PolygonChain} from "./utilities/polygonChain";

const POLYGON_FX_ROOT = "0xfe5e5D361b2ad62c541bAb87C45a0B9B018389a2";
const POLYGON_FX_CHILD = "0x8397259c983751DAf40400790063935a11afa28a";
const POLYGON_STATE_SENDER = "0x28e4F3a7f651294B9564800b2D01f35189A5bFbE";

const votingFunctionKey = ethers.utils.formatBytes32String("voting");
const user1InitialDeposit = 100;
const user2InitialDeposit = 200;
const user3InitialDeposit = 400;
const user3NewDeposit = 800;
const user2NewDeposit = 300;

describe("Test DelegateFunction and BalanceTracker integration", () => {
    let polygonChain!: PolygonChain;
    let snapshotId: string;

    let manager: SignerWithAddress;
    let weth: ERC20 & IWETH;
    let ethPool: EthPool;
    let ethPool2: EthPool;
    let ethPool3: EthPool;
    let delegateFunction: DelegateFunction;
    let eventProxy: EventProxy;
    let balanceTracker: BalanceTracker;

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
        ethPool2 = await deployL1EthPool(manager.address, addressRegistry.address, rebalancer.address);
        ethPool3 = await deployL1EthPool(manager.address, addressRegistry.address, rebalancer.address);
        supportedTokens = [ethPool.address, ethPool2.address];
        eventProxy = await deployL2EventProxy();
        delegateFunction = await deployL1DelegateFunction(deployer);
        balanceTracker = await deployL2BalancerTracker(eventProxy.address, supportedTokens);
        eventProxy = await setupL2EventProxyDestinations(
            eventProxy,
            polygonDeployer,
            ethPool.address,
            delegateFunction.address,
            [balanceTracker.address]
        );
        eventProxy = await setupL2EventProxyDestinations(
            eventProxy,
            polygonDeployer,
            ethPool2.address,
            delegateFunction.address,
            [balanceTracker.address]
        );
        eventProxy = await setupL2EventProxyDestinations(
            eventProxy,
            polygonDeployer,
            ethPool3.address,
            delegateFunction.address,
            [balanceTracker.address]
        );

        await ethPool.setDestinations(POLYGON_FX_ROOT, eventProxy.address);
        await ethPool.setEventSend(true);
        await ethPool2.setDestinations(POLYGON_FX_ROOT, eventProxy.address);
        await ethPool2.setEventSend(true);
        await ethPool3.setDestinations(POLYGON_FX_ROOT, eventProxy.address);
        await ethPool3.setEventSend(true);

        await delegateFunction.setDestinations(POLYGON_FX_ROOT, eventProxy.address);
        await delegateFunction.setEventSend(true);

        // OBTAIN WETH
        await weth.connect(user1).deposit({value: "5000000000000000000"});
        await weth.connect(user2).deposit({value: "5000000000000000000"});
        await weth.connect(user3).deposit({value: "5000000000000000000"});
        await weth.connect(user1).approve(ethPool.address, MaxUint256);
        await weth.connect(user2).approve(ethPool.address, MaxUint256);
        await weth.connect(user3).approve(ethPool.address, MaxUint256);
        await weth.connect(user1).approve(ethPool2.address, MaxUint256);
        await weth.connect(user2).approve(ethPool2.address, MaxUint256);
        await weth.connect(user3).approve(ethPool2.address, MaxUint256);
        await weth.connect(user1).approve(ethPool3.address, MaxUint256);
        await weth.connect(user2).approve(ethPool3.address, MaxUint256);
        await weth.connect(user3).approve(ethPool3.address, MaxUint256);
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
         * user2 who has 400 becomes delegatee of user1 and user3 and now has 700
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

    it("It should return Balance with amount = 0 when calling getBalance() on an account who's delegated", async () => {
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
         * user3 who has 200 and has delegated voting to user2 deposits 800 and now has 1200
         * user2 who has 400 and is a delegatee of user3 now has 1400
         */

        await ethPool.connect(user3).deposit(user3NewDeposit);

        await polygonChain.transferEvent(startingBlock);

        const u1Balances = await balanceTracker.getActualBalance(user1.address, supportedTokens);
        const u2Balances = await balanceTracker.getActualBalance(user2.address, supportedTokens);
        const u3Balances = await balanceTracker.getActualBalance(user3.address, supportedTokens);

        expect(u1Balances[0].amount).to.equal(user1InitialDeposit);
        expect(u2Balances[0].amount).to.equal(user2InitialDeposit + user3InitialDeposit + user3NewDeposit);
        expect(u3Balances[0].amount).to.equal(user3InitialDeposit + user3NewDeposit);
    });

    it("It should update balances accordingly upon re-delegation", async () => {
        /**
         * user1 who has 100
         * user2 who has 400+1200 and is a delegatee of user3
         * user3 who has 1200 and has delegated voting to user2, but re-delegates voting to user1
         */
        await delegateFunction.connect(user3).delegate([
            {
                functionId: votingFunctionKey,
                otherParty: user1.address,
                mustRelinquish: false,
            },
        ]);
        await delegateFunction
            .connect(user1)
            .acceptDelegation([{originalParty: user3.address, functionId: votingFunctionKey}]);

        await polygonChain.transferEvent(startingBlock);

        const u1Balances = await balanceTracker.getBalance(user1.address, supportedTokens);
        const u2Balances = await balanceTracker.getBalance(user2.address, supportedTokens);
        const u3Balances = await balanceTracker.getBalance(user3.address, supportedTokens);

        expect(u1Balances[0].amount).to.equal(user1InitialDeposit + user3InitialDeposit + user3NewDeposit);
        expect(u2Balances[0].amount).to.equal(user2InitialDeposit);
        expect(u3Balances[0].amount).to.equal(0);
    });

    it("It should not allow a user to delegate if they are already a delegatee", async () => {
        /**
         * user1 who has 100+1200 and is a delegatee of user3, and tries to delegate to user2 but gets reverted
         * user2 who has 400
         * user3 who has 1200 and has delegated voting to user1
         */
        await expect(
            delegateFunction.connect(user1).delegate([
                {
                    functionId: votingFunctionKey,
                    otherParty: user2.address,
                    mustRelinquish: false,
                },
            ])
        ).to.be.revertedWith("ALREADY_DELEGATEE");
    });

    it("It should not allow a user to accept a delegation if they are already a delegator", async () => {
        /**
         * user1 who has 100+1200 and is a delegatee of user3
         * user2 who has 400 and tries to delegate voting to user3
         * user3 who has 1200 and has delegated voting to user1 and tries to accept a voting delegation from user2
         */
        await delegateFunction.connect(user2).delegate([
            {
                functionId: votingFunctionKey,
                otherParty: user3.address,
                mustRelinquish: false,
            },
        ]);
        await expect(
            delegateFunction
                .connect(user3)
                .acceptDelegation([{originalParty: user2.address, functionId: votingFunctionKey}])
        ).to.be.revertedWith("ALREADY_DELEGATOR");
    });

    it("It should allow a delegator to become a delegatee after removal", async () => {
        /**
         * user1 who has 100+1200 and is a delegatee of user3
         * user2 who has 400 and tries to delegate voting to user3
         * user3 who has 1200 and has delegated voting to user1, and tries to remove this delegation and accept a voting delegation from user2
         */
        await delegateFunction.connect(user2).delegate([
            {
                functionId: votingFunctionKey,
                otherParty: user3.address,
                mustRelinquish: false,
            },
        ]);
        await delegateFunction.connect(user3).removeDelegation([votingFunctionKey]);
        await delegateFunction
            .connect(user3)
            .acceptDelegation([{originalParty: user2.address, functionId: votingFunctionKey}]);

        await polygonChain.transferEvent(startingBlock);

        const u1Balances = await balanceTracker.getBalance(user1.address, supportedTokens);
        const u2Balances = await balanceTracker.getBalance(user2.address, supportedTokens);
        const u3Balances = await balanceTracker.getBalance(user3.address, supportedTokens);

        expect(u1Balances[0].amount).to.equal(user1InitialDeposit);
        expect(u2Balances[0].amount).to.equal(0);
        expect(u3Balances[0].amount).to.equal(user3InitialDeposit + user3NewDeposit + user2InitialDeposit);
    });

    it("It should allow a delegatee to become a delegator after relinquishing", async () => {
        /**
         * user1 who has 100
         * user2 who has 400 and delegated voting to user3
         * user3 who has 1200+400 and is a delegatee of user2, and tries to relinquish this delegation and delegate voting to user1
         */
        await delegateFunction
            .connect(user3)
            .relinquishDelegation([{originalParty: user2.address, functionId: votingFunctionKey}]);
        await delegateFunction.connect(user3).delegate([
            {
                functionId: votingFunctionKey,
                otherParty: user1.address,
                mustRelinquish: false,
            },
        ]);
        await delegateFunction
            .connect(user1)
            .acceptDelegation([{originalParty: user3.address, functionId: votingFunctionKey}]);

        await polygonChain.transferEvent(startingBlock);

        const u1Balances = await balanceTracker.getBalance(user1.address, supportedTokens);
        const u2Balances = await balanceTracker.getBalance(user2.address, supportedTokens);
        const u3Balances = await balanceTracker.getBalance(user3.address, supportedTokens);

        expect(u1Balances[0].amount).to.equal(user1InitialDeposit + user3InitialDeposit + user3NewDeposit);
        expect(u2Balances[0].amount).to.equal(user2InitialDeposit);
        expect(u3Balances[0].amount).to.equal(0);
    });

    it("It should not allow a user to create a pending delegation, became a delegatee and have the pending delegation accepted", async () => {
        /**
         * user1 who has 100+1200 and is a delegatee of user3, and delegates to user2 and accepts a delegation of user3
         * user2 who has 400 and accepts a delegation of user1
         * user3 who has 1200 and has delegated voting to user1, removes their delegation and delegates again to user1
         */
        await delegateFunction.connect(user3).removeDelegation([votingFunctionKey]);
        await delegateFunction.connect(user3).delegate([
            {
                functionId: votingFunctionKey,
                otherParty: user1.address,
                mustRelinquish: false,
            },
        ]);
        await delegateFunction.connect(user1).delegate([
            {
                functionId: votingFunctionKey,
                otherParty: user2.address,
                mustRelinquish: false,
            },
        ]);
        await expect(
            delegateFunction
                .connect(user1)
                .acceptDelegation([{originalParty: user3.address, functionId: votingFunctionKey}])
        ).to.be.revertedWith("ALREADY_DELEGATOR");
        await delegateFunction
            .connect(user2)
            .acceptDelegation([{originalParty: user1.address, functionId: votingFunctionKey}]);
        await polygonChain.transferEvent(startingBlock);
    });

    it("It should update users balances correctly when a delegatee makes a deposit", async () => {
        /**
         * user1 has 100 and has delegated voting to user2
         * user2 who has 200+100 and is a delegatee of user1, and deposits 300
         * user3 who has 1200
         */

        await ethPool.connect(user2).deposit(user2NewDeposit);

        await polygonChain.transferEvent(startingBlock);

        const u1Balances = await balanceTracker.getActualBalance(user1.address, supportedTokens);
        const u2Balances = await balanceTracker.getActualBalance(user2.address, supportedTokens);
        const u3Balances = await balanceTracker.getActualBalance(user3.address, supportedTokens);

        expect(u1Balances[0].amount).to.equal(user1InitialDeposit);
        expect(u2Balances[0].amount).to.equal(user2InitialDeposit + user2NewDeposit + user1InitialDeposit);
        expect(u3Balances[0].amount).to.equal(user3InitialDeposit + user3NewDeposit);
    });

    it("It should not allow the proof of concept to work anymore", async () => {
        // Clean up from previous tests
        await delegateFunction.connect(user1).removeDelegation([votingFunctionKey]);
        await delegateFunction.connect(user3).removeDelegation([votingFunctionKey]);
        await ethPool.connect(user2).transfer(user1.address, 400);
        await ethPool.connect(user2).transfer(user3.address, 100);
        await polygonChain.transferEvent(startingBlock);
        await ethers.provider.send("evm_mine", []);
        startingBlock = (await ethers.provider.getBlock("latest")).number;

        /**
      => delegate, -> transfer, X> cancel delegation, (balance/actualBalance)

      A starts with 500
      B starts with 0
      C starts with 1300

      A => B     || A (0/500),   B (500/500), C (1300/1300)
      B -> B 0   || A (0/500),   B (0/0),     C (1300/1300)
      A -> C 500 || A (0/500),   B (0/0),     C (1800/1800)
      C -> B 500 || A (0/500),   B (500/500), C (1300/1300)
      A X> B     || A (500/500), B (0/0),     C (1300/1300)
      B -> B 0   || A (500/500), B (500/500), C (1300/1300)
     */

        // A => B
        await delegateFunction.connect(user1).delegate([
            {
                functionId: votingFunctionKey,
                otherParty: user2.address,
                mustRelinquish: false,
            },
        ]);
        await delegateFunction
            .connect(user2)
            .acceptDelegation([{originalParty: user1.address, functionId: votingFunctionKey}]);

        await polygonChain.transferEvent(startingBlock);
        await ethers.provider.send("evm_mine", []);
        startingBlock = (await ethers.provider.getBlock("latest")).number;

        // B -> B 0
        await ethPool.connect(user2).transfer(user2.address, 0);

        await polygonChain.transferEvent(startingBlock);
        await ethers.provider.send("evm_mine", []);
        startingBlock = (await ethers.provider.getBlock("latest")).number;

        // A -> C 500
        await ethPool.connect(user1).transfer(user3.address, user1InitialDeposit);

        // After the fix, this will no longer revert
        await expect(polygonChain.transferEvent(startingBlock)).to.not.be.reverted;
        await ethers.provider.send("evm_mine", []);
        startingBlock = (await ethers.provider.getBlock("latest")).number;

        // C -> B 500
        await ethPool.connect(user3).transfer(user2.address, user1InitialDeposit);

        await polygonChain.transferEvent(startingBlock);
        await ethers.provider.send("evm_mine", []);
        startingBlock = (await ethers.provider.getBlock("latest")).number;

        // A X> B
        await delegateFunction.connect(user1).removeDelegation([votingFunctionKey]);

        await polygonChain.transferEvent(startingBlock);
        await ethers.provider.send("evm_mine", []);
        startingBlock = (await ethers.provider.getBlock("latest")).number;

        // B -> B 0
        await ethPool.connect(user2).transfer(user2.address, 0);

        await polygonChain.transferEvent(startingBlock);
        await ethers.provider.send("evm_mine", []);
        startingBlock = (await ethers.provider.getBlock("latest")).number;

        const u1Balances = await balanceTracker.getBalance(user1.address, supportedTokens);
        const u2Balances = await balanceTracker.getBalance(user2.address, supportedTokens);
        const u3Balances = await balanceTracker.getBalance(user3.address, supportedTokens);

        // After the fix, there are no longer more votes than the initial balances
        expect(u1Balances[0].amount.add(u2Balances[0].amount).add(u3Balances[0].amount)).to.be.equal(
            user1InitialDeposit + user2InitialDeposit + user3InitialDeposit + user2NewDeposit + user3NewDeposit
        );
    });

    it("It should correctly update balance when depositing a second token", async () => {
        /**
         * user1 who has 400 tokens of pool 1, deposits 100 tokens of pool 2
         * user2 who has 100 tokens of pool 1, deposits 200 tokens of pool 2
         * user3 who has 1300 tokens of pool 1, deposits 400 tokens of pool 2
         */
        await ethPool2.connect(user1).deposit(user1InitialDeposit);
        await ethPool2.connect(user2).deposit(user2InitialDeposit);
        await ethPool2.connect(user3).deposit(user3InitialDeposit);

        await polygonChain.transferEvent(startingBlock);

        const u1Balances = await balanceTracker.getBalance(user1.address, supportedTokens);
        const u2Balances = await balanceTracker.getBalance(user2.address, supportedTokens);
        const u3Balances = await balanceTracker.getBalance(user3.address, supportedTokens);

        expect(u1Balances[0].amount).to.equal(400); // TODO: Fix amounts to variables after the beforeEach cleanup is fixed
        expect(u2Balances[0].amount).to.equal(100);
        expect(u3Balances[0].amount).to.equal(1300);

        expect(u1Balances[1].amount).to.equal(user1InitialDeposit);
        expect(u2Balances[1].amount).to.equal(user2InitialDeposit);
        expect(u3Balances[1].amount).to.equal(user3InitialDeposit);
    });

    it("It should correctly update balance when delegating multiple tokens", async () => {
        /**
         * user1 who has 400 tokens of pool 1 and 100 tokens of pool 2, delegates voting to user2
         * user2 who has 100 tokens of pool 1 and 200 tokens of pool 2
         * user3 who has 1300 tokens of pool 1 and 400 tokens of pool 2
         */
        await delegateFunction.connect(user1).delegate([
            {
                functionId: votingFunctionKey,
                otherParty: user2.address,
                mustRelinquish: false,
            },
        ]);
        await delegateFunction
            .connect(user2)
            .acceptDelegation([{originalParty: user1.address, functionId: votingFunctionKey}]);

        await polygonChain.transferEvent(startingBlock);

        const u1Balances = await balanceTracker.getBalance(user1.address, supportedTokens);
        const u2Balances = await balanceTracker.getBalance(user2.address, supportedTokens);
        const u3Balances = await balanceTracker.getBalance(user3.address, supportedTokens);

        expect(u1Balances[0].amount).to.equal(0); // TODO: Fix amounts to variables after the beforeEach cleanup is fixed
        expect(u2Balances[0].amount).to.equal(500);
        expect(u3Balances[0].amount).to.equal(1300);

        expect(u1Balances[1].amount).to.equal(0);
        expect(u2Balances[1].amount).to.equal(user2InitialDeposit + user1InitialDeposit);
        expect(u3Balances[1].amount).to.equal(user3InitialDeposit);
    });

    it("It should correctly update balance when depositing after delegating multiple tokens", async () => {
        /**
         * user1 who has 400 tokens of pool 1 and 100 tokens of pool 2, and has delegated voting to user2, deposits 100 tokens of pool 1 and 300 tokens of pool 2
         * user2 who has 100 tokens of pool 1 and 200 tokens of pool 2
         * user3 who has 1300 tokens of pool 1 and 400 tokens of pool 2
         */
        await ethPool.connect(user1).deposit(100);
        await ethPool2.connect(user1).deposit(300);

        await polygonChain.transferEvent(startingBlock);

        const u1Balances = await balanceTracker.getBalance(user1.address, supportedTokens);
        const u2Balances = await balanceTracker.getBalance(user2.address, supportedTokens);
        const u3Balances = await balanceTracker.getBalance(user3.address, supportedTokens);

        expect(u1Balances[0].amount).to.equal(0); // TODO: Fix amounts to variables after the beforeEach cleanup is fixed
        expect(u2Balances[0].amount).to.equal(600);
        expect(u3Balances[0].amount).to.equal(1300);

        expect(u1Balances[1].amount).to.equal(0);
        expect(u2Balances[1].amount).to.equal(user2InitialDeposit + user1InitialDeposit + 300);
        expect(u3Balances[1].amount).to.equal(user3InitialDeposit);
    });

    it("It should correctly update balance when adding a new token", async () => {
        /**
         * user1 who has 500 tokens of pool 1 and 400 tokens of pool 2, and has delegated voting to user2
         * user2 who has 100 tokens of pool 1 and 200 tokens of pool 2
         * user3 who has 1300 tokens of pool 1 and 400 tokens of pool 2
         * A new supported token is added
         */
        await balanceTracker.addSupportedTokens([ethPool3.address]);
        supportedTokens.push(ethPool3.address);

        await ethPool3.connect(user1).deposit(600);
        await ethPool3.connect(user2).deposit(400);
        await ethPool3.connect(user3).deposit(200);

        await polygonChain.transferEvent(startingBlock);

        const u1Balances = await balanceTracker.getBalance(user1.address, supportedTokens);
        const u2Balances = await balanceTracker.getBalance(user2.address, supportedTokens);
        const u3Balances = await balanceTracker.getBalance(user3.address, supportedTokens);

        expect(u1Balances[0].amount).to.equal(0); // TODO: Fix amounts to variables after the beforeEach cleanup is fixed
        expect(u2Balances[0].amount).to.equal(600);
        expect(u3Balances[0].amount).to.equal(1300);

        expect(u1Balances[1].amount).to.equal(0);
        expect(u2Balances[1].amount).to.equal(user2InitialDeposit + user1InitialDeposit + 300);
        expect(u3Balances[1].amount).to.equal(user3InitialDeposit);

        expect(u1Balances[2].amount).to.equal(0);
        expect(u2Balances[2].amount).to.equal(1000);
        expect(u3Balances[2].amount).to.equal(200);
    });

    it("It should correctly update balance when removing delegation of multiple tokens", async () => {
        /**
         * user1 who has 500 tokens of pool 1 and 400 tokens of pool 2, and removes their delegation to user2
         * user2 who has 100 tokens of pool 1 and 200 tokens of pool 2
         * user3 who has 1300 tokens of pool 1 and 400 tokens of pool 2
         */
        await delegateFunction.connect(user1).removeDelegation([votingFunctionKey]);

        await polygonChain.transferEvent(startingBlock);

        const u1Balances = await balanceTracker.getBalance(user1.address, supportedTokens);
        const u2Balances = await balanceTracker.getBalance(user2.address, supportedTokens);
        const u3Balances = await balanceTracker.getBalance(user3.address, supportedTokens);

        expect(u1Balances[0].amount).to.equal(500); // TODO: Fix amounts to variables after the beforeEach cleanup is fixed
        expect(u2Balances[0].amount).to.equal(100);
        expect(u3Balances[0].amount).to.equal(1300);

        expect(u1Balances[1].amount).to.equal(user1InitialDeposit + 300);
        expect(u2Balances[1].amount).to.equal(user2InitialDeposit);
        expect(u3Balances[1].amount).to.equal(user3InitialDeposit);

        expect(u1Balances[2].amount).to.equal(600);
        expect(u2Balances[2].amount).to.equal(400);
        expect(u3Balances[2].amount).to.equal(200);
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
                sender: l1PoolSender,
                eventType: ethers.utils.formatBytes32String("Transfer"),
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
});
