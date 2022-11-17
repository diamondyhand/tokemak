import {BigNumber} from "@ethersproject/bignumber";
import {ethers, artifacts} from "hardhat";
import {VoteTracker} from "../../typechain";

export interface VoteTokenSetupInput {
    token: string;
    multiplier: BigNumber;
}

export const runVoteMultiplierSetup = async (
    input: VoteTokenSetupInput[],
    voteTrackerAddress: string
): Promise<void> => {
    const voteTrackerArtifact = await artifacts.require("VoteTracker");
    const voteTracker = (await ethers.getContractAt(
        voteTrackerArtifact.abi,
        voteTrackerAddress
    )) as unknown as VoteTracker;

    const tx = await voteTracker.setVoteMultiplers(input);
    await tx.wait();

    console.log("Set Vote Multipliers Complete");
    input.forEach((x) => {
        console.log(`Token: ${x.token} - Multipliers: ${x.multiplier.toString()}`);
    });
};
