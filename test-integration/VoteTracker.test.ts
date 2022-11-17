import {expect} from "chai";
import {ethers, upgrades} from "hardhat";
import * as timeMachine from "ganache-time-traveler";
import {BalanceTracker, BalanceTracker__factory, Toke, VoteTracker} from "../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

import {BigNumber} from "ethers";

describe("Test VoteTracker", () => {
    let snapshotId: string;
    let eventProxy: SignerWithAddress;
    let deployer: SignerWithAddress;
    let victim: SignerWithAddress;
    let attacker: SignerWithAddress;

    let balanceTrackerFactory: BalanceTracker__factory;
    let balanceTracker: BalanceTracker;
    let toke: Toke;
    let voteTracker: VoteTracker;

    before(async () => {
        [deployer, eventProxy, victim, attacker] = await ethers.getSigners();
        balanceTrackerFactory = await ethers.getContractFactory("BalanceTracker");
        balanceTracker = (await upgrades.deployProxy(balanceTrackerFactory, [eventProxy.address])) as BalanceTracker;

        const tokeFactory = await ethers.getContractFactory("Toke", deployer);
        toke = await tokeFactory.deploy();

        await balanceTracker.connect(deployer).addSupportedTokens([toke.address]);

        const voteTrackerFactory = await ethers.getContractFactory("VoteTracker");

        voteTracker = (await upgrades.deployProxy(
            voteTrackerFactory,
            [
                eventProxy.address,
                ethers.utils.formatBytes32String("votesession1"),
                balanceTracker.address,
                (await ethers.provider.getNetwork()).chainId,
                [[toke.address, 1]],
            ],
            {
                unsafeAllow: ["state-variable-assignment", "state-variable-immutable"],
            }
        )) as VoteTracker;

        await voteTracker.connect(deployer).setReactorKeys(
            [
                {
                    token: toke.address,
                    key: ethers.utils.formatBytes32String("reactor1"),
                },
            ],
            true
        );
    });

    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"] as string;
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    describe("Duplicate Checks", () => {
        it("Should not allow duplicate userVoteKeys", async () => {
            // Give 1,000,000 TOKE to victim
            await balanceTracker.connect(deployer).setBalance([
                {
                    account: victim.address,
                    token: toke.address,
                    amount: ethers.utils.parseEther("1000000"),
                },
            ]);

            // Give 1000 TOKE to attacker
            await balanceTracker.connect(deployer).setBalance([
                {
                    account: attacker.address,
                    token: toke.address,
                    amount: ethers.utils.parseEther("1000"),
                },
            ]);

            // Victim puts all 1,000,000 votes into 'reactor1'
            await voteTracker.connect(victim).voteDirect({
                account: victim.address,
                voteSessionKey: ethers.utils.formatBytes32String("votesession1"),
                nonce: 0,
                chainId: (await ethers.provider.getNetwork()).chainId,
                totalVotes: 1000000,
                allocations: [
                    {
                        reactorKey: ethers.utils.formatBytes32String("reactor1"),
                        amount: 1000000,
                    },
                ],
            });

            await voteTracker.connect(deployer).updateUserVoteTotals([victim.address]);

            // Create 1000 vote allocations on 'reactor1' with 0 votes
            const vote_allocations: {reactorKey: string; amount: BigNumber}[] = [];
            for (let i = 0; i < 1000; i++)
                vote_allocations[i] = {
                    reactorKey: ethers.utils.formatBytes32String("reactor1"),
                    amount: BigNumber.from("0"),
                };

            // Finally create 1 real vote allocation to 'reactor1' with 1000 votes
            vote_allocations[1000] = {
                reactorKey: ethers.utils.formatBytes32String("reactor1"),
                amount: BigNumber.from("1000"),
            };

            // Send the 1001 vote allocations as attacker,
            // system aggregations for 'reactor1' will become 1_001_000
            await voteTracker.connect(attacker).voteDirect({
                account: attacker.address,
                voteSessionKey: ethers.utils.formatBytes32String("votesession1"),
                nonce: 0,
                chainId: (await ethers.provider.getNetwork()).chainId,
                totalVotes: 1000,
                allocations: vote_allocations,
            });

            // Update the attacker user vote totals,
            // this will cause userVoteDetails[attacker].totalUsedVotes to become 1_001_000
            await voteTracker.connect(attacker).updateUserVoteTotals([attacker.address]);

            // Update the attacker use vote totals again,
            // now totalUsedVotes is 1_001_000, creating a very large denominator
            // and causing system aggregations to get drained
            await voteTracker.connect(attacker).updateUserVoteTotals([attacker.address]);

            // No longer, after the exploit, the system aggregations for 'reactor1' has 0 votes
            //   await expect(
            //     await (
            //       await voteTracker.connect(deployer).getSystemVotes()
            //     )[1][0][2].toString()
            //   ).to.be.equal("0");
            await expect((await (await voteTracker.connect(deployer).getSystemVotes())[1][0][2]).gt(0)).to.be.true;

            // If the victim tries to remove their votes it, the vote transaction will revert
            // no longer
            await expect(
                voteTracker.connect(victim).voteDirect({
                    account: victim.address,
                    voteSessionKey: ethers.utils.formatBytes32String("votesession1"),
                    nonce: 1,
                    chainId: (await ethers.provider.getNetwork()).chainId,
                    totalVotes: 0,
                    allocations: [
                        {
                            reactorKey: ethers.utils.formatBytes32String("reactor1"),
                            amount: 0,
                        },
                    ],
                })
                //).to.be.reverted;
            ).to.not.be.reverted;

            // If the victim tries to resubmit their votes it, the update transaction will revert
            // no longer
            await expect(
                voteTracker.connect(victim).voteDirect({
                    account: victim.address,
                    voteSessionKey: ethers.utils.formatBytes32String("votesession1"),
                    nonce: 2,
                    chainId: (await ethers.provider.getNetwork()).chainId,
                    totalVotes: 1000000,
                    allocations: [
                        {
                            reactorKey: ethers.utils.formatBytes32String("reactor1"),
                            amount: 1000000,
                        },
                    ],
                })
            ).to.not.be.reverted;
            await expect(voteTracker.connect(victim).updateUserVoteTotals([victim.address])).to.not.be.reverted;
        });
    });
});
