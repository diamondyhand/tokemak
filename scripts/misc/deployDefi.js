/**
 * Deploy to Kovan
 */
const hre = require("hardhat");
const ethers = hre.ethers;
// const { getYAML } = require('../test/YAML.js');

// const fs = require('fs');

// const defiAbi = require('../build/DefiRound/abis/DefiRound.json');
// const defiBytecode = require('../bytecode/DefiRound.json');

// const coreAbi = require('../build/CoreEvent/abis/CoreEvent.json');
// const coreBytecode = require('../bytecode/CoreEvent.json');

const WETH_ADDRESS = "0x0a180a76e4466bf68a7f86fb029bed3cccfaaac5"; // Ropsten
// const USDC_ADDRESS = "0xfe724a829fdf12f7012365db98730eee33742ea2"; // Ropsten

// const LINK_ADDRESS = '0x514910771af9ca656af840dff83e8264ecf986ca';
// const BNT_ADDRESS = '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c';

const TREASURY_ADDRESS = "0x8C23b37d1cbEA412Fc3f664d9d69cE56c0254138";

// const coreSupportedTokens = [
//     [ LINK_ADDRESS, 1000, false ],
//     [ BNT_ADDRESS, 2000, false ]
// ];

async function main() {
    // let provider = new ethers.providers.Web3Provider();
    // let currentBlock = await provider.getBlockNumber();

    let deployer = new ethers.Wallet(hre.config.networks.ropsten.accounts[0]);
    deployer = deployer.connect(ethers.provider);

    const defiFactory = await ethers.getContractFactory("DefiRound");
    defiContract = await defiFactory.deploy(WETH_ADDRESS, TREASURY_ADDRESS, 60000000);
    await defiContract.deployed();

    console.log(defiContract.address);

    // const coreInterface = await new ethers.utils.Interface(coreAbi);
    // const coreFactory = await new ethers.ContractFactory(coreInterface, coreBytecode, deployer);
    // coreContract = await coreFactory.deploy(
    //     treasuryAddress, coreSupportedTokens
    // );
    // await coreContract.deployed();

    // console.log(defiContract.address);
    // console.log(coreContract.address);

    // fs.writeFileSync("subgraph.yaml", getYAML(defiContract.address, coreContract.address, currentBlock));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
