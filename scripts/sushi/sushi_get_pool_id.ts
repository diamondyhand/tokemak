import {BigNumberish} from "ethers";
import {ethers, artifacts, run} from "hardhat";
import dotenv from "dotenv";
// import {EventProxy} from "../typechain";

import factoryAbi from "../../abis/SushiswapRouter.json";
import pairAbi from "../../abis/SushiswapPair.json";

dotenv.config();

const main = async () => {
    const TOKEN_0_ADDRESS = "0x6b175474e89094c44da98b954eedeac495271d0f".toLowerCase();
    const TOKEN_1_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48".toLowerCase();

    const SUSHISWAP_FACTORY_ADDRESS = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";

    const factory = (await ethers.getContractAt(factoryAbi, SUSHISWAP_FACTORY_ADDRESS)) as any;

    const allPairsLength = await factory.allPairsLength();
    for (let i = 0; i < allPairsLength; i++) {
        const addr = await factory.allPairs(i);
        const pairContract = (await ethers.getContractAt(pairAbi, addr)) as any;
        const token0 = (await pairContract.token0()).toLowerCase();
        const token1 = (await pairContract.token1()).toLowerCase();
        if (
            (TOKEN_1_ADDRESS == token0 || TOKEN_1_ADDRESS == token1) &&
            (TOKEN_0_ADDRESS == token0 || TOKEN_0_ADDRESS == token1)
        ) {
            console.log(`Pair Address ${addr}`);
            console.log(`Pool Id ${i}`);
        }
    }
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
