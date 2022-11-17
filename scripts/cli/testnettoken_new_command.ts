import * as yargs from "yargs";
import {Arguments} from "yargs";
import {runNewTestnetTokenSetup} from "../tokens/new_testnet_token";

const newTestnetTokenCommand: yargs.CommandModule = {
    command: "testnettoken-new",
    describe: "Setup a new ERC20 pool against the existing current implementation",
    builder: (argv) => {
        argv.option("symbol", {
            alias: "symbol",
            type: "string",
            describe: "symbol for the new reactor",
            demandOption: true,
            requiresArg: true,
        });
        argv.option("name", {
            alias: "name",
            type: "string",
            describe: "token name for the new reactor",
            demandOption: true,
            requiresArg: true,
        });
        argv.option("decimals", {
            alias: "decimals",
            type: "number",
            describe: "number of decimals for the token",
            demandOption: true,
            requiresArg: true,
        });
        argv.option("skipVerify", {
            alias: "skipVerify",
            type: "boolean",
            describe: "skip verifying the contract on etherscan",
            demandOption: false,
            requiresArg: false,
        });
        return argv;
    },
    handler: runVoteEventSendSetup,
};

export default newTestnetTokenCommand;

export async function runVoteEventSendSetup(args: Arguments): Promise<void> {
    const symbol = args.symbol as string;
    const name = args.name as string;
    const decimals = args.decimals as number;
    const skipVerify = args.skipVerify as boolean;

    await runNewTestnetTokenSetup({
        name: name,
        symbol: symbol,
        decimals,
        skipVerify: skipVerify,
    });
}
