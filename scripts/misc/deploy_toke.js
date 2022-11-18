const { ethers } = require("hardhat");

async function main() {
    //const TREASURY_ADDRESS = "0x8b4334d4812C530574Bd4F2763FcD22dE94A969B";
    const [deployer] = await ethers.getSigners();

    console.log(`Deployer: ${deployer.address}`);
    //console.log(`Treasury: ${TREASURY_ADDRESS}`);

    //TOKE deploy
    const tokeFactory = await ethers.getContractFactory("Toke");
    const tokeContract = await tokeFactory.deploy();
    await tokeContract.deployed();

    console.log("Toke's address is ", tokeContract.address);

    const tokenName = await tokeContract.name();
    const tokenSymbol = await tokeContract.symbol();
    const tokenDecimals = await tokeContract.decimals();
    const totalSupply = await tokeContract.totalSupply();
    const balanceDeployerBefore = await tokeContract.balanceOf(deployer.address);

    console.log(
        `${tokenName} token contract deployed as ${tokenSymbol} - ${tokenDecimals} decimals at ${tokeContract.address}`
    );

    console.log(`Total Supply: ${totalSupply.toString()}`);
    console.log(`Deployer TOKE Balance (before): ${balanceDeployerBefore.toString()}`);

    // await tokeContract.transfer(TREASURY_ADDRESS, balanceDeployerBefore.toString())

    // const balanceDeployerAfter = await tokeContract.balanceOf(deployer.address)
    // const balanceTreasuryAfter = await tokeContract.balanceOf(TREASURY_ADDRESS)
    // console.log(`Deployer TOKE Balance (after): ${balanceDeployerAfter.toString()}`)
    // console.log(`Treasury TOKE Balance (after) : ${balanceTreasuryAfter.toString()}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
