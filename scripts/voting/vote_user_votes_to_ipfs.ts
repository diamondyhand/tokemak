import {ethers, artifacts} from "hardhat";
import dotenv from "dotenv";
import {VoteTracker} from "../../typechain";
import {TypedEvent} from "../../typechain/common";
import FormData from "form-data";
import axios from "axios";

dotenv.config();

export interface UserVotesToIPFSInput {
    voteTracker: string;
    queryBlockTag: number;
    startBlockTag: number;
}

export const runUserVotesToIPFS = async (input: UserVotesToIPFSInput): Promise<void> => {
    const voteArtifact = artifacts.require("VoteTracker");

    const voteContract = (await ethers.getContractAt(voteArtifact.abi, input.voteTracker)) as unknown as VoteTracker;

    let startBlock = input.startBlockTag;
    const blockJump = 2000;
    let endBlock = 0;

    const events: TypedEvent<[string] & {account: string}>[] = [];
    const filter = voteContract.filters.UserAggregationUpdated();

    do {
        endBlock = Math.min(input.queryBlockTag, startBlock + blockJump);
        const e = await retry(() => voteContract.queryFilter(filter, startBlock, endBlock));
        events.push(...e);
        startBlock = endBlock + 1;
        console.log(`Events ${events.length} - ${startBlock}`);
    } while (endBlock < input.queryBlockTag);

    console.log(`Events Done ${events.length}`);

    const usersToQuery = Array.from(new Set<string>(events.map((x) => x.args.account)));

    const results: {
        account: string;
        details: {
            totalUsedVotes: string;
            totalAvailableVotes: string;
        };
        votes: {
            reactorKey: string;
            amount: string;
        }[];
    }[] = [];

    for (let i = 0; i < usersToQuery.length; i++) {
        const user = usersToQuery[i];
        const userVotes = await retry(() => voteContract.getUserVotes(user, {blockTag: input.queryBlockTag}));
        results.push({
            account: user.toLowerCase(),
            details: {
                totalUsedVotes: userVotes.details.totalUsedVotes.toString(),
                totalAvailableVotes: userVotes.details.totalAvailableVotes.toString(),
            },
            votes: userVotes.votes.map((x) => {
                return {
                    reactorKey: x.reactorKey,
                    amount: x.amount.toString(),
                };
            }),
        });

        console.log(`Query User: ${user}`);
    }

    const files = results.map((x) => {
        return {
            path: x.account,
            content: Buffer.from(JSON.stringify(x)),
        };
    });

    const data = new FormData() as FormData & {_boundary: string};
    files.forEach((file) => {
        //for each file stream, we need to include the correct relative file path
        const filepath = `votingusers/${file.path}.json`;
        data.append(`file`, file.content, {
            filepath: filepath,
        });
    });
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

    console.log(`Pushing ${files.length} files (${data.getBuffer().length} bytes) to IPFS provider`);

    const response = await axios.post(url, data, {
        maxBodyLength: Infinity, //this is needed to prevent axios from erroring out with large directories
        headers: {
            "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
            pinata_api_key: process.env.DEFI_PINATA_KEY!,
            pinata_secret_api_key: process.env.DEFI_PINATA_SECRET!,
        },
    });

    console.log(`IPFS Hash: ${response.data.IpfsHash}`);
};

const retry = async <T>(run: () => Promise<T>) => {
    let tries = 0;
    while (tries < 5) {
        try {
            return await run();
        } catch {
            tries++;
            await new Promise((resolve) => setTimeout(resolve, 1000 * tries));
        }
    }

    throw "Failed";
};
