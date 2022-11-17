const {artifacts, ethers} = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();
const bip39 = require("bip39");
const hdkey = require("ethereumjs-wallet/dist/hdkey");
const chalk = require("chalk");

async function main() {
    const Defi = artifacts.require("DefiRound");

    const defiContract = await ethers.getContractAt(Defi.abi, process.env.DEFI_CONFIG_DEFI_CONTRACT);

    const mnemonic = "";
    const path = "m/44'/60'/0'/0/0";
    const hdwallet = hdkey.default.fromMasterSeed(await bip39.mnemonicToSeed(mnemonic));
    const wallet = hdwallet.derivePath(path).getWallet();
    const public = `0x${wallet.getAddress().toString("hex")}`;
    const prvt = `0x${wallet.getPrivateKey().toString("hex")}`;

    console.log(chalk.greenBright(`Treasury Mnemonic: ${mnemonic}`));
    console.log(chalk.greenBright(`Treasury Public: ${public}`));
    console.log(chalk.greenBright(`Treasury Private: ${prvt}`));

    await ETHWithdraw(defiContract, "", 0.00001);

    const usdcAmt = Math.floor(parseInt(process.env.DEFI_DEPLOY_USER_LIMIT_USDC) * 0.5);
    const user = new ethers.Wallet(process.env.DEFI_TEST_USER_PRIVATE, ethers.provider);
    await defiContract.connect(user).withdraw(USDCDeposit(usdcAmt), false);

    const ethAmt = Math.floor(parseInt(process.env.DEFI_DEPLOY_USER_LIMIT_WETH) * 0.5);
    const user2 = new ethers.Wallet(process.env.DEFI_TEST_USER_PRIVATE_2, ethers.provider);
    await defiContract.connect(user2).withdraw(WETHDeposit(ethAmt), true);

    await USDCWithdraw(defiContract, "", 500);
    await ETHWithdraw(defiContract, "", 400);
}

const USDCWithdraw = async (defiContract, private, amt) => {
    const user = new ethers.Wallet(private, ethers.provider);
    await defiContract.connect(user).withdraw(USDCDeposit(amt), false);
};

const ETHWithdraw = async (defiContract, private, amt) => {
    const user2 = new ethers.Wallet(private, ethers.provider);
    await defiContract.connect(user2).withdraw(WETHDeposit(amt), true);
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
