const {ethers, network} = require("hardhat");
const chalk = require("chalk");
require("dotenv").config();

const PROXY_ABI = require("@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol/TransparentUpgradeableProxy");
const PROXY_ADMIN_ABI = require("@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol/ProxyAdmin.json");

// const PROXY_ABI = artifacts.require('TransparentUpgradeableProxy');

const MANAGER_ADDRESS = "0xA86e412109f77c45a3BC1c5870b880492Fb86A14";

const WETH_POOL_ADDRESS = "0xD3D13a578a53685B4ac36A1Bab31912D2B2A2F36";
const USDC_POOL_ADDRESS = "0x04bDA0CF6Ad025948Af830E75228ED420b0e860d";

const TOKE_POOL_ADDRESS = "0xa760e26aA76747020171fCF8BdA108dFdE8Eb930";
const UNI_POOL_ADDRESS = "0x1b429e75369ea5cd84421c1cc182cee5f3192fd3";
const SUSHI_POOL_ADDRESS = "0x8858A739eA1dd3D80FE577EF4e0D03E88561FaA3";

const PROXY_ADMIN_1 = "0xc89F742452F534EcE603C7B62dF76102AAcF00Df";
const PROXY_ADMIN_2 = "0xd813b2a8a0c206dC2E5Ff7A44E11fd0396C51A21";

async function changeProxyAdmin() {
    const [deployer] = await ethers.getSigners();
    console.log(deployer.address);

    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [PROXY_ADMIN_1],
    });
    const proxyAdmin1 = await ethers.getSigner(PROXY_ADMIN_1);

    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [PROXY_ADMIN_2],
    });
    // const proxyAdmin2 = await ethers.getSigner(PROXY_ADMIN_2);

    let managerProxy = await ethers.getContractAt(PROXY_ABI.abi, MANAGER_ADDRESS);
    let managerAdmin = await managerProxy.connect(proxyAdmin1).callStatic.admin();
    console.log(`Manager ${chalk.green(MANAGER_ADDRESS)}, Admin: ${chalk.green(managerAdmin)}`);

    let wethPoolProxy = await ethers.getContractAt(PROXY_ABI.abi, WETH_POOL_ADDRESS);
    let wethPoolAdmin = await wethPoolProxy.connect(proxyAdmin1).callStatic.admin();
    console.log(`WETH Pool ${chalk.green(WETH_POOL_ADDRESS)}, Admin: ${chalk.green(wethPoolAdmin)}`);

    let usdcPoolProxy = await ethers.getContractAt(PROXY_ABI.abi, USDC_POOL_ADDRESS);
    let usdcPoolAdmin = await usdcPoolProxy.connect(proxyAdmin1).callStatic.admin();
    console.log(`USDC Pool ${chalk.green(WETH_POOL_ADDRESS)}, Admin: ${chalk.green(usdcPoolAdmin)}`);

    let tokePoolProxy = await ethers.getContractAt(PROXY_ABI.abi, TOKE_POOL_ADDRESS);
    let tokePoolAdmin = await tokePoolProxy.connect(proxyAdmin1).callStatic.admin();
    console.log(`TOKE Pool ${chalk.green(UNI_POOL_ADDRESS)}, Admin: ${chalk.green(tokePoolAdmin)}`);

    let uniPoolProxy = await ethers.getContractAt(PROXY_ABI.abi, UNI_POOL_ADDRESS);
    let uniPoolAdmin = await uniPoolProxy.connect(proxyAdmin1).callStatic.admin();
    console.log(`UNI Pool ${chalk.green(UNI_POOL_ADDRESS)}, Admin: ${chalk.green(uniPoolAdmin)}`);

    let sushiPoolProxy = await ethers.getContractAt(PROXY_ABI.abi, SUSHI_POOL_ADDRESS);
    let sushiPoolAdmin = await sushiPoolProxy.connect(proxyAdmin1).callStatic.admin();
    console.log(`SUSHI Pool ${chalk.green(UNI_POOL_ADDRESS)}, Admin: ${chalk.green(sushiPoolAdmin)}`);

    console.log("Upgrade the TOKE, UNI, and SUSHI Pools' ProxyAdmin");
    //change the admins
    // let proxy1Admin = ethers.getContractAt(PROXY_ADMIN_ABI, PROXY_ADMIN_1)
    let proxy2Admin = await ethers.getContractAt(PROXY_ADMIN_ABI.abi, PROXY_ADMIN_2);

    let tx;
    tx = await proxy2Admin.connect(deployer).changeProxyAdmin(TOKE_POOL_ADDRESS, PROXY_ADMIN_1);
    tx.wait();

    await proxy2Admin.connect(deployer).changeProxyAdmin(UNI_POOL_ADDRESS, PROXY_ADMIN_1);
    tx.wait();

    await proxy2Admin.connect(deployer).changeProxyAdmin(SUSHI_POOL_ADDRESS, PROXY_ADMIN_1);
    tx.wait();

    tokePoolAdmin = await tokePoolProxy.connect(proxyAdmin1).callStatic.admin();
    console.log(`TOKE Pool ${chalk.green(UNI_POOL_ADDRESS)}, Admin: ${chalk.green(tokePoolAdmin)}`);
    uniPoolAdmin = await uniPoolProxy.connect(proxyAdmin1).callStatic.admin();
    console.log(`UNI Pool ${chalk.green(UNI_POOL_ADDRESS)}, Admin: ${chalk.green(uniPoolAdmin)}`);
    sushiPoolAdmin = await sushiPoolProxy.connect(proxyAdmin1).callStatic.admin();
    console.log(`SUSHI Pool ${chalk.green(UNI_POOL_ADDRESS)}, Admin: ${chalk.green(sushiPoolAdmin)}`);

    // const ManagerFactory = await ethers.getContractFactory('Manager');
    // const managerContract = await upgrades.upgradeProxy(MANAGER_ADDRESS, ManagerFactory, { unsafeAllow: ['delegatecall'] });
    // await managerContract.deployed();

    // managerImplementation = await managerProxy.connect(proxyAdmin).callStatic.implementation();
    // console.log(managerImplementation);
}

changeProxyAdmin();
