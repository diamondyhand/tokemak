const {artifacts, ethers} = require("hardhat");
const timeMachine = require("ganache-time-traveler");

const dotenv = require("dotenv");
dotenv.config();

const REVERT = false;

async function main() {
    let snapshotId = "";
    if (REVERT) {
        let snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
        console.log(`Snapshot Id: ${snapshotId}`);
    }

    try {
        const [deployer] = await ethers.getSigners();
        const Pool = artifacts.require("Pool");
        const usdcPool = await ethers.getContractAt(Pool.abi, process.env.DEFI_CONFIG_USDC_POOL);

        const user1 = new ethers.Wallet(process.env.DEFI_TEST_USER_PRIVATE, ethers.provider);

        await usdcPool.connect(user1).requestWithdrawal(USDCAmount(1000));

        const blocks = parseInt(process.env.DEFI_DEPLOY_CYCLE_DURATION);
        for (let i = 0; i < blocks; i++) {
            await ethers.provider.send("evm_mine", []);
        }

        const Manager = artifacts.require("Manager");
        const manager = await ethers.getContractAt(Manager.abi, process.env.DEFI_CONFIG_MANAGER);

        const start = await manager.connect(deployer).startCycleRollover();
        await start.wait();

        const stop = await manager.connect(deployer).completeRollover("X");
        await stop.wait();

        await usdcPool.connect(user1).withdraw(USDCAmount(1000));
    } finally {
        if (REVERT) {
            await timeMachine.revertToSnapshot(snapshotId);
        }
    }
}

// const WETHAmount = (number) => {
//   return ethers.utils.parseUnits(number.toString(), 18);
// };
const USDCAmount = (number) => {
    return ethers.utils.parseUnits(number.toString(), 6);
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
