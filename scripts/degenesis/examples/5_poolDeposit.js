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
        const Pool = artifacts.require("Pool");
        const usdcPool = await ethers.getContractAt(Pool.abi, process.env.DEFI_CONFIG_USDC_POOL);

        const user1 = new ethers.Wallet(process.env.DEFI_TEST_USER_PRIVATE, ethers.provider);

        const ERC20 = artifacts.require("ERC20");
        const usdc = new ethers.Contract(process.env.DEFI_DEPLOY_USDC, ERC20.abi, ethers.provider);

        await usdc.connect(user1).approve(usdcPool.address, USDCAmount(1000));
        await usdcPool.connect(user1).deposit(USDCAmount(1000));

        // const user2 = new ethers.Wallet(process.env.DEFI_TEST_USER_PRIVATE, ethers.provider);
        // await defiContract.connect(user2).finalizeAssets(true);
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
