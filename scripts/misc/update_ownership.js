const {ethers} = require("hardhat");

async function main() {
    const COORDINATOR_ADDRESS = "0x90b6C61B102eA260131aB48377E143D6EB3A9d4B";
    const TOKE_ADDRESS = "0x2e9d63788249371f1DFC918a52f8d799F4a38C94";

    const [deployer] = await ethers.getSigners();

    console.log(`Deployer: ${deployer.address}`);
    console.log(`Coordinator: ${COORDINATOR_ADDRESS}`);

    //TOKE deploy
    const tokeContract = await ethers.getContractAt("Toke", TOKE_ADDRESS);

    let currentOwner = await tokeContract.owner();
    console.log(`Current Owner: ${currentOwner}`);

    const tx = await tokeContract.transferOwnership(COORDINATOR_ADDRESS);
    await tx.wait();

    currentOwner = await tokeContract.owner();
    console.log(`New Owner: ${currentOwner}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
