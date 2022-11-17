const {ethers} = require("hardhat");
require("dotenv").config();

const PROXY_ADMIN_ABI = require("@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol/ProxyAdmin");
const PROXY_ABI = require("@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol/TransparentUpgradeableProxy");
const ETH_POOL = "0xD3D13a578a53685B4ac36A1Bab31912D2B2A2F36";
const PROXY_ADMIN = "0xc89F742452F534EcE603C7B62dF76102AAcF00Df"; //THE SAME FOR ALL

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer: ", deployer.address);

    const proxyAdmin = await ethers.getContractAt(PROXY_ADMIN_ABI.abi, PROXY_ADMIN);
    let ethPoolProxy = await ethers.getContractAt(PROXY_ABI.abi, ETH_POOL);

    //Deployer a the ETH Logic
    const ethLogicFactory = await ethers.getContractFactory("EthPool");
    const ethLogicContract = await ethLogicFactory.deploy();
    await ethLogicContract.deployed();
    console.log("Expected New Logic Contract: ", ethLogicContract.address);

    await proxyAdmin.upgrade(ethPoolProxy.address, ethLogicContract.address);

    const initialized = await ethLogicContract
        .connect(deployer)
        .initialize(
            "0xA86e412109f77c45a3BC1c5870b880492Fb86A14",
            "0x28cB0DE9c70ba1B5116Df57D0c421770B5f44D45",
            "tAssetPool",
            "tAsset"
        );
    await initialized.wait();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
