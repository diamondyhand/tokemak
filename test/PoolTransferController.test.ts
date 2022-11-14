import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import * as timeMachine from "ganache-time-traveler";
import {expect} from "chai";
import {deployMockContract, MockContract} from "ethereum-waffle";
import {ethers, network, upgrades, artifacts} from "hardhat";
import {AddressRegistry, ERC20, Pool, PoolTransferController} from "../typechain";
import {getContractAddress} from "@ethersproject/address";
import {MISC_OPERATION_ROLE} from "./utilities/roles";

const WETH_WHALE = "0x2feb1512183545f48f6b9c5b4ebfcaf49cfca6f3";
const USDC_WHALE = "0x6262998ced04146fa42253a5c0af90ca02dfd2a3";

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

const MANAGER = "0xA86e412109f77c45a3BC1c5870b880492Fb86A14";

const ACCESS_CONTROL = artifacts.require("@openzeppelin/contracts/access/AccessControl.sol");

let registry: AddressRegistry;
let controller: PoolTransferController;
let usdcPool: Pool;
let wethPool: Pool;
let fakePool: Pool;
let usdcContract: ERC20;
let wethContract: ERC20;
let deployer: SignerWithAddress;
let user1: SignerWithAddress;
let fakeToken: SignerWithAddress;
let snapshotId: string;
let accessControl: MockContract;
let rebalancer: SignerWithAddress;

const wethAmount = 45;
const usdcAmount = 75;

describe("Pool Transfer Controller", () => {
    before(async () => {
        [deployer, user1, fakeToken, rebalancer] = await ethers.getSigners();
        const wethWhaleSigner = await impersonateAccount(WETH_WHALE);
        const usdcWhaleSigner = await impersonateAccount(USDC_WHALE);

        await setBalance(WETH_WHALE);
        await setBalance(USDC_WHALE);

        wethContract = await ethers.getContractAt("ERC20", WETH_ADDRESS);
        usdcContract = await ethers.getContractAt("ERC20", USDC_ADDRESS);

        await wethContract.connect(wethWhaleSigner).transfer(user1.address, 100);
        await usdcContract.connect(usdcWhaleSigner).transfer(user1.address, 100);

        wethPool = await setUpPool(WETH_ADDRESS, MANAGER, "WETH Reactor", "tWETH", rebalancer.address);
        usdcPool = await setUpPool(USDC_ADDRESS, MANAGER, "USDC Reactor", "tUSDC", rebalancer.address);
        fakePool = await setUpPool(fakeToken.address, MANAGER, "FakeToken", "FT", rebalancer.address);

        accessControl = await deployMockContract(deployer, ACCESS_CONTROL.abi);

        const registryFactory = await ethers.getContractFactory("AddressRegistry");
        registry = (await upgrades.deployProxy(registryFactory, [], {
            constructorArgs: ["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"],
            unsafeAllow: ["state-variable-assignment", "state-variable-immutable", "constructor"],
        })) as AddressRegistry;
        await registry.deployed();

        await addToRegistry([WETH_ADDRESS, USDC_ADDRESS], 0);
        await addToRegistry([wethPool.address, usdcPool.address], 2);

        const deployerTransactionCount = await deployer.getTransactionCount();
        const controllerAddress = getContractAddress({
            from: deployer.address,
            nonce: deployerTransactionCount,
        });

        const controllerFactory = await ethers.getContractFactory("PoolTransferController");
        controller = await controllerFactory.deploy(controllerAddress, accessControl.address, registry.address);
        await controller.deployed();
    });

    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
        await accessControl.mock.hasRole.withArgs(MISC_OPERATION_ROLE, user1.address).returns(true);
    });

    describe("Test roles", async () => {
        it("should revert if sender has not the role MISC_OPERATION_ROLE", async () => {
            await accessControl.mock.hasRole.withArgs(MISC_OPERATION_ROLE, user1.address).returns(false);
            await expect(
                controller.connect(user1).transferToPool([wethPool.address, usdcPool.address], [wethAmount, usdcAmount])
            ).to.be.revertedWith("NOT_MISC_OPERATION_ROLE");
        });
    });

    describe("Test deposits into pools through controller without manager", async () => {
        it("Runs correctly", async () => {
            expect(await wethContract.balanceOf(wethPool.address)).to.equal(0);
            expect(await usdcContract.balanceOf(usdcPool.address)).to.equal(0);

            await wethContract.connect(user1).transfer(controller.address, wethAmount);
            await usdcContract.connect(user1).transfer(controller.address, usdcAmount);

            // Transfer 45 of weth, 75 of usdc to pool
            const tx = await controller
                .connect(user1)
                .transferToPool([wethPool.address, usdcPool.address], [wethAmount, usdcAmount]);
            const receipt = await tx.wait();

            // Events on different contracts, do not need to check values
            expect(receipt.events![0]).to.exist;
            expect(receipt.events![1]).to.exist;

            expect(await wethContract.balanceOf(wethPool.address)).to.equal(wethAmount);
            expect(await usdcContract.balanceOf(usdcPool.address)).to.equal(usdcAmount);
        });
    });

    describe("Unit type testing", () => {
        it("Reverts on pool array length of 0", async () => {
            await expect(controller.connect(user1).transferToPool([], [])).to.be.revertedWith("NO_POOLS");
        });

        it("Reverts on mismatched array length", async () => {
            await expect(
                controller.connect(user1).transferToPool([wethPool.address], [wethAmount, usdcAmount])
            ).to.be.revertedWith("MISMATCH_ARRAY_LENGTH");
        });

        it("Reverts on 0 amount", async () => {
            await expect(controller.connect(user1).transferToPool([wethPool.address], [0])).to.be.revertedWith(
                "INVALID_AMOUNT"
            );
        });

        it("Reverts on pool not included in registry", async () => {
            await expect(controller.connect(user1).transferToPool([fakePool.address], [wethAmount])).to.be.revertedWith(
                "INVALID_POOL"
            );
        });

        it("Reverts on invalid token", async () => {
            await addToRegistry([fakePool.address], 2);
            await expect(controller.connect(user1).transferToPool([fakePool.address], [wethAmount])).to.be.revertedWith(
                "INVALID_TOKEN"
            );
        });

        // Making sure inherited ERC20 contract reverts
        it("Reverts on amount exceeding balance", async () => {
            await wethContract.connect(user1).transfer(controller.address, wethAmount);
            await expect(controller.connect(user1).transferToPool([wethPool.address], [100])).to.be.reverted;
        });
    });
});

const impersonateAccount = async (address: string): Promise<SignerWithAddress> => {
    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address],
    });
    return ethers.provider.getSigner(address) as unknown as SignerWithAddress;
};

const setBalance = async (address: string) => {
    await network.provider.send("hardhat_setBalance", [
        address,
        "0x3635c9adc5dea00000", // 1000 eth
    ]);
};

const setUpPool = async (
    underlyer: string,
    manager: string,
    name: string,
    symbol: string,
    rebalancer: string
): Promise<Pool> => {
    const factory = await ethers.getContractFactory("Pool");
    const pool = await upgrades.deployProxy(factory, [underlyer, manager, name, symbol, rebalancer], {
        unsafeAllow: ["constructor"],
    });
    await pool.deployed();
    return pool as Pool;
};

const addToRegistry = async (addresses: string[], index: number) => {
    const tx = await registry.connect(deployer).addToRegistry(addresses, index);
    await tx.wait();
};
