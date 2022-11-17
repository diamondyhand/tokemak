const {ethers, upgrades} = require("hardhat");
const dotenv = require("dotenv");

dotenv.config();

async function main() {
    const [deployer] = await ethers.getSigners();
    const tokenAddress = process.env.UNI_POOL;
    const managerAddress = process.env.DEFI_CONFIG_MANAGER;

    console.log(`Deployer: ${deployer.address}`);
    console.log(`Token Address ${tokenAddress}`);
    console.log(`Manager Address ${managerAddress}`);

    const poolFactory = await ethers.getContractFactory("Pool");

    const tokePool = await upgrades.deployProxy(poolFactory, [
        tokenAddress,
        managerAddress,
        "TokemakUniLPPool",
        "tUniLP",
    ]);
    await tokePool.deployed();

    console.log(`Reactor Address ${tokePool.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
