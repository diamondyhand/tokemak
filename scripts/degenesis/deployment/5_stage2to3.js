const {artifacts, ethers} = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();

const DEPLOY = false;

async function main() {
    const Defi = artifacts.require("DefiRound");

    const defiContract = await ethers.getContractAt(Defi.abi, process.env.DEFI_CONFIG_DEFI_CONTRACT);
    const [deployer] = await ethers.getSigners();

    if (DEPLOY) {
        await defiContract.connect(deployer).transferToTreasury();
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
