import * as yargs from "yargs";
import {Environment, Contract, getContractAddressByEnvironmentAndName} from "../config";
import dotenv from "dotenv";
import {ethers} from "hardhat";
import chalk from "chalk";
import {BigNumber, Wallet} from "ethers";
import * as bip39 from "bip39";
import hdkey from "ethereumjs-wallet/dist/hdkey";
dotenv.config();

type Signature = {
    r: string;
    s: string;
    v: number;
};

type Receipt = {
    chainId: number;
    cycle: BigNumber;
    wallet: string;
    amount: BigNumber;
};

const rewardsDrain: yargs.CommandModule = {
    command: "drain-rewards",
    describe: "Emergency script to drain rewards to treasury",
    builder: (argv) => {
        argv.option("environment", {
            alias: "env",
            type: "string",
            describe: "Target environment",
            demandOption: true,
            requiresArg: true,
            choices: Object.values(Environment),
        });
        return argv;
    },
    handler: rewardsDrainHandler,
};

export default rewardsDrain;

async function rewardsDrainHandler(args: yargs.Arguments): Promise<void> {
    const env = args.environment as Environment;
    const [deployer] = await ethers.getSigners();
    const rewardsAddress = getContractAddressByEnvironmentAndName(env, Contract.REWARDS);
    const managerAddress = getContractAddressByEnvironmentAndName(env, Contract.MANAGER);
    const tokeAddress = getContractAddressByEnvironmentAndName(env, Contract.TOKE);
    const treasuryAddress = getContractAddressByEnvironmentAndName(env, Contract.TREASURY);

    const rewardsContract = await ethers.getContractAt("Rewards", rewardsAddress);
    const managerContract = await ethers.getContractAt("Manager", managerAddress);
    const tokeContract = await ethers.getContractAt("Toke", tokeAddress);

    console.log(`Original signer address: ${chalk.magentaBright(deployer.address)}`);

    const provider = ethers.provider;
    const newSignerWallet = new ethers.Wallet(await genWallet(), provider);

    const tx1 = await rewardsContract.connect(deployer).setSigner(newSignerWallet.address);
    await tx1.wait();

    const rewardsBalance = await tokeContract.balanceOf(rewardsAddress);
    const treasuryBalance = await tokeContract.balanceOf(treasuryAddress);

    const recipientStruct = {
        chainId: await deployer.getChainId(),
        cycle: await managerContract.getCurrentCycleIndex(),
        wallet: deployer.address,
        amount: rewardsBalance,
    } as Receipt;
    const {v, r, s} = await generateSignature(rewardsAddress, recipientStruct, newSignerWallet);

    const tx2 = await rewardsContract.connect(deployer).claim(recipientStruct, v, r, s);
    await tx2.wait();
    const transferTx = await tokeContract.connect(deployer).transfer(treasuryAddress, rewardsBalance);
    await transferTx.wait();

    const rewardsBalanceAfter = await tokeContract.balanceOf(rewardsAddress);
    const treasuryBalanceAfter = await tokeContract.balanceOf(treasuryAddress);

    console.log(`Rewards before: ${chalk.cyanBright(formatDecimals(rewardsBalance))}`);
    console.log(`Treasury before: ${chalk.cyanBright(formatDecimals(treasuryBalance))}`);
    console.log(`Rewards balance after: ${chalk.cyanBright(formatDecimals(rewardsBalanceAfter))}`);
    console.log(`Treasury balance after: ${chalk.cyanBright(formatDecimals(treasuryBalanceAfter))}`);
}

const formatDecimals = (balance: BigNumber): string => {
    return ethers.utils.formatEther(balance.toString());
};

// Need deployer to claim
const generateSignature = async (contract: string, recipient: Receipt, wallet: Wallet): Promise<Signature> => {
    const domain = {
        name: "TOKE Distribution",
        version: "1",
        chainId: recipient.chainId,
        verifyingContract: contract,
    };
    const types = {
        Recipient: [
            {name: "chainId", type: "uint256"},
            {name: "cycle", type: "uint256"},
            {name: "wallet", type: "address"},
            {name: "amount", type: "uint256"},
        ],
    };
    const data = {
        chainId: recipient.chainId,
        cycle: recipient.cycle,
        wallet: recipient.wallet,
        amount: recipient.amount,
    };

    let signature = await wallet._signTypedData(domain, types, data);
    signature = signature.slice(2);
    const r = "0x" + signature.substring(0, 64);
    const s = "0x" + signature.substring(64, 128);
    const v = parseInt(signature.substring(128, 130), 16);
    return {r, s, v};
};

const genWallet = async (): Promise<string> => {
    const mnemonic = await bip39.generateMnemonic();
    const path = "m/44'/60'/0'/0/0";
    const hdwallet = hdkey.fromMasterSeed(await bip39.mnemonicToSeed(mnemonic));
    const wallet = hdwallet.derivePath(path).getWallet();
    const prvt = `0x${wallet.getPrivateKey().toString("hex")}`;

    console.log(`New rewardSigner public: ${chalk.green(wallet.getChecksumAddressString())}`);
    console.log(`New rewardSigner private: ${chalk.greenBright(prvt)}`);

    return prvt;
};
