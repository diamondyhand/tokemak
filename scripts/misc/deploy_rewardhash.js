const {ethers} = require("hardhat");
const dotenv = require("dotenv");

dotenv.config();

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log(`Deployer: ${deployer.address}`);

    //Rewards deploy
    const rewardHashFactory = await ethers.getContractFactory("RewardHash");
    const rewardsContract = await rewardHashFactory.deploy();
    await rewardsContract.deployed();

    console.log(`Rewards Contract ${rewardsContract.address}`);

    //Need to probably do a code check here because Goerli is slow at picking it up
    //The timeout works in pinch
    await new Promise((r) => setTimeout(r, 60000));

    console.log("Verifying");
    await run("verify:verify", {
        address: rewardsContract.address,
        constructorArguments: [],
        contract: "contracts/rewards/RewardHash.sol:RewardHash",
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
