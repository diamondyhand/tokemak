import {ethers, run} from "hardhat";
import {ConvexController__factory} from "../../typechain";
import {Contract, contractAddressByEnvironment, Environment} from "../config";

export const main = async (): Promise<void> => {
    outputId("curve2");
    outputId("curve3");
    outputId("curve4");
    outputId("convex");
};

const outputId = (id: string) => {
    console.log(`Id ${id} - ${ethers.utils.formatBytes32String(id)}`);
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
