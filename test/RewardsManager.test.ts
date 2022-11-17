import {expect} from "chai";
import * as timeMachine from "ganache-time-traveler";
import {ethers, upgrades} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {RewardsManager, RewardsManager__factory} from "../typechain";

const {AddressZero} = ethers.constants;

describe("Test RewardsManager", () => {
    let rewardsManagerFactory: RewardsManager__factory;
    let rewardsManager: RewardsManager;

    let snapshotId: string;

    let deployer: SignerWithAddress;
    let user1: SignerWithAddress;
    let pool1: SignerWithAddress;
    let pool2: SignerWithAddress;
    let pool3: SignerWithAddress;
    let pool4: SignerWithAddress;

    before(async () => {
        [deployer, user1, pool1, pool2, pool3, pool4] = await ethers.getSigners();
        rewardsManagerFactory = await ethers.getContractFactory("RewardsManager");
        rewardsManager = (await upgrades.deployProxy(rewardsManagerFactory, [])) as RewardsManager;
    });

    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"] as string;
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    describe("register pools", () => {
        it("should revert if not owner", async () => {
            await expect(rewardsManager.connect(user1).registerExcludePools([pool1.address])).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });

        it("should revert if pool address is 0", async () => {
            await expect(rewardsManager.connect(deployer).registerExcludePools([AddressZero])).to.be.revertedWith(
                "ZERO_ADDRESS"
            );
        });

        it("should revert if pool already exists", async () => {
            await expect(
                rewardsManager.connect(deployer).registerExcludePools([pool1.address, pool1.address])
            ).to.be.revertedWith("ADD_FAIL");
        });

        it("should register the given pools", async () => {
            const registerPools = [pool1.address, pool2.address];
            await rewardsManager.connect(deployer).registerExcludePools(registerPools);
            const pools = await rewardsManager.connect(deployer).getExcludePools();

            expect(registerPools.length).to.be.equal(pools.length);
            expect(registerPools).to.have.members(pools);
        });
    });

    describe("unregister pools", () => {
        it("should revert if not owner", async () => {
            await expect(rewardsManager.connect(user1).unregisterExcludePools([pool1.address])).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });

        it("should revert if pool is not registered", async () => {
            await expect(rewardsManager.connect(deployer).unregisterExcludePools([pool1.address])).to.be.revertedWith(
                "REMOVE_FAIL"
            );
        });

        it("should unregister the given pools", async () => {
            const registerPools = [pool1.address, pool2.address, pool3.address, pool4.address];
            const unregisterPools = [pool1.address, pool3.address];
            const registeredPools = registerPools.filter((item) => !unregisterPools.includes(item));

            await rewardsManager.connect(deployer).registerExcludePools(registerPools);
            await rewardsManager.connect(deployer).unregisterExcludePools(unregisterPools);

            const pools = await rewardsManager.connect(deployer).getExcludePools();

            expect(registeredPools.length).to.be.equal(pools.length);
            expect(registeredPools).to.have.members(pools);
        });
    });
});
