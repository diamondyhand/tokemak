const {ethers, artifacts} = require("hardhat");
const dotenv = require("dotenv");
const chalk = require("chalk");

dotenv.config();

const MANAGER_ADDRESS = "0xA86e412109f77c45a3BC1c5870b880492Fb86A14";
const ADDRESS_REGISTRY_ADDRESS = "0x28cB0DE9c70ba1B5116Df57D0c421770B5f44D45";
const ETH_POOL_ADDRESS = "0xD3D13a578a53685B4ac36A1Bab31912D2B2A2F36";
const UNI_POOL_ADDRESS = "0x1b429e75369ea5cd84421c1cc182cee5f3192fd3";
const SUSHI_POOL_ADDRESS = "0x8858A739eA1dd3D80FE577EF4e0D03E88561FaA3";
const TOKE_POOL_ADDRESS = "0xa760e26aA76747020171fCF8BdA108dFdE8Eb930";
const PROXY_ADMIN_ADDRESS = "0xc89F742452F534EcE603C7B62dF76102AAcF00Df";

const proxyAdminArtifact = artifacts.require("ProxyAdmin");
const proxyArtifact = artifacts.require("TransparentUpgradeableProxy");
const managerArtifact = artifacts.require("Manager");

async function main() {
    const deployer = new ethers.Wallet(process.env.DEGENESIS_DEPLOYER, ethers.provider);

    const proxyAdmin = await ethers.getContractAt(proxyAdminArtifact.abi, PROXY_ADMIN_ADDRESS, deployer);
    const manager = await ethers.getContractAt(managerArtifact.abi, MANAGER_ADDRESS, deployer);
    let poolFactory = await ethers.getContractFactory("Pool");
    let poolImplementation = await poolFactory.deploy();
    await poolImplementation.deployed();
    await poolImplementation.initialize(
        "0x1b429e75369ea5cd84421c1cc182cee5f3192fd3", //TODO: Change What should underlyer be here?
        MANAGER_ADDRESS,
        "tokemakAsset",
        "tAsset"
    );

    let ethPoolFactory = await ethers.getContractFactory("EthPool");
    let ethPoolImplementation = await ethPoolFactory.deploy();
    await ethPoolImplementation.deployed();
    await ethPoolImplementation.initialize(MANAGER_ADDRESS, ADDRESS_REGISTRY_ADDRESS, "tokemakWeth", "tWeth");

    console.log(`Pool implementation address: ${chalk.greenBright(poolImplementation.address)}`);
    console.log(`EthPool implementation address: ${chalk.greenBright(ethPoolImplementation.address)}`);

    let poolAddressArr = await manager.getPools();
    poolAddressArr = Object.assign([], poolAddressArr); // Won't push without this
    poolAddressArr.push(SUSHI_POOL_ADDRESS, UNI_POOL_ADDRESS, TOKE_POOL_ADDRESS); // Add addresses that are not registered with manager here
    console.log(poolAddressArr);

    for (let i = 0; i < poolAddressArr.length; i++) {
        let poolProxyAddr = poolAddressArr[i];
        let poolProxy = await ethers.getContractAt(proxyArtifact.abi, poolProxyAddr);

        console.log(`Pool proxy address: ${chalk.blueBright(poolProxyAddr)}`);
        console.log(
            `Implementation before, ${chalk.yellowBright(await proxyAdmin.getProxyImplementation(poolProxy.address))}`
        );

        let implementationAddr;
        if (poolProxyAddr.toLowerCase() === ETH_POOL_ADDRESS.toLowerCase()) {
            implementationAddr = ethPoolImplementation.address;
        } else {
            implementationAddr = poolImplementation.address;
        }

        await proxyAdmin.connect(deployer).upgrade(poolProxyAddr, implementationAddr);
        console.log(
            `Implementation after, ${chalk.yellowBright(await proxyAdmin.getProxyImplementation(poolProxy.address))}`
        );
    }
}

main();
