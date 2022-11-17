const {artifacts, ethers} = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();

async function main() {
    const toke = artifacts.require("Toke");

    const tokeContract = await ethers.getContractAt(toke.abi, process.env.TOKE_CONTRACT);
    const [deployer] = await ethers.getSigners();

    await tokeContract.connect(deployer).transfer(process.env.REWARDS_CONTRACT, TOKEAmount(3000000));
}

const TOKEAmount = (number) => {
    return ethers.utils.parseUnits(number.toString(), 18);
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
