import {ethers, artifacts} from "hardhat";
import dotenv from "dotenv";
import {TestnetToken__factory} from "../../typechain";
import CurvePoolFactoryAbi from "../../abis/CurvePoolFactory.json";
import CurvePlainPoolAbi from "../../abis/CurvePlainPool.json";
import {string} from "yargs";

dotenv.config();

const poolArtifact = artifacts.require("Pool");

const main = async () => {
    //////////////////////////////
    //Params
    //////////////////////////////

    // const ASSET_TYPES = [
    //   'USD', = 0
    //   'ETH', = 1
    //   'BTC',  =2
    //   'Other',  =3
    // ];

    // // [[title, description], …]
    // const IMPLEMENTATIONS_COPY = [
    //   ['Basic', 'For pools that supports any major ERC20 return implementation (“return True / revert”, “return None / revert”, “return True / return False”), and any number of decimal places up to 18'],
    //   ['Balances', 'For pools with positive rebase tokens like aTokens, or where there’s a fee-on-transfer; tokens with negative rebases must not be used'],
    //   [config.nativeCurrency.symbol, `For pools containing native ${config.nativeCurrency.symbol} (represented as 0xEE…EE)`],
    //   ['Optimized', 'A more gas-efficient implementation that can be used when every token in the pool has 18 decimals and returns True on success / reverts on error'],
    // ];

    //Pool creation
    const AMPLIFICATION = 1000000000;
    const FEE = 4000000;

    const [deployer] = await ethers.getSigners();

    const test = false;

    const pools: {
        assetType: number;
        implementation: number;
        tAssetAddress: string;
        underlyer: string;
        assetName: string;
    }[] = [
        // {
        //   //FXS
        //   assetType: 3, //Other
        //   implementation: 0, //Basic
        //   tAssetAddress: "0xADF15Ec41689fc5b6DcA0db7c53c9bFE7981E655",
        //   underlyer: "0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0",
        //   assetName: "FXS",
        // },
        // {
        //   //ALCX
        //   assetType: 3, //Other
        //   implementation: 3, //Optimized
        //   tAssetAddress: "0xD3B5D9a561c293Fb42b446FE7e237DaA9BF9AA84",
        //   underlyer: "0xdBdb4d16EdA451D0503b854CF79D55697F90c8DF",
        //   assetName: "ALCX",
        // },
        // {
        //   //SUSHI
        //   assetType: 3, //Other
        //   implementation: 0, //Basic
        //   tAssetAddress: "0xf49764c9C5d644ece6aE2d18Ffd9F1E902629777",
        //   underlyer: "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2",
        //   assetName: "SUSHI",
        // },
        // {
        //   //FOX
        //   assetType: 3, //Other
        //   implementation: 0, //Basic
        //   tAssetAddress: "0x808D3E6b23516967ceAE4f17a5F9038383ED5311",
        //   underlyer: "0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d",
        //   assetName: "FOX",
        // },
        // {
        //   //TCR
        //   assetType: 3, //Other
        //   implementation: 3, //Optimized
        //   tAssetAddress: "0x15A629f0665A3Eb97D7aE9A7ce7ABF73AeB79415",
        //   underlyer: "0x9C4A4204B79dd291D6b6571C5BE8BbcD0622F050",
        //   assetName: "TCR",
        // },
        // {
        //   //APW
        //   assetType: 3, //Other
        //   implementation: 0, //Basic
        //   tAssetAddress: "0xDc0b02849Bb8E0F126a216A2840275Da829709B0",
        //   underlyer: "0x4104b135DBC9609Fc1A9490E61369036497660c8",
        //   assetName: "APW",
        // },
        // {
        //   //SNX
        //   assetType: 3, //Other
        //   implementation: 0, //Basic
        //   tAssetAddress: "0xeff721Eae19885e17f5B80187d6527aad3fFc8DE",
        //   underlyer: "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F",
        //   assetName: "SNX",
        // },
        // {
        //   //GAMMA
        //   assetType: 3, //Other
        //   implementation: 3, //Optimized
        //   tAssetAddress: "0x2Fc6e9c1b2C07E18632eFE51879415a580AD22E1",
        //   underlyer: "0x6BeA7CFEF803D1e3d5f7C0103f7ded065644e197",
        //   assetName: "GAMMA",
        // },
        // {
        //     //MYC
        //     assetType: 3, //Other
        //     implementation: 3, //Optimized
        //     tAssetAddress: "0x061aee9ab655e73719577EA1df116D7139b2A7E7",
        //     underlyer: "0x4b13006980aCB09645131b91D259eaA111eaF5Ba",
        //     assetName: "MYC",
        // },
    ];

    //Deploy the curve pool

    const poolFactory = await ethers.getContractAt(CurvePoolFactoryAbi, "0xb9fc157394af804a3578134a6585c0dc9cc990d4");

    const exec = (
        contract: any,
        pool: {
            assetType: number;
            implementation: number;
            tAssetAddress: string;
            underlyer: string;
            assetName: string;
        }
    ) => {
        const description = `Tokemak t${pool.assetName}/${pool.assetName}`;
        const symbol = `t${pool.assetName}`;

        console.log(`Description: ${description}`);
        console.log(`Symbol: ${symbol}`);
        console.log("Tokens");
        console.log(pool.tAssetAddress, pool.underlyer, ethers.constants.AddressZero, ethers.constants.AddressZero);
        console.log(`Amplification: ${AMPLIFICATION}`);
        console.log(`Fee: ${FEE}`);
        console.log(`Asset Type ${pool.assetType}`);
        console.log(`Implementation: ${pool.implementation}`);

        if (test) {
            return;
        }

        return contract["deploy_plain_pool(string,string,address[4],uint256,uint256,uint256,uint256)"](
            description,
            symbol,
            [pool.tAssetAddress, pool.underlyer, ethers.constants.AddressZero, ethers.constants.AddressZero],
            AMPLIFICATION,
            FEE,
            pool.assetType,
            pool.implementation
        );
    };

    for (let i = 0; i < pools.length; i++) {
        const pool = pools[i];

        const poolAddress = await exec(poolFactory.connect(deployer).callStatic, pool);
        if (!test) {
            const deployPoolResponse = await exec(poolFactory.connect(deployer), pool);
            await deployPoolResponse.wait();
        }

        console.log("");
        console.log(`Pool Address ${poolAddress}`);
        console.log("");
    }
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
