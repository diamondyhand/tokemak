const {artifacts, ethers} = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();

async function main() {
    const manager = artifacts.require("Manager");
    const managerContract = await ethers.getContractAt(manager.abi, process.env.DEFI_CONFIG_MANAGER);
    const [deployer] = await ethers.getSigners();

    console.log(`Deployer ${deployer.address}`);
    const cycleDuration = await managerContract.cycleDuration();
    console.log(`Cycle Duration ${cycleDuration}`);

    const currentCycle = await managerContract.currentCycle();
    console.log(`Current Cycle ${currentCycle}`);

    console.log(`Cycle Expiration ${currentCycle.add(cycleDuration)}`);
    console.log(`Current Block ${(await ethers.provider.getBlock()).number}`);

    const xx = await managerContract.connect(deployer).startCycleRollover();
    await xx.wait();

    const x = await managerContract.connect(deployer).completeRollover("X");
    await x.wait();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
