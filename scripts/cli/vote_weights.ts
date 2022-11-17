import {ethers} from "hardhat";
import * as yargs from "yargs";
import {Arguments} from "yargs";
import {
    contractAddressByEnvironment,
    Environment,
    Contract,
    getContractAddressByEnvironmentAndName,
    getStakingNotionalAddress,
    StakingScheduleType,
} from "../config";
import {runVoteMultiplierSetup} from "../voting/vote_token_multiplier_setup";

const voteWeightSetup: yargs.CommandModule = {
    command: "vote-weights",
    describe: "Set up vote weights in vote tracker",
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
            alias: "key",
            type: "string",
            describe: "Target Contract",
            demandOption: true,
            requiresArg: true,
        });
        return argv;
    },
    handler: voteWeightSetupHandler,
};

export default voteWeightSetup;

const getConfig = (addressKey: string, env: Environment) => {
    if (addressKey == Contract.VOTE_TRACKER_LD) {
        return [
            {
                token: getStakingNotionalAddress(StakingScheduleType.DEFAULT), //Staking Schedule 0 Notional
                multiplier: ethers.utils.parseEther("1"),
            },
        ];
    } else {
        throw `Invalid address key: ${addressKey}`;
    }
};

export async function voteWeightSetupHandler(args: Arguments): Promise<void> {
    const env = args.environment as Environment;
    const addressKey = args.addressKey as string;

    const configs = getConfig(addressKey, env);
    const contractAddressByName = contractAddressByEnvironment[env];

    if (!configs || !contractAddressByName) {
        throw new Error(`Unknown target env ${env}`);
    }

    await runVoteMultiplierSetup(configs, contractAddressByName[addressKey as Contract]);
}
