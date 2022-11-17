import {ethers, artifacts} from "hardhat";
import dotenv from "dotenv";
import {IStateReceiver} from "../../typechain/IStateReceiver";

import stateSenderAbi from "../../abis/PolygonStateSender.json";
import chalk from "chalk";

dotenv.config();

const main = async () => {
    const EVENT_TX = "0xb131f23c73e4ee2c100c7e4c3f0b67f34fb61608fbb5d9a2150090cb35278091";

    //Mainnet
    const POLYGON_FX_CHILD = "0x8397259c983751DAf40400790063935a11afa28a";
    const ETH_PROVIDER = "https://eth-mainnet.alchemyapi.io/v2/" + process.env.ALCHEMY_API_KEY;

    const STATE_SENDER_CALLER = "0x0000000000000000000000000000000000001001";

    await ethers.provider.send("hardhat_impersonateAccount", [STATE_SENDER_CALLER]);
    await ethers.provider.send("hardhat_setBalance", [STATE_SENDER_CALLER, "0x100000000000000000"]);
    const stateReceiverArtifact = artifacts.require("IStateReceiver");

    const stateReceiver: IStateReceiver = (await ethers.getContractAt(
        stateReceiverArtifact.abi,
        POLYGON_FX_CHILD
    )) as unknown as IStateReceiver;

    const stateSenderCaller = await ethers.provider.getSigner(STATE_SENDER_CALLER);

    const goerliProvider = new ethers.providers.JsonRpcProvider(ETH_PROVIDER);

    const eventTx = await goerliProvider.getTransactionReceipt(EVENT_TX);
    const log = eventTx.logs[0];
    const iface = new ethers.utils.Interface(stateSenderAbi);
    const logArgs = iface.parseLog(log);

    console.log(logArgs.name);

    //const eventProxy = artifacts.require("EventProxy");
    // await ethers.provider.send("hardhat_setCode", [
    //   "0xd8A2E435BE384482816e6f922a4553E03bd71A35",
    //   eventProxy.deployedBytecode,
    // ]);

    // const voteTracker = artifacts.require("VoteTracker");
    // await ethers.provider.send("hardhat_setCode", [
    //   "0xBbB7279B5716bd9a8FFD010B6f9A79fE7A104720",
    //   voteTracker.deployedBytecode,
    // ]);

    const fxData = ethers.utils.defaultAbiCoder.decode(["address", "address", "bytes"], logArgs.args[2]);

    const eventData = ethers.utils.defaultAbiCoder.decode(["bytes32", "bytes"], fxData[2]);

    const voteData = ethers.utils.defaultAbiCoder.decode(
        ["(address,bytes32,uint256,uint256,uint256,(bytes32,uint256)[])"],
        eventData[1]
    );

    console.log("");
    singleLine("Account", "0x" + voteData[0][0]);
    singleLine("Vote Session", voteData[0][1]);
    singleLine("Cycle Number", ethers.BigNumber.from(voteData[0][1]).toString());
    singleLine("Nonce", voteData[0][2].toString());
    singleLine("Chain Id", voteData[0][3].toString());
    singleLine("Total Votes", ethers.utils.formatEther(voteData[0][4]));
    console.log("");
    const ar = voteData[0][5];
    console.log(`${chalk.cyan(`Allocations:  (${ar ? ar.length : 0})`)}`);

    if (ar) {
        for (let i = 0; i < ar.length; i++) {
            const reactor = ethers.utils.parseBytes32String(ar[i][0]).split("-")[0];
            padSingleLine("Reactor", " " + reactor);
            padSingleLine("Votes", "   " + ethers.utils.formatEther(ar[i][1]));
            console.log("");
        }
    }

    const tx = await stateReceiver
        .connect(stateSenderCaller)
        .onStateReceive(logArgs.args[0].add(1000000000), logArgs.args[2]);

    await tx.wait();
};

const padSingleLine = (header: string, value: string) => {
    singleLine("   " + header, value);
};

const singleLine = (header: string, value: string) => {
    console.log(`${chalk.cyan(header + ":")} ${chalk.green(value)}`);
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
