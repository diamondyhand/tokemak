import {BigNumber} from "ethers";
import {ethers, artifacts} from "hardhat";

const ERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/ERC20.sol");

export const FundToken = {
    FRAX: "FRAX",
    WETH: "WETH",
    WBTC: "WBTC",
    USDC: "USDC",
    DAI: "DAI",
    USDT: "USDT",
    TOKE: "TOKE",
};

export const FundTokenDecimals: Record<
    keyof typeof FundToken,
    {
        decimals: number;
        slot: number;
        address: string;
    }
> = {
    FRAX: {
        decimals: 18,
        slot: 0,
        address: "0x853d955aCEf822Db058eb8505911ED77F175b99e",
    },
    WETH: {
        decimals: 18,
        slot: 3,
        address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    },
    WBTC: {
        decimals: 8,
        slot: 0,
        address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    },
    USDC: {
        decimals: 6,
        slot: 9,
        address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    },
    DAI: {
        decimals: 18,
        slot: 2,
        address: "0x6b175474e89094c44da98b954eedeac495271d0f",
    },
    USDT: {
        decimals: 6,
        slot: 2,
        address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    },
    TOKE: {
        decimals: 18,
        slot: 0,
        address: "0x2e9d63788249371f1DFC918a52f8d799F4a38C94",
    },
};

export const tokenAmount = (token: keyof typeof FundToken, amount: number): BigNumber => {
    return ethers.utils.parseUnits(amount.toString(), FundTokenDecimals[token].decimals);
};

export const getTokenBalance = async (token: keyof typeof FundToken, forAddress: string): Promise<BigNumber> => {
    const contract = await ethers.getContractAt(ERC20.abi, FundTokenDecimals[token].address);

    return await contract.balanceOf(forAddress);
};

export const fundAccount = async (token: keyof typeof FundToken, toAddress: string, amount: number): Promise<void> => {
    const locallyManipulatedBalance = ethers.utils.parseUnits(amount.toString(), FundTokenDecimals[token].decimals);

    // Get storage slot index
    const index = ethers.utils.hexStripZeros(
        ethers.utils.solidityKeccak256(
            ["uint256", "uint256"],
            [toAddress, FundTokenDecimals[token].slot] // key, slot
        )
    );

    // Manipulate local balance (needs to be bytes32 string)
    await setStorageAt(
        FundTokenDecimals[token].address,
        index.toString(),
        toBytes32(locallyManipulatedBalance).toString()
    );
};

export const getLpTokenBalance = async (account: string, tokenAddress: string): Promise<BigNumber> => {
    const contract = await ethers.getContractAt(ERC20.abi, tokenAddress);
    return await contract.balanceOf(account);
};

export const pad = (value: BigNumber, pad: number): BigNumber => {
    return ethers.utils.parseUnits(value.toString(), pad);
};

export const toNumber = (value: BigNumber, pad: number): number => {
    return parseInt(ethers.utils.formatUnits(value, pad));
};

export const Amount = (num: number) => {
    return ethers.utils.parseUnits(num.toString(), 18);
};

const setStorageAt = async (address: string, index: string, value: string) => {
    await ethers.provider.send("hardhat_setStorageAt", [address, index, value]);
    await ethers.provider.send("evm_mine", []); // Just mines to the next block
};

const toBytes32 = (bn: BigNumber) => {
    return ethers.utils.hexlify(ethers.utils.zeroPad(bn.toHexString(), 32));
};
