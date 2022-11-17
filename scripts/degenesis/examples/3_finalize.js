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
        const Defi = artifacts.require("DefiRound");
        const defiContract = await ethers.getContractAt(Defi.abi, process.env.DEFI_CONFIG_DEFI_CONTRACT);

        const user1 = new ethers.Wallet(process.env.DEFI_TEST_USER_PRIVATE, ethers.provider);
        await defiContract.connect(user1).finalizeAssets(true);

        // const user2 = new ethers.Wallet(process.env.DEFI_TEST_USER_PRIVATE, ethers.provider);
        // await defiContract.connect(user2).finalizeAssets(true);
    } finally {
        if (REVERT) {
            await timeMachine.revertToSnapshot(snapshotId);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
