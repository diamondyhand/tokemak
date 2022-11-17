const {ethers} = require("hardhat");
const dotenv = require("dotenv");

dotenv.config();

async function main() {
    const [deployer] = await ethers.getSigners();
    const tokenAddress = process.env.TOKE_CONTRACT;
    const signerAddress = process.env.REWARDS_SIGNER;

    console.log(`Deployer: ${deployer.address}`);
    console.log(`Token Address ${tokenAddress}`);
    console.log(`Signer Address ${signerAddress}`);

    //Rewards deploy
    const rewardsFactory = await ethers.getContractFactory("Rewards");
    const rewardsContract = await rewardsFactory.deploy(tokenAddress, signerAddress);
    await rewardsContract.deployed();

    console.log(`Rewards Contract ${rewardsContract.address}`);

    const verifyTokenAddress = await rewardsContract.tokeToken();
    const verifySigner = await rewardsContract.rewardsSigner();

    console.log(`Verify Token Address ${verifyTokenAddress}`);
    console.log(`Verify Signer ${verifySigner}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
