import * as yargs from "yargs";
import {Arguments} from "yargs";
import {getContractAddressByEnvironmentAndName, Contract, Environment} from "../config";
import {sendTransaction, Transaction} from "gnosis-tx-submitter";
import {ethers} from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const tokePause: yargs.CommandModule = {
    command: "pause-toke",
    describe: "Sends commmand to Gnosis to pause Toke token in case of emergency",
    builder: (argv) => {
        argv.option("environment", {
            alias: "env",
            type: "string",
            describe: "target environment",
            demandOption: true,
            requiresArg: true,
            choices: Object.values(Environment),
        });
        argv.option("safeAddress", {
            alias: "safe",
            type: "string",
            describe: "Gnosis safe address",
            demandOption: true,
            requiresArg: true,
        });
        return argv;
    },
    handler: tokePauseHandler,
};

export default tokePause;

export async function tokePauseHandler(args: Arguments): Promise<void> {
    const ENV = args.env as Environment;
    const TOKE = getContractAddressByEnvironmentAndName(ENV, Contract.TOKE);

    const tokeInterface = (await ethers.getContractFactory("Toke")).interface;

    const tx: Transaction = {
        transactionTargetAddress: TOKE,
        transactionValue: ethers.BigNumber.from(0),
        transactionData: tokeInterface.encodeFunctionData("pause", []),
    };

    let chainId = 1;
    if (ENV == "goerli") {
        chainId = 5;
    }

    await sendTransaction(
        args.safeAddress as string,
        [tx],
        process.env.PRIVATE_KEY!,
        process.env.ALCHEMY_API_KEY!,
        chainId
    );
}
