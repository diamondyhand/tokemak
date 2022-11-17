import {ethers, run} from "hardhat";
import {CurveAddressProvider__factory} from "../../../typechain";

export const main = async (): Promise<void> => {
    const [deployer] = await ethers.getSigners();

    const controllerFactory = new CurveAddressProvider__factory(deployer);
    const controller = await controllerFactory.deploy(deployer.address);
    await controller.deployed();

    console.log(`Testnet Curve Address Provider: ${controller.address}`);

    await new Promise((r) => setTimeout(r, 90000));

    await run("verify:verify", {
        address: controller.address,
        constructorArguments: [deployer.address],
        contract: "contracts/testnet/curve/CurveAddressProvider.sol:CurveAddressProvider",
    });
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
