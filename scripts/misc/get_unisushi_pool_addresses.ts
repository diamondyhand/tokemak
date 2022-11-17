import dotenv from "dotenv";
import {getCreate2Address} from "@ethersproject/address";
import {pack, keccak256} from "@ethersproject/solidity";

dotenv.config();
const UNI_FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const SUSHI_FACTORY_ADDRESS = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";

const UNI_INIT_HASH = "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f";
const SUSHI_INIT_HASH = "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303";

const main = async () => {
    find("ALCX", "0xdBdb4d16EdA451D0503b854CF79D55697F90c8DF", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", false);
    find("FOX", "0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", true);
    find("SUSHI", "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", false);
};

const find = (desc: string, tokenA: string, tokenB: string, uni: boolean) => {
    const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA];

    const address = getCreate2Address(
        uni ? UNI_FACTORY_ADDRESS : SUSHI_FACTORY_ADDRESS,
        keccak256(["bytes"], [pack(["address", "address"], [token0, token1])]),
        uni ? UNI_INIT_HASH : SUSHI_INIT_HASH
    );

    console.log("");
    console.log("--------------------------");
    console.log(`${desc} @ ${uni ? "Uniswap" : "Sushiswap"}`);
    console.log(`TokenA: ${tokenA}`);
    console.log(`TokenB: ${tokenB}`);
    console.log(`Pair ${address}`);
    console.log("--------------------------");
    console.log("");
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
