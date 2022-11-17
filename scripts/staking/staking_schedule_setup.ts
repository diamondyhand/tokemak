import {BigNumber} from "@ethersproject/bignumber";
import {ethers, artifacts} from "hardhat";
import {Staking} from "../../typechain";
// import timeMachine from "ganache-time-traveler";

export interface ScheduleSetupInput {
    contract: string;
    tokeAddress: string;
    schedule: {
        cliff: number;
        duration: number;
        interval: number;
        isActive: boolean;
        hardStart: number;
        isPublic: boolean;
    };
    notionalAddress: string;
}

export const runScheduleSetup = async (input: ScheduleSetupInput): Promise<void> => {
    const [deployer] = await ethers.getSigners();
    const artifact = artifacts.require("Staking");
    const stakingContract = (await ethers.getContractAt(artifact.abi, input.contract)) as unknown as Staking;

    let tx = await stakingContract.connect(deployer).addSchedule(
        {
            cliff: input.schedule.cliff,
            duration: input.schedule.duration,
            interval: input.schedule.interval,
            setup: true,
            isActive: input.schedule.isActive,
            hardStart: input.schedule.hardStart,
            isPublic: input.schedule.isPublic,
        },
        input.notionalAddress
    );

    const receipt = await tx.wait();

    const result = ethers.utils.defaultAbiCoder.decode(
        ["uint256", "uint256", "uint256", "uint256", "bool", "bool", "uint256", "address"],
        receipt.logs[0].data
    );

    const scheduleIndex = result[0].toString();
    console.log(`Schedule Index: ${scheduleIndex}`);
    console.log(`Cliff: ${result[1].toString()}`);
    console.log(`Duration: ${result[2].toString()}`);
    console.log(`Interval: ${result[3].toString()}`);
    console.log(`Setup: ${result[4].toString()}`);
    console.log(`IsActive: ${result[5].toString()}`);
    console.log(`Hard Start: ${result[6].toString()}`);
    if (input.schedule.hardStart > 0) {
        console.log(`Hard Start: ${new Date(Number(result[6].toString()) * 1000)}`);
    }
    console.log(`Notional: ${result[7].toString()}`);
    console.log("");

    return;

    if (ethers.provider._network.name === "homestead" && input.schedule.hardStart > 0) {
        //Give deployer some TOKE
        const depositAmount = ethers.utils.parseUnits("520", 18);
        const index = ethers.utils.solidityKeccak256(
            ["uint256", "uint256"],
            [deployer.address, 0] // key, slot
        );
        await ethers.provider.send("hardhat_setStorageAt", [
            input.tokeAddress,
            index,
            toBytes32(depositAmount).toString(),
        ]);
        await ethers.provider.send("evm_mine", []); // Just mines to the next block

        tx = await stakingContract.connect(deployer)["deposit(uint256,uint256)"](depositAmount, scheduleIndex);
        await tx.wait();

        //Run against latest code in your branch
        // const artifact = artifacts.require("Staking");

        // await network.provider.send("hardhat_setCode", [
        //   input.contract,
        //   artifact.deployedBytecode,
        // ]);

        console.log("Vesting 520 TOKE");
        console.log("");

        const cliffEndTime = new Date((input.schedule.hardStart + input.schedule.cliff) * 1000);
        console.log(`Cliff End ${cliffEndTime.toString()}`);

        let currentBlockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

        await ethers.provider.send("evm_setNextBlockTimestamp", [cliffEndTime.getTime() / 1000 - 60]);
        await ethers.provider.send("evm_mine", []);
        currentBlockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
        console.log(`Current Time ${new Date(currentBlockTimestamp * 1000)} (60 Seconds Before Cliff)`);
        let vested = await stakingContract.vested(deployer.address, scheduleIndex);
        console.log(`Vested At this time ${ethers.utils.formatUnits(vested, 18)}`);
        console.log("");
        await ethers.provider.send("evm_setNextBlockTimestamp", [cliffEndTime.getTime() / 1000]);
        await ethers.provider.send("evm_mine", []);
        currentBlockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
        console.log(`Current Time ${new Date(currentBlockTimestamp * 1000)} (Cliff End)`);
        vested = await stakingContract.vested(deployer.address, scheduleIndex);
        console.log(`Vested At this time ${ethers.utils.formatUnits(vested, 18)}`);
        console.log("");
        let ix = 0;
        do {
            console.log("");
            await ethers.provider.send("evm_increaseTime", [input.schedule.interval + 10]);
            await ethers.provider.send("evm_mine", []);
            currentBlockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
            console.log(`Current Time ${new Date(currentBlockTimestamp * 1000)}`);

            const vested = await stakingContract.vested(deployer.address, scheduleIndex);
            console.log(`Vested At this time ${ethers.utils.formatUnits(vested, 18)}`);

            ix += input.schedule.interval;
        } while (ix < input.schedule.duration);
    }
};

const toBytes32 = (bn: BigNumber) => {
    return ethers.utils.hexlify(ethers.utils.zeroPad(bn.toHexString(), 32));
};
