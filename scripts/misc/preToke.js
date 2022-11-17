const {ethers, artifacts} = require("hardhat");
const BN = ethers.BigNumber;
const chalk = require("chalk");
var _ = require("lodash");
const dotenv = require("dotenv");
const PreToke = artifacts.require("PreToke");
const AirdropPush = artifacts.require("AirdropPush");

dotenv.config();

// method is used to account for the decimal placement that token has
function amount(decimals, value) {
    return BN.from("10").pow(BN.from(decimals)).mul(BN.from(value));
}

async function main() {
    const [deployer] = await ethers.getSigners();
    //let deployer = ethers.Wallet.fromMnemonic(process.env.mnemonic);
    //deployer = deployer.connect(ethers.provider);

    console.log(`Deployer: ${chalk.green(deployer.address)}`);

    const balance = await deployer.getBalance();
    console.log(`Current Deployer Balance: ${balance.toString()}`);
    //const preTokeFactory = await ethers.getContractFactory("PreToke");
    //const pToke = await preTokeFactory.connect(deployer).deploy();
    //await pToke.deployed();
    const pToke = await ethers.getContractAt(PreToke.abi, "0xFf6C9aBEde4Bd2Aa83c0189720CD3Ca19c1d7E88");
    //await run("verify:verify", { address: pToke.address, constructorArguments: [], contract: "contracts/token/PreToke.sol:PreToke" })
    console.log(`PreToke Address: ${chalk.green(pToke.address)}`);

    //const airdropFactory = await ethers.getContractFactory("AirdropPush");
    //const distributor = await airdropFactory.connect(deployer).deploy();
    //await distributor.deployed();
    const distributor = await ethers.getContractAt(AirdropPush.abi, "0x93632534aBBA8b3ef079301301d3A23849e7506C");
    //await run("verify:verify", { address: distributor.address, constructorArguments: [] })
    console.log(`Distributor Address: ${chalk.green(distributor.address)}`);

    const decimals = await pToke.decimals();
    console.log(`Decimals ${decimals}`);
    //const totalSupply = amount(decimals, 100000000); // 100M
    //await pToke.connect(deployer).mint(deployer.address, totalSupply);
    //console.log(
    //  `Minted ${chalk.green(deployer.address)} ${chalk.yellow(totalSupply)}`
    //);

    //await pToke.connect(deployer).approve(distributor.address, totalSupply);

    let paused = await pToke.connect(deployer).paused();
    console.log(`PreToke is now paused: ${chalk.yellow(paused)}`);

    const unpause = await pToke.connect(deployer).unpause({nonce: 23});
    await unpause.wait();
    paused = await pToke.connect(deployer).paused();
    console.log(`PreToke is now paused: ${chalk.yellow(paused)}`);
    // //paused = await pToke.connect(deployer).paused();
    // //console.log(`PreToke is now paused: ${chalk.yellow(paused)}`);

    const userAmounts = [["0x0", amount(decimals, 0)]];

    // const split = _.unzip(userAmounts);
    // const users = split[0];
    // const amounts = split[1];

    // const dtx = await distributor.connect(deployer).distribute(pToke.address, users, amounts);
    // await dtx.wait();

    // console.log(
    //  `Minted ${chalk.green("Distributed")}`
    // );

    // const ptx = await pToke.connect(deployer).pause();
    // await ptx.wait();

    // let pausedEnd = await pToke.connect(deployer).paused();
    // console.log(`PreToke is now paused: ${chalk.yellow(pausedEnd)}`);

    // // FOR FUTURE DATE
    // await pToke.unpause()
    // const paused = await pToke.paused()
    // console.log(`PreToke is now paused: ${paused}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
