import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import * as timeMachine from "ganache-time-traveler";
import {ethers, artifacts, waffle, upgrades} from "hardhat";
const {deployMockContract} = waffle;
import {Redeem, PreToke, Toke, Staking, Manager} from "../typechain";
const IERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20");
const staking = artifacts.require("IStaking");
const IManager = artifacts.require("IManager");
import type {MockContract} from "ethereum-waffle";
import {Signer} from "crypto";
const IEventProxy = artifacts.require("IEventProxy");

const {id} = ethers.utils;

describe("Redeem", () => {
    let redeem: Redeem;
    let snapshotId: any;
    let deployer: SignerWithAddress;
    let user1: SignerWithAddress;
    let preToke: PreToke;
    let toke: Toke;
    let staking: Staking;
    let manager: MockContract;
    let treasury: SignerWithAddress;
    let notionalAddress: SignerWithAddress;

    const blockNumber = 1000000000;
    const stakingSchedule = 1;

    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    before(async () => {
        [deployer, user1, treasury, notionalAddress] = await ethers.getSigners();

        const preTokeFactory = await ethers.getContractFactory("PreToke");
        const tokeFactory = await ethers.getContractFactory("Toke");
        const stakingFactory = await ethers.getContractFactory("Staking");

        preToke = await preTokeFactory.connect(deployer).deploy();
        await preToke.connect(deployer).mint(deployer.address, 1000000000000000);
        toke = await tokeFactory.connect(deployer).deploy();
        staking = await stakingFactory.connect(deployer).deploy();
        manager = await deployMockContract(deployer, IManager.abi);

        staking = (await upgrades.deployProxy(stakingFactory, [
            toke.address,
            manager.address,
            treasury.address,
            notionalAddress.address,
        ])) as Staking;
        await staking.deployed();

        await staking.connect(deployer).addSchedule(
            {
                cliff: 1000,
                duration: 1000,
                interval: 1,
                setup: true,
                isActive: true,
                hardStart: 234234,
                isPublic: false,
            },
            notionalAddress.address
        );

        const redeemFactory = await ethers.getContractFactory("Redeem");
        redeem = await redeemFactory
            .connect(deployer)
            .deploy(preToke.address, toke.address, staking.address, blockNumber, stakingSchedule);

        await staking.connect(deployer).setPermissionedDepositor(redeem.address, true);
    });

    describe("Convert", async () => {
        it("Moves funds to the correct schedule", async () => {
            await preToke.connect(deployer).transfer(user1.address, 100);
            await preToke.connect(user1).approve(redeem.address, 100);
            await toke.connect(deployer).transfer(redeem.address, 100);
            await redeem.connect(user1).convert();

            const balance = await staking.balanceOf(user1.address);
            const stakes = await staking.getStakes(user1.address);

            expect(balance).to.be.equal(100);
            expect(stakes.length).to.be.equal(1);
            expect(stakes[0].scheduleIx).to.be.equal(1);
            expect(stakes[0].initial).to.be.equal(100);
        });
    });
});
