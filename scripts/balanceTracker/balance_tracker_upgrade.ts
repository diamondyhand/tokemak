import {ethers, run, artifacts} from "hardhat";

import dotenv from "dotenv";
import {ProxyAdmin} from "../../typechain";
import {Contract, Environment, getContractAddressByEnvironmentAndName} from "../config";

dotenv.config();

const proxyAdminArtifact = artifacts.require("ProxyAdmin");

const ENV = Environment.MAINNET;

async function main() {
    const PROXY_ADMIN_ADDRESS = getContractAddressByEnvironmentAndName(ENV, Contract.PROXY_ADMIN_POLYGON);
    const BALANCE_TRACKER = getContractAddressByEnvironmentAndName(ENV, Contract.BALANCE_TRACKER);
    const EVENT_PROXY = getContractAddressByEnvironmentAndName(ENV, Contract.EVENT_PROXY);

    console.log(`Proxy Address: ${BALANCE_TRACKER}`);

    const [deployer] = await ethers.getSigners();

    const proxyAdmin = (await ethers.getContractAt(
        proxyAdminArtifact.abi,
        PROXY_ADMIN_ADDRESS,
        deployer
    )) as unknown as ProxyAdmin;

    const implFactory = await ethers.getContractFactory("BalanceTracker");
    const implContract = await implFactory.deploy();
    await implContract.deployed();

    const implAddress = implContract.address;

    console.log(`Impl: ${implAddress}`);

    const initTx = await implContract.connect(deployer).initialize(EVENT_PROXY);
    await initTx.wait();

    await new Promise((r) => setTimeout(r, 120000));

    await run("verify:verify", {
        address: implAddress,
        constructorArguments: [],
        contract: "contracts/balance-tracker/BalanceTracker.sol:BalanceTracker",
    });

    const tx = await proxyAdmin.connect(deployer).upgrade(BALANCE_TRACKER, implAddress);
    await tx.wait();
}

main();
