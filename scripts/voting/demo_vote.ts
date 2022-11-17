/**
 * Usage: `npx hardhat run --network mumbai scripts/voting/demo_vote.ts`
 * To use this script you need to defined the following env variables in your .env file
 *
 * ```
 * TEST_VOTER_WALLET=
 * TEST_VOTER_PRIVATE=
 * TEST_CHAIN_ID=
 * TEST_VOTE_CONTRACT= the voteTracker contract address
 * TEST_VOTE_API_URL= optional. If set, it will send the generated vote payload to the provided API.
 * ```
 */
import {BigNumber} from "@ethersproject/bignumber";
import {ethers, artifacts} from "hardhat";
import dotenv from "dotenv";
import {VoteTracker} from "../../typechain";
import {signVote, UserVoteAllocationItem} from "../../test-integration/utilities/vote";
import axios from "axios";

dotenv.config();

const main = async () => {
    const VOTER_WALLET = process.env.TEST_VOTER_WALLET || "";
    const VOTER_PRIVATE = process.env.TEST_VOTER_PRIVATE || "";
    const CHAIN_ID = parseInt(process.env.TEST_CHAIN_ID || "80001");
    const VOTE_CONTRACT = process.env.TEST_VOTE_CONTRACT || "";

    const voteArtifact = artifacts.require("VoteTracker");
    const voteContract = (await ethers.getContractAt(voteArtifact.abi, VOTE_CONTRACT)) as unknown as VoteTracker;
    const {voteSessionKey} = await voteContract.settings();
    const reactorKeys = await voteContract.getReactorKeys();
    const getMaxVoteBalance = await voteContract.getMaxVoteBalance(VOTER_WALLET);

    const {allocations, totalVotes} = getRandomVoteAllocationsAndTotal(reactorKeys, BigNumber.from(1000000));

    const nonce = (await voteContract.userNonces(VOTER_WALLET)).toNumber();

    const userVotePayload = {
        account: VOTER_WALLET,
        voteSessionKey: voteSessionKey,
        nonce,
        chainId: CHAIN_ID,
        totalVotes,
        allocations,
    };

    const signature = signVote(VOTE_CONTRACT, userVotePayload, VOTER_PRIVATE, 5);

    console.log(JSON.stringify({userVotePayload, signature}, null, 2));

    if (process.env.TEST_VOTE_API_URL) {
        try {
            const response = await axios.post(process.env.TEST_VOTE_API_URL, {
                userVotePayload,
                signature,
            });
            console.log(response.data);
        } catch (err) {
            console.log((err as any).response?.data);
        }
    }
};

function getRandomVoteAllocationsAndTotal(
    reactorKeys: string[],
    balance: BigNumber,
    nbAllocations = 3
): {allocations: UserVoteAllocationItem[]; totalVotes: string} {
    const amount = balance.div(nbAllocations);
    return {
        allocations: reactorKeys.slice(0, nbAllocations).map((val) => ({
            reactorKey: val,
            amount: amount.toString(),
        })),
        totalVotes: amount.mul(nbAllocations).toString(),
    };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
