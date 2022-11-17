import {artifacts, ethers, run} from "hardhat";
import {ProxyAdmin} from "../../typechain";
import {Contract, Environment, getContractAddressByEnvironmentAndName} from "../config";

const ENV = Environment.GOERLI;

const MANAGER_ADDRESS = getContractAddressByEnvironmentAndName(ENV, Contract.MANAGER);
const TOKE_POOL_ADDRESS = getContractAddressByEnvironmentAndName(ENV, Contract.TOKE_POOL);
const PROXY_ADMIN_ADDRESS = getContractAddressByEnvironmentAndName(ENV, Contract.PROXY_ADMIN);
const TOKE_ADDRESS = getContractAddressByEnvironmentAndName(ENV, Contract.TOKE);

const proxyAdminArtifact = artifacts.require("ProxyAdmin");
const proxyArtifact = artifacts.require("TransparentUpgradeableProxy");

async function main() {
    const [deployer] = await ethers.getSigners();

    const proxyAdmin = (await ethers.getContractAt(
        proxyAdminArtifact.abi,
        PROXY_ADMIN_ADDRESS,
        deployer
    )) as unknown as ProxyAdmin;

    const poolFactory = await ethers.getContractFactory("TokeMigrationPool");
    const poolImplementation = await poolFactory.deploy();
    await poolImplementation.deployed();
    await poolImplementation.initialize(TOKE_ADDRESS, MANAGER_ADDRESS, "tokemakAsset", "tAsset");

    const poolImplementationAddress = poolImplementation.address;

    console.log(`Pool implementation address: ${poolImplementationAddress}`);

    await run("verify:verify", {
        address: poolImplementationAddress,
        constructorArguments: [],
        contract: "contracts/pools/TokeMigrationPool.sol:TokeMigrationPool",
    });

    console.log("");
    console.log("");
    console.log(`Proxy Admin: ${PROXY_ADMIN_ADDRESS}`);
    console.log(`Toke Pool Proxy: ${TOKE_POOL_ADDRESS}`);
    console.log(`New Implementation: ${poolImplementationAddress}`);
    console.log("");
    console.log("");

    // const poolProxy = await ethers.getContractAt(
    //   proxyArtifact.abi,
    //   TOKE_POOL_ADDRESS
    // );

    // console.log(
    //   `Implementation before, ${await proxyAdmin.getProxyImplementation(
    //     poolProxy.address
    //   )}`
    // );

    // const tx = await proxyAdmin
    //   .connect(deployer)
    //   .upgrade(poolProxy.address, poolImplementationAddress);
    // await tx.wait(5);

    // console.log(
    //   `Implementation after, ${await proxyAdmin.getProxyImplementation(
    //     poolProxy.address
    //   )}`
    // );
}

main();
