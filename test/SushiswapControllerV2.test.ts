import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import {deployMockContract, MockContract} from "ethereum-waffle";
import * as timeMachine from "ganache-time-traveler";
import {artifacts, ethers, network} from "hardhat";
import {
    SushiswapControllerV2,
    ERC20,
    IUniswapV2Pair,
    IUniswapV2Router02,
    IUniswapV2Factory,
    IMasterChefV2,
    MasterChef,
} from "../typechain";
import {getContractAddress} from "@ethersproject/address";
import {JsonRpcSigner} from "@ethersproject/providers";
import {ADD_LIQUIDITY_ROLE, REMOVE_LIQUIDITY_ROLE, MISC_OPERATION_ROLE} from "./utilities/roles";
import MasterChefV2 from "../abis/MasterchefV2.json";
import ComplexRewarder from "../abis/ComplexRewarder.json";
import {BigNumber} from "ethers";
import {Block} from "../node_modules/@ethersproject/abstract-provider/src.ts/index";

const {formatBytes32String} = ethers.utils;
const ERC20Artifact = artifacts.require("@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20");
const UniV2Pair = artifacts.require("IUniswapV2Pair");
const ISushiswapV2RouterArtifact = artifacts.require(
    "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol:IUniswapV2Router02"
);
const IUniswapV2FactoryArtifact = artifacts.require(
    "@sushiswap/core/contracts/uniswapv2/interfaces/IUniswapV2Factory.sol:IUniswapV2Factory"
);
const ACCESS_CONTROL = artifacts.require("@openzeppelin/contracts/access/AccessControl.sol");

type UserInfo = {
    amount: BigNumber;
    rewardDebt: BigNumber;
    unpaidRewards: BigNumber;
};

describe("Test Sushiswap Controller", () => {
    const SUSHISWAP_FACTORY_ADDRESS = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";
    const SUSHISWAP_ROUTER_ADDRESS = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
    const MASTERCHEF_V2 = "0xEF0881eC094552b2e128Cf945EF17a6752B4Ec5d";

    const ALCX_WHALE = "0x6bb8bc41e668b7c8ef3850486c9455b5c86830b3";
    const WETH_WHALE = "0x06920c9fc643de77b99cb7670a944ad31eaaa260";

    const TOKEMAK_TREASURY = "0x8b4334d4812C530574Bd4F2763FcD22dE94A969B";

    const masterchefPoolArrayLength = 46;

    const alcxToken = "0xdbdb4d16eda451d0503b854cf79d55697f90c8df";
    const wethToken = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    let controller: SushiswapControllerV2;
    let snapshotId: string;
    let deployer: SignerWithAddress;
    let addressRegistry: MockContract;
    let accessControl: MockContract;
    let masterchef: IMasterChefV2 & MasterChef;
    let poolId: number;
    let block: Block;
    let router: IUniswapV2Router02;
    let alcxERC20: ERC20;
    let controllerSigner: JsonRpcSigner;

    before(async () => {
        [deployer] = await ethers.getSigners();

        accessControl = await deployMockContract(deployer, ACCESS_CONTROL.abi);

        const addressRegistryArtifact = artifacts.require("AddressRegistry");
        addressRegistry = await deployMockContract(deployer, addressRegistryArtifact.abi);

        const transactionCount = await deployer.getTransactionCount();
        const controllerAddress = getContractAddress({
            from: deployer.address,
            nonce: transactionCount,
        });

        const sushiswapFactory = await ethers.getContractFactory("SushiswapControllerV2");
        controller = await sushiswapFactory
            .connect(deployer)
            .deploy(
                SUSHISWAP_ROUTER_ADDRESS,
                SUSHISWAP_FACTORY_ADDRESS,
                MASTERCHEF_V2,
                controllerAddress,
                accessControl.address,
                addressRegistry.address,
                TOKEMAK_TREASURY
            );

        router = (await ethers.getContractAt(
            ISushiswapV2RouterArtifact.abi,
            SUSHISWAP_ROUTER_ADDRESS
        )) as unknown as IUniswapV2Router02;

        masterchef = (await ethers.getContractAt(MasterChefV2, MASTERCHEF_V2)) as unknown as IMasterChefV2 & MasterChef;
        poolId = await getPoolId(alcxToken, wethToken);

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [controller.address],
        });

        controllerSigner = await ethers.provider.getSigner(controller.address);

        let etherBal = ethers.utils.parseEther("5000").toHexString();
        if (etherBal.startsWith("0x0")) etherBal = "0x" + etherBal.substring(3);

        await ethers.provider.send("hardhat_setBalance", [controller.address, etherBal]);
        alcxERC20 = await getToken(alcxToken);
    });

    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];

        block = await ethers.provider.getBlock("latest");
    });

    after(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    describe("Test roles", async () => {
        const data = formatBytes32String("");
        it("should revert deployement if sender has not the role ADD_LIQUIDITY_ROLE", async () => {
            await accessControl.mock.hasRole.withArgs(ADD_LIQUIDITY_ROLE, controllerSigner._address).returns(false);

            await expect(
                controller
                    .connect(controllerSigner)
                    .deploy(
                        alcxToken,
                        wethToken,
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
                        alcxToken,
                        wethToken,
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
        let alcxAmount: BigNumber;
        let wethAmount: BigNumber;

        beforeEach(async () => {
            await mockSetup();
            const pairPool = (await masterchef.lpToken(poolId)) as unknown as string;

            const pairContract = (await ethers.getContractAt(UniV2Pair.abi, pairPool)) as IUniswapV2Pair;

            const reserves = await pairContract.getReserves();

            alcxAmount = ethers.utils.parseUnits("200", 18);
            wethAmount = await router.getAmountOut(alcxAmount, reserves[0], reserves[1]);

            await await fundAccount(alcxToken, ALCX_WHALE, controller.address, 1000, 18);
            await fundAccount(wethToken, WETH_WHALE, controller.address, 1500, 18);
        });

        it("Reverts on withdrawal amount > amount deposited in Masterchef", async () => {
            await controller
                .connect(controllerSigner)
                .deploy(
                    alcxToken,
                    wethToken,
                    alcxAmount,
                    wethAmount,
                    "0",
                    "0",
                    controller.address,
                    block.timestamp + 5000,
                    poolId,
                    true,
                    false
                );

            const amountInMasterchef = ((await masterchef.userInfo(poolId, controller.address)) as unknown as UserInfo)
                .amount;

            await expect(
                controller
                    .connect(controllerSigner)
                    .withdraw(
                        alcxToken,
                        wethToken,
                        amountInMasterchef.add(200),
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
                        alcxToken,
                        wethToken,
                        alcxAmount,
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
            const userInfo = (await masterchef.userInfo(poolId, controller.address)) as unknown as UserInfo;

            //Should revert because we deposited the LP tokens into masterchef
            //we need to withdraw them first so we have something to remove
            await expect(
                controller
                    .connect(controllerSigner)
                    .withdraw(
                        alcxToken,
                        wethToken,
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
                        alcxToken,
                        wethToken,
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

        it("Can withdraw partial amounts of lp token from Masterchef", async () => {
            await controller
                .connect(controllerSigner)
                .deploy(
                    alcxToken,
                    wethToken,
                    alcxAmount,
                    wethAmount,
                    "0",
                    "0",
                    controller.address,
                    block.timestamp + 5000,
                    poolId,
                    true,
                    false
                );

            const lpTokenAmountBefore = (
                (await masterchef.userInfo(poolId, controllerSigner._address)) as unknown as UserInfo
            ).amount;
            const amountToWithdraw = lpTokenAmountBefore.div(2); // withdraw half
            await controller
                .connect(controllerSigner)
                .withdraw(
                    alcxToken,
                    wethToken,
                    amountToWithdraw,
                    "0",
                    "0",
                    controller.address,
                    block.timestamp + 5000,
                    poolId,
                    true
                );

            expect(
                ((await masterchef.userInfo(poolId, controllerSigner._address)) as unknown as UserInfo).amount
            ).to.equal(lpTokenAmountBefore.sub(amountToWithdraw));
        });

        it("Properly claims tokens on deploy", async () => {
            await controller
                .connect(controllerSigner)
                .deploy(
                    alcxToken,
                    wethToken,
                    alcxAmount,
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

            const treasuryALCXBalanceBefore = await alcxERC20.balanceOf(TOKEMAK_TREASURY);

            const rewarder = await ethers.getContractAt(
                ComplexRewarder,
                (await masterchef.rewarder(poolId)) as unknown as string
            );
            const claimALCX = await rewarder.pendingToken(poolId, controllerSigner._address);

            expect(claimALCX).to.be.gt(0);
            await controller
                .connect(controllerSigner)
                .deploy(
                    alcxToken,
                    wethToken,
                    alcxAmount,
                    wethAmount,
                    "0",
                    "0",
                    controller.address,
                    block.timestamp + 5000,
                    poolId,
                    true,
                    false
                );
            expect(await alcxERC20.balanceOf(TOKEMAK_TREASURY)).to.be.gte(treasuryALCXBalanceBefore.add(claimALCX));
        });

        it("Properly claims on withdrawal", async () => {
            await controller
                .connect(controllerSigner)
                .deploy(
                    alcxToken,
                    wethToken,
                    alcxAmount,
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

            const treasuryALCXBalanceBefore = await alcxERC20.balanceOf(TOKEMAK_TREASURY);
            const rewarder = await ethers.getContractAt(
                ComplexRewarder,
                (await masterchef.rewarder(poolId)) as unknown as string
            );
            const claimALCX = await rewarder.pendingToken(poolId, controllerSigner._address);
            expect(claimALCX).to.be.gt(0);

            const withdrawalAmount = ((await masterchef.userInfo(poolId, controller.address)) as unknown as UserInfo)
                .amount;
            await controller
                .connect(controllerSigner)
                .withdraw(
                    alcxToken,
                    wethToken,
                    withdrawalAmount,
                    "0",
                    "0",
                    controller.address,
                    block.timestamp + 5000,
                    poolId,
                    true
                );

            expect(await alcxERC20.balanceOf(TOKEMAK_TREASURY)).to.be.gte(treasuryALCXBalanceBefore.add(claimALCX));
        });
    });

    describe("Rewarder DNE", () => {
        const localPoolId = 7;

        const rulerToken = "0x2aeccb42482cc64e087b6d2e5da39f5a7a7001f8";
        const RULER_WHALE = "0x6bef09f99bf6d92d6486889bdd8a374af151461d";

        let rulerAmount: BigNumber;
        let wethamount: BigNumber;

        before(async () => {
            await mockSetup();

            const pairPool = (await masterchef.lpToken(poolId)) as unknown as string;

            const pairContract = (await ethers.getContractAt(UniV2Pair.abi, pairPool)) as IUniswapV2Pair;
            const reserves = await pairContract.getReserves();
            rulerAmount = ethers.utils.parseUnits("200", 18);
            wethamount = await router.getAmountOut(rulerAmount, reserves[0], reserves[1]);

            await fundAccount(rulerToken, RULER_WHALE, controller.address, 1000, 18);
            await fundAccount(wethToken, WETH_WHALE, controller.address, 1500, 18);
        });

        it("Runs", async () => {
            const rewarder = await masterchef.rewarder(localPoolId);
            expect(rewarder).to.equal(ethers.constants.AddressZero);

            await expect(
                controller
                    .connect(controllerSigner)
                    .deploy(
                        rulerToken,
                        wethToken,
                        rulerAmount,
                        wethamount,
                        "0",
                        "0",
                        controller.address,
                        block.timestamp + 5000,
                        localPoolId,
                        true,
                        false
                    )
            ).to.not.be.reverted;

            const withdrawalAmount = (
                (await masterchef.userInfo(localPoolId, controller.address)) as unknown as UserInfo
            ).amount;

            await expect(
                controller
                    .connect(controllerSigner)
                    .withdraw(
                        rulerToken,
                        wethToken,
                        withdrawalAmount,
                        "0",
                        "0",
                        controller.address,
                        block.timestamp + 5000,
                        localPoolId,
                        true
                    )
            ).to.not.be.reverted;
        });
    });

    describe("Testing claim function", () => {
        let pairContract: IUniswapV2Pair;

        before(async () => {
            await mockSetup();

            const pairPool = (await masterchef.lpToken(poolId)) as unknown as string;
            pairContract = (await ethers.getContractAt(UniV2Pair.abi, pairPool)) as IUniswapV2Pair;
            const reserves = await pairContract.getReserves();
            const alcxAmount = ethers.utils.parseUnits("200", 18);
            const wethAmount = await router.getAmountOut(alcxToken, reserves[0], reserves[1]);

            await await fundAccount(alcxToken, ALCX_WHALE, controller.address, 300, 18);
            await fundAccount(wethToken, WETH_WHALE, controller.address, 500, 18);

            await controller
                .connect(controllerSigner)
                .deploy(
                    alcxToken,
                    wethToken,
                    alcxAmount,
                    wethAmount,
                    "0",
                    "0",
                    controller.address,
                    block.timestamp + 5000,
                    poolId,
                    true,
                    false
                );
        });

        it("Reverts on zero Sushi to claim", async () => {
            await expect(
                controller.connect(controllerSigner).claimSushi(5) // Incorrect poolId, nothing to claim
            ).to.be.revertedWith("NO_CLAIMABLE");
        });

        it("Claims sushi and any reward tokens properly", async () => {
            await mineBlocks(4);

            const sushiERC20 = await getToken((await masterchef.SUSHI()) as unknown as string);

            const treasurySushiBalanceBefore = await sushiERC20.balanceOf(TOKEMAK_TREASURY);
            const treasuryALCXBalanceBefore = await alcxERC20.balanceOf(TOKEMAK_TREASURY);

            const rewarder = await ethers.getContractAt(
                ComplexRewarder,
                (await masterchef.rewarder(poolId)) as unknown as string
            );

            const claimableSushi = (await masterchef.pendingSushi(
                poolId,
                controllerSigner._address
            )) as unknown as BigNumber;
            const claimALCX = await rewarder.pendingToken(poolId, controllerSigner._address);

            expect(claimableSushi).to.be.gt(0);
            expect(claimALCX).to.be.gt(0);

            await controller.connect(controllerSigner).claimSushi(poolId);

            expect(await sushiERC20.balanceOf(TOKEMAK_TREASURY)).to.gte(treasurySushiBalanceBefore.add(claimableSushi));
            expect(await alcxERC20.balanceOf(TOKEMAK_TREASURY)).to.be.gte(treasuryALCXBalanceBefore.add(claimALCX));
        });
    });

    describe("Testing withdrawal of lp tokens from MasterchefV2, depositing of lp tokens to masterchef", () => {
        let alcxAmount: BigNumber;
        let wethAmount: BigNumber;
        let pairContract: IUniswapV2Pair;

        beforeEach(async () => {
            await mockSetup();

            const pairPool = (await masterchef.lpToken(poolId)) as unknown as string;

            pairContract = (await ethers.getContractAt(UniV2Pair.abi, pairPool)) as IUniswapV2Pair;

            const reserves = await pairContract.getReserves();

            const router = (await ethers.getContractAt(
                ISushiswapV2RouterArtifact.abi,
                SUSHISWAP_ROUTER_ADDRESS
            )) as unknown as IUniswapV2Router02;

            alcxAmount = ethers.utils.parseUnits("200", 18);
            wethAmount = await router.getAmountOut(alcxAmount, reserves[0], reserves[1]);

            await await fundAccount(alcxToken, ALCX_WHALE, controller.address, 1000, 18);
            await fundAccount(wethToken, WETH_WHALE, controller.address, 1500, 18);

            // Deploy half of funds, don't deposit into Masterchef
            await controller
                .connect(controllerSigner)
                .deploy(
                    alcxToken,
                    wethToken,
                    alcxAmount.div(3),
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
                    alcxToken,
                    wethToken,
                    alcxAmount.div(3),
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

        it("Withdraws part of the tokens from MasterchefV2 when Manager holds some lp tokens", async () => {
            const managerLpTokenBalanceBefore = await pairContract.balanceOf(controller.address);
            const masterChefLpTokenBalanceBefore = (
                (await masterchef.userInfo(poolId, controllerSigner._address)) as unknown as UserInfo
            ).amount;
            const tokenDifference = 1000;
            await controller
                .connect(controllerSigner)
                .withdraw(
                    alcxToken,
                    wethToken,
                    managerLpTokenBalanceBefore.add(tokenDifference),
                    "0",
                    "0",
                    controller.address,
                    block.timestamp + 5000,
                    poolId,
                    true
                );
            const masterChefLpTokenBalanceAfter = (
                (await masterchef.userInfo(poolId, controllerSigner._address)) as unknown as UserInfo
            ).amount;
            expect(masterChefLpTokenBalanceAfter).to.equal(masterChefLpTokenBalanceBefore.sub(tokenDifference));
        });

        it("Withdraws no tokens from MasterchefV2 when Manager holds enough lp tokens", async () => {
            const managerLpTokenBalanceBefore = await pairContract.balanceOf(controller.address);
            const masterChefLpTokenBalanceBefore = (
                (await masterchef.userInfo(poolId, controllerSigner._address)) as unknown as UserInfo
            ).amount;
            const tokenDifference = 1000;
            await controller
                .connect(controllerSigner)
                .withdraw(
                    alcxToken,
                    wethToken,
                    managerLpTokenBalanceBefore.sub(tokenDifference),
                    "0",
                    "0",
                    controller.address,
                    block.timestamp + 5000,
                    poolId,
                    true
                );
            const masterChefLpTokenBalanceAfter = (
                (await masterchef.userInfo(poolId, controllerSigner._address)) as unknown as UserInfo
            ).amount;
            expect(masterChefLpTokenBalanceAfter).to.equal(masterChefLpTokenBalanceBefore);
            expect(await pairContract.balanceOf(controller.address)).to.equal(tokenDifference);
        });

        it("Deposits all extra lp tokens to Masterchef", async () => {
            const managerLpBalanceBefore = await pairContract.balanceOf(controller.address);
            const managerLpDepositsBefore = (
                (await masterchef.userInfo(poolId, controllerSigner._address)) as unknown as UserInfo
            ).amount;
            await controller
                .connect(controllerSigner)
                .deploy(
                    alcxToken,
                    wethToken,
                    alcxAmount.div(3),
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
            const managerLpDepositsAfter = (
                (await masterchef.userInfo(poolId, controllerSigner._address)) as unknown as UserInfo
            ).amount;
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

        for (let i = 0; i < masterchefPoolArrayLength; i++) {
            const checksummedLPToken = ethers.utils.getAddress((await masterchef.lpToken(i)) as unknown as string);
            if (checksummedLPToken === checksummedPair) {
                poolId = i;
                break;
            }
        }
        return poolId;
    };

    const mockSetup = async () => {
        // Initiailizes all mocks for ease of use
        await addressRegistry.mock.checkAddress.returns(true);
        await accessControl.mock.hasRole.withArgs(ADD_LIQUIDITY_ROLE, controllerSigner._address).returns(true);
        await accessControl.mock.hasRole.withArgs(REMOVE_LIQUIDITY_ROLE, controllerSigner._address).returns(true);
        await accessControl.mock.hasRole.withArgs(MISC_OPERATION_ROLE, controllerSigner._address).returns(true);
    };

    const claimData = (poolId: number): string => {
        return ethers.utils.defaultAbiCoder.encode(["uint256"], [poolId]);
    };

    const mineBlocks = async (numBlocks: number) => {
        for (let i = 0; i < numBlocks; i++) {
            await ethers.provider.send("evm_mine", []);
        }
    };

    const getToken = async (tokenAddress: string): Promise<ERC20> => {
        return await ethers.getContractAt("ERC20", tokenAddress);
    };
});
