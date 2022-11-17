import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import {deployMockContract, MockContract} from "ethereum-waffle";
import * as timeMachine from "ganache-time-traveler";
import {artifacts, ethers, network} from "hardhat";
import {CurveControllerMetaPool4} from "../../typechain";
import {getContractAddress} from "@ethersproject/address";
import {JsonRpcSigner} from "@ethersproject/providers";
import {
    Amount,
    fundAccount,
    FundTokenDecimals,
    getLpTokenBalance,
    getTokenBalance,
    pad,
    tokenAmount,
    toNumber,
} from "../utilities/fundAccount";

const ACCESS_CONTROL = artifacts.require("@openzeppelin/contracts/access/AccessControl.sol");

const CURVE_META_4POOL_ADDRESS = "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B"; // FRAX3CRV Meta Pool
const CURVE_META_4POOL_LP_TOKEN_ADDRESS = CURVE_META_4POOL_ADDRESS;
const CURVE_BASE_3POOL_ADDRESS = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7"; // DAI/USDC/USDT Pool
const CURVE_3POOL_DEPOSIT_ZAP_ADDRESS = "0xA79828DF1850E8a3A3064576f380D90aECDD3359";

describe("Test Curve 4 Coin Meta Controller Against 4Pool", () => {
    let controller: CurveControllerMetaPool4;
    let snapshotId: string;
    let deployer: SignerWithAddress;
    let addressRegistry: MockContract;
    let controllerSigner: JsonRpcSigner;
    let accessControl: MockContract;

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
        const curveControllerFactory = await ethers.getContractFactory("CurveControllerMetaPool4");
        controller = (await curveControllerFactory
            .connect(deployer)
            .deploy(
                controllerAddress,
                accessControl.address,
                addressRegistry.address,
                CURVE_BASE_3POOL_ADDRESS,
                CURVE_3POOL_DEPOSIT_ZAP_ADDRESS
            )) as unknown as CurveControllerMetaPool4;

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

        await addressRegistry.mock.checkAddress.returns(true);
    });

    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    describe("Add Liquidity Stables", async () => {
        it("Can deploy equal amounts of each token", async () => {
            const fraxAmount = 1000;
            const daiAmount = 1000;
            const usdcAmount = 1000;
            const usdtAmount = 1000;

            await addLiquidityNoMinCheckRevert(fraxAmount, daiAmount, usdcAmount, usdtAmount);
        });

        it("Can deploy various amounts of each token", async () => {
            const fraxAmount = 123;
            const daiAmount = 3478;
            const usdcAmount = 1;
            const usdtAmount = 134789;

            await addLiquidityNoMinCheckRevert(fraxAmount, daiAmount, usdcAmount, usdtAmount);
        });

        it("Can deploy FRAX only", async () => {
            const fraxAmount = 1000;
            const daiAmount = 0;
            const usdcAmount = 0;
            const usdtAmount = 0;

            await addLiquidityNoMinCheckRevert(fraxAmount, daiAmount, usdcAmount, usdtAmount);
        });

        it("Can deploy DAI only", async () => {
            const fraxAmount = 0;
            const daiAmount = 1000;
            const usdcAmount = 0;
            const usdtAmount = 0;

            await addLiquidityNoMinCheckRevert(fraxAmount, daiAmount, usdcAmount, usdtAmount);
        });

        it("Can deploy USDC only", async () => {
            const fraxAmount = 0;
            const daiAmount = 0;
            const usdcAmount = 1000;
            const usdtAmount = 0;

            await addLiquidityNoMinCheckRevert(fraxAmount, daiAmount, usdcAmount, usdtAmount);
        });

        it("Can deploy USDT only", async () => {
            const fraxAmount = 0;
            const daiAmount = 0;
            const usdcAmount = 0;
            const usdtAmount = 1000;

            await addLiquidityNoMinCheckRevert(fraxAmount, daiAmount, usdcAmount, usdtAmount);
        });

        it("Reverts when min amount isn't met", async () => {
            const fraxAmount = 0;
            const daiAmount = 0;
            const usdcAmount = 0;
            const usdtAmount = 1000;

            await expect(addLiquidity(fraxAmount, daiAmount, usdcAmount, usdtAmount, usdtAmount * 2)).to.be.reverted;
        });
    });

    describe("Withdraw", () => {
        it("Can withdraw it all", async () => {
            const fraxAmount = 0;
            const daiAmount = 1000;
            const usdcAmount = 200;
            const usdtAmount = 0;
            const lp = 1100;
            const randomFee = 2;

            const deployedBalanceTotal = ethers.utils.parseUnits(
                (fraxAmount + daiAmount + usdcAmount + usdtAmount).toString(),
                18
            );

            const beforeBalanceFRAX = await getTokenBalance("FRAX", controller.address);
            const beforeBalanceDAI = await getTokenBalance("DAI", controller.address);
            const beforeBalanceUSDC = await getTokenBalance("USDC", controller.address);
            const beforeBalanceUSDT = await getTokenBalance("USDT", controller.address);
            const beforeBalanceTotal = beforeBalanceFRAX
                .add(beforeBalanceDAI)
                .add(pad(beforeBalanceUSDC, 12))
                .add(pad(beforeBalanceUSDT, 12));

            await addLiquidity(fraxAmount, daiAmount, usdcAmount, usdtAmount, lp);

            const lpBalance = await getLpTokenBalance(controller.address, CURVE_META_4POOL_LP_TOKEN_ADDRESS);

            await controller
                .connect(controllerSigner)
                .withdraw(CURVE_META_4POOL_ADDRESS, lpBalance, [
                    ethers.utils.parseUnits("0", FundTokenDecimals.FRAX.decimals),
                    ethers.utils.parseUnits("0", FundTokenDecimals.DAI.decimals),
                    ethers.utils.parseUnits("0", FundTokenDecimals.USDC.decimals),
                    ethers.utils.parseUnits("0", FundTokenDecimals.USDT.decimals),
                ]);

            const afterBalanceFRAX = await getTokenBalance("FRAX", controller.address);
            const afterBalanceDAI = await getTokenBalance("DAI", controller.address);
            const afterBalanceUSDC = await getTokenBalance("USDC", controller.address);
            const afterBalanceUSDT = await getTokenBalance("USDT", controller.address);

            const afterBalanceTotal = afterBalanceFRAX
                .add(afterBalanceDAI)
                .add(pad(afterBalanceUSDC, 12))
                .add(pad(afterBalanceUSDT, 12));

            expect(beforeBalanceUSDT.lt(afterBalanceUSDT)).to.be.true;

            expect(toNumber(afterBalanceTotal.sub(beforeBalanceTotal), 18)).to.be.gte(
                toNumber(deployedBalanceTotal, 18) - randomFee
            );
        });

        it("Can withdraw a 1/4", async () => {
            const fraxAmount = 0;
            const daiAmount = 1000;
            const usdcAmount = 200;
            const usdtAmount = 0;
            const lp = 1100;
            const randomFee = 2;

            const deployedBalanceTotal = ethers.utils.parseUnits(
                (fraxAmount + daiAmount + usdcAmount + usdtAmount).toString(),
                18
            );

            const beforeBalanceFRAX = await getTokenBalance("FRAX", controller.address);
            const beforeBalanceDAI = await getTokenBalance("DAI", controller.address);
            const beforeBalanceUSDC = await getTokenBalance("USDC", controller.address);
            const beforeBalanceUSDT = await getTokenBalance("USDT", controller.address);
            const beforeBalanceTotal = beforeBalanceFRAX
                .add(beforeBalanceUSDC)
                .add(pad(beforeBalanceDAI, 12))
                .add(pad(beforeBalanceUSDT, 12));

            await addLiquidity(fraxAmount, daiAmount, usdcAmount, usdtAmount, lp);

            const lpBalance = await getLpTokenBalance(controller.address, CURVE_META_4POOL_LP_TOKEN_ADDRESS);

            await controller
                .connect(controllerSigner)
                .withdraw(CURVE_META_4POOL_ADDRESS, lpBalance.div(4), [
                    ethers.utils.parseUnits("0", FundTokenDecimals.FRAX.decimals),
                    ethers.utils.parseUnits("0", FundTokenDecimals.DAI.decimals),
                    ethers.utils.parseUnits("0", FundTokenDecimals.USDC.decimals),
                    ethers.utils.parseUnits("0", FundTokenDecimals.USDT.decimals),
                ]);

            const afterBalanceFRAX = await getTokenBalance("FRAX", controller.address);
            const afterBalanceDAI = await getTokenBalance("DAI", controller.address);
            const afterBalanceUSDC = await getTokenBalance("USDC", controller.address);
            const afterBalanceUSDT = await getTokenBalance("USDT", controller.address);
            const afterBalanceTotal = afterBalanceFRAX
                .add(afterBalanceDAI)
                .add(pad(afterBalanceUSDC, 12))
                .add(pad(afterBalanceUSDT, 12));

            expect(beforeBalanceUSDT.lt(afterBalanceUSDT)).to.be.true;

            expect(toNumber(afterBalanceTotal.sub(beforeBalanceTotal), 18)).to.be.gte(
                toNumber(deployedBalanceTotal, 18) / 4 - randomFee
            );
        });
    });

    describe("Withdraw imbalance", () => {
        it("Can remove FRAX only", async () => {
            const fraxAmount = 1000;
            const daiAmount = 0;
            const usdcAmount = 0;
            const usdtAmount = 0;
            const lp = 900;
            const withdrawAmount = 100;
            const token = "FRAX";

            await addLiquidity(fraxAmount, daiAmount, usdcAmount, usdtAmount, lp);

            const beforeBalance = await getTokenBalance(token, controller.address);

            await controller
                .connect(controllerSigner)
                .withdrawImbalance(
                    CURVE_META_4POOL_ADDRESS,
                    [
                        ethers.utils.parseUnits(withdrawAmount.toString(), FundTokenDecimals.FRAX.decimals),
                        ethers.utils.parseUnits("0", FundTokenDecimals.DAI.decimals),
                        ethers.utils.parseUnits("0", FundTokenDecimals.USDC.decimals),
                        ethers.utils.parseUnits("0", FundTokenDecimals.USDT.decimals),
                    ],
                    ethers.utils.parseUnits(lp.toString(), 18)
                );

            const afterBalance = await getTokenBalance(token, controller.address);

            expect(beforeBalance.add(tokenAmount(token, withdrawAmount)).eq(afterBalance)).to.be.true;
        });

        it("Can remove DAI only", async () => {
            const fraxAmount = 0;
            const daiAmount = 1000;
            const usdcAmount = 0;
            const usdtAmount = 0;
            const lp = 900;
            const withdrawAmount = 100;
            const token = "DAI";

            await addLiquidity(fraxAmount, daiAmount, usdcAmount, usdtAmount, lp);

            const beforeBalance = await getTokenBalance(token, controller.address);

            await controller
                .connect(controllerSigner)
                .withdrawImbalance(
                    CURVE_META_4POOL_ADDRESS,
                    [
                        ethers.utils.parseUnits("0", FundTokenDecimals.FRAX.decimals),
                        ethers.utils.parseUnits(withdrawAmount.toString(), FundTokenDecimals.DAI.decimals),
                        ethers.utils.parseUnits("0", FundTokenDecimals.USDC.decimals),
                        ethers.utils.parseUnits("0", FundTokenDecimals.USDT.decimals),
                    ],
                    ethers.utils.parseUnits(lp.toString(), 18)
                );

            const afterBalance = await getTokenBalance(token, controller.address);

            expect(beforeBalance.add(tokenAmount(token, withdrawAmount)).eq(afterBalance)).to.be.true;
        });

        it("Can remove USDC only", async () => {
            const fraxAmount = 0;
            const daiAmount = 0;
            const usdcAmount = 1000;
            const usdtAmount = 0;
            const lp = 900;
            const withdrawAmount = 100;
            const token = "USDC";

            await addLiquidity(fraxAmount, daiAmount, usdcAmount, usdtAmount, lp);

            const beforeBalance = await getTokenBalance(token, controller.address);

            await controller
                .connect(controllerSigner)
                .withdrawImbalance(
                    CURVE_META_4POOL_ADDRESS,
                    [
                        ethers.utils.parseUnits("0", FundTokenDecimals.FRAX.decimals),
                        ethers.utils.parseUnits("0", FundTokenDecimals.DAI.decimals),
                        ethers.utils.parseUnits(withdrawAmount.toString(), FundTokenDecimals.USDC.decimals),
                        ethers.utils.parseUnits("0", FundTokenDecimals.USDT.decimals),
                    ],
                    ethers.utils.parseUnits(lp.toString(), 18)
                );

            const afterBalance = await getTokenBalance(token, controller.address);

            expect(beforeBalance.add(tokenAmount(token, withdrawAmount)).eq(afterBalance)).to.be.true;
        });

        it("Can remove USDT only", async () => {
            const fraxAmount = 0;
            const daiAmount = 0;
            const usdcAmount = 0;
            const usdtAmount = 1000;
            const lp = 900;
            const withdrawAmount = 100;
            const token = "USDT";

            await addLiquidity(fraxAmount, daiAmount, usdcAmount, usdtAmount, lp);

            const beforeBalance = await getTokenBalance(token, controller.address);

            await controller
                .connect(controllerSigner)
                .withdrawImbalance(
                    CURVE_META_4POOL_ADDRESS,
                    [
                        ethers.utils.parseUnits("0", FundTokenDecimals.FRAX.decimals),
                        ethers.utils.parseUnits("0", FundTokenDecimals.DAI.decimals),
                        ethers.utils.parseUnits("0", FundTokenDecimals.USDC.decimals),
                        ethers.utils.parseUnits(withdrawAmount.toString(), FundTokenDecimals.USDT.decimals),
                    ],
                    ethers.utils.parseUnits(lp.toString(), 18)
                );

            const afterBalance = await getTokenBalance(token, controller.address);

            expect(beforeBalance.add(tokenAmount(token, withdrawAmount)).eq(afterBalance)).to.be.true;
        });

        it("Can remove two coins", async () => {
            const fraxAmount = 0;
            const daiAmount = 90;
            const usdcAmount = 0;
            const usdtAmount = 1000;
            const lp = 900;

            await addLiquidity(fraxAmount, daiAmount, usdcAmount, usdtAmount, lp);

            const beforeDaiBalance = await getTokenBalance("DAI", controller.address);
            const beforeUSDTBalance = await getTokenBalance("USDT", controller.address);

            await controller
                .connect(controllerSigner)
                .withdrawImbalance(
                    CURVE_META_4POOL_ADDRESS,
                    [
                        ethers.utils.parseUnits("0", FundTokenDecimals.FRAX.decimals),
                        ethers.utils.parseUnits(daiAmount.toString(), FundTokenDecimals.DAI.decimals),
                        ethers.utils.parseUnits("0", FundTokenDecimals.USDC.decimals),
                        ethers.utils.parseUnits("800".toString(), FundTokenDecimals.USDT.decimals),
                    ],
                    ethers.utils.parseUnits(lp.toString(), 18)
                );

            const afterDaiBalance = await getTokenBalance("DAI", controller.address);
            const afterUSDTBalance = await getTokenBalance("USDT", controller.address);

            expect(beforeDaiBalance.add(tokenAmount("DAI", daiAmount)).eq(afterDaiBalance)).to.be.true;
            expect(beforeUSDTBalance.add(tokenAmount("USDT", 800)).eq(afterUSDTBalance)).to.be.true;
        });
    });

    const addLiquidity = async (
        fraxAmount: number,
        daiAmount: number,
        usdcAmount: number,
        usdtAmount: number,
        minAmount: number
    ) => {
        if (fraxAmount > 0) {
            await fundAccount("FRAX", await controllerSigner.getAddress(), fraxAmount);
        }
        if (daiAmount > 0) {
            await fundAccount("DAI", await controllerSigner.getAddress(), daiAmount);
        }
        if (usdcAmount > 0) {
            await fundAccount("USDC", await controllerSigner.getAddress(), usdcAmount);
        }
        if (usdtAmount > 0) {
            await fundAccount("USDT", await controllerSigner.getAddress(), usdtAmount);
        }
        return controller.deploy(
            CURVE_META_4POOL_ADDRESS,
            [
                ethers.utils.parseUnits(fraxAmount.toString(), FundTokenDecimals.FRAX.decimals),
                ethers.utils.parseUnits(daiAmount.toString(), FundTokenDecimals.DAI.decimals),
                ethers.utils.parseUnits(usdcAmount.toString(), FundTokenDecimals.USDC.decimals),
                ethers.utils.parseUnits(usdtAmount.toString(), FundTokenDecimals.USDT.decimals),
            ],
            Amount(minAmount)
        );
    };

    const addLiquidityNoMinCheckRevert = async (
        fraxAmount: number,
        daiAmount: number,
        usdcAmount: number,
        usdtAmount: number
    ) => {
        await expect(addLiquidity(fraxAmount, daiAmount, usdcAmount, usdtAmount, 0)).to.not.be.reverted;
    };
});
