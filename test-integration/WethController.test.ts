import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import * as timeMachine from "ganache-time-traveler";
import {expect} from "chai";
import {deployMockContract, MockContract} from "ethereum-waffle";
import {WethController, IWETH, Manager, AddressRegistry} from "../typechain";
import {ethers, network, artifacts, upgrades} from "hardhat";
import {ContractFactory} from "ethers";

const WETH_ABI = artifacts.require("contracts/interfaces/IWETH.sol:IWETH").abi;
const ACCESS_CONTROL_ABI = artifacts.require("@openzeppelin/contracts/access/AccessControl.sol").abi;

const WETH_WHALE_ADDRESS = "0x2feb1512183545f48f6b9c5b4ebfcaf49cfca6f3";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

describe("Testing WethController", () => {
    let deployer: SignerWithAddress;
    let user1: SignerWithAddress;
    let whaleSigner: SignerWithAddress;
    let wethContract: IWETH;
    let controller: WethController;
    let manager: Manager;
    let registry: AddressRegistry;
    let controllerId: string;
    let controllerInterface: ContractFactory["interface"];
    let snapshotId: string;
    let accessControl: MockContract;

    before(async () => {
        [deployer, user1] = await ethers.getSigners();

        accessControl = await deployMockContract(deployer, ACCESS_CONTROL_ABI);
        await accessControl.mock.hasRole.returns(true);

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [WETH_WHALE_ADDRESS],
        });
        await deployer.sendTransaction({
            to: WETH_WHALE_ADDRESS,
            value: ethers.utils.parseEther("10"),
        });
        whaleSigner = (await ethers.provider.getSigner(WETH_WHALE_ADDRESS)) as unknown as SignerWithAddress;
        wethContract = (await ethers.getContractAt(WETH_ABI, WETH_ADDRESS)) as unknown as IWETH;

        const managerFactory = await ethers.getContractFactory("Manager");
        manager = (await upgrades.deployProxy(
            managerFactory,
            [20, (await ethers.provider.getBlock("latest")).timestamp + 20],
            {
                unsafeAllow: ["delegatecall", "constructor", "state-variable-assignment", "state-variable-immutable"],
            }
        )) as Manager;
        await manager.deployed();

        const registryFactory = await ethers.getContractFactory("AddressRegistry");
        registry = (await upgrades.deployProxy(registryFactory, [], {
            constructorArgs: ["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"],
            unsafeAllow: ["state-variable-assignment", "state-variable-immutable", "constructor"],
        })) as AddressRegistry;
        await registry.deployed();

        const controllerFactory = await ethers.getContractFactory("WethController");
        controllerInterface = controllerFactory.interface;
        controller = await controllerFactory.deploy(manager.address, accessControl.address, registry.address);
        controllerId = ethers.utils.formatBytes32String("weth");

        await manager.connect(deployer).registerController(controllerId, controller.address);
    });

    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    describe("Integration tests", () => {
        it("Returns proper amout of eth to Manager", async () => {
            const amount = 5;

            await wethContract.connect(whaleSigner).transfer(manager.address, amount);
            expect(await ethers.provider.getBalance(manager.address)).to.equal(0);
            expect(await wethContract.balanceOf(manager.address)).to.equal(amount);

            const maintenanceData = cycleData(amount, "unwrap");
            await expect(manager.connect(deployer).executeMaintenance(maintenanceData)).to.not.be.reverted;
            expect(await ethers.provider.getBalance(manager.address)).to.equal(5);
            expect(await wethContract.balanceOf(manager.address)).to.equal(0);
        });

        it("Returns proper amount of weth to Manager", async () => {
            const amount = 5;

            await user1.sendTransaction({
                to: manager.address,
                value: amount,
            });
            expect(await ethers.provider.getBalance(manager.address)).to.equal(amount);
            expect(await wethContract.balanceOf(manager.address)).to.equal(0);

            const maintenanceData = cycleData(amount, "wrap");
            await expect(manager.connect(deployer).executeMaintenance(maintenanceData)).to.not.be.reverted;
            expect(await ethers.provider.getBalance(manager.address)).to.equal(0);
            expect(await wethContract.balanceOf(manager.address)).to.equal(amount);
        });
    });

    /**
     * Unit type test.  Testing here because of the way that the unit test file is set up.  Here the
     * caller and manager are seperate, in the unit test file they are the same address.  This makes
     * it difficult to plan for the caller in the unit test file to have a certain amount of ether.
     */
    describe("Testing for Manager sending in higher amount than eth it has on wrap", () => {
        it("Reverts on not enough eth", async () => {
            await user1.sendTransaction({
                to: manager.address,
                value: 5,
            });

            const maintenanceData = {
                cycleSteps: [
                    {
                        controllerId: controllerId,
                        data: controllerInterface.encodeFunctionData("wrap", [6]),
                    },
                ],
            };
            await expect(manager.connect(deployer).executeMaintenance(maintenanceData)).to.be.revertedWith(
                "NOT_ENOUGH_ETH"
            );
        });
    });
    const cycleData = (amount: number, sig: string) => {
        return {
            cycleSteps: [
                {
                    controllerId: controllerId,
                    data: controllerInterface.encodeFunctionData(sig, [amount]),
                },
            ],
        };
    };
});
