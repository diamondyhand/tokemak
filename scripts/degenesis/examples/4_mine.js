const {ethers} = require("hardhat");

const dotenv = require("dotenv");
dotenv.config();

async function main() {
    for (let i = 0; i < 1000; i++) {
        await ethers.provider.send("evm_mine", []);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
