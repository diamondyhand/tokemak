import {ethers, run} from "hardhat";
import dotenv from "dotenv";
import {Contract, contractAddressByEnvironment, Environment} from "../config";

dotenv.config();

const main = async () => {
    const ENV = Environment.MAINNET;

    const EVENT_PROXY = contractAddressByEnvironment[ENV][Contract.EVENT_PROXY];

    const cycleRolloverTrackerFactory = await ethers.getContractFactory("CycleRolloverTracker");
    const cycleRolloverTracker = await cycleRolloverTrackerFactory.deploy(EVENT_PROXY);
    await cycleRolloverTracker.deployed();

    await new Promise((r) => setTimeout(r, 50000));

    try {
        await run("verify:verify", {
            address: cycleRolloverTracker.address,
            constructorArguments: [EVENT_PROXY],
            contract: "contracts/cycle-rollover-tracker/CycleRolloverTracker.sol:CycleRolloverTracker",
        });
    } catch (e) {
        console.log("Verify failed, come back to it");
    }

    console.log(`CycleRolloverTracker: ${cycleRolloverTracker.address}`);
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
