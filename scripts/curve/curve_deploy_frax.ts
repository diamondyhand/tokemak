import {ethers, artifacts} from "hardhat";
import dotenv from "dotenv";
import {TestnetToken__factory} from "../../typechain";
import CurvePoolFactoryAbi from "../../abis/CurvePoolFactory.json";
import CurvePlainPoolAbi from "../../abis/CurvePlainPool.json";

dotenv.config();

const ERC20Artfiact = artifacts.require("TestnetToken");

const main = async () => {
    //////////////////////////////
    //Params
    //////////////////////////////

    //Pool creation
    const AMPLIFICATION = 1000000000;
    const FEE = 4000000;

    // const ASSET_TYPES = [
    //   'USD',
    //   'ETH',
    //   'BTC',
    //   'Other',
    // ];
    const ASSET_TYPE = 0;

    // // [[title, description], …]
    // const IMPLEMENTATIONS_COPY = [
    //   ['Basic', 'For pools that supports any major ERC20 return implementation (“return True / revert”, “return None / revert”, “return True / return False”), and any number of decimal places up to 18'],
    //   ['Balances', 'For pools with positive rebase tokens like aTokens, or where there’s a fee-on-transfer; tokens with negative rebases must not be used'],
    //   [config.nativeCurrency.symbol, `For pools containing native ${config.nativeCurrency.symbol} (represented as 0xEE…EE)`],
    //   ['Optimized', 'A more gas-efficient implementation that can be used when every token in the pool has 18 decimals and returns True on success / reverts on error'],
    // ];
    const IMPLEMENTATION = 0;

    //Amount of each token to add during initial liquidity add
    const INITIAL_LIQUIDITY_ADD_TOKEN_1 = 100;
    const INITIAL_LIQUIDITY_ADD_TOKEN_2 = 100;

    const TOKEN1_ADDRESS = "0x94671A3ceE8C7A12Ea72602978D1Bb84E920eFB2"; //tFRAX
    const TOKEN2_ADDRESS = "0x853d955acef822db058eb8505911ed77f175b99e"; //FRAX

    const [deployer] = await ethers.getSigners();

    //Perform these swaps in a loop from Token 1 to Token 2
    const TOKEN_1_SWAP_AMOUNTS = [20, 20, 20, 20, 20];

    console.log("");
    console.log("Pool Settings");
    console.log(`Amplification: ${AMPLIFICATION}`);
    console.log(`Fee: ${FEE}`);

    //Deploy the curve pool

    const poolFactory = await ethers.getContractAt(CurvePoolFactoryAbi, "0xb9fc157394af804a3578134a6585c0dc9cc990d4");

    const exec = (contract: any) => {
        return contract["deploy_plain_pool(string,string,address[4],uint256,uint256,uint256,uint256)"](
            "tFRAX/FRAX Test",
            "tFRAX+FRAX",
            [TOKEN1_ADDRESS, TOKEN2_ADDRESS, ethers.constants.AddressZero, ethers.constants.AddressZero],
            AMPLIFICATION,
            FEE,
            ASSET_TYPE,
            IMPLEMENTATION
        );
    };

    const poolAddress = await exec(poolFactory.connect(deployer).callStatic);
    const deployPoolResponse = await exec(poolFactory.connect(deployer));
    await deployPoolResponse.wait();

    console.log("");
    console.log(`Pool Address ${poolAddress}`);
    console.log("");

    //Provide the initial set of liquidity to the pool

    const poolContract = await ethers.getContractAt(CurvePlainPoolAbi, poolAddress);

    const token1 = await ethers.getContractAt(ERC20Artfiact.abi, TOKEN1_ADDRESS);
    const token2 = await ethers.getContractAt(ERC20Artfiact.abi, TOKEN2_ADDRESS);

    const t1approve = await token1.connect(deployer).approve(poolAddress, TokenAmount(INITIAL_LIQUIDITY_ADD_TOKEN_1));
    await t1approve.wait();

    const t2approve = await token2.connect(deployer).approve(poolAddress, TokenAmount(INITIAL_LIQUIDITY_ADD_TOKEN_2));
    await t2approve.wait();

    const execAddLiquidity = (contract: any) => {
        return contract["add_liquidity(uint256[2],uint256)"](
            [TokenAmount(INITIAL_LIQUIDITY_ADD_TOKEN_1), TokenAmount(INITIAL_LIQUIDITY_ADD_TOKEN_2)],
            0
        );
    };

    const initialLiquidityLPTokens = await execAddLiquidity(poolContract.connect(deployer).callStatic);
    const initialLiquidityLPTokensTx = await execAddLiquidity(poolContract.connect(deployer));
    await initialLiquidityLPTokensTx.wait();

    console.log("Initial Liquidity Add");
    console.log(`Token 1 Added: ${INITIAL_LIQUIDITY_ADD_TOKEN_1}`);
    console.log(`Token 2 Added: ${INITIAL_LIQUIDITY_ADD_TOKEN_2}`);
    console.log(`Initial LP Tokens Received ${ethers.utils.formatEther(initialLiquidityLPTokens)}`);
    console.log("");

    return;

    const exchange = async (user: any, coinToSend: number, coinToReceive: number, amount: number, min: number) => {
        const tokenAmount = TokenAmount(amount);
        const tokenMin = TokenAmount(min);

        const dy = await poolContract.connect(user).get_dy(coinToSend, coinToReceive, tokenAmount);

        await (coinToSend === 0 ? token1 : token2).connect(deployer).approve(poolContract.address, tokenAmount);

        await poolContract
            .connect(user)
            ["exchange(int128,int128,uint256,uint256)"](coinToSend, coinToReceive, tokenAmount, tokenMin);

        return dy;
    };

    for (let i = 0; i < TOKEN_1_SWAP_AMOUNTS.length; i++) {
        const amt = TOKEN_1_SWAP_AMOUNTS[i];
        const firstSwapAmountReceive = await exchange(deployer, 0, 1, amt, 0);

        console.log(`Token 2 Received on Swap ${i + 1} of ${amt}: ${ethers.utils.formatEther(firstSwapAmountReceive)}`);
    }
    console.log("");
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
