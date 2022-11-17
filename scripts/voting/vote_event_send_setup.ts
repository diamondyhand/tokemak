import {ethers, artifacts} from "hardhat";
import {Pool} from "../../typechain";

export interface VoteEventSendSetupInput {
    address: string;
    enable: boolean;
    fxProxy: string;
    l2Destination: string;
}

export const runVoteEventSend = async (input: VoteEventSendSetupInput[]): Promise<void> => {
    const ILiquidityPool = await artifacts.require("ILiquidityPool");
    for (let i = 0; i < input.length; i++) {
        //These are not technically all liqiduity pools but the method signatures on what we're calling are
        //all the same. Need to refactor to shared interface.

        const contract = (await ethers.getContractAt(ILiquidityPool.abi, input[i].address)) as Pool;

        if (input[i].enable) {
            const tx2 = await contract.setDestinations(input[i].fxProxy, input[i].l2Destination);
            await tx2.wait();
            console.log(`Contract ${input[i].address} FX: ${input[i].fxProxy}, L2: ${input[i].l2Destination}`);
        }

        const tx = await contract.setEventSend(input[i].enable);
        await tx.wait();
        console.log(`Contract ${input[i].address} Event Send = ${input[i].enable}`);

        console.log("-------------");
    }
};
