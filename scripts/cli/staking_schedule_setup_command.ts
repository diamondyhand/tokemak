import * as yargs from "yargs";
import {Arguments} from "yargs";
import {getContractAddressByEnvironmentAndName, contractAddressByEnvironment, Environment, Contract} from "../config";
import {runScheduleSetup, ScheduleSetupInput} from "../staking/staking_schedule_setup";

const stakingScheduleSetupCommand: yargs.CommandModule = {
    command: "staking-schedule-setup",
    describe: "configures the investor staking schedule",
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
    handler: runStakingScheduleSetupCommand,
};

export default stakingScheduleSetupCommand;

const schedule = {
    cliff: 31536000, //1 Year (365 days) in seconds
    duration: 31536000, //1 Year (365 days) in seconds
    interval: 604800, //1 Week in seconds
    isActive: true,
    hardStart: 1638381600, //December 1st, 2021 18:00:00 GMT+0
    isPublic: false,
};

const getConfig = (env: Environment) => {
    return {
        contract: getContractAddressByEnvironmentAndName(env, Contract.STAKING),
        tokeAddress: getContractAddressByEnvironmentAndName(env, Contract.TOKE),
        schedule: schedule,
        notionalAddress: "0x8623F190d5308Cf69dCD89c8eC558CCC185a671e",
    };
};

const configsByEnv: Record<Environment, ScheduleSetupInput> = {
    [Environment.GOERLI]: getConfig(Environment.GOERLI),
    [Environment.MAINNET]: getConfig(Environment.MAINNET),
};

export async function runStakingScheduleSetupCommand(args: Arguments): Promise<void> {
    const targetEnv = args.environment as Environment;

    const configs = configsByEnv[targetEnv];
    const contractAddressByName = contractAddressByEnvironment[targetEnv];

    if (!configs || !contractAddressByName) {
        throw new Error(`unknown target env ${targetEnv}`);
    }

    await runScheduleSetup(configs);
}
