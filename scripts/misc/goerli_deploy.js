const {ethers, upgrades} = require("hardhat");
const dotenv = require("dotenv");
// const bip39 = require("bip39");
// const hdkey = require("ethereumjs-wallet/dist/hdkey");
const chalk = require("chalk");

dotenv.config();

// const USDValue = (number) => {
//   return ethers.utils.parseUnits(number.toString(), 8);
// };

// const CYCLE_DURATION = process.env.DEFI_DEPLOY_CYCLE_DURATION
//   ? parseInt(process.env.DEFI_DEPLOY_CYCLE_DURATION)
//   : 6422;
// const MAX_TOTAL_VALUE = USDValue(
//   process.env.DEFI_DEPLOY_MAX_TOTAL_VALUE
//     ? parseInt(process.env.DEFI_DEPLOY_MAX_TOTAL_VALUE)
//     : 48000000
// );

async function main() {
    // let treasuryPublic = "";
    // let treasuryWrite = null;
    // if (!treasuryPublic) {
    //   const mnemonic = await bip39.generateMnemonic();
    //   const path = "m/44'/60'/0'/0/0";
    //   const hdwallet = hdkey.default.fromMasterSeed(
    //     await bip39.mnemonicToSeed(mnemonic)
    //   );
    //   const wallet = hdwallet.derivePath(path).getWallet();
    //   const public = `0x${wallet.getAddress().toString("hex")}`;
    //   const prvt = `0x${wallet.getPrivateKey().toString("hex")}`;
    //   treasuryPublic = public;
    //   treasuryWrite = () => {
    //     console.log(chalk.greenBright(`Treasury Mnemonic: ${mnemonic}`));
    //     console.log(chalk.greenBright(`Treasury Public: ${public}`));
    //     console.log(chalk.greenBright(`Treasury Private: ${prvt}`));
    //   };
    // }
    // console.log(chalk.greenBright(`Treasury address: ${treasuryPublic}`));
    // if (treasuryWrite) {
    //   treasuryWrite();
    // }
    // // Deploy Manager
    // const managerFactory = await ethers.getContractFactory("Manager");
    // const managerContract = await upgrades.deployProxy(
    //   managerFactory,
    //   [CYCLE_DURATION],
    //   {
    //     unsafeAllow: ["delegatecall"],
    //   }
    // );
    // await managerContract.deployed();
    // //Deploy our Pools
    // console.log(
    //   chalk.greenBright(`Manager contract address: ${managerContract.address}`)
    // );
    const ethPoolFactory = await ethers.getContractFactory("EthPool");
    const wethGenesisPool = await upgrades.deployProxy(ethPoolFactory, [
        "0xe5dB5477F7787862116ff92E7d33A244A4ca35E0",
        "0x93eC546fdcae65B10f2a409115612b2A21f53919",
        "TokemakWethPool",
        "tWETH",
    ]);
    await wethGenesisPool.deployed();
    console.log(chalk.greenBright(`WETH Pool contract address: ${wethGenesisPool.address}`));
    // const testnetTokenFactory = await ethers.getContractFactory("TestnetToken");
    // const usdcToken = await testnetTokenFactory.deploy("xUSDC", "xUSDC");
    // await usdcToken.deployed();
    // console.log(
    //   chalk.greenBright(`USDC Token contract address: ${usdcToken.address}`)
    // );
    // const poolFactory = await ethers.getContractFactory("Pool");
    // const usdcGenesisPool = await upgrades.deployProxy(poolFactory, [
    //   usdcToken.address,
    //   managerContract.address,
    //   "TokemakUsdcPool",
    //   "tUSDC",
    // ]);
    // await usdcGenesisPool.deployed();
    // console.log(
    //   chalk.greenBright(`USDC Pool contract address: ${usdcGenesisPool.address}`)
    // );
    // const tokePool = await upgrades.deployProxy(poolFactory, [
    //   "0xdcC9439Fe7B2797463507dD8669717786E51a014",
    //   managerContract.address,
    //   "TokemakTokePool",
    //   "tToke",
    // ]);
    // await tokePool.deployed();
    // console.log(
    //   chalk.greenBright(`Toke Pool contract address: ${tokePool.address}`)
    // );
    // const uniPool = await upgrades.deployProxy(poolFactory, [
    //   "0x78A405645246f1f4D887a6d22C688be75E530740",
    //   managerContract.address,
    //   "TokemakUniLPPool",
    //   "tUniLP",
    // ]);
    // await uniPool.deployed();
    // console.log(
    //   chalk.greenBright(`Uni Pool contract address: ${uniPool.address}`)
    // );
    // const sushiPool = await upgrades.deployProxy(poolFactory, [
    //   "0xF85F8A8690D405FaB654BbA630e4D0f6383f1e83",
    //   managerContract.address,
    //   "TokemakSushiLPPool",
    //   "tSushiLP",
    // ]);
    // await sushiPool.deployed();
    // console.log(
    //   chalk.greenBright(`Sushi Pool contract address: ${sushiPool.address}`)
    // );
    // // Register pools to manager
    // await managerContract.registerPool(wethGenesisPool.address);
    // await managerContract.registerPool(usdcGenesisPool.address);
    // await managerContract.registerPool(tokePool.address);
    // await managerContract.registerPool(uniPool.address);
    // await managerContract.registerPool(sushiPool.address);
    // const defiFactory = await ethers.getContractFactory("DefiRound");
    // const defiContract = await defiFactory.deploy(
    //   WETH_ADDRESS,
    //   treasuryPublic,
    //   MAX_TOTAL_VALUE
    // );
    // await defiContract.deployed();
    // console.log(
    //   chalk.greenBright(`DeFi contract address: ${defiContract.address}\r\n\r\n`)
    // );
    // console.log(
    //   chalk.greenBright(`\r\n=================================================`)
    // );

    // const testOracleFactory = await ethers.getContractFactory("TestOracle");
    // const oracle = await testOracleFactory.deploy();
    // await oracle.deployed();
    // console.log(chalk.greenBright(`oracle contract address: ${oracle.address}`));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
