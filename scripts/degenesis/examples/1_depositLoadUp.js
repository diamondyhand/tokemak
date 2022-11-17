const {artifacts, ethers} = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();
const bip39 = require("bip39");
const hdkey = require("ethereumjs-wallet/dist/hdkey");
const chalk = require("chalk");

const fs = require("fs/promises");

const provider = new ethers.providers.JsonRpcProvider(process.env.HARDHAT_LOCALHOST);

const USDC_WHALE_ADDRESS = "0x0548F59fEE79f8832C299e01dCA5c76F034F558e";
const USDC_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

async function main() {
    const Defi = artifacts.require("DefiRound");

    const abiFile = await fs.readFile("./artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json", "utf-8");
    const erc20Artifact = JSON.parse(abiFile.toString());

    const defiContract = await ethers.getContractAt(Defi.abi, process.env.DEFI_CONFIG_DEFI_CONTRACT);

    //const usdc = new ethers.Contract(USDC_ADDRESS, erc20Artifact.abi, provider);

    // await doUsdcDeposit(100000, usdc, defiContract, provider);
    // await doUsdcDeposit(50000, usdc, defiContract, provider);
    // await doUsdcDeposit(7584, usdc, defiContract, provider);
    // await doUsdcDeposit(200, usdc, defiContract, provider);
    // await doUsdcDeposit(2500.657485, usdc, defiContract, provider);
    // await doUsdcDeposit(99999.999999, usdc, defiContract, provider);
    // await doUsdcDeposit(10, usdc, defiContract, provider);
    // await doUsdcDeposit(10, usdc, defiContract, provider);
    // await doUsdcDeposit(9927.5, usdc, defiContract, provider);
    // await doUsdcDeposit(100, usdc, defiContract, provider);
    // await doUsdcDeposit(50320, usdc, defiContract, provider);
    // await doUsdcDeposit(100000, usdc, defiContract, provider);
    // await doUsdcDeposit(100000, usdc, defiContract, provider);
    // await doUsdcDeposit(100000, usdc, defiContract, provider);
    // await doUsdcDeposit(100000, usdc, defiContract, provider);
    // await doUsdcDeposit(2500, usdc, defiContract, provider);
    // await doUsdcDeposit(100000, usdc, defiContract, provider);
    // await doUsdcDeposit(50000, usdc, defiContract, provider);
    // await doUsdcDeposit(7584, usdc, defiContract, provider);
    // await doUsdcDeposit(200, usdc, defiContract, provider);
    // await doUsdcDeposit(2500.657485, usdc, defiContract, provider);
    // await doUsdcDeposit(99999.999999, usdc, defiContract, provider);
    // await doUsdcDeposit(10, usdc, defiContract, provider);
    // await doUsdcDeposit(10, usdc, defiContract, provider);
    // await doUsdcDeposit(9927.5, usdc, defiContract, provider);
    // await doUsdcDeposit(100, usdc, defiContract, provider);
    // await doUsdcDeposit(50320, usdc, defiContract, provider);
    // await doUsdcDeposit(100000, usdc, defiContract, provider);
    // await doUsdcDeposit(100000, usdc, defiContract, provider);
    // await doUsdcDeposit(100000, usdc, defiContract, provider);
    // await doUsdcDeposit(100000, usdc, defiContract, provider);
    // await doUsdcDeposit(2500, usdc, defiContract, provider);
    // await doUsdcDeposit(100000, usdc, defiContract, provider);
    // await doUsdcDeposit(50000, usdc, defiContract, provider);
    // await doUsdcDeposit(7584, usdc, defiContract, provider);
    // await doUsdcDeposit(200, usdc, defiContract, provider);
    // await doUsdcDeposit(2500.657485, usdc, defiContract, provider);
    // await doUsdcDeposit(99999.999999, usdc, defiContract, provider);
    // await doUsdcDeposit(10, usdc, defiContract, provider);
    // await doUsdcDeposit(10, usdc, defiContract, provider);
    // await doUsdcDeposit(9927.5, usdc, defiContract, provider);
    // await doUsdcDeposit(100, usdc, defiContract, provider);
    // await doUsdcDeposit(50320, usdc, defiContract, provider);
    // await doUsdcDeposit(100000, usdc, defiContract, provider);
    // await doUsdcDeposit(100000, usdc, defiContract, provider);
    // await doUsdcDeposit(100000, usdc, defiContract, provider);
    // await doUsdcDeposit(100000, usdc, defiContract, provider);
    // await doUsdcDeposit(2500, usdc, defiContract, provider);

    // await doEthDeposit(44, defiContract, true);
    // await doEthDeposit(44, defiContract, true);
    // await doEthDeposit(44, defiContract, true);
    // await doEthDeposit(44, defiContract, true);
    // await doEthDeposit(44, defiContract, true);
    // await doEthDeposit(44, defiContract, true);
    // await doEthDeposit(20, defiContract, true);
    // await doEthDeposit(10, defiContract, true);
    // await doEthDeposit(40.99999999, defiContract, true);
    // await doEthDeposit(5.23478, defiContract, true);
    // await doEthDeposit(5, defiContract, true);
    // await doEthDeposit(1, defiContract, true);
    // await doEthDeposit(0.5, defiContract, true);
    // await doEthDeposit(0.5, defiContract, true);
    // await doEthDeposit(0.5, defiContract, true);
    // await doEthDeposit(0.05, defiContract, true);
    await doEthDeposit(0.001, defiContract, true);
    await doEthDeposit(0.001, defiContract, true);
    await doEthDeposit(9, defiContract, true);
    await doEthDeposit(18, defiContract, true);
    await doEthDeposit(0.001, defiContract, true);
    await doEthDeposit(44, defiContract, true);
    await doEthDeposit(44, defiContract, true);
    await doEthDeposit(44, defiContract, true);
    await doEthDeposit(44, defiContract, true);
    await doEthDeposit(44, defiContract, true);
    await doEthDeposit(44, defiContract, true);
    await doEthDeposit(20, defiContract, true);
    await doEthDeposit(10, defiContract, true);
    await doEthDeposit(40.99999999, defiContract, true);
    await doEthDeposit(5.23478, defiContract, true);
    await doEthDeposit(5, defiContract, true);
    await doEthDeposit(1, defiContract, true);
    await doEthDeposit(0.5, defiContract, true);
    await doEthDeposit(0.5, defiContract, true);
    await doEthDeposit(0.5, defiContract, true);
    await doEthDeposit(0.05, defiContract, true);
    await doEthDeposit(0.001, defiContract, true);
    await doEthDeposit(0.001, defiContract, true);
    await doEthDeposit(9, defiContract, true);
    await doEthDeposit(18, defiContract, true);
    await doEthDeposit(0.001, defiContract, true);
    await doEthDeposit(44, defiContract, true);
    await doEthDeposit(20, defiContract, true);
    await doEthDeposit(10, defiContract, true);
    await doEthDeposit(40.99999999, defiContract, true);
    await doEthDeposit(5.23478, defiContract, true);
    await doEthDeposit(5, defiContract, true);
    await doEthDeposit(1, defiContract, true);
    await doEthDeposit(0.5, defiContract, true);
    await doEthDeposit(0.5, defiContract, true);
    await doEthDeposit(0.5, defiContract, true);
    await doEthDeposit(0.05, defiContract, true);
    await doEthDeposit(0.001, defiContract, true);
    await doEthDeposit(0.001, defiContract, true);
    await doEthDeposit(9, defiContract, true);
    await doEthDeposit(18, defiContract, true);
    await doEthDeposit(0.001, defiContract, true);

    for (let i = 0; i < 500; i++) {
        await doEthDeposit(500, defiContract, false);
    }
}

const doEthDeposit = async (deposit, defiContract, writeOut) => {
    const wallet = await genWallet();

    let etherBal = ethers.utils.parseEther(`${Math.max(100, deposit * 2)}`).toHexString();
    if (etherBal.startsWith("0x0")) etherBal = "0x" + etherBal.substring(3);

    await provider.send("hardhat_setBalance", [wallet.public, etherBal]);

    const user2 = new ethers.Wallet(wallet.private, provider);
    await defiContract.connect(user2).deposit(WETHDeposit(deposit), [], {value: WETHAmount(deposit)});
    if (writeOut) {
        console.log(chalk.green("\r\n============================================================="));
        console.log(chalk.green(`Mnemonic: ${wallet.mnemonic}`));
        console.log(chalk.green(`Public Address: ${wallet.public}`));
        console.log(chalk.green(`Private: ${wallet.private}`));
        console.log(chalk.green(`ETH: ${deposit}`));
        console.log(chalk.green("=============================================================\r\n"));
    }
};

const doUsdcDeposit = async (deposit, usdc, defiContract) => {
    const usdcWhale = await provider.getSigner(USDC_WHALE_ADDRESS);

    await provider.send("hardhat_impersonateAccount", [USDC_WHALE_ADDRESS]);
    let etherBal = ethers.utils.parseEther(`550.0`).toHexString();
    let usdcLimit = 200000;
    if (etherBal.startsWith("0x0")) etherBal = "0x" + etherBal.substring(3);
    const wallet = await genWallet();

    await provider.send("hardhat_setBalance", [USDC_WHALE_ADDRESS, etherBal]); // ethers.utils.parseEther(`${ethLimit}.0`).toHexString()]);

    await provider.send("hardhat_setBalance", [wallet.public, etherBal]);

    const xxx = await usdc.connect(usdcWhale).transfer(wallet.public, USDCAmount(usdcLimit));
    await provider.send("hardhat_stopImpersonatingAccount", [USDC_WHALE_ADDRESS]);

    const user2 = new ethers.Wallet(wallet.private, provider);
    await usdc.connect(user2).approve(defiContract.address, USDCAmount(deposit));

    await xxx.wait();

    await defiContract.connect(user2).deposit(USDCDeposit(deposit), []);

    console.log(chalk.green("\r\n============================================================="));
    console.log(chalk.green(`Mnemonic: ${wallet.mnemonic}`));
    console.log(chalk.green(`Public Address: ${wallet.public}`));
    console.log(chalk.green(`Private: ${wallet.private}`));
    console.log(chalk.green(`USDC: ${deposit}`));
    console.log(chalk.green("=============================================================\r\n"));
};

const genWallet = async () => {
    const mnemonic = await bip39.generateMnemonic();
    const path = "m/44'/60'/0'/0/0";
    const hdwallet = hdkey.default.fromMasterSeed(await bip39.mnemonicToSeed(mnemonic));
    const wallet = hdwallet.derivePath(path).getWallet();
    const public = `0x${wallet.getAddress().toString("hex")}`;
    const prvt = `0x${wallet.getPrivateKey().toString("hex")}`;

    return {public, private: prvt, mnemonic};
};

const WETHAmount = (number) => {
    return ethers.utils.parseUnits(number.toString(), 18);
};
const WETHDeposit = (number) => {
    return [process.env.DEFI_DEPLOY_WETH, WETHAmount(number)];
};
const USDCDeposit = (number) => {
    return [process.env.DEFI_DEPLOY_USDC, USDCAmount(number)];
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
