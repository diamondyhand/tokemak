import {artifacts, ethers, run} from "hardhat";
import {Pool, Pool__factory, ProxyAdmin, TransparentUpgradeableProxy__factory} from "../../typechain";

//Testnet
const MANAGER_ADDRESS = "0xe5dB5477F7787862116ff92E7d33A244A4ca35E0";
const TOKE_POOL_ADDRESS = "0x156dE8C7e1EC3bBF4f62a3E30fe248Fe6505e56f";
const PROXY_ADMIN_ADDRESS = "0x34aF6F5783c6C31680E49cEA7ABbCd4e5BD67117";
const TOKE_ADDRESS = "0xdcC9439Fe7B2797463507dD8669717786E51a014";

//Mainnet
// const MANAGER_ADDRESS = "0xA86e412109f77c45a3BC1c5870b880492Fb86A14";
// const TOKE_POOL_ADDRESS = "0xa760e26aA76747020171fCF8BdA108dFdE8Eb930";
// const PROXY_ADMIN_ADDRESS = "0xc89F742452F534EcE603C7B62dF76102AAcF00Df";
//const TOKE_ADDRESS = "";

const proxyAdminArtifact = artifacts.require("ProxyAdmin");
const proxyArtifact = artifacts.require("TransparentUpgradeableProxy");

async function main() {
    // console.log(
    //   await ethers.provider.getStorageAt(
    //     TOKE_POOL_ADDRESS,
    //     "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"
    //   )
    // );

    // return;

    const [deployer] = await ethers.getSigners();

    const proxyAdmin = (await ethers.getContractAt(
        proxyAdminArtifact.abi,
        PROXY_ADMIN_ADDRESS,
        deployer
    )) as unknown as ProxyAdmin;

    // const poolFactory = await ethers.getContractFactory("TokeMigrationPool");
    // const poolImplementation = await poolFactory.deploy();
    // await poolImplementation.deployed();
    // await poolImplementation.initialize(
    //   TOKE_ADDRESS,
    //   MANAGER_ADDRESS,
    //   "tokemakAsset",
    //   "tAsset"
    // );

    //console.log(`Pool implementation address: ${poolImplementation.address}`);

    const poolProxy = await ethers.getContractAt(proxyArtifact.abi, TOKE_POOL_ADDRESS);

    console.log(`Implementation before, ${await proxyAdmin.getProxyImplementation(poolProxy.address)}`);

    const tx = await proxyAdmin
        .connect(deployer)
        .upgrade(poolProxy.address, "0x3d1b902413AA684C823845DEbFb9D0096C440E12");
    await tx.wait(5);

    console.log(`Implementation after, ${await proxyAdmin.getProxyImplementation(poolProxy.address)}`);

    // await run("verify:verify", {
    //   address: "0x3d1b902413AA684C823845DEbFb9D0096C440E12",
    //   constructorArguments: [],
    //   contract: "contracts/pools/TokeMigrationPool.sol:TokeMigrationPool",
    // });
}

main();
