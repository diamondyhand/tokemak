import {ethers} from "hardhat";
import * as yargs from "yargs";
import {Arguments} from "yargs";
import {
    getContractAddressByEnvironmentAndName,
    contractAddressByEnvironment,
    Environment,
    Contract,
    getStakingNotionalAddress,
    StakingScheduleType,
} from "../config";
import {VoteTokenSetupInput, runVoteMultiplierSetup} from "../voting/vote_token_multiplier_setup";

const voteTokenMultiplierSetup: yargs.CommandModule = {
    command: "vote-token-multipliers",
    describe: "configure vote tracker with tokens and their voting power",
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

export default voteTokenMultiplierSetup;

const TOKE_MULTIPLIER = ethers.utils.parseEther("6");
const UNI_MULTIPLIER = ethers.utils.parseEther("69");
const SUSHI_MULTIPLIER = ethers.utils.parseEther("69");
const STAKING_MULTIPLIER = ethers.utils.parseEther("1");

const getConfig = (env: Environment, addressKey: string) => {
    if (addressKey == Contract.VOTE_TRACKER_CORE) {
        return [
            {
                token: getContractAddressByEnvironmentAndName(env, Contract.TOKE_POOL),
                multiplier: ethers.utils.parseEther("6"),
            },
            {
                token: getContractAddressByEnvironmentAndName(env, Contract.UNI_POOL),
                multiplier: ethers.utils.parseEther("69"),
            },
            {
                token: getContractAddressByEnvironmentAndName(env, Contract.SUSHI_POOL),
                multiplier: ethers.utils.parseEther("69"),
            },
            {
                token: getContractAddressByEnvironmentAndName(env, Contract.STAKING),
                multiplier: ethers.utils.parseEther("1"),
            },
        ];
    } else if (addressKey == Contract.VOTE_TRACKER_LD) {
        return [
            {
                token: getContractAddressByEnvironmentAndName(env, Contract.TOKE_POOL),
                multiplier: ethers.utils.parseEther("1"),
            },
        ];
    } else if (addressKey == Contract.CORE3_VOTE_TRACKER) {
        return [
            {
                token: getStakingNotionalAddress(StakingScheduleType.DEFAULT),
                multiplier: ethers.utils.parseEther("6"),
            },
            {
                token: getStakingNotionalAddress(StakingScheduleType.INVESTOR),
                multiplier: ethers.utils.parseEther("1"),
            },
            {
                token: getContractAddressByEnvironmentAndName(env, Contract.UNI_POOL),
                multiplier: ethers.utils.parseEther("69"),
            },
            {
                token: getContractAddressByEnvironmentAndName(env, Contract.SUSHI_POOL),
                multiplier: ethers.utils.parseEther("69"),
            },
        ];
    } else {
        throw `Invalid Adress Key ${addressKey}`;
    }
};

export async function runVoteMultiplierSetupHandler(args: Arguments): Promise<void> {
    const targetEnv = args.environment as Environment;
    const addressKey = args.addressKey as string;

    const configs = getConfig(targetEnv, addressKey);
    const contractAddressByName = contractAddressByEnvironment[targetEnv];

    if (!configs || !contractAddressByName) {
        throw new Error(`unknown target env ${targetEnv}`);
    }

    await runVoteMultiplierSetup(configs, contractAddressByName[addressKey as Contract]);
}
