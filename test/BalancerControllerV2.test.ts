import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import {deployMockContract, MockContract} from "ethereum-waffle";
import * as timeMachine from "ganache-time-traveler";
import {artifacts, ethers, network} from "hardhat";
import {BalancerControllerV2, ERC20, BalancerHelpers} from "../typechain";
import {getContractAddress} from "@ethersproject/address";
import {JsonRpcSigner} from "@ethersproject/providers";
import {ADD_LIQUIDITY_ROLE, REMOVE_LIQUIDITY_ROLE} from "./utilities/roles";

import {WeightedPoolEncoder} from "@balancer-labs/balancer-js";

import {BAL_ADDRESS, BAL_WHALE_ADDRESS, WETH_ADDRESS, WETH_WHALE_ADDRESS} from "./utilities/consts";

const ERC20Artifact = artifacts.require("@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20");
const ACCESS_CONTROL = artifacts.require("@openzeppelin/contracts/access/AccessControl.sol");

describe("Test Balancer V2 Controller", () => {
    const BALANCER_VAULT_ADDRESS = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";

    const BALANCER_BALETH_8020_POOL_ID = "0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014";
    const BALANCER_BALETH_8020_POOL_ADDRESS = "0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56";
    // pool: https://app.balancer.fi/#/pool/0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014

    const assets = [BAL_ADDRESS, WETH_ADDRESS];

    let controller: BalancerControllerV2;
    let snapshotId: string;
    let snapshotId_individual: string;
    let deployer: SignerWithAddress;
    let addressRegistry: MockContract;
    let accessControl: MockContract;

    let controllerSigner: JsonRpcSigner;

    let asset1bal: ERC20;
    let asset2weth: ERC20;
    let bpt: ERC20;

    let queries: BalancerHelpers;

    before(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];

        [deployer] = await ethers.getSigners();

        accessControl = await deployMockContract(deployer, ACCESS_CONTROL.abi);

        const addressRegistryArtifact = artifacts.require("AddressRegistry");
        addressRegistry = await deployMockContract(deployer, addressRegistryArtifact.abi);

        const transactionCount = await deployer.getTransactionCount();
        const controllerAddress = getContractAddress({from: deployer.address, nonce: transactionCount});

        const balancerFactory = await ethers.getContractFactory("BalancerControllerV2");
        controller = await balancerFactory
            .connect(deployer)
            .deploy(BALANCER_VAULT_ADDRESS, controllerAddress, accessControl.address, addressRegistry.address);

        await network.provider.request({method: "hardhat_impersonateAccount", params: [controller.address]});

        controllerSigner = ethers.provider.getSigner(controller.address);

        let etherBal = ethers.utils.parseEther("5000").toHexString();
        if (etherBal.startsWith("0x0")) etherBal = "0x" + etherBal.substring(3);

        await ethers.provider.send("hardhat_setBalance", [controller.address, etherBal]);

        asset1bal = (await ethers.getContractAt(ERC20Artifact.abi, BAL_ADDRESS)) as ERC20;
        asset2weth = (await ethers.getContractAt(ERC20Artifact.abi, WETH_ADDRESS)) as ERC20;
        bpt = (await ethers.getContractAt(ERC20Artifact.abi, BALANCER_BALETH_8020_POOL_ADDRESS)) as ERC20;

        // helper functions for balancer amounts queries
        const queriesFactory = await ethers.getContractFactory("BalancerHelpers");
        queries = await queriesFactory.connect(deployer).deploy(BALANCER_VAULT_ADDRESS);
    });

    after(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    describe("Test roles", async () => {
        it("should revert deployement if sender has not the role ADD_LIQUIDITY_ROLE", async () => {
            await accessControl.mock.hasRole.withArgs(ADD_LIQUIDITY_ROLE, controllerSigner._address).returns(false);

            await expect(
                controller
                    .connect(controllerSigner)
                    .deploy(BALANCER_BALETH_8020_POOL_ID, [BAL_ADDRESS, WETH_ADDRESS], [0], 0)
            ).to.be.revertedWith("NOT_ADD_LIQUIDITY_ROLE");
        });

        it("should revert Withdraw if sender has not the role REMOVE_LIQUIDITY_ROLE", async () => {
            await accessControl.mock.hasRole.withArgs(REMOVE_LIQUIDITY_ROLE, controllerSigner._address).returns(false);
            await expect(
                controller.connect(controllerSigner).withdraw(BALANCER_BALETH_8020_POOL_ID, 0, assets, [0])
            ).to.be.revertedWith("NOT_REMOVE_LIQUIDITY_ROLE");
        });

        it("should revert Withdraw imbalance if sender has not the role REMOVE_LIQUIDITY_ROLE", async () => {
            await accessControl.mock.hasRole.withArgs(REMOVE_LIQUIDITY_ROLE, controllerSigner._address).returns(false);
            await expect(
                controller.connect(controllerSigner).withdrawImbalance(BALANCER_BALETH_8020_POOL_ID, 0, assets, [0])
            ).to.be.revertedWith("NOT_REMOVE_LIQUIDITY_ROLE");
        });
    });

    describe("Deploy and Withdraw Liquidity tests", async () => {
        before(async () => {
            // set up mock access
            await addressRegistry.mock.checkAddress.returns(true);
            await accessControl.mock.hasRole.withArgs(ADD_LIQUIDITY_ROLE, controllerSigner._address).returns(true);
            await accessControl.mock.hasRole.withArgs(REMOVE_LIQUIDITY_ROLE, controllerSigner._address).returns(true);

            // fund asset accounts
            await fundAccount(BAL_ADDRESS, BAL_WHALE_ADDRESS, controller.address, 2500, 18);
            await fundAccount(WETH_ADDRESS, WETH_WHALE_ADDRESS, controller.address, 10, 18);
        });

        beforeEach(async () => {
            const snapshot = await timeMachine.takeSnapshot();
            snapshotId_individual = snapshot["result"];
        });

        afterEach(async () => {
            await timeMachine.revertToSnapshot(snapshotId_individual);
        });

        it("deposit to invalid pool should revert", async () => {
            const poolId = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

            const balAmount = ethers.utils.parseUnits("10", 18);
            const wethAmount = ethers.utils.parseUnits("10", 18);

            const amountsIn = [balAmount, wethAmount];

            await expect(controller.connect(controllerSigner).deploy(poolId, assets, amountsIn, 1)).to.be.reverted;
        });

        it("deposit and withdraw LP Tokens", async () => {
            const poolId = BALANCER_BALETH_8020_POOL_ID;

            const asset1before = await asset1bal.balanceOf(controller.address);
            const asset2before = await asset2weth.balanceOf(controller.address);
            const bptBefore = await bpt.balanceOf(controller.address);

            const assets = [BAL_ADDRESS, WETH_ADDRESS];
            const amountsIn = [asset1before, asset2before];

            //
            // calculate min # of bpt to expect after liquidity deploy
            //

            const depositUserData = WeightedPoolEncoder.joinExactTokensInForBPTOut(amountsIn, 1);
            const queryJoinResult = await queries.callStatic.queryJoin(poolId, controller.address, controller.address, {
                assets: assets,
                maxAmountsIn: amountsIn,
                fromInternalBalance: false,
                userData: depositUserData,
            });
            const minBptExpected = queryJoinResult.bptOut.div(100).mul(99); // 1% slippage

            //
            // deploy liquidity
            //
            await expect(controller.connect(controllerSigner).deploy(poolId, assets, amountsIn, minBptExpected)).to.not
                .be.reverted;

            const asset1after = await asset1bal.balanceOf(controller.address);
            const asset2after = await asset2weth.balanceOf(controller.address);
            const bptAfter = await bpt.balanceOf(controller.address);

            // check to make sure assets are withdrawn from controller
            expect(asset1before).to.be.gt(asset1after);
            expect(asset1after).to.be.equal(0);
            expect(asset2before).to.be.gt(asset2after);
            expect(asset2after).to.be.equal(0);
            // check to make sure we've received BPT
            expect(bptBefore).to.be.lt(bptAfter);
            expect(bptAfter).to.be.gte(minBptExpected);

            // TODO: do we need this? @codenutt
            await mineBlocks(4);

            // calculate amounts for partial withdraw
            const halfBal = asset1before.div(2);
            const halfWeth = asset2before.div(2);

            //
            //	approximate how much bpt half of our deposit amounts will burn
            //

            const withdrawUserData = WeightedPoolEncoder.exitBPTInForExactTokensOut([halfBal, halfWeth], bptAfter);
            const queryExitResult = await queries.callStatic.queryExit(poolId, controller.address, controller.address, {
                assets,
                minAmountsOut: [halfBal, halfWeth],
                toInternalBalance: false,
                userData: withdrawUserData,
            });
            const maxBptBurnedForHalf = queryExitResult.bptIn.div(100).mul(101); // 1% slippage

            //
            //	Withdraw half of our deposit amounts
            //
            await expect(
                controller.connect(controllerSigner).withdraw(poolId, maxBptBurnedForHalf, assets, [halfBal, halfWeth])
            ).to.not.be.reverted;

            const remainingBptBalance = await bpt.balanceOf(controller.address);
            //
            //	Approximate how much assets the rest of our BPT will fetch
            //
            const withdrawBalanceUserData = WeightedPoolEncoder.exitExactBPTInForTokensOut(remainingBptBalance);
            const queryExitBalanceResult = await queries.callStatic.queryExit(
                poolId,
                controller.address,
                controller.address,
                {
                    assets,
                    minAmountsOut: [halfBal.div(100).mul(99), halfWeth.div(100).mul(99)],
                    toInternalBalance: false,
                    userData: withdrawBalanceUserData,
                }
            );
            const expectedAssetAmounts = queryExitBalanceResult.amountsOut.map((amount) => amount.div(100).mul(99)); // 1% slippage

            //
            //	Cash in remaining BPT
            //
            await expect(
                controller
                    .connect(controllerSigner)
                    .withdrawImbalance(poolId, remainingBptBalance, assets, expectedAssetAmounts)
            ).to.not.be.reverted;

            expect(await asset1bal.balanceOf(controller.address)).to.gt(
                asset1before,
                "Asset1 is not at least starting amount"
            );
            expect(await asset2weth.balanceOf(controller.address)).to.lt(
                asset2before,
                "Asset2 is not at least starting amount"
            );
            expect(await bpt.balanceOf(controller.address)).to.eq(0, "BPT not fully exhausted");
        });

        it("deposit imbalanced with one asset amount set to 0 - should revert", async () => {
            const poolId = BALANCER_BALETH_8020_POOL_ID;

            const asset1before = await asset1bal.balanceOf(controller.address);
            const asset2before = await asset2weth.balanceOf(controller.address);
            const bptBefore = await bpt.balanceOf(controller.address);

            const assets = [BAL_ADDRESS, WETH_ADDRESS];
            const amountsIn = [0, asset2before];

            // try to deploy with 0 for one of the assets and make sure it reverts with proper message
            await expect(controller.connect(controllerSigner).deploy(poolId, assets, amountsIn, 1)).to.be.revertedWith(
                "!AMOUNTS[i]"
            );

            //
            // veryfy that no balances changed
            //
            expect(asset1before).to.be.eq(await asset1bal.balanceOf(controller.address));
            expect(asset2before).to.be.eq(await asset2weth.balanceOf(controller.address));
            expect(bptBefore).to.be.eq(await bpt.balanceOf(controller.address));
        });
    });

    /**
     * Fund account for token by:
     *  - impersonate whale
     *  - fund whale with eth
     *  - transfer token amount from whale to destination
     * @param {string} token - Address of ERC20 token
     * @param {string} from - Whale's address
     * @param {string} to - Destination account address
     * @param {number} amount - Amount of token to transfer
     * @param {number} decimals - Number of decimals of token
     */
    async function fundAccount(token: string, from: string, to: string, amount: number, decimals: number) {
        let etherBal = ethers.utils.parseEther("5000").toHexString();
        if (etherBal.startsWith("0x0")) etherBal = "0x" + etherBal.substring(3);

        await ethers.provider.send("hardhat_setBalance", [from, etherBal]);
        await ethers.provider.send("hardhat_setBalance", [to, etherBal]);

        await network.provider.request({method: "hardhat_impersonateAccount", params: [from]});

        const tokenContract = (await ethers.getContractAt(ERC20Artifact.abi, token)) as ERC20;

        const signer = ethers.provider.getSigner(from);
        await tokenContract.connect(signer).transfer(to, ethers.utils.parseUnits(amount.toString(), decimals));
    }

    /**
     * Fast-forward the chain by the given number of blocks
     * @param numBlocks Number of blocks to mine
     */
    const mineBlocks = async (numBlocks: number) => {
        for (let i = 0; i < numBlocks; i++) {
            await ethers.provider.send("evm_mine", []);
        }
    };
});
