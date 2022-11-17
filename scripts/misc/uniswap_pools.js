const {ethers} = require("hardhat");
const {ChainId, Token, WETH, Pair} = require("@uniswap/sdk");
const dotenv = require("dotenv");

dotenv.config();

async function main() {
    // eslint-disable-next-line no-unused-vars
    const [deployer] = await ethers.getSigners();

    console.log(ChainId);
    console.log(WETH);

    const wethAddress = WETH[ChainId.MAINNET];
    const tokeContract = new Token(ChainId.MAINNET, "0x2e9d63788249371f1DFC918a52f8d799F4a38C94", 18);
    const sushiContract = new Token(ChainId.MAINNET, "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2", 18);

    console.log(wethAddress);
    console.log(tokeContract);

    // NOTE:
    const wethTokePair = Pair.getAddress(wethAddress, tokeContract);
    const wethSushiPair = Pair.getAddress(wethAddress, sushiContract);
    console.log("WETH/TOKE Pair Uniswap:", wethTokePair);
    console.log("WETH/TOKE Pair Sushi:", wethSushiPair);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
