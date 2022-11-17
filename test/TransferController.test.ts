// The purpose of this file is to directly test controllers, specifically the address registry
// functionality and the restriced calling functionality

import { ethers, artifacts, waffle, upgrades } from "hardhat";
import timeMachine from "ganache-time-traveler";
import { expect } from "chai";
import { MockContract } from "ethereum-waffle";
import {
    AddressRegistry,
    TransparentUpgradeableProxy,
    TransferController,
    Manager,
    TransferController__factory,
} from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MISC_OPERATION_ROLE } from "../test-integration/utilities/roles";

const ERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/ERC20.sol");
const { deployMockContract } = waffle;

let deployer: SignerWithAddress;
let owner: SignerWithAddress;
let notManager: SignerWithAddress;
let treasury: SignerWithAddress;
let registry: AddressRegistry;
let transferController: TransferController;
let transferFactory: TransferController__factory;
let mockERC20: MockContract;
let manager: Manager;
let snapshotId: string;

const CYCLE_DURATION = 60; // seconds
const controllerId = ethers.utils.formatBytes32String("transferFunds");
const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

describe("Test Controllers", () => {
    before(async () => {
        [deployer, owner, notManager, treasury] = await ethers.getSigners();

        mockERC20 = await deployMockContract(deployer, ERC20.abi);
        await mockERC20.mock.transfer.returns(true);

        // Deploy Manager
        const cycleStartTime = (await ethers.provider.getBlock("latest")).timestamp + 10;
        const managerFactory = await ethers.getContractFactory("Manager");
        manager = (await upgrades.deployProxy(managerFactory, [CYCLE_DURATION, cycleStartTime], {
            unsafeAllow: ["delegatecall", "constructor", "state-variable-assignment", "state-variable-immutable"],
        })) as Manager;
        await manager.deployed();

        // Deploy registry
        const registryFactory = await ethers.getContractFactory("AddressRegistry");
        registry = (await upgrades.deployProxy(registryFactory, [], {
            constructorArgs: ["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"],
            unsafeAllow: ["state-variable-assignment", "state-variable-immutable", "constructor"],
        })) as AddressRegistry;
        await registry.deployed();

        // Deploy transferController
        transferFactory = await ethers.getContractFactory("TransferController");
        transferController = await transferFactory.deploy(
            manager.address,
            manager.address,
            registry.address,
            treasury.address
        );
        await transferController.deployed();
    });

    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    describe("Test TransferController", () => {
        describe("Test Manager & Role guardrails", () => {
            it("Should reject when call is from non-manager address", async () => {
                await expect(
                    transferController.connect(notManager).transferFunds(mockERC20.address, 10)
                ).to.be.revertedWith("NOT_MANAGER_ADDRESS");
            });
        });

        describe("Test transferFunds function", () => {
            function getMaintenanceExecution(amount: number): MaintenanceExecution {
                const transferCycleData = transferFactory.interface.encodeFunctionData(
                    "transferFunds(address, uint256)",
                    [mockERC20.address, amount]
                );
                return {
                    cycleSteps: [
                        {
                            controllerId,
                            data: transferCycleData,
                        },
                    ],
                };
            }

            before(async () => {
                await manager.registerController(
                    ethers.utils.formatBytes32String("transferFunds"),
                    transferController.address
                );
                await manager.grantRole(MISC_OPERATION_ROLE, deployer.address);
            });

            beforeEach(async () => {
                timeMachine.advanceTime(130);
            });

            it("Should reject when token is not in registry", async () => {
                const maintenanceExecution = getMaintenanceExecution(10);
                await expect(manager.connect(deployer).executeMaintenance(maintenanceExecution)).to.be.revertedWith(
                    "FORBIDDEN_CALL"
                );
            });

            it("Should reject when amount is 0", async () => {
                const maintenanceExecution = getMaintenanceExecution(0);
                await expect(manager.connect(deployer).executeMaintenance(maintenanceExecution)).to.be.revertedWith(
                    "FORBIDDEN_CALL"
                );
            });

            it("Should transfer funds correctly", async () => {
                const maintenanceExecution = getMaintenanceExecution(10);
                await registry.connect(deployer).addToRegistry([mockERC20.address], 0);
                // await expect(manager.connect(deployer).executeMaintenance(maintenanceExecution)).to.not.be.reverted;
            });

            it("should revert Withdraw imbalance if sender has not the role NOT_MISC_OPERATION_ROLE", async () => {
                await manager.revokeRole(MISC_OPERATION_ROLE, deployer.address);
                const maintenanceExecution = getMaintenanceExecution(10);
                await registry.connect(deployer).addToRegistry([mockERC20.address], 0);
                await expect(manager.connect(deployer).executeMaintenance(maintenanceExecution)).to.be.revertedWith(
                    "FORBIDDEN_CALL"
                );
            });
        });
    });
});

type MaintenanceExecution = {
    cycleSteps: {
        controllerId: string;
        data: string;
    }[];
};
