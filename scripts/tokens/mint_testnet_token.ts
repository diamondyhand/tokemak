import {artifacts, ethers} from "hardhat";
import {TestnetToken} from "../../typechain";

export interface MintTestnetTokenArgs {
    tokenAddress: string;
    destination: string;
    amount: number;
    decimals: number;
}

export const runMintTestnetTokenSetup = async (input: MintTestnetTokenArgs): Promise<void> => {
    const [deployer] = await ethers.getSigners();

    console.log(`Deployer: ${deployer.address}`);
    console.log(`Token: ${input.tokenAddress}`);
    console.log(`Destination: ${input.destination}`);
    console.log(`Amount: ${input.amount}`);
    console.log(`Decimals: ${input.decimals}`);

    const artifact = await artifacts.require("TestnetToken");

    const contract = (await ethers.getContractAt(artifact.abi, input.tokenAddress)) as unknown as TestnetToken;

    const addresses = input.destination.split(",");

    for (let i = 0; i < addresses.length; i++) {
        await contract
            .connect(deployer)
            .mint(addresses[i], ethers.utils.parseUnits(input.amount.toString(), input.decimals));

        console.log(`Minted to ${addresses[i]}`);
    }

    console.log("Complete");
};
