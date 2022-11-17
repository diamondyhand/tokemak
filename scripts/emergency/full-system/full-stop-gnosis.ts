/**
 *
 * This script currently pauses the Staking, Delegate, and all Pool contracts.
 * These transactions must be executed in the Gnosis UI in order to actually pause the system.
 *
 * THIS SCRIPT WILL ONLY WORK IF THE MANAGER HAS BEEN UPDATED TO CONTAIN THE MOST RECENT POOLS
 *
 */

import {ethers} from "hardhat";
import {Environment, getContractAddressByEnvironmentAndName, Contract} from "../../config";
import {sendTransaction, Transaction} from "gnosis-tx-submitter";
import * as yargs from "yargs";
import chalk from "chalk";
import * as dotenv from "dotenv";
dotenv.config();

let safeAddress: string;
let chainId = 1;

const systemStopGnosis: yargs.CommandModule = {
    command: "full-stop",
    describe: "Prints addresses and hex encoded to pause entire system via Gnosis",
    builder: (argv) => {
        argv.option("environment", {
            alias: "env",
            type: "string",
            describe: "Target environment",
            demandOption: true,
            requiresArg: true,
            choices: Object.values(Environment),
        });
        argv.option("pauseBoolean", {
            alias: "pause",
            type: "boolean",
            describe: "True to pause, false to unpause",
            demandOption: true,
            requiresArg: true,
        });
        argv.option("safeAddress", {
            alias: "safe",
            type: "string",
            describe: "Target Gnosis safe address",
            demandOption: true,
            requiresArg: true,
        });
        return argv;
    },
    handler: systemStopHandler,
};
export default systemStopGnosis;

async function systemStopHandler(args: yargs.Arguments): Promise<void> {
    const ENV = args.environment as Environment;
    const MANAGER = getContractAddressByEnvironmentAndName(ENV, Contract.MANAGER);
    const STAKING = getContractAddressByEnvironmentAndName(ENV, Contract.STAKING);

    // At time of script creation, delegate contract not deployed
    let DELEGATE = "";
    try {
        DELEGATE = getContractAddressByEnvironmentAndName(ENV, Contract.DELEGATE);
    } catch (e) {
        console.log("No delegate contract");
    }

    if (ENV == "goerli") {
        chainId = 5;
    }
    safeAddress = args.safeAddress as string;

    const pause = args.pauseBoolean as boolean;
    let pauseString = "pause";
    if (!pause) {
        pauseString = "unpause";
    }

    await generatePoolTx(MANAGER, pauseString);
    await generateStakingTx(STAKING, pauseString);
    if (DELEGATE != "") {
        await generateDelegateTx(DELEGATE, pauseString);
    }
}

async function generatePoolTx(managerAddress: string, pauseString: string): Promise<void> {
    const managerContract = await ethers.getContractAt("Manager", managerAddress);
    const poolArray = await managerContract.getPools();

    console.log(chalk.bold.redBright("Creating pool pause batch transactions..."));
    let startingIndex = 0;
    const poolArrayLength = poolArray.length;
    const iLoopLength = Math.ceil(poolArrayLength / 8); // 8 txs per batch
    let txArray: Transaction[] = [];

    for (let i = 0; i < iLoopLength; i++) {
        const endingIndex = startingIndex + 8;
        for (let j = startingIndex; j < poolArrayLength && j < endingIndex; j++) {
            const currentPoolAddr = poolArray[j];
            const poolContract = await ethers.getContractAt("Pool", currentPoolAddr);
            txArray[j] = {
                transactionTargetAddress: currentPoolAddr,
                transactionValue: ethers.BigNumber.from(0),
                transactionData: poolContract.interface.encodeFunctionData(pauseString),
            };
        }
        startingIndex = endingIndex;

        // Removing empty elements from array
        const txArrayNoEmpties = txArray.filter((x) => x);

        console.log(chalk.yellowBright(`Sending transaction ${i + 1} of ${iLoopLength}...`));

        await sendTxToGnosis(txArrayNoEmpties);
        txArray = [];
    }

    console.log(chalk.bold.greenBright(`Transactions for pools sent to Gnosis safe address ${safeAddress}`));
}

async function generateStakingTx(stakingAddress: string, pauseString: string): Promise<void> {
    const stakingContract = await ethers.getContractAt("Staking", stakingAddress);
    console.log(chalk.bold.redBright("Creating Staking transaction..."));
    await sendTxToGnosis([
        {
            transactionTargetAddress: stakingAddress,
            transactionValue: ethers.BigNumber.from(0),
            transactionData: stakingContract.interface.encodeFunctionData(pauseString),
        },
    ]);
    console.log(chalk.bold.greenBright(`Transaction for Staking sent to Gnosis safe address ${safeAddress}`));
}

async function generateDelegateTx(delegateAddress: string, pauseString: string): Promise<void> {
    const delegateContract = await ethers.getContractAt("DelegateFunction", delegateAddress);
    console.log(chalk.bold.greenBright("Creating Delegate transaction..."));
    await sendTxToGnosis([
        {
            transactionTargetAddress: delegateAddress,
            transactionValue: ethers.BigNumber.from(0),
            transactionData: delegateContract.interface.encodeFunctionData(pauseString),
        },
    ]);
    console.log(chalk.bold.greenBright(`Transaction for Staking sent to Gnosis safe address ${safeAddress}`));
}

async function sendTxToGnosis(txs: Transaction[]): Promise<void> {
    await sendTransaction(safeAddress, txs, process.env.PRIVATE_KEY!, process.env.ALCHEMY_API_KEY!, chainId);
}
