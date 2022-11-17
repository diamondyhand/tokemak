import * as yargs from "yargs";
import {Arguments} from "yargs";
import {getContractAddressByEnvironmentAndName, contractAddressByEnvironment, Environment, Contract} from "../config";
import {
    EventType,
    runDestinationSetup,
    DesinationSetupInput,
} from "../cycle_rollover_tracker/cycle_rollover_tracker_setup";

const destinationSetup: yargs.CommandModule = {
    command: "cycle-rollover-tracker-setup",
    describe:
        "configure polygon event proxy to forward messages to target contracts (using preconfigured environments)",
    builder: (argv) => {
        argv.option("environment", {
            alias: "env",
            type: "string",
            describe: "target environment",
            demandOption: true,
            requiresArg: true,
            choices: Object.values(Environment),
        });
        return argv;
    },
    handler: destinationSetupHandler,
};

export default destinationSetup;

const getConfig = (env: Environment) => {
    return [
        {
            sender: getContractAddressByEnvironmentAndName(env, Contract.MANAGER),
            events: [EventType.CYCLE_ROLLOVER_START],
            destinations: [getContractAddressByEnvironmentAndName(env, Contract.CYCLE_ROLLOVER_TRACKER)],
        },
        {
            sender: getContractAddressByEnvironmentAndName(env, Contract.MANAGER),
            events: [EventType.CYCLE_ROLLOVER_COMPLETE],
            destinations: [
                getContractAddressByEnvironmentAndName(env, Contract.CYCLE_ROLLOVER_TRACKER),
                getContractAddressByEnvironmentAndName(env, Contract.VOTE_TRACKER_LD),
            ],
        },
    ];
};

const configsByEnv: Record<Environment, DesinationSetupInput[]> = {
    [Environment.GOERLI]: getConfig(Environment.GOERLI),
    [Environment.MAINNET]: getConfig(Environment.MAINNET),
};

export async function destinationSetupHandler(args: Arguments): Promise<void> {
    const targetEnv = args.environment as Environment;

    const configs = configsByEnv[targetEnv];
    const contractAddressByName = contractAddressByEnvironment[targetEnv];

    if (!configs || !contractAddressByName) {
        throw new Error(`unknown target env ${targetEnv}`);
    }

    for (const config of configs) {
        await runDestinationSetup(config, contractAddressByName[Contract.EVENT_PROXY]);
    }
}
