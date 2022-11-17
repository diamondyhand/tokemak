import {ethers, artifacts} from "hardhat";
import {EventProxy, VoteTracker} from "../../typechain";
import {Contract} from "../config";

export interface VoteReactorSetupInput {
    reactorKey: string;
    token: string;
    allowed: boolean;
    voteTrackerAddress: string;
}

export const runVoteSetReactorCmd = async (input: VoteReactorSetupInput): Promise<void> => {
    const voteTrackerArtifact = await artifacts.require("VoteTracker");
    const voteTracker = (await ethers.getContractAt(
        voteTrackerArtifact.abi,
        input.voteTrackerAddress
    )) as unknown as VoteTracker;

    const keys = input.reactorKey
        .split(",")
        .filter((x) => (x || "").length > 0)
        .map((x) => {
            const formattedKey = ethers.utils.formatBytes32String(x);
            return {token: input.token, key: formattedKey};
        });

    console.log(`Vote Tracker: ${input.voteTrackerAddress}`);
    console.log(`Token: ${input.token}`);
    console.log(`Allowed: ${input.allowed}`);
    console.log(`Keys Provided: ${input.reactorKey}`);
    console.log(`Formatted Keys: ${keys.map((x) => x.key).join(",")}`);

    const tx = await voteTracker.setReactorKeys(keys, input.allowed);
    await tx.wait();

    console.log("Complete");
};
