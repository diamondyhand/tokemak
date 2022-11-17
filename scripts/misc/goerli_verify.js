// const {ethers} = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();
async function main() {
    // const USDValue = (number) => {
    //   return ethers.utils.parseUnits(number.toString(), 8);
    // };
    // const WETH_ADDRESS = process.env.DEFI_DEPLOY_WETH;
    // const MAX_TOTAL_VALUE = USDValue(
    //   process.env.DEFI_DEPLOY_MAX_TOTAL_VALUE
    //     ? parseInt(process.env.DEFI_DEPLOY_MAX_TOTAL_VALUE)
    //     : 48000000
    // );

    // //DEFI
    // await run("verify:verify", {
    //   address: "0x407FCca95B199f3e9D1D8640F5d98173c26c1a61",
    //   constructorArguments: [
    //     WETH_ADDRESS,
    //     "0xf150b381a0eecc51f41014e488b1886e090f9a04",
    //     MAX_TOTAL_VALUE,
    //   ],
    //   contract: "contracts/defi-round/DefiRound.sol:DefiRound",
    // });

    // //Manager
    // await run("verify:verify", {
    //   address: "0x271f9dBe44fDcD9413891B9F1aeCeE49D93F2eAc",
    //   constructorArguments: [],
    //   contract: "contracts/manager/Manager.sol:Manager",
    // });

    // //Rewards;
    // await run("verify:verify", {
    //   address: "0x6e4F49C6A38b1eDb790Aa1E5cFe1732b9f0BC412",
    //   constructorArguments: [
    //     "0xdcC9439Fe7B2797463507dD8669717786E51a014",
    //     "0x15ab2502ddd766065327a720af57893471a9f974",
    //   ],
    //   contract: "contracts/rewards/Rewards.sol:Rewards",
    // });

    // // //Sushi Uni Pool Toke Implementation
    // await run("verify:verify", {
    //   address: "0x9f9cc1533BC9994a6c6415155D73c035f6114F04",
    //   constructorArguments: [],
    //   contract: "contracts/pools/Pool.sol:Pool",
    // });

    // ETH Pool Implementation
    // await run("verify:verify", {
    //   address: "0xbcb00c1C10ec2503bA0381798c6927bE71F3ad10",
    //   constructorArguments: [],
    //   contract: "contracts/pools/EthPool.sol:EthPool",
    // });

    // USDC Token
    await run("verify:verify", {
        address: "0x1a15270036D6f5FcB0e94712A441Ccb13d744740",
        constructorArguments: ["xUSDC", "xUSDC"],
        contract: "contracts/testnet/TestnetToken.sol:TestnetToken",
    });

    // await run("verify:verify", {
    //   address: "0xd1C66661937AF59237dd6c3556996e6fd95A2FAd",
    //   constructorArguments: [],
    //   contract: "contracts/testnet/TestOracle.sol:TestOracle",
    // });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
