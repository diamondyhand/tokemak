import * as yargs from "yargs";
import {Arguments} from "yargs";
import {runSystemVotesToJSON} from "../voting/vote_system_votes_to_json";

const runSystemVotesToJSONCommand: yargs.CommandModule = {
    command: "vote-system-to-json",
    describe: "Export current system votes to JSON file",
    builder: (argv) => {
        argv.option("voteTracker", {
            alias: "voteTracker",
            type: "string",
            describe: "address to the vote tracker contract you want to snapshot",
            demandOption: true,
            requiresArg: true,
        });
        argv.option("filename", {
            alias: "filename",
            type: "string",
            describe: "path to write the json file to",
            demandOption: true,
            requiresArg: true,
        });
        argv.option("blockTag", {
            alias: "blockTag",
            type: "string",
            describe: "query at specific tag. latest is default",
            demandOption: false,
            requiresArg: false,
        });
        return argv;
    },
    handler: runSystemVotesToJSONSetup,
};

export default runSystemVotesToJSONCommand;

export async function runSystemVotesToJSONSetup(args: Arguments): Promise<void> {
    const voteTracker = args.voteTracker as string;
    const fileName = args.filename as string;
    const blockTag = args.blockTag as string;

    await runSystemVotesToJSON({
        voteTracker,
        fileName,
        blockTag,
    });
}
