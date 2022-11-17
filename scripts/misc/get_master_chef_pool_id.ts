import dotenv from "dotenv";
import {getCreate2Address} from "@ethersproject/address";
import {pack, keccak256} from "@ethersproject/solidity";
import MasterChefV1Abi from "../../abis/MasterChefV1.json";
import MasterChefV2Abi from "../../abis/MasterchefV2.json";
import {ethers} from "hardhat";
import {BigNumber} from "ethers";

dotenv.config();

const MASTERCHEF_V1 = "0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd";
const MASTERCHEF_V2 = "0xEF0881eC094552b2e128Cf945EF17a6752B4Ec5d";

const main = async () => {
    await finAndCheck("ALCX", "0xC3f279090a47e80990Fe3a9c30d24Cb117EF91a8");
    await finAndCheck("SUSHI", "0x795065dCc9f64b5614C407a6EFDC400DA6221FB0");
};

const finAndCheck = async (desc: string, lpToken: string) => {
    const found = await find(desc, lpToken);
    if (!found) {
        console.log("");
        console.log("--------------------------");
        console.log(desc);
        console.log(`LP Token: ${lpToken}`);
        console.log(`Not Found`);
        console.log("--------------------------");
        console.log("");
    }
};

const find = async (desc: string, lpToken: string) => {
    //Check V2
    const masterChefV2 = await ethers.getContractAt(MasterChefV2Abi, MASTERCHEF_V2);

    const v2PoolLength = await masterChefV2.poolLength();
    for (let i = 0; i < v2PoolLength; i++) {
        const queriedAddress = await masterChefV2.lpToken(i);
        if (queriedAddress.toLowerCase() == lpToken.toLowerCase()) {
            output(desc, false, i, lpToken);
            return true;
        }
    }

    //Check V1
    const masterChefV1 = await ethers.getContractAt(MasterChefV1Abi, MASTERCHEF_V1);

    const v1PoolLength = await masterChefV2.poolLength();
    for (let i = 0; i < v1PoolLength; i++) {
        const info: {
            lpToken: string;
            allocPoint: BigNumber;
            lastRewardBlock: BigNumber;
            accSushiPerShare: BigNumber;
        } = await masterChefV1.poolInfo(i);

        if (info?.lpToken?.toLowerCase() == lpToken.toLowerCase()) {
            output(desc, true, i, lpToken);
            return true;
        }
    }

    return false;
};

const output = (desc: string, v1: boolean, poolId: number, lpToken: string) => {
    console.log("");
    console.log("--------------------------");
    console.log(desc);
    console.log(`LP Token: ${lpToken}`);
    console.log(`Pool Id: ${poolId}`);
    console.log(`MasterChef Version: ${v1 ? "1" : "2"}`);
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
