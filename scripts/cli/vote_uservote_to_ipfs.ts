import * as yargs from "yargs";
import {Arguments} from "yargs";
import {runUserVotesToIPFS} from "../voting/vote_user_votes_to_ipfs";

const runUserVotesToIPFSSetupCommand: yargs.CommandModule = {
    command: "vote-user-to-ipfs",
    describe: "Export current system votes to JSON file",
    builder: (argv) => {
        argv.option("voteTracker", {
            alias: "voteTracker",
            type: "string",
            describe: "address to the vote tracker contract you want to snapshot",
            demandOption: true,
            requiresArg: true,
        });
        argv.option("startBlock", {
            alias: "startBlock",
            type: "number",
            describe: "Block to start querying for participating users at",
            demandOption: true,
            requiresArg: true,
        });

        argv.option("queryBlock", {
            alias: "queryBlock",
            type: "number",
            describe: "Block to start querying for balances at",
            demandOption: true,
            requiresArg: true,
        });
        return argv;
    },
    handler: runUserVotesToIPFSSetup,
};

export default runUserVotesToIPFSSetupCommand;

export async function runUserVotesToIPFSSetup(args: Arguments): Promise<void> {
    const voteTracker = args.voteTracker as string;
    const queryBlockTag = args.queryBlock as number;
    const startBlockTag = args.startBlock as number;

    await runUserVotesToIPFS({
        voteTracker,
        queryBlockTag,
        startBlockTag,
    });
}
