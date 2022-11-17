const {artifacts, ethers} = require("hardhat");
const {getRoot, MerkleTree} = require("@airswap/merkle");
const dotenv = require("dotenv");
dotenv.config();
const pinataSDK = require("@pinata/sdk");
const fs = require("fs/promises");
const fsold = require("fs");
const pinata = pinataSDK(process.env.DEFI_PINATA_KEY, process.env.DEFI_PINATA_SECRET);

const UPDATE_CONTRACT = false;
const FILE_PATH = "";

async function main() {
    const Defi = artifacts.require("DefiRound");

    let listOfAddress = await getAddresses();
    listOfAddress = listOfAddress.sort();

    const tree = new MerkleTree(listOfAddress.map((x) => ethers.utils.keccak256(x)));
    const root = getRoot(tree);

    await fs.mkdir(`./whitelistfiles/${root}`, {recursive: true});
    const fileName = `./whitelistfiles/${root}/whitelist.csv`;
    await fs.writeFile(fileName, listOfAddress.join("\n"));
    const readableStreamForFile = fsold.createReadStream(fileName);
    const options = {
        pinataMetadata: {
            name: `defi-whitelist-${root}.csv`,
            keyvalues: {
                customKey: "customValue",
                customKey2: "customValue2",
            },
        },
        pinataOptions: {
            cidVersion: 0,
        },
    };
    const result = await pinata.pinFileToIPFS(readableStreamForFile, options);
    console.log(`\r\nIPFS Hash: ${result.IpfsHash}`);

    if (UPDATE_CONTRACT) {
        const defiContract = await ethers.getContractAt(Defi.abi, process.env.DEFI_CONFIG_DEFI_CONTRACT);
        const [deployer] = await ethers.getSigners();

        const tx = await defiContract.populateTransaction.configureWhitelist([true, root]);
        //const tx = await defiContract.populateTransaction.configureWhitelist([false, root]);
        const x = await deployer.sendTransaction(tx);
        await x.wait();

        // await defiContract.connect(deployer).configureWhitelist([true, root]);
    }
}

const getAddresses = async () => {
    const stream = await fs.readFile(FILE_PATH);
    const str = stream.toString();
    return str
        .split("\n")
        .map((x) => x.trim())
        .filter((x) => {
            if (!ethers.utils.isAddress(x)) {
                console.log(`Invalid address: ${x}`);
                return false;
            }
            return true;
        });

    // return new Promise((result) => {
    //   result([
    //     "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    //     "0x70997970c51812dc3a010c7d01b50e0d17dc79c8"
    // ])
    //});
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
