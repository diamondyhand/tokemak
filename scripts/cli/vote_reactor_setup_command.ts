import * as yargs from "yargs";
import {Arguments} from "yargs";
import {getContractAddressByEnvironmentAndName, contractAddressByEnvironment, Environment, Contract} from "../config";
import {runVoteReactorSetup, VoteReactorSetupInput} from "../voting/vote_reactor_setup";

const voteReactorSetupCommand: yargs.CommandModule = {
    command: "vote-reactor-setup",
    describe: "configure vote tracker with the reactors it will accept",
    builder: (argv) => {
        argv.option("environment", {
            alias: "env",
            type: "string",
            describe: "target environment",
            demandOption: true,
            requiresArg: true,
            choices: Object.values(Environment),
        });
        argv.option("addressKey", {
            alias: "addressKey",
            type: "string",
            describe: "target environment",
            demandOption: true,
            requiresArg: true,
        });
        return argv;
    },
    handler: runVoteMultiplierSetupHandler,
};

export default voteReactorSetupCommand;

const getConfig = (env: Environment, addressKey: string) => {
    return {
        voteTracker: getContractAddressByEnvironmentAndName(env, addressKey as Contract),
    };
};

export async function runVoteMultiplierSetupHandler(args: Arguments): Promise<void> {
    const targetEnv = args.environment as Environment;
    const addressKey = args.addressKey as string;

    const configs = getConfig(targetEnv, addressKey);
    const contractAddressByName = contractAddressByEnvironment[targetEnv];

    if (!configs || !contractAddressByName) {
        throw new Error(`unknown target env ${targetEnv}`);
    }

    await runVoteReactorSetup(configs);
}
