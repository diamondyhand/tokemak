import {ethers, artifacts} from "hardhat";
import dotenv from "dotenv";
import {Manager} from "../../typechain";
import {ManagerRoles, Environment} from "../config";
import {sendTransaction} from "gnosis-tx-submitter";

dotenv.config();

export interface ManagerGrantRoleInput {
    targetEnv: Environment;
    managerAddress: string;
    safeAddress?: string;
    role: string;
    address: string;
}

export const runManagerGrantRole = async (config: ManagerGrantRoleInput): Promise<void> => {
    console.log(` 
    env=${config.targetEnv}
    manager=${config.managerAddress}
    safeAddress=${config.safeAddress}
    role=${config.role}
    address=${config.address}
    \n`);

    const managerArtifact = await artifacts.require("Manager");
    const manager = (await ethers.getContractAt(managerArtifact.abi, config.managerAddress)) as unknown as Manager;

    let newRole = "";
    switch (config.role) {
        case ManagerRoles.ADD_LIQUIDITY_ROLE:
            newRole = await manager.ADD_LIQUIDITY_ROLE();
            break;
        case ManagerRoles.REMOVE_LIQUIDITY_ROLE:
            newRole = await manager.REMOVE_LIQUIDITY_ROLE();
            break;
        case ManagerRoles.MISC_OPERATION_ROLE:
            newRole = await manager.MISC_OPERATION_ROLE();
            break;
        default:
            throw `ROLE=${config.role} hasn't been implemented yet`;
    }

    if (config.safeAddress) {
        console.log("Sending transaction to Gnosis...");
        await sendGrantRoleToGnosis(
            config.safeAddress,
            manager,
            newRole,
            config.address,
            config.targetEnv === Environment.MAINNET ? 1 : 5
        );
    } else {
        const grantRole = await manager.grantRole(newRole, config.address);
        await grantRole.wait();

        console.log(`${config.role} granted to ${config.address}`);
    }
};

const sendGrantRoleToGnosis = async (
    safe: string,
    manager: Manager,
    newRole: string,
    address: string,
    chainId: number
): Promise<void> => {
    const tx = {
        transactionTargetAddress: manager.address,
        transactionValue: ethers.BigNumber.from(0),
        transactionData: manager.interface.encodeFunctionData("grantRole", [newRole, address]),
    };

    await sendTransaction(safe, [tx], process.env.PRIVATE_KEY!, process.env.ALCHEMY_API_KEY!, chainId);
};
