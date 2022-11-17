import {expect} from "chai";
import * as timeMachine from "ganache-time-traveler";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {ethers} from "hardhat";
import {RewardHash} from "../typechain";

let deployer: SignerWithAddress;
let user1: SignerWithAddress;
let snapshotId: any;
let rewardHashContract: RewardHash;

describe("RewardHash Unit Test", async () => {
    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    before(async () => {
        [deployer, user1] = await ethers.getSigners();
        const rewardHashFactory = await ethers.getContractFactory("RewardHash");
        rewardHashContract = await rewardHashFactory.deploy();
        await rewardHashContract.deployed();
    });

    describe("Test Defaults", async () => {
        it("Test Owner is set", async () => {
            const ownerAddress = await rewardHashContract.owner();
            expect(ownerAddress).to.equal(deployer.address);
        });
        it("Test no hashes to get", async () => {
            const result = await rewardHashContract.cycleHashes(1);
            expect(result.latestClaimable).to.be.empty;
            expect(result.cycle).to.be.empty;
        });
    });

    describe("Test Adding Hash", async () => {
        it("Test adding hash by not owner", async () => {
            await expect(rewardHashContract.connect(user1).setCycleHashes(1, "claimableHash", "cycleHash")).to.be
                .reverted;
        });

        it("Test adding empty claimable hash", async () => {
            await expect(rewardHashContract.connect(deployer).setCycleHashes(1, "", "cycleHash-1")).to.be.revertedWith(
                "Invalid latestClaimableIpfsHash"
            );
        });

        it("Test adding empty cycle hash", async () => {
            await expect(
                rewardHashContract.connect(deployer).setCycleHashes(1, "claimableHash-1", "")
            ).to.be.revertedWith("Invalid cycleIpfsHash");
        });

        it("Test adding contiguous newest hash", async () => {
            const trx = await rewardHashContract.connect(deployer).setCycleHashes(1, "claimableHash-1", "cycleHash-1");
            const receipt = await trx.wait();
            const result = await rewardHashContract.cycleHashes(1);
            const latestIndex = await rewardHashContract.latestCycleIndex();
            expect(result.latestClaimable).to.equal("claimableHash-1");
            expect(result.cycle).to.equal("cycleHash-1");
            expect(latestIndex).to.equal(1);

            expect(receipt.events?.[0].event).to.equal("CycleHashAdded");
            expect(receipt.events?.[0].args?.[0]).to.equal(1);
            expect(receipt.events?.[0].args?.[1]).to.equal("claimableHash-1");
            expect(receipt.events?.[0].args?.[2]).to.equal("cycleHash-1");
        });

        it("Test adding non-contiguous newest hash", async () => {
            await rewardHashContract.connect(deployer).setCycleHashes(1, "claimableHash-1", "cycleHash-1");
            await rewardHashContract.connect(deployer).setCycleHashes(4, "claimableHash-4", "cycleHash-4");
            const result = await rewardHashContract.cycleHashes(3);
            const latestIndex = await rewardHashContract.latestCycleIndex();
            expect(result.latestClaimable).to.equal("");
            expect(result.cycle).to.be.empty;
            expect(latestIndex).to.equal(4);
        });

        it("Test adding existing hash", async () => {
            await rewardHashContract.connect(deployer).setCycleHashes(1, "claimableHash-1", "cycleHash-1");
            await rewardHashContract
                .connect(deployer)
                .setCycleHashes(1, "claimableHash-1 updated", "cycleHash-1 updated");
            const result = await rewardHashContract.cycleHashes(1);
            const latestIndex = await rewardHashContract.latestCycleIndex();
            expect(result.latestClaimable).to.equal("claimableHash-1 updated");
            expect(result.cycle).to.equal("cycleHash-1 updated");
            expect(latestIndex).to.equal(1);
        });

        it("Test unable to find previous claimable", async () => {
            const trx = await rewardHashContract.connect(deployer).setCycleHashes(4, "claimableHash-4", "cycleHash-4");
            const receipt = await trx.wait();
            const result = await rewardHashContract.connect(deployer).cycleHashes(3);
            const latestIndex = await rewardHashContract.latestCycleIndex();
            expect(result.latestClaimable).to.be.empty;
            expect(result.cycle).to.be.empty;
            expect(latestIndex).to.equal(4);

            expect(receipt.events?.[0].event).to.equal("CycleHashAdded");
            expect(receipt.events?.[0].args?.[0]).to.equal(4);
            expect(receipt.events?.[0].args?.[1]).to.equal("claimableHash-4");
            expect(receipt.events?.[0].args?.[2]).to.equal("cycleHash-4");
        });
    });
});
