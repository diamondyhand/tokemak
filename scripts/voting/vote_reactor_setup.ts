import {ethers, artifacts} from "hardhat";
import dotenv from "dotenv";
import {VoteTracker} from "../../typechain";

dotenv.config();

export interface VoteReactorSetupInput {
    voteTracker: string;
}

export const runVoteReactorSetup = async (input: VoteReactorSetupInput): Promise<void> => {
    const voteArtifact = artifacts.require("VoteTracker");

    const reactors = {
        alcx: "0xdbdb4d16eda451d0503b854cf79d55697f90c8df",
        fxs: "0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0",
        ohm: "0x383518188c0c6d7730d91b2c03a03c837814a899",
        sushi: "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2",
        tcr: "0x9c4a4204b79dd291d6b6571c5be8bbcd0622f050",
    } as Record<string, string>;

    // const remove = {
    //   alcx: "0xdbdb4d16eda451d0503b854cf79d55697f90c8df",
    //   fxs: "0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0",
    //   ohm: "0x383518188c0c6d7730d91b2c03a03c837814a899",
    //   sushi: "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2",
    //   tcr: "0x9c4a4204b79dd291d6b6571c5be8bbcd0622f050",
    // } as Record<string, string>;

    const reactorKeys = Object.keys(reactors).map((x) => getReactorKeyEntry(reactors[x], x));
    // const removeReactorKeys = Object.keys(remove).map((x) =>
    //   getReactorKeyEntry(remove[x], x)
    // );

    const [deployer] = await ethers.getSigners();
    const voteTracker = (await ethers.getContractAt(voteArtifact.abi, input.voteTracker)) as unknown as VoteTracker;

    const yes = await voteTracker.connect(deployer).setReactorKeys(reactorKeys, true);
    await yes.wait();

    // const no = await voteTracker
    //   .connect(deployer)
    //   .setReactorKeys(removeReactorKeys, false);
    // await no.wait();
};

const getReactorKeyEntry = (address: string, key: string) => {
    return {
        token: address,
        key: ethers.utils.formatBytes32String(`${key}-default`),
    };
};
