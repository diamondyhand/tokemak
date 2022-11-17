import * as yargs from "yargs";
import {Arguments} from "yargs";
import {runMintTestnetTokenSetup} from "../tokens/mint_testnet_token";

const mintTestnetTokenCommand: yargs.CommandModule = {
    command: "testnettoken-mint",
    describe: "Setup a new ERC20 pool against the existing current implementation",
    builder: (argv) => {
        argv.option("tokenAddress", {
            alias: "tokenAddress",
            type: "string",
            describe: "Token Address",
            demandOption: true,
            requiresArg: true,
        });
        argv.option("destination", {
            alias: "destination",
            type: "string",
            describe: "mint to this address, can be comma delimited",
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
        argv.option("amount", {
            alias: "amount",
            type: "number",
            describe: "amount to mint",
            demandOption: false,
            requiresArg: false,
        });
        return argv;
    },
    handler: runMintTestnetTokenMint,
};

export default mintTestnetTokenCommand;

export async function runMintTestnetTokenMint(args: Arguments): Promise<void> {
    const tokenAddress = args.tokenAddress as string;
    const destination = args.destination as string;
    const decimals = args.decimals as number;
    const amount = args.amount as number;

    await runMintTestnetTokenSetup({
        tokenAddress: tokenAddress,
        destination: destination,
        decimals: decimals,
        amount: amount,
    });
}
