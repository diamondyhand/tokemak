import {ethers, artifacts} from "hardhat";
import dotenv from "dotenv";
import {VoteTracker} from "../../typechain";

dotenv.config();

export interface VoteProxySubmitterSetup {
    voteTracker: string;
    addresses: string[];
}

export const runVoteProxySubmitterSetup = async (input: VoteProxySubmitterSetup): Promise<void> => {
    const voteArtifact = artifacts.require("VoteTracker");

    const [deployer] = await ethers.getSigners();
    const voteTracker = (await ethers.getContractAt(voteArtifact.abi, input.voteTracker)) as unknown as VoteTracker;

    const yes = await voteTracker.connect(deployer).setProxySubmitters(input.addresses, true);
    await yes.wait();
};
