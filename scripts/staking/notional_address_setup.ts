import {ethers, artifacts} from "hardhat";
import {Staking} from "../../typechain";

export const runNotionalSetup = async (
    stakingAddress: string,
    notionals: string[],
    indices: string[]
): Promise<void> => {
    const stakingArtifact = artifacts.require("Staking");
    const staking = (await ethers.getContractAt(stakingArtifact.abi, stakingAddress)) as unknown as Staking;

    const tx = await staking.setNotionalAddresses(indices, notionals);
    await tx.wait();

    console.log("Set notional addresses complete");
    for (let i = 0; i < notionals.length; i++) {
        console.log(`Notional: ${notionals[i]}, ScheduleIndex: ${indices[i]}`);
    }
};
