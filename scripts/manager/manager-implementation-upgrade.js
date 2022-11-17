const {ethers} = require("hardhat");
//const chalk = require("chalk");
const {getContractAddressByEnvironmentAndName, Contract, Environment} = require("../config");
require("dotenv").config();

const ENV = Environment.GOERLI;
const cycleDuration = 604800; //One Week
const nextCycleStartTime = 1646238600; //Wednesday, March 2, 2022 4:30:00 PM

const MANAGER_ADDRESS = getContractAddressByEnvironmentAndName(ENV, Contract.MANAGER);
const PROXY_ADMIN_ADDRESS = getContractAddressByEnvironmentAndName(ENV, Contract.PROXY_ADMIN);

// const proxyAdminArtifact = artifacts.require("ProxyAdmin");
// const managerArtifact = artifacts.require("Manager");

async function upgradeManagerImplementation() {
    //const [deployer] = await ethers.getSigners();

    // const proxyAdmin = await ethers.getContractAt(
    //   proxyAdminArtifact.abi,
    //   PROXY_ADMIN_ADDRESS,
    //   deployer
    // );
    // const manager = await ethers.getContractAt(
    //   managerArtifact.abi,
    //   MANAGER_ADDRESS,
    //   deployer
    // );

    let managerContractFactory = await ethers.getContractFactory("Manager");
    let managerImplementation = await managerContractFactory.deploy();
    await managerImplementation.deployed();
    let tx = await managerImplementation.initialize(cycleDuration, nextCycleStartTime);
    await tx.wait();

    await run("verify:verify", {
        address: managerImplementation.address,
        constructorArguments: [],
        contract: "contracts/manager/Manager.sol:Manager",
    });

    console.log("");
    console.log("");
    console.log(`Proxy Admin: ${PROXY_ADMIN_ADDRESS}`);
    console.log(`Manager Proxy: ${MANAGER_ADDRESS}`);
    console.log(`New Manager Implementation: ${managerImplementation.address}`);

    const call = managerContractFactory.interface.encodeFunctionData("setNextCycleStartTime(uint256)", [
        nextCycleStartTime,
    ]);

    console.log(`Call: ${call}`);
    console.log("");
    console.log("");

    // console.log(
    //   `Manager implementation address: ${chalk.greenBright(
    //     managerImplementation.address
    //   )}`
    // );

    // console.log(
    //   `Implementation before, ${chalk.yellowBright(
    //     await proxyAdmin.getProxyImplementation(manager.address)
    //   )}`
    // );
    // console.log(`Deployer: ${deployer.address}`);

    // const data = managerContractFactory.interface.encodeFunctionData(
    //   "setNextCycleStartTime(uint256)",
    //   [nextCycleStartTime]
    // );

    // tx = await proxyAdmin
    //   .connect(deployer)
    //   .upgradeAndCall(MANAGER_ADDRESS, managerImplementation.address, data);
    // await tx.wait();

    // tx = await manager.setCycleDuration(cycleDuration);
    // tx.wait();

    // console.log(
    //   `Implementation after, ${chalk.yellowBright(
    //     await proxyAdmin.getProxyImplementation(manager.address)
    //   )}`
    // );
}

upgradeManagerImplementation();
