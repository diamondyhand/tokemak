import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import {deployMockContract, MockContract} from "ethereum-waffle";
import {getContractAddress} from "ethers/lib/utils";
import {artifacts, ethers} from "hardhat";
import {MISC_OPERATION_ROLE} from "../test-integration/utilities/roles";
import {WethController} from "../typechain";

const wethAbi = artifacts.require("contracts/interfaces/IWETH.sol:IWETH").abi;
const accessControlAbi = artifacts.require("@openzeppelin/contracts/access/AccessControl.sol").abi;

describe("WethController", () => {
    let deployer: SignerWithAddress;
    let user1: SignerWithAddress;
    let controller: WethController;
    let weth: MockContract;
    let controllerAddress: string;
    let accessControl: MockContract;
    let addressRegistry: MockContract;

    before(async () => {
        [deployer, user1] = await ethers.getSigners();

        accessControl = await deployMockContract(deployer, accessControlAbi);

        const addressRegistryArtifact = artifacts.require("AddressRegistry");
        addressRegistry = await deployMockContract(deployer, addressRegistryArtifact.abi);

        weth = (await deployMockContract(deployer, wethAbi)) as unknown as MockContract;

        const txCount = await deployer.getTransactionCount();
        controllerAddress = getContractAddress({
            from: deployer.address,
            nonce: txCount + 1,
        });

        await addressRegistry.mock.weth.returns(weth.address);

        const controllerFactory = await ethers.getContractFactory("WethController");
        controller = await controllerFactory.deploy(controllerAddress, accessControl.address, addressRegistry.address);
        await controller.deployed();
    });

    beforeEach(async () => {
        await accessControl.mock.hasRole.withArgs(MISC_OPERATION_ROLE, user1.address).returns(true);
    });

    describe("Test constructor", () => {
        it("Correct args", async () => {
            expect(await controller.manager()).to.equal(controllerAddress);
            expect(await controller.addressRegistry()).to.equal(addressRegistry.address);
            expect(await controller.weth()).to.equal(weth.address);
        });
    });

    describe("Test roles", () => {
        it("should revert if sender has not the role MISC_OPERATION_ROLE", async () => {
            await accessControl.mock.hasRole.withArgs(MISC_OPERATION_ROLE, user1.address).returns(false);
            await expect(controller.connect(user1).wrap(0)).to.be.revertedWith("NOT_MISC_OPERATION_ROLE");
        });

        it("should revert if sender has not the role MISC_OPERATION_ROLE", async () => {
            await accessControl.mock.hasRole.withArgs(MISC_OPERATION_ROLE, user1.address).returns(false);

            await expect(controller.connect(user1).unwrap(0)).to.be.revertedWith("NOT_MISC_OPERATION_ROLE");
        });
    });

    describe("Test wrapping", () => {
        it("Reverts on 0 msg.value", async () => {
            await expect(controller.connect(user1).wrap(0)).to.be.revertedWith("INVALID_VALUE");
        });

        it("Reverts on incorrect balance returned", async () => {
            await weth.mock.balanceOf.returns(0);
            await weth.mock.deposit.returns();
            await expect(controller.connect(user1).wrap(5, {value: 5})).to.be.revertedWith("INCORRECT_WETH_AMOUNT");
        });
    });

    describe("Testing unwrapping", () => {
        beforeEach(async () => {
            await weth.mock.balanceOf.withArgs(user1.address).returns(10);
        });

        it("Reverts on 0 amount", async () => {
            await expect(controller.connect(user1).unwrap(0)).to.be.revertedWith("INVALID_AMOUNT");
        });

        it("Reverts on excess withdrawal", async () => {
            await weth.mock.balanceOf.returns(4);
            await expect(controller.connect(user1).unwrap(5)).to.be.revertedWith("EXCESS_WITHDRAWAL");
        });

        it("Reverts on incorrect eth returned", async () => {
            await weth.mock.balanceOf.returns(5);
            await weth.mock.withdraw.returns();
            await expect(controller.connect(user1).unwrap(4)).to.be.revertedWith("INCORRECT_ETH_AMOUNT");
        });
    });
});
