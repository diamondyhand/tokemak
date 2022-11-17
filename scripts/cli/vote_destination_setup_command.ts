import * as yargs from "yargs";
import {Arguments} from "yargs";
import {getContractAddressByEnvironmentAndName, contractAddressByEnvironment, Environment, Contract} from "../config";
import {EventType, VoteDesinationSetupInput, runVoteDestinationSetup} from "../voting/vote_destination_setup";

const voteDestinationSetup: yargs.CommandModule = {
    command: "vote-destination-setup",
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
    handler: voteDestinationSetupHandler,
};

export default voteDestinationSetup;

const POOL_BALANCE_EVENTS = [
    EventType.DEPOSIT,
    EventType.TRANSFER,
    EventType.WITHDRAW,
    EventType.SLASH,
    EventType.WITHDRAWAL_REQUEST,
];

const getPoolBalanceDestinations = (env: Environment) => {
    return [
        getContractAddressByEnvironmentAndName(env, Contract.BALANCE_TRACKER),
        getContractAddressByEnvironmentAndName(env, Contract.VOTE_TRACKER_LD),
        getContractAddressByEnvironmentAndName(env, Contract.CORE3_VOTE_TRACKER),
    ];
};

const getConfig = (env: Environment) => {
    const poolDestinations = getPoolBalanceDestinations(env);
    return [
        {
            sender: getContractAddressByEnvironmentAndName(env, Contract.TOKE_POOL),
            events: POOL_BALANCE_EVENTS,
            destinations: poolDestinations,
        },
        {
            sender: getContractAddressByEnvironmentAndName(env, Contract.UNI_POOL),
            events: POOL_BALANCE_EVENTS,
            destinations: poolDestinations,
        },
        {
            sender: getContractAddressByEnvironmentAndName(env, Contract.SUSHI_POOL),
            events: POOL_BALANCE_EVENTS,
            destinations: poolDestinations,
        },
        {
            sender: getContractAddressByEnvironmentAndName(env, Contract.STAKING),
            events: POOL_BALANCE_EVENTS,
            destinations: poolDestinations,
        },
        {
            sender: getContractAddressByEnvironmentAndName(env, Contract.MANAGER),
            events: [EventType.CYCLE_ROLLOVER],
            destinations: [
                getContractAddressByEnvironmentAndName(env, Contract.VOTE_TRACKER_LD),
                getContractAddressByEnvironmentAndName(env, Contract.CYCLE_ROLLOVER_TRACKER),
            ],
        },
        {
            sender: getContractAddressByEnvironmentAndName(env, Contract.ON_CHAIN_VOTE_L1_CORE),
            events: [EventType.VOTE],
            destinations: [getContractAddressByEnvironmentAndName(env, Contract.VOTE_TRACKER_CORE)],
        },
        {
            sender: getContractAddressByEnvironmentAndName(env, Contract.ON_CHAIN_VOTE_L1_LD),
            events: [EventType.VOTE],
            destinations: [getContractAddressByEnvironmentAndName(env, Contract.VOTE_TRACKER_LD)],
        },
        {
            sender: getContractAddressByEnvironmentAndName(env, Contract.CORE3_ON_CHAIN_VOTE),
            events: [EventType.VOTE],
            destinations: [getContractAddressByEnvironmentAndName(env, Contract.CORE3_VOTE_TRACKER)],
        },
    ];
};

const configsByEnv: Record<Environment, VoteDesinationSetupInput[]> = {
    [Environment.GOERLI]: getConfig(Environment.GOERLI),
    [Environment.MAINNET]: getConfig(Environment.MAINNET),
};

export async function voteDestinationSetupHandler(args: Arguments): Promise<void> {
    const targetEnv = args.environment as Environment;

    const configs = configsByEnv[targetEnv];
    const contractAddressByName = contractAddressByEnvironment[targetEnv];

    if (!configs || !contractAddressByName) {
        throw new Error(`unknown target env ${targetEnv}`);
    }

    for (const config of configs) {
        await runVoteDestinationSetup(config, contractAddressByName[Contract.EVENT_PROXY]);
    }
}
