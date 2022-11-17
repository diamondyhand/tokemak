const {artifacts, ethers} = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();

async function main() {
    const Defi = artifacts.require("DefiRound");

    const defiContract = await ethers.getContractAt(Defi.abi, process.env.DEFI_CONFIG_DEFI_CONTRACT);
    const user = new ethers.Wallet(process.env.DEFI_TEST_USER_PRIVATE, ethers.provider);

    const ERC20 = artifacts.require("ERC20");
    const usdc = new ethers.Contract(process.env.DEFI_DEPLOY_USDC, ERC20.abi, ethers.provider);

    const usdcAmt = Math.floor(parseInt(process.env.DEFI_DEPLOY_USER_LIMIT_USDC) * 0.9);
    await usdc.connect(user).approve(defiContract.address, USDCAmount(usdcAmt));
    await defiContract.connect(user).deposit(USDCDeposit(usdcAmt), []);

    const ethAmt = Math.floor(parseInt(process.env.DEFI_DEPLOY_USER_LIMIT_WETH) * 0.9);
    const user2 = new ethers.Wallet(process.env.DEFI_TEST_USER_PRIVATE_2, ethers.provider);
    await defiContract.connect(user2).deposit(WETHDeposit(ethAmt), [], {value: WETHAmount(ethAmt)});
}

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
