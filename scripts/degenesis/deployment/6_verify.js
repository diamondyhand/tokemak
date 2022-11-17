const {ethers} = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();
async function main() {
    const USDValue = (number) => {
        return ethers.utils.parseUnits(number.toString(), 8);
    };
    const CYCLE_DURATION = process.env.DEFI_DEPLOY_CYCLE_DURATION
        ? parseInt(process.env.DEFI_DEPLOY_CYCLE_DURATION)
        : 6422;
    const WETH_ADDRESS = process.env.DEFI_DEPLOY_WETH;
    const USDC_ADDRESS = process.env.DEFI_DEPLOY_USDC;
    const MAX_TOTAL_VALUE = USDValue(
        process.env.DEFI_DEPLOY_MAX_TOTAL_VALUE ? parseInt(process.env.DEFI_DEPLOY_MAX_TOTAL_VALUE) : 48000000
    );
    let treasuryPublic = process.env.DEFI_TREASURY_PUBLIC;

    await run("verify:verify", {
        address: process.env.DEFI_CONFIG_DEFI_CONTRACT,
        constructorArguments: [WETH_ADDRESS, treasuryPublic, MAX_TOTAL_VALUE],
        contract: "contracts/defi-round/DefiRound.sol:DefiRound",
    });

    await run("verify:verify", {
        address: process.env.DEFI_CONFIG_MANAGER,
        constructorArguments: [CYCLE_DURATION],
        contract: "contracts/manager/Manager.sol:Manager",
    });

    //Rewards
    // await run("verify:verify", {
    //   address: "0x79dD22579112d8a5F7347c5ED7E609e60da713C5",
    //   constructorArguments: [
    //     "0x2e9d63788249371f1DFC918a52f8d799F4a38C94",
    //     signerAddress,
    //   ],
    //   contract: "contracts/rewards/Rewards.sol:Rewards",
    // });

    // //Sushi Uni Pool Toke Implementation
    // await run("verify:verify", {
    //   address: "0xbbfC7D1D53116830326478F77F489530CEC7Ba8a",
    //   constructorArguments: [],
    //   contract: "contracts/pools/Pool.sol:Pool",
    // });

    // //USDC Pool Implementation
    // await run("verify:verify", {
    //   address: "0xcA5E07804BeEF19b6E71B9db18327D215CD58d4E",
    //   constructorArguments: [],
    //   contract: "contracts/pools/Pool.sol:Pool",
    // });

    // //USDC Pool Implementation
    // await run("verify:verify", {
    //   address: "0x77F18a6968a38F9Aef1aF676420c4799E8b864ee",
    //   constructorArguments: [],
    //   contract: "contracts/pools/EthPool.sol:EthPool",
    // });

    await run("verify:verify", {
        address: process.env.DEFI_CONFIG_USDC_POOL,
        constructorArguments: [USDC_ADDRESS, process.env.DEFI_CONFIG_MANAGER, "TokemakUsdcPool", "tUSDC"],
        contract: "contracts/pools/Pool.sol:Pool",
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
