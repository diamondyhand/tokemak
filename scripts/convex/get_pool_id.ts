import {ethers, run} from "hardhat";
import {WethController__factory} from "../../typechain";
import {Contract, getContractAddressByEnvironmentAndName, Environment, getChainIdByEnv} from "../config";

import ConvexBooster from "../../abis/ConvexBooster.json";

export const main = async (): Promise<void> => {
    const ENV = Environment.MAINNET;
    const CONVEX_BOOSTER = "0xF403C135812408BFbE8713b5A23a04b3D48AAE31";

    const lpToken = "0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA".toLowerCase();
    const rewards = "0x2ad92A7aE036a038ff02B96c88de868ddf3f8190".toLowerCase();

    const CHAIN_INFO = getChainIdByEnv(ENV);

    const chainValidation = (await ethers.provider.getNetwork()).chainId;
    if (CHAIN_INFO.l1 != chainValidation) throw "Mismatch Chain";

    const booster = await ethers.getContractAt(ConvexBooster, CONVEX_BOOSTER);

    for (let i = 0; i < 500; i++) {
        const pool = await booster.poolInfo(i);
        console.log(".");
        const l = pool[0];
        const r = pool[3];
        if (l.toString().toLowerCase() == lpToken && r.toString().toLowerCase() == rewards) {
            console.log("");
            console.log(`Pool Id ${i}`);
            console.log("");
            break;
        }
    }
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
