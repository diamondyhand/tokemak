const {ethers, artifacts} = require("hardhat");
const dotenv = require("dotenv");
const chalk = require("chalk");

dotenv.config();

const WETH_ADDRESS = process.env.DEFI_DEPLOY_WETH;
const USDC_ADDRESS = process.env.DEFI_DEPLOY_USDC;
const WETH_ORACLE_ADDRESS = process.env.DEFI_DEPLOY_WETH_ORACLE;
const USDC_ORACLE_ADDRESS = process.env.DEFI_DEPLOY_USDC_ORACLE;
const USER_LIMIT_WETH = process.env.DEFI_DEPLOY_USER_LIMIT_WETH
    ? parseFloat(process.env.DEFI_DEPLOY_USER_LIMIT_WETH)
    : 44;
const USER_LIMIT_USDC = process.env.DEFI_DEPLOY_USER_LIMIT_USDC
    ? parseFloat(process.env.DEFI_DEPLOY_USER_LIMIT_USDC)
    : 100000;
const WETH_POOL = process.env.DEFI_CONFIG_WETH_POOL;
const USDC_POOL = process.env.DEFI_CONFIG_USDC_POOL;

async function main() {
    const [deployer] = await ethers.getSigners();
    const Defi = artifacts.require("DefiRound");
    const defiContract = await ethers.getContractAt(Defi.abi, process.env.DEFI_CONFIG_DEFI_CONTRACT);

    const userWethLimit = WETHAmount(USER_LIMIT_WETH);
    const userUsdcLimit = USDCAmount(USER_LIMIT_USDC);

    const s = await defiContract.connect(deployer).addSupportedTokens([
        {
            token: WETH_ADDRESS,
            oracle: WETH_ORACLE_ADDRESS,
            genesis: WETH_POOL,
            maxLimit: userWethLimit,
        },
        {
            token: USDC_ADDRESS,
            oracle: USDC_ORACLE_ADDRESS,
            genesis: USDC_POOL,
            maxLimit: userUsdcLimit,
        },
    ]);
    await s.wait();

    console.log(chalk.greenBright(`\r\n=================================================`));
    console.log(chalk.greenBright(`WETH Pool contract address: ${WETH_POOL}`));
    console.log(chalk.greenBright(`USDC Pool contract address: ${USDC_POOL}`));
    console.log(chalk.greenBright(`DeFi contract address: ${defiContract.address}\r\n\r\n`));
    console.log(chalk.greenBright(`WETH Address: ${WETH_ADDRESS}`));
    console.log(chalk.greenBright(`USDC Address: ${USDC_ADDRESS}`));
    console.log(chalk.greenBright(`WETH Oracle Address: ${WETH_ORACLE_ADDRESS}`));
    console.log(chalk.greenBright(`USDC Oracle Address: ${USDC_ORACLE_ADDRESS}`));
    console.log(chalk.greenBright(`WETH User Limit: ${userWethLimit}`));
    console.log(chalk.greenBright(`USDC User Limit: ${userUsdcLimit}`));
    console.log(chalk.greenBright(`=================================================\r\n`));
}

const WETHAmount = (number) => {
    return ethers.utils.parseUnits(number.toString(), 18);
};
const USDCAmount = (number) => {
    return ethers.utils.parseUnits(number.toString(), 6);
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
