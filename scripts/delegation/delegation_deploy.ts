import {ethers, run} from "hardhat";
import dotenv from "dotenv";
import {DelegateFunction, DelegateFunction__factory, TransparentUpgradeableProxy__factory} from "../../typechain";
import {Contract, getContractAddressByEnvironmentAndName, Environment} from "../config";

dotenv.config();

const main = async () => {
    const [deployer] = await ethers.getSigners();
    const ENV = Environment.MAINNET;

    const PROXY_ADMIN = getContractAddressByEnvironmentAndName(ENV, Contract.PROXY_ADMIN);
    const delegationFunctionInterface = DelegateFunction__factory.createInterface();
    const initializeData = delegationFunctionInterface.encodeFunctionData("initialize");

    //Deploy the implementation
    const delegateFunctionFactory = new DelegateFunction__factory(deployer);
    const delegationFunctionImpl = await delegateFunctionFactory.deploy();
    await delegationFunctionImpl.deployed();

    const implAddress = delegationFunctionImpl.address;

    console.log("");
    console.log(`Delegate Function Implementation: ${implAddress}`);

    //Initialize the implementation
    const initializeImplementationTx = await delegationFunctionImpl.initialize();
    await initializeImplementationTx.wait();

    await new Promise((r) => setTimeout(r, 90000));

    try {
        await run("verify:verify", {
            address: implAddress,
            constructorArguments: [],
            contract: "contracts/DelegateFunction.sol:DelegateFunction",
        });
    } catch (e) {
        console.log(e);
        console.log("Verify failed, come back to it");
    }

    //Deploy the proxy pointing to the implementation
    const proxyFactory = new TransparentUpgradeableProxy__factory(deployer);
    const proxy = await proxyFactory.deploy(implAddress, PROXY_ADMIN, initializeData);
    await proxy.deployed();

    console.log(`Proxy: ${proxy.address}`);
    console.log("");

    const typedContract = (await ethers.getContractAt("DelegateFunction", proxy.address, deployer)) as DelegateFunction;
    const funcTx = await typedContract
        .connect(deployer)
        .setAllowedFunctions([
            {id: ethers.utils.formatBytes32String("voting")},
            {id: ethers.utils.formatBytes32String("rewards")},
        ]);
    await funcTx.wait();

    console.log("Configured for functions");
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
