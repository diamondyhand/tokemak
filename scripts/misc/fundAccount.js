const {ethers} = require("hardhat");

async function main() {
    const WETH_BALANCE_SLOT = 3;
    const USDC_BALANCE_SLOT = 9;

    const setStorageAt = async (address, index, value) => {
        await ethers.provider.send("hardhat_setStorageAt", [address, index, value]);
        await ethers.provider.send("evm_mine", []); // Just mines to the next block
    };

    const toBytes32 = (bn) => {
        return ethers.utils.hexlify(ethers.utils.zeroPad(bn.toHexString(), 32));
    };

    const run = async () => {
        await fundUSDC("0x0548F59fEE79f8832C299e01dCA5c76F034F558e", "100000000");
        await fundWETH("0x4f868c1aa37fcf307ab38d215382e88fca6275e2", "1000000");

        let etherBal = ethers.utils.parseEther(`511150.0`).toHexString();

        if (etherBal.startsWith("0x0")) etherBal = "0x" + etherBal.substring(3);

        await ethers.provider.send("hardhat_setBalance", ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", etherBal]); // ethers.utils.parseEther(`${ethLimit}.0`).toHexString()]);
    };

    const fundUSDC = async (address, amount) => {
        const locallyManipulatedBalance = WETHAmount(amount);

        // Get storage slot index
        const index = ethers.utils.solidityKeccak256(
            ["uint256", "uint256"],
            [address, USDC_BALANCE_SLOT] // key, slot
        );

        // Manipulate local balance (needs to be bytes32 string)
        await setStorageAt(
            process.env.DEFI_DEPLOY_USDC,
            index.toString(),
            toBytes32(locallyManipulatedBalance).toString()
        );
    };

    const fundWETH = async (address, amount) => {
        const locallyManipulatedBalance = WETHAmount(amount);

        // Get storage slot index
        const index = ethers.utils.solidityKeccak256(
            ["uint256", "uint256"],
            [address, WETH_BALANCE_SLOT] // key, slot
        );

        // Manipulate local balance (needs to be bytes32 string)
        await setStorageAt(
            process.env.DEFI_DEPLOY_WETH,
            index.toString(),
            toBytes32(locallyManipulatedBalance).toString()
        );
    };

    await run();
}

const WETHAmount = (number) => {
    return ethers.utils.parseUnits(number.toString(), 18);
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
