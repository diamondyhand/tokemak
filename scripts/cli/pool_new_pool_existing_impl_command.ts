import * as yargs from "yargs";
import {Arguments} from "yargs";
import {getContractAddressByEnvironmentAndName, Environment, Contract} from "../config";
import {runNewPoolExistingImplSetup} from "../pool/setup_new_pool_existing_impl";

const newPoolExistingImplSetupCommand: yargs.CommandModule = {
    command: "pool-new-existing-impl",
    describe: "Setup a new ERC20 pool against the existing current implementation",
    builder: (argv) => {
        argv.option("environment", {
            alias: "env",
            type: "string",
            describe: "target environment",
            demandOption: true,
            requiresArg: true,
            choices: Object.values(Environment),
        });
        argv.option("underlyer", {
            alias: "underlyer",
            type: "string",
            describe: "underlying token address",
            demandOption: true,
            requiresArg: true,
        });
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
        argv.option("skipVerify", {
            alias: "skipVerify",
            type: "boolean",
            describe: "skip verifying the contract on etherscan",
            demandOption: false,
            requiresArg: false,
        });
        argv.option("pause", {
            alias: "pause",
            type: "boolean",
            describe: "pause the contract after deployment",
            demandOption: false,
            requiresArg: false,
        });
        argv.option("transferOwnership", {
            alias: "transferOwnership",
            type: "boolean",
            describe: "transfer ownership to the dev coorindator multisig",
            demandOption: false,
            requiresArg: false,
        });
        return argv;
    },
    handler: runVoteEventSendSetup,
};

export default newPoolExistingImplSetupCommand;

const getConfig = (
    env: Environment,
    underlyer: string,
    symbol: string,
    name: string,
    skipVerify: boolean,
    pause: boolean,
    transferOwnership: boolean
) => {
    return {
        managerAddress: getContractAddressByEnvironmentAndName(env, Contract.MANAGER),
        proxyAdmin: getContractAddressByEnvironmentAndName(env, Contract.PROXY_ADMIN),
        poolImplementation: getContractAddressByEnvironmentAndName(env, Contract.POOL_IMPLEMENTATION),
        devCoordinatorMultisig: getContractAddressByEnvironmentAndName(env, Contract.DEV_COORDINATOR_MULTISIG),
        underlyer,
        symbol,
        name,
        skipVerify,
        pause,
        transferOwnership,
    };
};

export async function runVoteEventSendSetup(args: Arguments): Promise<void> {
    const targetEnv = args.environment as Environment;
    const underlyer = args.underlyer as string;
    const symbol = args.symbol as string;
    const name = args.name as string;
    const skipVerify = args.skipVerify as boolean;
    const pause = args.pause as boolean;
    const transferOwnership = args.transferOwnership as boolean;

    const configs = getConfig(targetEnv, underlyer, symbol, name, skipVerify, pause, transferOwnership);

    if (!configs) {
        throw new Error(`unknown target env ${targetEnv}`);
    }

    await runNewPoolExistingImplSetup(configs);
}
