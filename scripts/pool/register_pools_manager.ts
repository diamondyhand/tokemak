import {ethers} from "hardhat";
import yargs, {Arguments} from "yargs";
import {Contract, getContractAddressByEnvironmentAndName, Environment} from "../config";
import {sendTransaction, Transaction} from "gnosis-tx-submitter";
import {Manager} from "../../typechain";
import * as dotenv from "dotenv";
dotenv.config();

const registerPoolsManager: yargs.CommandModule = {
    command: "set-pools",
    describe: "Set pools on manager",
    builder: (argv) => {
        argv.option("environment", {
            alias: "env",
            type: "string",
            describe: "Target env",
            demandOption: true,
            requiresArg: true,
        });
        argv.option("safeAddress", {
            alias: "safe",
            type: "string",
            describe: "Gnosis safe address to submit txns to",
            demandOption: true,
            requiresArg: true,
        });
        argv.option("poolAddresses", {
            alias: "pools",
            type: "string",
            describe: "Addresses to be registered",
            demandOption: true,
            requiresArg: true,
        });
        argv.array("poolAddresses");
        return argv;
    },
    handler: addPoolsHandler,
};
export default registerPoolsManager;

async function addPoolsHandler(args: Arguments): Promise<void> {
    const ENV = args.environment as Environment;
    const MANAGER = getContractAddressByEnvironmentAndName(ENV, Contract.MANAGER);

    const manager = (await ethers.getContractAt("Manager", MANAGER)) as Manager;
    const poolsFromManager: string[] = await manager.getPools();
    const poolsFromCLI = args.poolAddresses as string[];
    const poolsToRegister: string[] = [];

    // Checksumming addresses for comparison reasons
    poolsFromManager.forEach((x) => {
        return checksum(x);
    });

    poolsFromCLI.forEach((addr1) => {
        addr1 = checksum(addr1);
        if (!poolsFromManager.includes(addr1)) {
            poolsToRegister.push(addr1);
        }
    });

    let chainId = 1;
    if (ENV == "goerli") {
        chainId = 5;
    }

    console.log("Sending transaction to Gnosis...");
    sendPoolsToGnosis(args.safeAddress as string, poolsToRegister, manager, chainId);
}

const checksum = (address: string): string => {
    return ethers.utils.getAddress(address);
};

const sendPoolsToGnosis = async (safe: string, poolsToRegister: string[], manager: Manager, chainId: number) => {
    const txs: Transaction[] = [];
    for (let i = 0; i < poolsToRegister.length; i++) {
        txs[i] = {
            transactionTargetAddress: manager.address,
            transactionValue: ethers.BigNumber.from(0),
            transactionData: manager.interface.encodeFunctionData("registerPool", [poolsToRegister[i]]),
        };
    }

    await sendTransaction(safe, txs, process.env.PRIVATE_KEY!, process.env.ALCHEMY_API_KEY!, chainId);
};
