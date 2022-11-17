import {expect} from "chai";
import {MockContract} from "@ethereum-waffle/mock-contract";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import * as timeMachine from "ganache-time-traveler";
import {artifacts, ethers, upgrades, waffle} from "hardhat";
import {OnChainVoteL1} from "../typechain";
import {UserVotePayload} from "../test-integration/utilities/vote";

const {deployMockContract} = waffle;
const IFxStateSender = artifacts.require("IFxStateSender");
const {AddressZero: ZERO_ADDRESS} = ethers.constants;

let onChainVoteL1: OnChainVoteL1;
let fxStateSender: MockContract;
let destinationOnL2: SignerWithAddress;
let user1: SignerWithAddress;
let user2: SignerWithAddress;
let deployer: SignerWithAddress;
let snapshotId: string;

describe("Test OnChainVoteL1", () => {
    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    before(async () => {
        [deployer, destinationOnL2, user1, user2] = await ethers.getSigners();

        const onChainVoteL1Factory = await ethers.getContractFactory("OnChainVoteL1");
        onChainVoteL1 = (await upgrades.deployProxy(onChainVoteL1Factory)) as OnChainVoteL1;
        fxStateSender = await deployMockContract(deployer, IFxStateSender.abi);
    });

    describe("Test Set Destination", async () => {
        it("Reverts on non owner call", async () => {
            await expect(
                onChainVoteL1.connect(user1).setDestinations(fxStateSender.address, destinationOnL2.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Reverts when destination on L1 is zero address", async () => {
            await expect(
                onChainVoteL1.connect(deployer).setDestinations(ZERO_ADDRESS, destinationOnL2.address)
            ).to.be.revertedWith("INVALID_ADDRESS");
        });

        it("Reverts when destination on L2 address is 0", async () => {
            await expect(
                onChainVoteL1.connect(deployer).setDestinations(fxStateSender.address, ZERO_ADDRESS)
            ).to.be.revertedWith("INVALID_ADDRESS");
        });

        it("Correctly stores all data", async () => {
            await onChainVoteL1.connect(deployer).setDestinations(fxStateSender.address, destinationOnL2.address);

            const destinationsStruct = await onChainVoteL1.destinations();
            expect(destinationsStruct.fxStateSender).to.equal(fxStateSender.address);
            expect(destinationsStruct.destinationOnL2).to.equal(destinationOnL2.address);
        });

        it("Emits an event with correct args", async () => {
            const tx = await onChainVoteL1
                .connect(deployer)
                .setDestinations(fxStateSender.address, destinationOnL2.address);
            const receipt = await tx.wait();
            const eventArgs = (receipt as any).events[0].args;
            expect(eventArgs.fxStateSender).to.equal(fxStateSender.address);
            expect(eventArgs.destinationOnL2).to.equal(destinationOnL2.address);
        });
    });

    describe("Test Set Event Send", () => {
        it("Reverts on non owner call", async () => {
            await expect(onChainVoteL1.connect(user1).setEventSend(true)).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });

        it("Reverts if destinations are not set", async () => {
            await expect(onChainVoteL1.connect(deployer).setEventSend(true)).to.be.revertedWith("DESTINATIONS_NOT_SET");
        });

        it("Properly stores the boolean", async () => {
            await onChainVoteL1.connect(deployer).setDestinations(fxStateSender.address, destinationOnL2.address);

            await onChainVoteL1.connect(deployer).setEventSend(true);
            expect(await onChainVoteL1._eventSend()).to.equal(true);
        });
    });

    describe("Test Vote", async () => {
        it("reverts when sender account is different from payload account", async () => {
            const goodVote = getGoodVote(user1.address);
            await expect(onChainVoteL1.connect(user2).vote(goodVote)).to.be.revertedWith("INVALID_ACCOUNT");
        });

        it("works", async () => {
            fxStateSender.mock.sendMessageToChild.returns();
            const goodVote = getGoodVote(user1.address);
            await onChainVoteL1.connect(deployer).setDestinations(fxStateSender.address, destinationOnL2.address);
            await onChainVoteL1.connect(deployer).setEventSend(true);

            await expect(onChainVoteL1.connect(user1).vote(goodVote)).to.not.be.reverted;
        });
    });

    describe("Testing pauseability", () => {
        it("Initially is not paused", async () => {
            expect(await onChainVoteL1.paused()).to.equal(false);
        });

        it("Pauses correctly, emits Paused event", async () => {
            const tx = await onChainVoteL1.connect(deployer).pause();
            const receipt = await tx.wait();

            expect(await onChainVoteL1.paused()).to.equal(true);
            expect(receipt.events![0].event).to.equal("Paused");
            expect(receipt.events![0].args!.account).to.equal(deployer.address);
        });

        it("Unpauses correctly, emits UnPaused event", async () => {
            await onChainVoteL1.connect(deployer).pause();
            const tx = await onChainVoteL1.connect(deployer).unpause();
            const receipt = await tx.wait();

            expect(await onChainVoteL1.paused()).to.equal(false);
            expect(receipt.events![0].event).to.equal("Unpaused");
            expect(receipt.events![0].args!.account).to.equal(deployer.address);
        });

        it("Rejects when caller is not owner", async () => {
            await expect(onChainVoteL1.connect(user1).pause()).to.be.revertedWith("Ownable: caller is not the owner");
            await onChainVoteL1.connect(deployer).pause();
            await expect(onChainVoteL1.connect(user1).unpause()).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Vote function pauses correctly", async () => {
            await onChainVoteL1.connect(deployer).pause();

            const goodVote = {
                account: user1.address,
                voteSessionKey: ethers.utils.formatBytes32String("1"),
                nonce: 0,
                chainId: 1,
                totalVotes: ethers.utils.parseUnits("100", 18).toString(),
                allocations: [
                    {
                        reactorKey: "0x616176652d64656661756c740000000000000000000000000000000000000000",
                        amount: "55000000000000000000",
                    },
                ],
            };

            await expect(onChainVoteL1.connect(user1).vote(goodVote)).to.be.revertedWith("Pausable: paused");
        });
    });

    function getGoodVote(account: string): UserVotePayload {
        return {
            account,
            voteSessionKey: ethers.utils.formatBytes32String("1"),
            nonce: 0,
            chainId: 1,
            totalVotes: ethers.utils.parseUnits("100", 18).toString(),
            allocations: [
                {
                    reactorKey: "0x616176652d64656661756c740000000000000000000000000000000000000000",
                    amount: "55000000000000000000",
                },
            ],
        };
    }
});
