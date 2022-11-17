import {ethers, artifacts} from "hardhat";
import dotenv from "dotenv";
import {VoteTracker} from "../../typechain";

dotenv.config();

const main = async () => {
    const vote = {
        account: "0x3d146A937Ddada8AfA2536367832128F3F967E29",
        voteSessionKey: "0x3100000000000000000000000000000000000000000000000000000000000000",
        nonce: 15,
        chainId: 80001,
        totalVotes: "104158000000000000000000",
        allocations: [
            {
                reactorKey: "0x616c63782d64656661756c740000000000000000000000000000000000000000",
                amount: "104158000000000000000000",
            },
        ],
    };

    const voteTracker = artifacts.require("VoteTracker");
    await ethers.provider.send("hardhat_setCode", [
        "0x19E39678B2369089bCCD43780049D70ad6926BBE",
        voteTracker.deployedBytecode,
    ]);

    const [deployer] = await ethers.getSigners();

    const contract = (await ethers.getContractAt(
        voteTracker.abi,
        "0x19E39678B2369089bCCD43780049D70ad6926BBE"
    )) as unknown as VoteTracker;

    const b = await contract.connect(deployer).voteDirect(vote);

    await b.wait();
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
