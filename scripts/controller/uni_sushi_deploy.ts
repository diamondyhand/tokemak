import {ethers, run} from "hardhat";
import {
    ConvexController__factory,
    SushiswapControllerV1__factory,
    SushiswapControllerV2__factory,
    UniswapController__factory,
} from "../../typechain";
import {Contract, Environment, getContractAddressByEnvironmentAndName} from "../config";

export const main = async (): Promise<void> => {
    const ENV = Environment.MAINNET;

    const MANAGER_ADDRESS = getContractAddressByEnvironmentAndName(ENV, Contract.MANAGER);
    const ADDRESS_REGISTRY = getContractAddressByEnvironmentAndName(ENV, Contract.ADDRESS_REGISTRY);

    const [deployer] = await ethers.getSigners();

    const UNISWAP_FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    const UNISWAP_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const uniswapFactory = new UniswapController__factory(deployer);
    const uniswapController = await uniswapFactory.deploy(
        UNISWAP_ROUTER_ADDRESS,
        UNISWAP_FACTORY_ADDRESS,
        MANAGER_ADDRESS,
        ADDRESS_REGISTRY
    );
    await uniswapController.deployed();

    console.log(`Uniswap Controller Address ${uniswapController.address}`);

    const SUSHISWAP_FACTORY_ADDRESS_V1 = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";
    const SUSHISWAP_ROUTER_ADDRESS_V1 = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
    const MASTERCHEF_V1 = "0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd";
    const sushiv1Factory = new SushiswapControllerV1__factory(deployer);
    const sushiv1Controller = await sushiv1Factory.deploy(
        SUSHISWAP_ROUTER_ADDRESS_V1,
        SUSHISWAP_FACTORY_ADDRESS_V1,
        MASTERCHEF_V1,
        MANAGER_ADDRESS,
        ADDRESS_REGISTRY
    );
    await sushiv1Controller.deployed();

    console.log(`SushiV1 Controller Address ${sushiv1Controller.address}`);

    const SUSHISWAP_FACTORY_ADDRESS_V2 = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";
    const SUSHISWAP_ROUTER_ADDRESS_V2 = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
    const MASTERCHEF_V2 = "0xEF0881eC094552b2e128Cf945EF17a6752B4Ec5d";
    const sushiv2Factory = new SushiswapControllerV2__factory(deployer);
    const sushiv2Controller = await sushiv2Factory.deploy(
        SUSHISWAP_ROUTER_ADDRESS_V2,
        SUSHISWAP_FACTORY_ADDRESS_V2,
        MASTERCHEF_V2,
        MANAGER_ADDRESS,
        MANAGER_ADDRESS,
        ADDRESS_REGISTRY
    );
    await sushiv2Controller.deployed();

    console.log(`SushiV2 Controller Address ${sushiv2Controller.address}`);

    await new Promise((r) => setTimeout(r, 50000));

    try {
        await run("verify:verify", {
            address: uniswapController.address,
            constructorArguments: [
                UNISWAP_ROUTER_ADDRESS,
                UNISWAP_FACTORY_ADDRESS,
                MANAGER_ADDRESS,
                MANAGER_ADDRESS,
                ADDRESS_REGISTRY,
            ],
            contract: `contracts/controllers/UniswapController.sol:UniswapController`,
        });
    } catch (e) {
        console.log("Verify failed, come back to it");
    }

    try {
        await run("verify:verify", {
            address: sushiv1Controller.address,
            constructorArguments: [
                SUSHISWAP_ROUTER_ADDRESS_V1,
                SUSHISWAP_FACTORY_ADDRESS_V1,
                MASTERCHEF_V1,
                MANAGER_ADDRESS,
                MANAGER_ADDRESS,
                ADDRESS_REGISTRY,
            ],
            contract: `contracts/controllers/SushiswapControllerV1.sol:SushiswapControllerV1`,
        });
    } catch (e) {
        console.log("Verify failed, come back to it");
    }

    try {
        await run("verify:verify", {
            address: sushiv2Controller.address,
            constructorArguments: [
                SUSHISWAP_ROUTER_ADDRESS_V2,
                SUSHISWAP_FACTORY_ADDRESS_V2,
                MASTERCHEF_V2,
                MANAGER_ADDRESS,
                MANAGER_ADDRESS,
                ADDRESS_REGISTRY,
            ],
            contract: `contracts/controllers/SushiSwapControllerV2.sol:SushiswapControllerV2`,
        });
    } catch (e) {
        console.log("Verify failed, come back to it");
    }
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
