import {ethers, run} from "hardhat";
import {Contract, getContractAddressByEnvironmentAndName, Environment} from "../config";

export const main = async (): Promise<void> => {
    const ENV = Environment.MAINNET;
    const N_COINS = 3;

    const MANAGER_ADDRESS = getContractAddressByEnvironmentAndName(ENV, Contract.MANAGER);
    const ADDRESS_REGISTRY = getContractAddressByEnvironmentAndName(ENV, Contract.ADDRESS_REGISTRY);

    const CURVE_ADDRESS_PROVIDER = getContractAddressByEnvironmentAndName(
        ENV,
        Contract.THIRDPARTY_CURVE_ADDRESS_PROVIDER
    );

    const [deployer] = await ethers.getSigners();

    const factory = (await import(`../../typechain/factories/CurveController${N_COINS}__factory`))[
        `CurveController${N_COINS}__factory`
    ];

    const controllerFactory = new factory(deployer);
    const controller = await controllerFactory.deploy(
        MANAGER_ADDRESS,
        MANAGER_ADDRESS,
        ADDRESS_REGISTRY,
        CURVE_ADDRESS_PROVIDER
    );
    await controller.deployed();

    console.log(`Curve ${N_COINS} Controller Address ${controller.address}`);

    await new Promise((r) => setTimeout(r, 50000));

    try {
        await run("verify:verify", {
            address: controller.address,
            constructorArguments: [MANAGER_ADDRESS, MANAGER_ADDRESS, ADDRESS_REGISTRY, CURVE_ADDRESS_PROVIDER],
            contract: `contracts/controllers/curve/CurveController${N_COINS}.sol:CurveController${N_COINS}`,
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
