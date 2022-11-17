import * as yargs from "yargs";
import {Arguments} from "yargs";
import {contractAddressByEnvironment, Environment, Contract} from "../config";
import {runVoteProxySubmitterSetup} from "../voting/vote_proxy_submitter_setup";

const voteProxySubmittersSetup: yargs.CommandModule = {
    command: "vote-proxy-submitters",
    describe: "configure vote tracker with allowed proxy accounts",
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

export default voteProxySubmittersSetup;

const getConfig = (env: Environment) => {
    if (env == Environment.GOERLI) {
        return ["0x54e49de986c42fc63006627e6860f08392c2e6b1", "0xf20617f2c776f84949ca614591ffac5bf4b7eb1d"];
    } else if (env == Environment.MAINNET) {
        return [
            "0x7ec994409c47f3d50d3ca1e13973bb04cc517849",
            "0x8868e9c4eeeb144fab404a73c40ee680f3db8492",
            "0x07b8f3efab5746e7a19664f9a063e442a50dbb13",
            "0x4c630c7b0dda86a34388a8f2b66c3029e761996f",
            "0xa3a9e9649719f7062065fd5f0da3c13c9453a12c",
            "0x8501750a3857592c27849b8a3c659a466ff10a45",
            "0xd1011b0de4c38acba38a15660e1842e12bec6d07",
            "0x8f84b7cfd9caed66d25afe57abc4027906fe8e99",
        ];
    } else {
        throw `Invalid Env ${env}`;
    }
};

export async function runVoteMultiplierSetupHandler(args: Arguments): Promise<void> {
    const targetEnv = args.environment as Environment;
    const addressKey = args.addressKey as string;

    const configs = getConfig(targetEnv);
    const contractAddressByName = contractAddressByEnvironment[targetEnv];

    if (!configs || !contractAddressByName) {
        throw new Error(`unknown target env ${targetEnv}`);
    }

    await runVoteProxySubmitterSetup({
        voteTracker: contractAddressByName[addressKey as Contract],
        addresses: configs,
    });
}
