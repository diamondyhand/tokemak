import {ethers, run, network, artifacts} from "hardhat";
import {Manager} from "../../typechain";
import {Contract, contractAddressByEnvironment, Environment} from "../config";

export const main = async (): Promise<void> => {
    const COORDINATOR = "0x90b6C61B102eA260131aB48377E143D6EB3A9d4B";

    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [COORDINATOR],
    });

    let etherBal = ethers.utils.parseEther("5000").toHexString();
    if (etherBal.startsWith("0x0")) etherBal = "0x" + etherBal.substring(3);

    await ethers.provider.send("hardhat_setBalance", [COORDINATOR, etherBal]);

    const signer = await ethers.provider.getSigner(COORDINATOR);

    const manager = "0xA86e412109f77c45a3BC1c5870b880492Fb86A14";

    const managerArtifact = await artifacts.require("Manager");

    const eventProxy = artifacts.require("CurveController3");

    const ENV = Environment.MAINNET;
    const MANAGER_ADDRESS = contractAddressByEnvironment[ENV][Contract.MANAGER];
    const ADDRESS_REGISTRY = contractAddressByEnvironment[ENV][Contract.ADDRESS_REGISTRY];

    const CURVE_ADDRESS_PROVIDER = contractAddressByEnvironment[ENV][Contract.THIRDPARTY_CURVE_ADDRESS_PROVIDER];
    const N_COINS = 3;
    const [deployer] = await ethers.getSigners();

    const factory = (await import(`../../typechain/factories/CurveController${N_COINS}__factory`))[
        `CurveController${N_COINS}__factory`
    ];

    const controllerFactory = new factory(deployer);
    const controller = await controllerFactory.deploy(MANAGER_ADDRESS, ADDRESS_REGISTRY, CURVE_ADDRESS_PROVIDER);
    await controller.deployed();

    const x = await ethers.provider.getCode(controller.address);

    await ethers.provider.send("hardhat_setCode", ["0x800dF6754eC48f56572B406eA3FCdfD9E2D9f5e6", x]);

    const managerContract = new ethers.Contract(manager, managerArtifact.abi, signer) as unknown as Manager;

    const receipt = await managerContract.connect(signer).executeMaintenance({
        cycleSteps: [
            {
                controllerId: "0x6375727665330000000000000000000000000000000000000000000000000000",
                data: "0x376ed3b0000000000000000000000000bebc44782c7db0a1a60cb6fe97d0b483032ff1c7000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002540be4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000035ab028ac154b80000",
            },
        ],
    });
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
