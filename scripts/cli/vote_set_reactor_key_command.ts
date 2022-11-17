import * as yargs from "yargs";
import {Arguments} from "yargs";
import {getContractAddressByEnvironmentAndName, Environment, Contract} from "../config";
import {runVoteSetReactorCmd} from "../voting/vote_set_reactor_cmd";

const voteSetReactorKeySetupCommand: yargs.CommandModule = {
    command: "vote-set-reactor",
    describe: "Configure a reactor in the vote tracker as allowed or not",
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
        argv.option("token", {
            alias: "token",
            type: "string",
            describe: "erc20 address of the project",
            demandOption: true,
            requiresArg: true,
        });
        argv.option("reactorKey", {
            alias: "reactorKey",
            type: "string",
            describe: "reactor key the votes will be logged under. comma delimited to setup multiple",
            demandOption: true,
            requiresArg: true,
        });
        argv.option("allowed", {
            alias: "allowed",
            type: "boolean",
            describe: "Add or remove the key",
            demandOption: true,
            requiresArg: true,
        });
        return argv;
    },
    handler: runSetReactorKeySetuphandler,
};

export default voteSetReactorKeySetupCommand;

export async function runSetReactorKeySetuphandler(args: Arguments): Promise<void> {
    const targetEnv = args.environment as Environment;
    const addressKey = args.addressKey as string;
    const voteTrackerAddress = getContractAddressByEnvironmentAndName(targetEnv, addressKey as Contract);
    const token = args.token as string;
    const reactorKey = args.reactorKey as string;
    const allowed = args.allowed as boolean;

    if (!voteTrackerAddress || !targetEnv) {
        throw new Error(`unknown target env ${targetEnv}`);
    }

    await runVoteSetReactorCmd({
        voteTrackerAddress,
        token,
        allowed,
        reactorKey,
    });
}
