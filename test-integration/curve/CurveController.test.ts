import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import {deployMockContract, MockContract} from "ethereum-waffle";
import * as timeMachine from "ganache-time-traveler";
import {artifacts, ethers, network} from "hardhat";
import {
    IStableSwapPool,
    CurveControllerTemplate,
    TestnetToken,
    TestnetToken__factory,
    ICurveFactory,
} from "../../typechain";
import {getContractAddress} from "@ethersproject/address";
import {BigNumber, ContractTransaction} from "ethers";
import {JsonRpcSigner} from "@ethersproject/providers";
import {ADD_LIQUIDITY_ROLE, REMOVE_LIQUIDITY_ROLE} from "../utilities/roles";

const ACCESS_CONTROL = artifacts.require("@openzeppelin/contracts/access/AccessControl.sol");
import {Amount} from "../utilities/fundAccount";

describe("Test Curve Controller", () => {
    const CURVE_FACTORY_ADDRESS = "0xb9fc157394af804a3578134a6585c0dc9cc990d4";
    const CURVE_ADDRESS_PROVIDER_ADDRESS = "0x0000000022D53366457F9d5E68Ec105046FC4383";

    // const ASSET_TYPES = [
    //   'USD',
    //   'ETH',
    //   'BTC',
    //   'Other',
    // ];
    const CURVE_POOL_ASSET_TYPE = 0;
    // // [[title, description], …]
    // const IMPLEMENTATIONS_COPY = [
    //   ['Basic', 'For pools that supports any major ERC20 return implementation (“return True / revert”, “return None / revert”, “return True / return False”), and any number of decimal places up to 18'],
    //   ['Balances', 'For pools with positive rebase tokens like aTokens, or where there’s a fee-on-transfer; tokens with negative rebases must not be used'],
    //   [config.nativeCurrency.symbol, `For pools containing native ${config.nativeCurrency.symbol} (represented as 0xEE…EE)`],
    //   ['Optimized', 'A more gas-efficient implementation that can be used when every token in the pool has 18 decimals and returns True on success / reverts on error'],
    // ];
    const CURVE_POOL_IMPLEMENTATION_TYPE = 0;
    const CURVE_POOL_AMPLIFICATION = 1000000000;
    const CURVE_POOL_FEE = 4000000;

    let pool: IStableSwapPool;
    let controller: CurveControllerTemplate;
    let snapshotId: string;
    let deployer: SignerWithAddress;
    let addressRegistry: MockContract;
    let accessControl: MockContract;

    let token1: TestnetToken;
    let token2: TestnetToken;

    let controllerSigner: JsonRpcSigner;

    const token1InitialAmount = Amount(100);
    const token2InitialAmount = Amount(100);

    const token1DepositAmount = Amount(100);
    const token2DepositAmount = Amount(100);
    const minMintAmount = token1DepositAmount.add(token2DepositAmount);

    before(async () => {
        [deployer] = await ethers.getSigners();

        accessControl = await deployMockContract(deployer, ACCESS_CONTROL.abi);
        await accessControl.mock.hasRole.returns(true);

        const addressRegistryArtifact = artifacts.require("AddressRegistry");
        addressRegistry = await deployMockContract(deployer, addressRegistryArtifact.abi);

        //Determine the address of the upcoming controller beforehand so that
        //we can send it in as the "manager" and satisfy our "onlyManager" or "only self" checks
        const transactionCount = await deployer.getTransactionCount();
        const controllerAddress = getContractAddress({
            from: deployer.address,
            nonce: transactionCount,
        });

        //Deploy the actual controller
        const curveControllerFactory = await ethers.getContractFactory("CurveControllerTemplate");
        controller = await curveControllerFactory
            .connect(deployer)
            .deploy(controllerAddress, accessControl.address, addressRegistry.address, CURVE_ADDRESS_PROVIDER_ADDRESS);

        //Get a reference to the controller as a signer so we can again
        //make calls as the "Manager"
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [controller.address],
        });

        controllerSigner = await ethers.provider.getSigner(controller.address);

        //Fund our signer with lots of ETH
        let etherBal = ethers.utils.parseEther("50000").toHexString();
        if (etherBal.startsWith("0x0")) etherBal = "0x" + etherBal.substring(3);

        await ethers.provider.send("hardhat_setBalance", [controller.address, etherBal]);

        //Deploy some test tokens to work with
        const erc20Factory = (await ethers.getContractFactory("TestnetToken", deployer)) as TestnetToken__factory;
        token1 = await erc20Factory.deploy("token1", "token1", 18);
        token2 = await erc20Factory.deploy("token2", "token2", 18);

        const curveFactory = await ethers.getContractAt("ICurveFactory", CURVE_FACTORY_ADDRESS);

        const deployPool = (contract: typeof curveFactory.callStatic | ICurveFactory) => {
            return contract["deploy_plain_pool(string,string,address[4],uint256,uint256,uint256,uint256)"](
                "Token1/Token2",
                "t1+t1",
                [token1.address, token2.address, ethers.constants.AddressZero, ethers.constants.AddressZero],
                CURVE_POOL_AMPLIFICATION,
                CURVE_POOL_FEE,
                CURVE_POOL_ASSET_TYPE,
                CURVE_POOL_IMPLEMENTATION_TYPE
            );
        };

        const poolAddress = (await deployPool(curveFactory.callStatic)) as string;

        const deployPoolTx = (await deployPool(curveFactory)) as ContractTransaction;
        await deployPoolTx.wait();

        pool = await ethers.getContractAt("IStableSwapPool", poolAddress);
    });

    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];

        await addressRegistry.mock.checkAddress.returns(true);
        await token1.connect(deployer).mint(controller.address, token1InitialAmount);
        await token2.connect(deployer).mint(controller.address, token2InitialAmount);
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    describe("Test roles", async () => {
        it("should revert if sender has not the role ADD_LIQUIDITY_ROLE", async () => {
            await accessControl.mock.hasRole.withArgs(ADD_LIQUIDITY_ROLE, controllerSigner._address).returns(false);

            await expect(
                controller
                    .connect(controllerSigner)
                    .deploy(
                        pool.address,
                        [token1InitialAmount.add(token1DepositAmount), token2DepositAmount],
                        minMintAmount
                    )
            ).to.be.revertedWith("NOT_ADD_LIQUIDITY_ROLE");
        });

        it("should revert Withdraw imbalance if sender has not the role REMOVE_LIQUIDITY_ROLE", async () => {
            await accessControl.mock.hasRole.withArgs(REMOVE_LIQUIDITY_ROLE, controllerSigner._address).returns(false);

            const maxBurnAmount = Amount(50).add(Amount(50)).add(1);

            await expect(
                controller
                    .connect(controllerSigner)
                    .withdrawImbalance(pool.address, [Amount(50), Amount(50)], maxBurnAmount)
            ).to.be.revertedWith("NOT_REMOVE_LIQUIDITY_ROLE");
        });

        it("should revert Withdraw if sender has not the role REMOVE_LIQUIDITY_ROLE", async () => {
            await accessControl.mock.hasRole.withArgs(REMOVE_LIQUIDITY_ROLE, controllerSigner._address).returns(false);

            await expect(
                controller.connect(controllerSigner).withdraw(pool.address, minMintAmount, [Amount(90), Amount(90)])
            ).to.be.revertedWith("NOT_REMOVE_LIQUIDITY_ROLE");
        });

        it("It reverts Withdraw one coin if sender has not the role REMOVE_LIQUIDITY_ROLE", async () => {
            await accessControl.mock.hasRole.withArgs(REMOVE_LIQUIDITY_ROLE, controllerSigner._address).returns(false);

            await expect(
                controller.connect(controllerSigner).withdrawOneCoin(pool.address, Amount(90), 0, Amount(89))
            ).to.be.revertedWith("NOT_REMOVE_LIQUIDITY_ROLE");
        });
    });

    describe("Test liquidity deployement", async () => {
        it("Add liquidity successfully", async () => {
            const token1DepositAmount = Amount(100);
            const token2DepositAmount = Amount(100);
            const minMintAmount = token1DepositAmount.add(token2DepositAmount);

            await controller
                .connect(controllerSigner)
                .deploy(pool.address, [token1DepositAmount, token2DepositAmount], minMintAmount);

            const lpTokenBalance = await pool.callStatic.balanceOf(controller.address);

            // check that coins balances have decreased
            expect(await token1.balanceOf(controller.address)).to.be.equal(
                token1InitialAmount.sub(token1DepositAmount)
            );
            expect(await token2.balanceOf(controller.address)).to.be.equal(
                token2InitialAmount.sub(token2DepositAmount)
            );

            // check that lpToken balance has increased
            expect(BigNumber.from(lpTokenBalance)).to.be.gte(minMintAmount);

            // check that coins allowance has been reset
            expect(await token1.allowance(controller.address, pool.address)).to.equal(0);
            expect(await token2.allowance(controller.address, pool.address)).to.equal(0);
        });

        it("Reverts is balance is lower that deposited amount", async () => {
            await expect(
                controller
                    .connect(controllerSigner)
                    .deploy(
                        pool.address,
                        [token1InitialAmount.add(token1DepositAmount), token2DepositAmount],
                        minMintAmount
                    )
            ).to.be.revertedWith("INSUFFICIENT_BALANCE");
        });
    });

    describe("Test liquidity withdrawal", async () => {
        beforeEach(async () => {
            await controller
                .connect(controllerSigner)
                .deploy(pool.address, [token1DepositAmount, token2DepositAmount], minMintAmount);
        });

        it("Withdraw imbalance liquidity successfully", async () => {
            const token1WithdrawAmount = Amount(50);
            const token2WithdrawAmount = Amount(50);
            const maxBurnAmount = token1WithdrawAmount.add(token2WithdrawAmount).add(1);

            await controller
                .connect(controllerSigner)
                .withdrawImbalance(pool.address, [Amount(50), Amount(50)], maxBurnAmount);

            const lpTokenBalance = await pool.callStatic.balanceOf(controller.address);

            // check that coins balances have increased
            expect(await token1.balanceOf(controller.address)).to.be.equal(
                token1InitialAmount.sub(token1DepositAmount).add(token1WithdrawAmount)
            );
            expect(await token2.balanceOf(controller.address)).to.be.equal(
                token2InitialAmount.sub(token2DepositAmount).add(token2WithdrawAmount)
            );

            // check that lpToken balance has decreased
            expect(BigNumber.from(lpTokenBalance)).to.be.lte(maxBurnAmount);

            expect(await token1.allowance(controller.address, pool.address)).to.equal(0);
            expect(await token2.allowance(controller.address, pool.address)).to.equal(0);
        });

        it("Withdraw liquidity successfully", async () => {
            const minToken1Amount = Amount(90);
            const minToken2Amount = Amount(90);
            await controller
                .connect(controllerSigner)
                .withdraw(pool.address, minMintAmount, [minToken1Amount, minToken2Amount]);

            const lpTokenBalance = await pool.callStatic.balanceOf(controller.address);

            // check that coins balances have increased
            expect(await token1.balanceOf(controller.address)).to.be.gte(
                token1InitialAmount.sub(token1DepositAmount).add(minToken1Amount)
            );
            expect(await token2.balanceOf(controller.address)).to.be.gte(
                token2InitialAmount.sub(token2DepositAmount).add(minToken2Amount)
            );

            // check that lpToken balance has decreased
            expect(BigNumber.from(lpTokenBalance)).to.be.gte(0);

            // check that coins allowance has been reset
            expect(await token1.allowance(controller.address, pool.address)).to.equal(0);
            expect(await token2.allowance(controller.address, pool.address)).to.equal(0);
        });

        it("Withdraw one coin successfully", async () => {
            const token1Amount = Amount(90);
            const minAmount = Amount(89);
            await controller.connect(controllerSigner).withdrawOneCoin(pool.address, token1Amount, 0, minAmount);

            // check that coins balances have increased
            expect(await token1.balanceOf(controller.address)).to.be.gte(
                token1InitialAmount.sub(token1DepositAmount).add(minAmount)
            );
            expect(await token2.balanceOf(controller.address)).to.be.gte(token2InitialAmount.sub(token2DepositAmount));

            // check that coins allowance has been reset
            expect(await token1.allowance(controller.address, pool.address)).to.equal(0);
            expect(await token2.allowance(controller.address, pool.address)).to.equal(0);
        });
    });
});
