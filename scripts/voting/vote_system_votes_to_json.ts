import {ethers, artifacts} from "hardhat";
import dotenv from "dotenv";
import {VoteTracker} from "../../typechain";
import fs from "fs/promises";

dotenv.config();

export interface SystemVotesToJSONInput {
    voteTracker: string;
    fileName: string;
    blockTag: string;
}

export const runSystemVotesToJSON = async (input: SystemVotesToJSONInput): Promise<void> => {
    const voteArtifact = artifacts.require("VoteTracker");

    const voteTracker = (await ethers.getContractAt(voteArtifact.abi, input.voteTracker)) as unknown as VoteTracker;

    let tag: string | number = input.blockTag || "latest";

    if (tag !== "latest") tag = parseInt(tag);

    const systemVotes = await voteTracker.getSystemVotes();

    const toWrite = {
        details: {
            voteSessionKey: systemVotes.details.voteSessionKey,
            totalVotes: systemVotes.details.totalVotes.toString(),
        },
        votes: systemVotes.votes.map((x) => {
            return {
                token: x.token,
                reactorKey: x.reactorKey,
                totalVotes: x.totalVotes.toString(),
            };
        }),
    };

    await fs.writeFile(input.fileName, JSON.stringify(toWrite));
};
