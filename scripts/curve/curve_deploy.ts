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
    const ASSET_TYPE = 0;
    const IMPLEMENTATION = 3;

    //Starting amount of tokens the LP can work with
    const TEST_TOKENS_AMOUNT_TO_MINT = 10000;

    //Amount of each token to add during initial liquidity add
    const INITIAL_LIQUIDITY_ADD_TOKEN_1 = 1000;
    const INITIAL_LIQUIDITY_ADD_TOKEN_2 = 1000;

    //Perform these swaps in a loop from Token 1 to Token 2
    const TOKEN_1_SWAP_AMOUNTS = [200, 200, 200, 200];

    const SECOND_ADD_LIQUIDITY = [90, 1800];

    const [deployer, liquidityProvider, swapper1] = await ethers.getSigners();

    console.log("");
    console.log("Pool Settings");
    console.log(`Amplification: ${AMPLIFICATION}`);
    console.log(`Fee: ${FEE}`);

    //Create our test tokens

    const erc20Factory = (await ethers.getContractFactory("TestnetToken", deployer)) as TestnetToken__factory;
    const token1 = await erc20Factory.deploy("token1", "token1", 18);
    const token2 = await erc20Factory.deploy("token2", "token2", 18);

    //Mint an initial amount to LP

    const tokenMint = async (address: string) => {
        await token1.mint(address, TokenAmount(TEST_TOKENS_AMOUNT_TO_MINT));
        await token2.mint(address, TokenAmount(TEST_TOKENS_AMOUNT_TO_MINT));
    };

    await tokenMint(liquidityProvider.address);
    await tokenMint(swapper1.address);

    //Deploy the curve pool

    const poolFactory = await ethers.getContractAt(CurvePoolFactoryAbi, "0xb9fc157394af804a3578134a6585c0dc9cc990d4");

    const exec = (contract: any) => {
        return contract["deploy_plain_pool(string,string,address[4],uint256,uint256,uint256,uint256)"](
            "Token1/Token2",
            "t1+t1",
            [token1.address, token2.address, ethers.constants.AddressZero, ethers.constants.AddressZero],
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

    await token1.connect(liquidityProvider).approve(poolAddress, TokenAmount(INITIAL_LIQUIDITY_ADD_TOKEN_1));
    await token2.connect(liquidityProvider).approve(poolAddress, TokenAmount(INITIAL_LIQUIDITY_ADD_TOKEN_2));

    const execAddLiquidity = (contract: any) => {
        return contract["add_liquidity(uint256[2],uint256)"](
            [TokenAmount(INITIAL_LIQUIDITY_ADD_TOKEN_1), TokenAmount(INITIAL_LIQUIDITY_ADD_TOKEN_2)],
            0
        );
    };

    const initialLiquidityLPTokens = await execAddLiquidity(poolContract.connect(liquidityProvider).callStatic);
    const initialLiquidityLPTokensTx = await execAddLiquidity(poolContract.connect(liquidityProvider));
    await initialLiquidityLPTokensTx.wait();

    console.log("Initial Liquidity Add");
    console.log(`Token 1 Added: ${INITIAL_LIQUIDITY_ADD_TOKEN_1}`);
    console.log(`Token 2 Added: ${INITIAL_LIQUIDITY_ADD_TOKEN_2}`);
    console.log(`Initial LP Tokens Received ${ethers.utils.formatEther(initialLiquidityLPTokens)}`);
    console.log("");

    const exchange = async (user: any, coinToSend: number, coinToReceive: number, amount: number, min: number) => {
        const tokenAmount = TokenAmount(amount);
        const tokenMin = TokenAmount(min);

        const dy = await poolContract.connect(user).get_dy(coinToSend, coinToReceive, tokenAmount);

        await (coinToSend === 0 ? token1 : token2).connect(swapper1).approve(poolContract.address, tokenAmount);

        await poolContract
            .connect(user)
            ["exchange(int128,int128,uint256,uint256)"](coinToSend, coinToReceive, tokenAmount, tokenMin);

        return dy;
    };

    for (let i = 0; i < TOKEN_1_SWAP_AMOUNTS.length; i++) {
        const amt = TOKEN_1_SWAP_AMOUNTS[i];
        const firstSwapAmountReceive = await exchange(swapper1, 0, 1, amt, 0);

        console.log(`Token 2 Received on Swap ${i + 1} of ${amt}: ${ethers.utils.formatEther(firstSwapAmountReceive)}`);
    }
    console.log("");

    const execSecondLiquidity = (contract: any, amount1: number, amount2: number) => {
        return contract["add_liquidity(uint256[2],uint256)"]([TokenAmount(amount1), TokenAmount(amount2)], 0);
    };

    await token1.connect(liquidityProvider).approve(poolAddress, TokenAmount(SECOND_ADD_LIQUIDITY[0]));
    await token2.connect(liquidityProvider).approve(poolAddress, TokenAmount(SECOND_ADD_LIQUIDITY[1]));

    const secondLP = await execSecondLiquidity(
        poolContract.connect(liquidityProvider).callStatic,
        SECOND_ADD_LIQUIDITY[0],
        SECOND_ADD_LIQUIDITY[1]
    );
    const secondLPTx = await execSecondLiquidity(
        poolContract.connect(liquidityProvider),
        SECOND_ADD_LIQUIDITY[0],
        SECOND_ADD_LIQUIDITY[1]
    );

    await secondLPTx.wait();

    console.log(
        `Second LP Tokens Received On Liquidity add of ${SECOND_ADD_LIQUIDITY[0]}, ${
            SECOND_ADD_LIQUIDITY[1]
        }: ${ethers.utils.formatEther(secondLP)}`
    );
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
