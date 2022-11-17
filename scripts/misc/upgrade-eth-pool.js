const {ethers, upgrades, artifacts, network} = require("hardhat");
const {chalk} = require("chalk");
require("dotenv").config();

const PROXY_ADMIN_ABI = require("../node_modules/@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol/ProxyAdmin.json");
const PROXY_ABI = require("../node_modules/@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol/TransparentUpgradeableProxy.json");
const ETH_POOL = "0xD3D13a578a53685B4ac36A1Bab31912D2B2A2F36";
const PROXY_ADMIN = "0xc89F742452F534EcE603C7B62dF76102AAcF00Df"; //THE SAME FOR ALL

async function upgradeEthImplementation() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer: ", deployer.address);

    // await network.provider.request({
    //   method: "hardhat_impersonateAccount",
    //   params: [PROXY_ADMIN],
    // });
    // const proxyAdminSigner = await ethers.getSigner(PROXY_ADMIN);

    const proxyAdmin = await ethers.getContractAt(PROXY_ADMIN_ABI.abi, PROXY_ADMIN);
    let ethPoolProxy = await ethers.getContractAt(PROXY_ABI.abi, ETH_POOL);

    // let ethProxyCurrentImplementation = await ethPoolProxy
    //   .connect(proxyAdminSigner)
    //   .callStatic.implementation();
    // console.log("Current Implementation: ", ethProxyCurrentImplementation);

    //Deployer a the ETH Logic
    const ethLogicFactory = await ethers.getContractFactory("EthPool");
    const ethLogicContract = await ethLogicFactory.deploy();
    await ethLogicContract.deployed();
    console.log("Expected New Logic Contract: ", ethLogicContract.address);

    await proxyAdmin.upgrade(ethPoolProxy.address, ethLogicContract.address);

    // let ethProxyNewImplementation = await ethPoolProxy
    //   .connect(proxyAdminSigner)
    //   .callStatic.implementation();
    // console.log("Current Implementation: ", ethProxyNewImplementation);
}

upgradeEthImplementation();
