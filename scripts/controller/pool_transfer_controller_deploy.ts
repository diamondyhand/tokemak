import {ethers, run} from "hardhat";
import {PoolTransferController__factory} from "../../typechain";
import {Contract, Environment, getContractAddressByEnvironmentAndName} from "../config";

export const main = async (): Promise<void> => {
    const ENV = Environment.MAINNET;

    const MANAGER_ADDRESS = getContractAddressByEnvironmentAndName(ENV, Contract.MANAGER);
    const ADDRESS_REGISTRY = getContractAddressByEnvironmentAndName(ENV, Contract.ADDRESS_REGISTRY);

    const [deployer] = await ethers.getSigners();

    const controllerFactory = new PoolTransferController__factory(deployer);
    const controller = await controllerFactory.deploy(MANAGER_ADDRESS, MANAGER_ADDRESS, ADDRESS_REGISTRY);
    await controller.deployed();

    console.log(`Pool Transfer Controller Address ${controller.address}`);

    await new Promise((r) => setTimeout(r, 50000));

    try {
        await run("verify:verify", {
            address: controller.address,
            constructorArguments: [MANAGER_ADDRESS, MANAGER_ADDRESS, ADDRESS_REGISTRY],
            contract: `contracts/controllers/PoolTransferController.sol:PoolTransferController`,
        });
    } catch (e) {
        console.log(e);
        console.log("Verify failed, come back to it");
    }
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
