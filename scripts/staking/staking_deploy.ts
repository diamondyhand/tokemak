import {ethers, run, artifacts} from "hardhat";

import dotenv from "dotenv";
import {ProxyAdmin, Staking__factory, TransparentUpgradeableProxy__factory} from "../../typechain";
import {Contract, Environment, getContractAddressByEnvironmentAndName} from "../config";

dotenv.config();

const ZERO_NOTIONAL = "0x1954d90213fdA53D35e76DB8f075a6216b8743A1";

const proxyAdminArtifact = artifacts.require("ProxyAdmin");

const ENV = Environment.GOERLI;

async function main() {
    const PROXY_ADMIN_ADDRESS = getContractAddressByEnvironmentAndName(ENV, Contract.PROXY_ADMIN);
    const MANAGER_ADDRESS = getContractAddressByEnvironmentAndName(ENV, Contract.MANAGER);
    const TOKE_ADDRESS = getContractAddressByEnvironmentAndName(ENV, Contract.TOKE);
    const TREASURY_ADDRESS = getContractAddressByEnvironmentAndName(ENV, Contract.TREASURY);

    const [deployer] = await ethers.getSigners();

    //   const proxyAdmin = (await ethers.getContractAt(
    //     proxyAdminArtifact.abi,
    //     PROXY_ADMIN_ADDRESS,
    //     deployer
    //   )) as unknown as ProxyAdmin;

    //   const stakingFactory = await ethers.getContractFactory("Staking");
    //   const stakingImplementation = await stakingFactory.deploy();
    //   await stakingImplementation.deployed();

    const stakingImplAddress = "0x8623F190d5308Cf69dCD89c8eC558CCC185a671e";

    console.log(`Staking Impl: ${stakingImplAddress}`);

    //   const initTx = await stakingImplementation
    //     .connect(deployer)
    //     .initialize(TOKE_ADDRESS, MANAGER_ADDRESS, TREASURY_ADDRESS, ZERO_NOTIONAL);
    //   await initTx.wait();

    //   await new Promise((r) => setTimeout(r, 120000));

    await run("verify:verify", {
        address: stakingImplAddress,
        constructorArguments: [],
        contract: "contracts/staking/Staking.sol:Staking",
    });

    const stakingInterface = Staking__factory.createInterface();
    const initializeData = stakingInterface.encodeFunctionData("initialize", [
        TOKE_ADDRESS,
        MANAGER_ADDRESS,
        TREASURY_ADDRESS,
        ZERO_NOTIONAL,
    ]);

    const proxyFactory = new TransparentUpgradeableProxy__factory(deployer);
    const proxy = await proxyFactory.deploy(stakingImplAddress, PROXY_ADMIN_ADDRESS, initializeData);
    await proxy.deployed();

    console.log(`Proxy ${proxy.address}`);
}

main();
