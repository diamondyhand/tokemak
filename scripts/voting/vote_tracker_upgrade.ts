import {ethers, run, artifacts} from "hardhat";

import dotenv from "dotenv";
import {ProxyAdmin} from "../../typechain";
import {Contract, Environment, getContractAddressByEnvironmentAndName} from "../config";

dotenv.config();

const proxyAdminArtifact = artifacts.require("ProxyAdmin");

const ENV = Environment.MAINNET;

async function main() {
    const PROXY_ADMIN_ADDRESS = getContractAddressByEnvironmentAndName(ENV, Contract.PROXY_ADMIN_POLYGON);
    const VOTE_TRACKER = getContractAddressByEnvironmentAndName(ENV, Contract.VOTE_TRACKER_LD);

    const [deployer] = await ethers.getSigners();

    const proxyAdmin = (await ethers.getContractAt(
        proxyAdminArtifact.abi,
        PROXY_ADMIN_ADDRESS,
        deployer
    )) as unknown as ProxyAdmin;

    const voteTrackerFactory = await ethers.getContractFactory("VoteTracker");
    const voteTrackerImplementation = await voteTrackerFactory.deploy();
    await voteTrackerImplementation.deployed();

    const voteTrackerImplAddress = voteTrackerImplementation.address;

    console.log(`Vote Tracker Impl: ${voteTrackerImplAddress}`);

    const initTx = await voteTrackerImplementation
        .connect(deployer)
        .initialize(voteTrackerImplAddress, ethers.utils.formatBytes32String("1"), voteTrackerImplAddress, 1, [
            {token: voteTrackerImplAddress, multiplier: 1},
        ]);
    await initTx.wait();

    await new Promise((r) => setTimeout(r, 120000));

    await run("verify:verify", {
        address: voteTrackerImplAddress,
        constructorArguments: [],
        contract: "contracts/vote/VoteTracker.sol:VoteTracker",
    });

    const tx = await proxyAdmin.connect(deployer).upgrade(VOTE_TRACKER, voteTrackerImplAddress);
    await tx.wait();
}

main();
