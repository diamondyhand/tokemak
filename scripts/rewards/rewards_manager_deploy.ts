import {ethers, run} from "hardhat";
import dotenv from "dotenv";
import {RewardsManager__factory, TransparentUpgradeableProxy__factory} from "../../typechain";
import {Contract, contractAddressByEnvironment, Environment} from "../config";

dotenv.config();

const main = async () => {
    const [deployer] = await ethers.getSigners();
    const ENV = Environment.MAINNET;

    const PROXY_ADMIN = contractAddressByEnvironment[ENV][Contract.PROXY_ADMIN];

    const rewardsManagerInterface = RewardsManager__factory.createInterface();
    const initializeData = rewardsManagerInterface.encodeFunctionData("initialize");

    //Deploy the implementation
    const rewardsManagerFactory = new RewardsManager__factory(deployer);
    const rewardsManager = await rewardsManagerFactory.deploy();
    await rewardsManager.deployed();

    console.log(`RewardsManager Implementation: ${rewardsManager.address}`);

    //Initialize the implementation
    const initializeImplementationTx = await rewardsManager.initialize();
    await initializeImplementationTx.wait();

    await new Promise((r) => setTimeout(r, 50000));

    try {
        await run("verify:verify", {
            address: rewardsManager.address,
            constructorArguments: [],
            contract: "contracts/rewards/RewardsManager.sol:RewardsManager",
        });
    } catch (e) {
        console.log("Verify failed, come back to it");
    }

    //Deploy the proxy pointing to the implementation
    const proxyFactory = new TransparentUpgradeableProxy__factory(deployer);
    const proxy = await proxyFactory.deploy(rewardsManager.address, PROXY_ADMIN, initializeData);
    await proxy.deployed();

    console.log(`RewardsManager: ${proxy.address}`);
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
