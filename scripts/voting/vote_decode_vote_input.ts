import InputDataDecoder from "ethereum-input-data-decoder";
import {artifacts, ethers} from "hardhat";
import chalk from "chalk";

const artifact = artifacts.require("VoteTracker");
const abi = artifact.abi;
const decoder = new InputDataDecoder(abi);

const data =
    "0x02fc74d300000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000001b8ea93b8ac77a43b98a0812d4d452a2d266b7758816a3117064ac5d89d5cf13be08e957ab2a209e9d15a7df5e7f9227c4f0341437e4f3a0edad089dea4850ad20000000000000000000000000aa821467df3996c445ac3b02464fa258b23a4c26310000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000089000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000";

const run = () => {
    const result = decoder.decodeData(data);

    console.log("");
    singleLine("Account", "0x" + result.inputs[0][0]);
    singleLine("Vote Session", result.inputs[0][1]);
    singleLine("Nonce", result.inputs[0][2].toString());
    singleLine("Chain Id", result.inputs[0][3].toString());
    singleLine("Total Votes", ethers.utils.formatEther(result.inputs[0][4]));
    console.log("");
    const ar = result.inputs[0][5];
    console.log(`${chalk.cyan(`Allocations:  (${ar ? ar.length : 0})`)}`);

    if (ar) {
        for (let i = 0; i < ar.length; i++) {
            const reactor = ethers.utils.parseBytes32String("0x" + ar[i][0]).split("-")[0];
            padSingleLine("Reactor", " " + reactor);
            padSingleLine("Votes", "   " + ethers.utils.formatEther(ar[i][1]));
            console.log("");
        }
    }

    singleLine("v", result.inputs[1]);
    singleLine("r", result.inputs[2]);
    singleLine("s", result.inputs[3]);
    console.log("");
};

const padSingleLine = (header: string, value: string) => {
    singleLine("   " + header, value);
};

const singleLine = (header: string, value: string) => {
    console.log(`${chalk.cyan(header + ":")} ${chalk.green(value)}`);
};

run();
