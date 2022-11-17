import {ethers, artifacts} from "hardhat";
import dotenv from "dotenv";
import {TestnetToken__factory} from "../../typechain";
import CurvePoolFactoryAbi from "../../abis/CurvePoolFactory.json";
import CurvePlainPoolAbi from "../../abis/CurvePlainPool.json";
import CurvePoolProxyAbi from "../../abis/CurvePoolProxy.json";
import CurveFeeDistributorAbi from "../../abis/CurveFeeDistributor.json";

dotenv.config();

const ERC20Artfiact = artifacts.require("TestnetToken");

const main = async () => {
    //////////////////////////////
    //Params
    //////////////////////////////

    const POOL_ADDRESS = "0x694650a0B2866472c2EEA27827CE6253C1D13074";
    const POOL_FACTORY = "0xB9fC157394Af804a3578134A6585C0dc9cc990d4";
    const FEE_DISTRIBUTOR = "0xA464e6DCda8AC41e03616F95f4BC98a13b8922Dc";

    const [deployer] = await ethers.getSigners();

    const poolContract = await ethers.getContractAt(CurvePlainPoolAbi, POOL_ADDRESS);

    const withdraw_admin_fees = await poolContract.connect(deployer).withdraw_admin_fees();

    await withdraw_admin_fees.wait();

    const feeDistrbutor = await ethers.getContractAt(CurveFeeDistributorAbi, FEE_DISTRIBUTOR);
    console.log(feeDistrbutor);
    const feeClaimTx = await feeDistrbutor.connect(deployer).callStatic["claim()"]();

    console.log(`Result ${feeClaimTx}`);

    // const poolFactory = await ethers.getContractAt(
    //   CurvePoolFactoryAbi,
    //   POOL_FACTORY
    // );

    // const feeReceiver = await poolFactory.get_fee_receiver(POOL_ADDRESS);

    // console.log(`Fee Receiver ${feeReceiver}`);

    // const poolProxy = await ethers.getContractAt(CurvePoolProxyAbi, feeReceiver);

    // const burn = await poolProxy.connect(deployer).burn(POOL_ADDRESS);

    // await burn.wait();
};

const TokenAmount = (num: number) => {
    return ethers.utils.parseUnits(num.toString(), 18);
};

const exit = (code: number) => {
    console.log("");
    process.exit(code);
};

main()
    .then(() => exit(0))
    .catch((error) => {
        console.error(error);
        exit(1);
    });
