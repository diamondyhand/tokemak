import {ethers, artifacts, run} from "hardhat";
import dotenv from "dotenv";
import {AddressRegistry, AddressRegistry__factory, TransparentUpgradeableProxy__factory} from "../../typechain";
import {Contract, contractAddressByEnvironment, Environment} from "../config";

dotenv.config();

const main = async () => {
    const [deployer] = await ethers.getSigners();
    const ENV = Environment.MAINNET;

    const PROXY_ADMIN = contractAddressByEnvironment[ENV][Contract.PROXY_ADMIN];
    const DEV_COORDINATOR = contractAddressByEnvironment[ENV][Contract.DEV_COORDINATOR_MULTISIG];

    const addressIndustryInterface = AddressRegistry__factory.createInterface();
    const initializeData = addressIndustryInterface.encodeFunctionData("initialize");

    //Deploy the implementation
    const addressRegistryFactory = new AddressRegistry__factory(deployer);
    let addressRegistry = await addressRegistryFactory.deploy();
    await addressRegistry.deployed();

    const addressRegistryAddress = addressRegistry.address;

    console.log("");
    console.log(`Address Registry Implementation: ${addressRegistryAddress}`);

    //Initialize the implementation
    const initializeImplementationTx = await addressRegistry.initialize();
    await initializeImplementationTx.wait();

    await new Promise((r) => setTimeout(r, 45000));

    try {
        await run("verify:verify", {
            address: addressRegistryAddress,
            constructorArguments: [],
            contract: "contracts/registry/AddressRegistry.sol:AddressRegistry",
        });
    } catch (e) {
        console.log("Verify failed, come back to it");
    }

    //Deploy the proxy pointing to the implementation
    const proxyFactory = new TransparentUpgradeableProxy__factory(deployer);
    const proxy = await proxyFactory.deploy(addressRegistryAddress, PROXY_ADMIN, initializeData);
    await proxy.deployed();

    console.log(`Address Registry: ${proxy.address}`);
    console.log("");

    //Grant Admin to Dev Coordinator
    const addressRegsitryArtifact = await artifacts.require("AddressRegistry");
    addressRegistry = (await ethers.getContractAt(
        addressRegsitryArtifact.abi,
        proxy.address
    )) as unknown as AddressRegistry;

    const adminRole = await addressRegistry.DEFAULT_ADMIN_ROLE();

    const grantAdminRole = await addressRegistry.grantRole(adminRole, DEV_COORDINATOR);
    await grantAdminRole.wait();

    console.log("Admin granted to coordinator");
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
