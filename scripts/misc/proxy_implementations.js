const {ethers, network} = require("hardhat");
const chalk = require("chalk");
require("dotenv").config();

const PROXY_ABI = require("@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol/TransparentUpgradeableProxy");

// const PROXY_ABI = artifacts.require('TransparentUpgradeableProxy');

const MANAGER_ADDRESS = "0xA86e412109f77c45a3BC1c5870b880492Fb86A14";

const WETH_POOL_ADDRESS = "0xD3D13a578a53685B4ac36A1Bab31912D2B2A2F36";
const USDC_POOL_ADDRESS = "0x04bDA0CF6Ad025948Af830E75228ED420b0e860d";

const TOKE_POOL_ADDRESS = "0xa760e26aA76747020171fCF8BdA108dFdE8Eb930";
const UNI_POOL_ADDRESS = "0x1b429e75369ea5cd84421c1cc182cee5f3192fd3";
const SUSHI_POOL_ADDRESS = "0x8858A739eA1dd3D80FE577EF4e0D03E88561FaA3";

const PROXY_ADMIN_1 = "0xc89F742452F534EcE603C7B62dF76102AAcF00Df";
const PROXY_ADMIN_2 = "0xd813b2a8a0c206dC2E5Ff7A44E11fd0396C51A21";

async function getImplementations() {
    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [PROXY_ADMIN_1],
    });
    const proxyAdmin1 = await ethers.getSigner(PROXY_ADMIN_1);

    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [PROXY_ADMIN_2],
    });
    const proxyAdmin2 = await ethers.getSigner(PROXY_ADMIN_2);

    // const [deployer] = await ethers.getSigners();
    // console.log(deployer.address);

    let managerProxy = await ethers.getContractAt(PROXY_ABI.abi, MANAGER_ADDRESS);
    let managerImplementation = await managerProxy.connect(proxyAdmin1).callStatic.implementation();
    console.log(`Manager ${chalk.green(MANAGER_ADDRESS)}, Implementation: ${chalk.green(managerImplementation)}`);

    let wethPoolProxy = await ethers.getContractAt(PROXY_ABI.abi, WETH_POOL_ADDRESS);
    let wethPoolImplementation = await wethPoolProxy.connect(proxyAdmin1).callStatic.implementation();
    console.log(`WETH Pool ${chalk.green(WETH_POOL_ADDRESS)}, Implementation: ${chalk.green(wethPoolImplementation)}`);

    let usdcPoolProxy = await ethers.getContractAt(PROXY_ABI.abi, USDC_POOL_ADDRESS);
    let usdcPoolImplementation = await usdcPoolProxy.connect(proxyAdmin1).callStatic.implementation();
    console.log(`USDC Pool ${chalk.green(WETH_POOL_ADDRESS)}, Implementation: ${chalk.green(usdcPoolImplementation)}`);

    let tokePoolProxy = await ethers.getContractAt(PROXY_ABI.abi, TOKE_POOL_ADDRESS);
    let tokePoolImplementation = await tokePoolProxy.connect(proxyAdmin2).callStatic.implementation();
    console.log(`TOKE Pool ${chalk.green(UNI_POOL_ADDRESS)}, Implementation: ${chalk.green(tokePoolImplementation)}`);

    let uniPoolProxy = await ethers.getContractAt(PROXY_ABI.abi, UNI_POOL_ADDRESS);
    let uniPoolImplementation = await uniPoolProxy.connect(proxyAdmin2).callStatic.implementation();
    console.log(`UNI Pool ${chalk.green(UNI_POOL_ADDRESS)}, Implementation: ${chalk.green(uniPoolImplementation)}`);

    let sushiPoolProxy = await ethers.getContractAt(PROXY_ABI.abi, SUSHI_POOL_ADDRESS);
    let sushiPoolImplementation = await sushiPoolProxy.connect(proxyAdmin2).callStatic.implementation();
    console.log(`SUSHI Pool ${chalk.green(UNI_POOL_ADDRESS)}, Implementation: ${chalk.green(sushiPoolImplementation)}`);

    // const ManagerFactory = await ethers.getContractFactory('Manager');
    // const managerContract = await upgrades.upgradeProxy(MANAGER_ADDRESS, ManagerFactory, { unsafeAllow: ['delegatecall'] });
    // await managerContract.deployed();

    // managerImplementation = await managerProxy.connect(proxyAdmin).callStatic.implementation();
    // console.log(managerImplementation);
}

getImplementations();
