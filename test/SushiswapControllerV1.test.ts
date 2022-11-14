import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import {deployMockContract, MockContract} from "ethereum-waffle";
import * as timeMachine from "ganache-time-traveler";
import {artifacts, ethers, network} from "hardhat";
import {
    SushiswapControllerV1,
    ERC20,
    IUniswapV2Pair,
    IUniswapV2Router02,
    IUniswapV2Factory,
    MasterChef,
} from "../typechain";
import {getContractAddress} from "@ethersproject/address";
import {JsonRpcSigner} from "@ethersproject/providers";
import {ADD_LIQUIDITY_ROLE, MISC_OPERATION_ROLE, REMOVE_LIQUIDITY_ROLE} from "./utilities/roles";
import {BigNumber} from "ethers";
import {Block} from "../node_modules/@ethersproject/abstract-provider/src.ts/index";

const {formatBytes32String} = ethers.utils;
const ERC20Artifact = artifacts.require("ERC20");
const UniV2Pair = artifacts.require("IUniswapV2Pair");
const ISushiswapV2RouterArtifact = artifacts.require(
    "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol:IUniswapV2Router02"
);
const MasterChefArtifact = artifacts.require("@sushiswap/core/contracts/MasterChef.sol");
const ACCESS_CONTROL = artifacts.require("@openzeppelin/contracts/access/AccessControl.sol");
const IUniswapV2FactoryArtifact = artifacts.require(
    "@sushiswap/core/contracts/uniswapv2/interfaces/IUniswapV2Factory.sol:IUniswapV2Factory"
);

const token1SNX = "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F";
const token2weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

describe("Test Sushiswap Controller", () => {
    const SUSHISWAP_FACTORY_ADDRESS = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";
    const SUSHISWAP_ROUTER_ADDRESS = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
    const MASTERCHEF_V1 = "0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd";

    const STAKE_WHALE = "0xe93381fb4c4f14bda253907b18fad305d799241a";
    const WETH_WHALE = "0x06920c9fc643de77b99cb7670a944ad31eaaa260";

    const TOKEMAK_TREASURY = "0x8b4334d4812C530574Bd4F2763FcD22dE94A969B";

    let controller: SushiswapControllerV1;
    let snapshotId: string;
    let deployer: SignerWithAddress;
    let addressRegistry: MockContract;
    let accessControl: MockContract;
    let block: Block;
    let masterchef: MasterChef;
    let sushiERC20: ERC20;
    let poolId: number;
    let controllerSigner: JsonRpcSigner;

    before(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];

        [deployer] = await ethers.getSigners();

        accessControl = await deployMockContract(deployer, ACCESS_CONTROL.abi);

        const addressRegistryArtifact = artifacts.require("AddressRegistry");
        addressRegistry = await deployMockContract(deployer, addressRegistryArtifact.abi);

        const transactionCount = await deployer.getTransactionCount();
        const controllerAddress = getContractAddress({
            from: deployer.address,
            nonce: transactionCount,
        });

        const sushiswapFactory = await ethers.getContractFactory("SushiswapControllerV1");
        controller = await sushiswapFactory
            .connect(deployer)
            .deploy(
                SUSHISWAP_ROUTER_ADDRESS,
                SUSHISWAP_FACTORY_ADDRESS,
                MASTERCHEF_V1,
                controllerAddress,
                accessControl.address,
                addressRegistry.address,
                TOKEMAK_TREASURY
            );

        masterchef = (await ethers.getContractAt(MasterChefArtifact.abi, MASTERCHEF_V1)) as unknown as MasterChef;

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [controller.address],
        });

        controllerSigner = await ethers.provider.getSigner(controller.address);

        let etherBal = ethers.utils.parseEther("5000").toHexString();
        if (etherBal.startsWith("0x0")) etherBal = "0x" + etherBal.substring(3);

        await ethers.provider.send("hardhat_setBalance", [controller.address, etherBal]);

        sushiERC20 = await ethers.getContractAt("ERC20", await masterchef.sushi());
        poolId = await getPoolId(token1SNX, token2weth);
    });

    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];

        block = await ethers.provider.getBlock("latest");
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    describe("Test roles", async () => {
        it("should revert deployement if sender has not the role ADD_LIQUIDITY_ROLE", async () => {
            await accessControl.mock.hasRole.withArgs(ADD_LIQUIDITY_ROLE, controllerSigner._address).returns(false);

            await expect(
                controller
                    .connect(controllerSigner)
                    .deploy(
                        token1SNX,
                        token2weth,
                        200,
                        200,
                        "0",
                        "0",
                        controller.address,
                        block.timestamp + 5000,
                        poolId,
                        true,
                        false
                    )
            ).to.be.revertedWith("NOT_ADD_LIQUIDITY_ROLE");
        });

        it("should revert Withdraw imbalance if sender has not the role REMOVE_LIQUIDITY_ROLE", async () => {
            await accessControl.mock.hasRole.withArgs(REMOVE_LIQUIDITY_ROLE, controllerSigner._address).returns(false);

            await expect(
                controller
                    .connect(controllerSigner)
                    .withdraw(
                        token1SNX,
                        token2weth,
                        200,
                        "0",
                        "0",
                        controller.address,
                        block.timestamp + 5000,
                        poolId,
                        true
                    )
            ).to.be.revertedWith("NOT_REMOVE_LIQUIDITY_ROLE");
        });
    });

    describe("Deploy and Withdraw", async () => {
        let snxAmount: BigNumber;
        let wethAmount: BigNumber;

        before(async () => {
            await mockSetup();

            const pairPool = (await masterchef.poolInfo(poolId)).lpToken;

            const pairContract = (await ethers.getContractAt(UniV2Pair.abi, pairPool)) as IUniswapV2Pair;

            const reserves = await pairContract.getReserves();

            const router = (await ethers.getContractAt(
                ISushiswapV2RouterArtifact.abi,
                SUSHISWAP_ROUTER_ADDRESS
            )) as unknown as IUniswapV2Router02;

            snxAmount = ethers.utils.parseUnits("200", 18);
            wethAmount = await router.getAmountOut(snxAmount, reserves[0], reserves[1]);

            await await fundAccount(token1SNX, STAKE_WHALE, controller.address, 1000, 18);
            await fundAccount(token2weth, WETH_WHALE, controller.address, 1500, 18);
        });

        it("Reverts on withdrawal overage", async () => {
            await controller
                .connect(controllerSigner)
                .deploy(
                    token1SNX,
                    token2weth,
                    snxAmount,
                    wethAmount,
                    "0",
                    "0",
                    controller.address,
                    block.timestamp + 5000,
                    poolId,
                    true,
                    false
                );

            const toWithdraw = (await masterchef.userInfo(poolId, controllerSigner._address)).amount.add(200);

            await expect(
                controller
                    .connect(controllerSigner)
                    .withdraw(
                        token1SNX,
                        token2weth,
                        toWithdraw,
                        "0",
                        "0",
                        controller.address,
                        block.timestamp + 5000,
                        poolId,
                        true
                    )
            ).to.be.revertedWith("INVALID_AMOUNT");
        });

        it("Can Deposit and Withdraw LP Tokens from Masterchef", async () => {
            await expect(
                controller
                    .connect(controllerSigner)
                    .deploy(
                        token1SNX,
                        token2weth,
                        snxAmount,
                        wethAmount,
                        "0",
                        "0",
                        controller.address,
                        block.timestamp + 5000,
                        poolId,
                        true,
                        false
                    )
            ).to.not.be.reverted;

            await mineBlocks(4);
            const userInfo = await masterchef.userInfo(poolId, controller.address);

            //Should revert because we deposited the LP tokens into masterchef
            //we need to withdraw them first so we have something to remove
            await expect(
                controller
                    .connect(controllerSigner)
                    .withdraw(
                        token1SNX,
                        token2weth,
                        userInfo.amount,
                        "0",
                        "0",
                        controller.address,
                        block.timestamp + 5000,
                        poolId,
                        false
                    )
            ).to.be.reverted;

            await expect(
                controller
                    .connect(controllerSigner)
                    .withdraw(
                        token1SNX,
                        token2weth,
                        userInfo.amount,
                        "0",
                        "0",
                        controller.address,
                        block.timestamp + 5000,
                        poolId,
                        true
                    )
            ).to.not.be.reverted;
        });

        it("Claims Sushi and sends to treasury on deploy", async () => {
            await controller
                .connect(controllerSigner)
                .deploy(
                    token1SNX,
                    token2weth,
                    snxAmount,
                    wethAmount,
                    "0",
                    "0",
                    controller.address,
                    block.timestamp + 5000,
                    poolId,
                    true,
                    false
                );

            await mineBlocks(4);

            const treasurySushiBefore = await sushiERC20.balanceOf(TOKEMAK_TREASURY);
            const sushiRewards = await masterchef.pendingSushi(poolId, controller.address);

            expect(sushiRewards).to.be.gt(0);

            await controller
                .connect(controllerSigner)
                .deploy(
                    token1SNX,
                    token2weth,
                    snxAmount,
                    wethAmount,
                    "0",
                    "0",
                    controller.address,
                    block.timestamp + 5000,
                    poolId,
                    true,
                    false
                );
            expect(await sushiERC20.balanceOf(TOKEMAK_TREASURY)).to.be.gte(treasurySushiBefore.add(sushiRewards));
        });

        it("Claims Sushi and sends to treasury on withdrawal", async () => {
            await controller
                .connect(controllerSigner)
                .deploy(
                    token1SNX,
                    token2weth,
                    snxAmount,
                    wethAmount,
                    "0",
                    "0",
                    controller.address,
                    block.timestamp + 5000,
                    poolId,
                    true,
                    false
                );

            await mineBlocks(4);

            const treasurySushiBefore = await sushiERC20.balanceOf(TOKEMAK_TREASURY);
            const sushiRewards = await masterchef.pendingSushi(poolId, controller.address);

            expect(sushiRewards).to.be.gt(0);

            const withdrawalAmount = (await masterchef.userInfo(poolId, controllerSigner._address)).amount;
            await controller
                .connect(controllerSigner)
                .withdraw(
                    token1SNX,
                    token2weth,
                    withdrawalAmount,
                    "0",
                    "0",
                    controller.address,
                    block.timestamp + 5000,
                    poolId,
                    true
                );
            expect(await sushiERC20.balanceOf(TOKEMAK_TREASURY)).to.be.gte(treasurySushiBefore.add(sushiRewards));
        });

        it("Partial withdrawal works", async () => {
            await controller
                .connect(controllerSigner)
                .deploy(
                    token1SNX,
                    token2weth,
                    snxAmount,
                    wethAmount,
                    "0",
                    "0",
                    controller.address,
                    block.timestamp + 5000,
                    poolId,
                    true,
                    false
                );

            const lpTokenAmountBefore = (await masterchef.userInfo(poolId, controllerSigner._address)).amount;
            const amountToWithdraw = lpTokenAmountBefore.div(2);
            await controller
                .connect(controllerSigner)
                .withdraw(
                    token1SNX,
                    token2weth,
                    amountToWithdraw,
                    "0",
                    "0",
                    controller.address,
                    block.timestamp + 5000,
                    poolId,
                    true
                );
            expect((await masterchef.userInfo(poolId, controllerSigner._address)).amount).to.equal(
                lpTokenAmountBefore.sub(amountToWithdraw)
            );
        });
    });

    describe("Testing withdrawal of lp tokens from Masterchef, depositing of tokens to masterchef", () => {
        let snxAmount: BigNumber;
        let wethAmount: BigNumber;
        let pairContract: IUniswapV2Pair;

        before(async () => {
            await mockSetup();

            const pairPool = (await masterchef.poolInfo(poolId)).lpToken;

            pairContract = (await ethers.getContractAt(UniV2Pair.abi, pairPool)) as IUniswapV2Pair;

            const reserves = await pairContract.getReserves();

            const router = (await ethers.getContractAt(
                ISushiswapV2RouterArtifact.abi,
                SUSHISWAP_ROUTER_ADDRESS
            )) as unknown as IUniswapV2Router02;

            snxAmount = ethers.utils.parseUnits("200", 18);
            wethAmount = await router.getAmountOut(snxAmount, reserves[0], reserves[1]);

            await await fundAccount(token1SNX, STAKE_WHALE, controller.address, 1000, 18);
            await fundAccount(token2weth, WETH_WHALE, controller.address, 1500, 18);

            // Deploy half of funds, don't deposit into Masterchef
            await controller
                .connect(controllerSigner)
                .deploy(
                    token1SNX,
                    token2weth,
                    snxAmount.div(3),
                    wethAmount.div(3),
                    "0",
                    "0",
                    controller.address,
                    block.timestamp + 5000,
                    poolId,
                    false,
                    false
                );

            // Deploy half of funds, deposit into Masterchef
            await controller
                .connect(controllerSigner)
                .deploy(
                    token1SNX,
                    token2weth,
                    snxAmount.div(3),
                    wethAmount.div(3),
                    "0",
                    "0",
                    controller.address,
                    block.timestamp + 5000,
                    poolId,
                    true,
                    false
                );
        });

        it("Withdraws part of the tokens from Masterchef when Manager holds some lp tokens", async () => {
            const managerLpTokenBalanceBefore = await pairContract.balanceOf(controller.address);
            const masterChefLpTokenBalanceBefore = (await masterchef.userInfo(poolId, controllerSigner._address))
                .amount;
            const tokenDifference = 1000;
            await controller
                .connect(controllerSigner)
                .withdraw(
                    token1SNX,
                    token2weth,
                    managerLpTokenBalanceBefore.add(tokenDifference),
                    "0",
                    "0",
                    controller.address,
                    block.timestamp + 5000,
                    poolId,
                    true
                );
            const masterChefLpTokenBalanceAfter = (await masterchef.userInfo(poolId, controllerSigner._address)).amount;
            expect(masterChefLpTokenBalanceAfter).to.equal(masterChefLpTokenBalanceBefore.sub(tokenDifference));
        });

        it("Withdraws no tokens from Masterchef when Manager holds enough lp tokens", async () => {
            const managerLpTokenBalanceBefore = await pairContract.balanceOf(controller.address);
            const masterChefLpTokenBalanceBefore = (await masterchef.userInfo(poolId, controllerSigner._address))
                .amount;
            const tokenDifference = 1000;
            await controller
                .connect(controllerSigner)
                .withdraw(
                    token1SNX,
                    token2weth,
                    managerLpTokenBalanceBefore.sub(tokenDifference),
                    "0",
                    "0",
                    controller.address,
                    block.timestamp + 5000,
                    poolId,
                    true
                );
            const masterChefLpTokenBalanceAfter = (await masterchef.userInfo(poolId, controllerSigner._address)).amount;
            expect(masterChefLpTokenBalanceAfter).to.equal(masterChefLpTokenBalanceBefore);
            expect(await pairContract.balanceOf(controller.address)).to.equal(tokenDifference);
        });

        it("Deposits all extra lp tokens to Masterchef", async () => {
            const managerLpBalanceBefore = await pairContract.balanceOf(controller.address);
            const managerLpDepositsBefore = (await masterchef.userInfo(poolId, controllerSigner._address)).amount;
            await controller
                .connect(controllerSigner)
                .deploy(
                    token1SNX,
                    token2weth,
                    snxAmount.div(3),
                    wethAmount.div(3),
                    "0",
                    "0",
                    controller.address,
                    block.timestamp + 5000,
                    poolId,
                    true,
                    true
                );

            const managerLpBalanceAfter = await pairContract.balanceOf(controller.address);
            const managerLpDepositsAfter = (await masterchef.userInfo(poolId, controllerSigner._address)).amount;
            expect(managerLpBalanceAfter).to.equal(0);
            // gt because we are also adding lp tokens from liquidity add that are not accounted for
            expect(managerLpDepositsAfter).to.be.gt(managerLpBalanceBefore.add(managerLpDepositsBefore));
        });
    });

    const fundAccount = async (token: string, from: string, to: string, amount: number, decimals: number) => {
        let etherBal = ethers.utils.parseEther("5000").toHexString();
        if (etherBal.startsWith("0x0")) etherBal = "0x" + etherBal.substring(3);

        await ethers.provider.send("hardhat_setBalance", [from, etherBal]);
        await ethers.provider.send("hardhat_setBalance", [to, etherBal]);

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [from],
        });

        const tokenContract = (await ethers.getContractAt(ERC20Artifact.abi, token)) as ERC20;

        const signer = await ethers.provider.getSigner(from);

        await tokenContract.connect(signer).transfer(to, ethers.utils.parseUnits(amount.toString(), decimals));
    };

    const getPoolId = async (tokenA: string, tokenB: string): Promise<number> => {
        const sushiFactory = (await ethers.getContractAt(
            IUniswapV2FactoryArtifact.abi,
            SUSHISWAP_FACTORY_ADDRESS
        )) as unknown as IUniswapV2Factory;
        const checksummedPair = ethers.utils.getAddress(await sushiFactory.getPair(tokenA, tokenB));
        let poolId = 0;

        for (let i = 0; i < 348; i++) {
            const checksummedLPToken = ethers.utils.getAddress((await masterchef.poolInfo(i)).lpToken);
            if (checksummedLPToken === checksummedPair) {
                poolId = i;
                break;
            }
        }
        return poolId;
    };

    const mockSetup = async () => {
        await addressRegistry.mock.checkAddress.returns(true);
        await accessControl.mock.hasRole.withArgs(ADD_LIQUIDITY_ROLE, controllerSigner._address).returns(true);
        await accessControl.mock.hasRole.withArgs(REMOVE_LIQUIDITY_ROLE, controllerSigner._address).returns(true);
        await accessControl.mock.hasRole.withArgs(MISC_OPERATION_ROLE, controllerSigner._address).returns(true);
    };

    const mineBlocks = async (numBlocks: number) => {
        for (let i = 0; i < numBlocks; i++) {
            await ethers.provider.send("evm_mine", []);
        }
    };
});
