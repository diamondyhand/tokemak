import {ethers, run} from "hardhat";

//Mainnet
const MANAGER_ADDRESS = "0xA86e412109f77c45a3BC1c5870b880492Fb86A14";
const TOKE_ADDRESS = "0x2e9d63788249371f1DFC918a52f8d799F4a38C94";
const VERIFY = true;

async function main() {
    const [deployer] = await ethers.getSigners();

    const poolFactory = await ethers.getContractFactory("TokeVotePool");
    const poolImplementation = await poolFactory.deploy();
    await poolImplementation.deployed();
    await poolImplementation.initialize(TOKE_ADDRESS, MANAGER_ADDRESS, "tokemakAsset", "tAsset");

    const impl = poolImplementation.address;
    console.log(`Pool implementation address: ${impl}`);

    if (VERIFY) {
        await run("verify:verify", {
            address: impl,
            constructorArguments: [],
            contract: "contracts/pools/TokeVotePool.sol:TokeVotePool",
        });
    }
}

main();
