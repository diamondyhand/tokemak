const {ethers, upgrades} = require("hardhat");
const dotenv = require("dotenv");
const bip39 = require("bip39");
const hdkey = require("ethereumjs-wallet/dist/hdkey");
const chalk = require("chalk");

dotenv.config();

const USDValue = (number) => {
    return ethers.utils.parseUnits(number.toString(), 8);
};

const CYCLE_DURATION = process.env.DEFI_DEPLOY_CYCLE_DURATION ? parseInt(process.env.DEFI_DEPLOY_CYCLE_DURATION) : 6422;
const WETH_ADDRESS = process.env.DEFI_DEPLOY_WETH;
const USDC_ADDRESS = process.env.DEFI_DEPLOY_USDC;
const MAX_TOTAL_VALUE = USDValue(
    process.env.DEFI_DEPLOY_MAX_TOTAL_VALUE ? parseInt(process.env.DEFI_DEPLOY_MAX_TOTAL_VALUE) : 48000000
);

async function main() {
    let treasuryPublic = process.env.DEFI_TREASURY_PUBLIC;
    let treasuryWrite = null;
    if (!treasuryPublic) {
        const mnemonic = await bip39.generateMnemonic();
        const path = "m/44'/60'/0'/0/0";
        const hdwallet = hdkey.default.fromMasterSeed(await bip39.mnemonicToSeed(mnemonic));
        const wallet = hdwallet.derivePath(path).getWallet();
        const public = `0x${wallet.getAddress().toString("hex")}`;
        const prvt = `0x${wallet.getPrivateKey().toString("hex")}`;
        treasuryPublic = public;

        treasuryWrite = () => {
            console.log(chalk.greenBright(`Treasury Mnemonic: ${mnemonic}`));
            console.log(chalk.greenBright(`Treasury Public: ${public}`));
            console.log(chalk.greenBright(`Treasury Private: ${prvt}`));
        };
    }

    // Deploy Manager
    const managerFactory = await ethers.getContractFactory("Manager");
    const managerContract = await upgrades.deployProxy(managerFactory, [CYCLE_DURATION], {
        unsafeAllow: ["delegatecall", "constructor"],
    });
    await managerContract.deployed();
    //Deploy our Pools

    const poolFactory = await ethers.getContractFactory("Pool");

    const wethGenesisPool = await upgrades.deployProxy(poolFactory, [
        WETH_ADDRESS,
        managerContract.address,
        "TokemakWethPool",
        "tWETH",
    ]);
    await wethGenesisPool.deployed();

    const usdcGenesisPool = await upgrades.deployProxy(poolFactory, [
        USDC_ADDRESS,
        managerContract.address,
        "TokemakUsdcPool",
        "tUSDC",
    ]);
    await usdcGenesisPool.deployed();

    // Register pools to manager
    await managerContract.registerPool(wethGenesisPool.address);
    await managerContract.registerPool(usdcGenesisPool.address);

    const defiFactory = await ethers.getContractFactory("DefiRound");
    const defiContract = await defiFactory.deploy(WETH_ADDRESS, treasuryPublic, MAX_TOTAL_VALUE);
    await defiContract.deployed();

    console.log(chalk.greenBright(`\r\n=================================================`));
    console.log(chalk.greenBright(`Treasury address: ${treasuryPublic}`));
    console.log(chalk.greenBright(`Manager contract address: ${managerContract.address}`));
    console.log(chalk.greenBright(`WETH Pool contract address: ${wethGenesisPool.address}`));
    console.log(chalk.greenBright(`USDC Pool contract address: ${usdcGenesisPool.address}`));
    console.log(chalk.greenBright(`DeFi contract address: ${defiContract.address}\r\n\r\n`));
    console.log(chalk.greenBright(`Manager Cycle Duration: ${CYCLE_DURATION}`));
    console.log(chalk.greenBright(`WETH Address: ${WETH_ADDRESS}`));
    console.log(chalk.greenBright(`USDC Address: ${USDC_ADDRESS}`));
    console.log(chalk.greenBright(`Max Total Value: ${MAX_TOTAL_VALUE}`));
    if (treasuryWrite) {
        treasuryWrite();
    }
    console.log(chalk.greenBright(`=================================================\r\n`));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
