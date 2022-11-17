import * as yargs from "yargs";
import {Arguments} from "yargs";
import {contractAddressByEnvironment, Environment} from "../config";
import {runNotionalSetup} from "../staking/notional_address_setup";

const notionalAddressSetup: yargs.CommandModule = {
    command: "set-notional",
    describe: "Set notional addresses snd schedule indexes",
    builder: (argv) => {
        argv.option("environment", {
            alias: "env",
            type: "string",
            describe: "target environment",
            demandOption: true,
            requiresArg: true,
            choices: Object.values(Environment),
        });
        argv.option("notionalAddress", {
            alias: "notional",
            type: "string",
            describe: "Address to map to schedule Index",
            demandOption: true,
            requiresArg: true,
        });
        argv.option("scheduleIdx", {
            alias: "Idx",
            type: "string",
            describe: "Schedule index to map notional address to",
            demandOption: true,
            requiresArg: true,
        });
        return argv;
    },
    handler: runNotionalSetHandler,
};

export default notionalAddressSetup;

async function runNotionalSetHandler(args: Arguments): Promise<void> {
    const targetEnv = args.environment as Environment;
    const contractAddressByName = contractAddressByEnvironment[targetEnv];
    if (!contractAddressByName) {
        throw new Error(`Unknown env ${targetEnv}`);
    }

    await runNotionalSetup(
        contractAddressByName["staking"],
        [args.notionalAddress as string],
        [args.scheduleIdx as string]
    );
}
