import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import {deployMockContract, MockContract} from "ethereum-waffle";
import * as timeMachine from "ganache-time-traveler";
import {artifacts, ethers, network} from "hardhat";
import {CurveControllerV2Pool3} from "../../typechain";
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

const CURVE_3POOL_V2_ADDRESS = "0x80466c64868E1ab14a1Ddf27A676C3fcBE638Fe5";
const CURVE_3POOL_V2_LP_TOKEN_ADDRESS = "0xcA3d75aC011BF5aD07a98d02f18225F9bD9A6BDF";
const CURVE_ADDRESS_PROVIDER_ADDRESS = "0x0000000022D53366457F9d5E68Ec105046FC4383";

describe("Test Curve 3 Coin V2 Controller Against 3Pool", () => {
    let controller: CurveControllerV2Pool3;
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
        const curveControllerFactory = await ethers.getContractFactory("CurveControllerV2Pool3");
        controller = (await curveControllerFactory
            .connect(deployer)
            .deploy(
                controllerAddress,
                accessControl.address,
                addressRegistry.address,
                CURVE_ADDRESS_PROVIDER_ADDRESS
            )) as unknown as CurveControllerV2Pool3;

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

    describe("Add Liquidity", async () => {
        it("Can deploy equal amounts of each token", async () => {
            const usdtAmount = 1000;
            const wBtcAmount = 1000;
            const wEthAmount = 1000;

            await addLiquidityNoMinCheckRevert(usdtAmount, wBtcAmount, wEthAmount);
        });
        it("Can deploy various amounts of each token", async () => {
            const usdtAmount = 3478;
            const wBtcAmount = 1;
            const wEthAmount = 134789;

            await addLiquidityNoMinCheckRevert(usdtAmount, wBtcAmount, wEthAmount);
        });
        it("Can deploy USDT only", async () => {
            const usdtAmount = 1000;
            const wBtcAmount = 0;
            const wEthAmount = 0;

            await addLiquidityNoMinCheckRevert(usdtAmount, wBtcAmount, wEthAmount);
        });
        it("Can deploy WBTC only", async () => {
            const usdtAmount = 0;
            const wBtcAmount = 1000;
            const wEthAmount = 0;

            await addLiquidityNoMinCheckRevert(usdtAmount, wBtcAmount, wEthAmount);
        });
        it("Can deploy WETH only", async () => {
            const usdtAmount = 0;
            const wBtcAmount = 0;
            const wEthAmount = 1000;

            await addLiquidityNoMinCheckRevert(usdtAmount, wBtcAmount, wEthAmount);
        });

        it("Reverts when min amount isn't met", async () => {
            const usdtAmount = 0;
            const wBtcAmount = 0;
            const wEthAmount = 1000;

            await expect(addLiquidity(usdtAmount, wBtcAmount, wEthAmount, wEthAmount * 2)).to.be.revertedWith(
                "Slippage"
            );
        });
    });

    describe("Withdraw", () => {
        it("Can withdraw it all", async () => {
            const usdtAmount = 1000;
            const wBtcAmount = 200;
            const wEthAmount = 0;
            const lp = 0;
            const randomFee = 2;

            const deployedBalanceTotal = ethers.utils.parseUnits((usdtAmount + wBtcAmount + wEthAmount).toString(), 18);

            const beforeBalanceUSDT = await getTokenBalance("USDT", controller.address);
            const beforeBalanceWBTC = await getTokenBalance("WBTC", controller.address);
            const beforeBalanceWETH = await getTokenBalance("WETH", controller.address);
            const beforeBalanceTotal = beforeBalanceWBTC
                .add(pad(beforeBalanceUSDT, 12))
                .add(pad(beforeBalanceWETH, 12));

            await addLiquidity(usdtAmount, wBtcAmount, wEthAmount, lp);

            const lpBalance = await getLpTokenBalance(controller.address, CURVE_3POOL_V2_LP_TOKEN_ADDRESS);

            await controller
                .connect(controllerSigner)
                .withdraw(CURVE_3POOL_V2_ADDRESS, lpBalance, [
                    ethers.utils.parseUnits("0", FundTokenDecimals.USDT.decimals),
                    ethers.utils.parseUnits("0", FundTokenDecimals.WBTC.decimals),
                    ethers.utils.parseUnits("0", FundTokenDecimals.WETH.decimals),
                ]);

            const afterBalanceUSDT = await getTokenBalance("USDT", controller.address);
            const afterBalanceWBTC = await getTokenBalance("WBTC", controller.address);
            const afterBalanceWETH = await getTokenBalance("WETH", controller.address);

            const afterBalanceTotal = afterBalanceUSDT.add(pad(afterBalanceWBTC, 12)).add(pad(afterBalanceWETH, 12));

            expect(beforeBalanceWETH.lt(afterBalanceWETH)).to.be.true;

            expect(toNumber(afterBalanceTotal.sub(beforeBalanceTotal), 18)).to.be.gte(
                toNumber(deployedBalanceTotal, 18) - randomFee
            );
        });

        it("Can withdraw a 1/4", async () => {
            const usdtAmount = 1000;
            const wBtcAmount = 200;
            const wEthAmount = 0;
            const lp = 0;
            const randomFee = 2;

            const deployedBalanceTotal = ethers.utils.parseUnits((usdtAmount + wBtcAmount + wEthAmount).toString(), 18);

            const beforeBalanceUSDT = await getTokenBalance("USDT", controller.address);
            const beforeBalanceWBTC = await getTokenBalance("WBTC", controller.address);
            const beforeBalanceWETH = await getTokenBalance("WETH", controller.address);
            const beforeBalanceTotal = beforeBalanceWBTC
                .add(pad(beforeBalanceUSDT, 12))
                .add(pad(beforeBalanceWETH, 12));

            await addLiquidity(usdtAmount, wBtcAmount, wEthAmount, lp);

            const lpBalance = await getLpTokenBalance(controller.address, CURVE_3POOL_V2_LP_TOKEN_ADDRESS);

            await controller
                .connect(controllerSigner)
                .withdraw(CURVE_3POOL_V2_ADDRESS, lpBalance.div(4), [
                    ethers.utils.parseUnits("0", FundTokenDecimals.USDT.decimals),
                    ethers.utils.parseUnits("0", FundTokenDecimals.WBTC.decimals),
                    ethers.utils.parseUnits("0", FundTokenDecimals.WETH.decimals),
                ]);

            const afterBalanceUSDT = await getTokenBalance("USDT", controller.address);
            const afterBalanceWBTC = await getTokenBalance("WBTC", controller.address);
            const afterBalanceWETH = await getTokenBalance("WETH", controller.address);
            const afterBalanceTotal = afterBalanceUSDT.add(pad(afterBalanceWBTC, 12)).add(pad(afterBalanceWETH, 12));

            expect(beforeBalanceWETH.lt(afterBalanceWETH)).to.be.true;

            expect(toNumber(afterBalanceTotal.sub(beforeBalanceTotal), 18)).to.be.gte(
                toNumber(deployedBalanceTotal, 18) / 4 - randomFee
            );
        });
    });

    describe("Withdraw one coin", () => {
        it("Can withdraw it all in WBTC", async () => {
            const usdtAmount = 1000;
            const wBtcAmount = 1000;
            const wEthAmount = 1000;
            const lp = 2900;
            const randomFee = 2;
            const indexWBTC = 1;

            await addLiquidity(usdtAmount, wBtcAmount, wEthAmount, lp);

            const beforeBalanceUSDT = await getTokenBalance("USDT", controller.address);
            const beforeBalanceWBTC = await getTokenBalance("WBTC", controller.address);
            const beforeBalanceWETH = await getTokenBalance("WETH", controller.address);
            const lpBalance = await getLpTokenBalance(controller.address, CURVE_3POOL_V2_LP_TOKEN_ADDRESS);
            await controller
                .connect(controllerSigner)
                .withdrawOneCoin(
                    CURVE_3POOL_V2_ADDRESS,
                    lpBalance,
                    indexWBTC,
                    ethers.utils.parseUnits((wBtcAmount - randomFee).toString(), FundTokenDecimals.WBTC.decimals)
                );
            const afterBalanceUSDT = await getTokenBalance("USDT", controller.address);
            const afterBalanceWBTC = await getTokenBalance("WBTC", controller.address);
            const afterBalanceWETH = await getTokenBalance("WETH", controller.address);
            expect(
                beforeBalanceWBTC
                    .add(tokenAmount("WBTC", usdtAmount + wBtcAmount + wEthAmount + randomFee))
                    .gte(afterBalanceWBTC)
            ).to.be.true;
            expect(afterBalanceWETH.sub(beforeBalanceWETH).eq(0)).to.be.true;
            expect(afterBalanceUSDT.sub(beforeBalanceUSDT).eq(0)).to.be.true;
        });

        it("Can withdraw it all in WETH", async () => {
            const usdtAmount = 100;
            const wBtcAmount = 100;
            const wEthAmount = 100;
            const lp = 0;
            const randomFee = 2;
            const indexWETH = 2;

            await addLiquidity(usdtAmount, wBtcAmount, wEthAmount, lp);

            const beforeBalanceUSDT = await getTokenBalance("USDT", controller.address);
            const beforeBalanceWBTC = await getTokenBalance("WBTC", controller.address);
            const beforeBalanceWETH = await getTokenBalance("WETH", controller.address);
            const lpBalance = await getLpTokenBalance(controller.address, CURVE_3POOL_V2_LP_TOKEN_ADDRESS);
            await controller
                .connect(controllerSigner)
                .withdrawOneCoin(
                    CURVE_3POOL_V2_ADDRESS,
                    lpBalance,
                    indexWETH,
                    ethers.utils.parseUnits((wEthAmount - randomFee).toString(), FundTokenDecimals.WETH.decimals)
                );
            const afterBalanceUSDT = await getTokenBalance("USDT", controller.address);
            const afterBalanceWBTC = await getTokenBalance("WBTC", controller.address);
            const afterBalanceWETH = await getTokenBalance("WETH", controller.address);
            expect(
                beforeBalanceWETH
                    .add(tokenAmount("WETH", usdtAmount + wBtcAmount + wEthAmount + randomFee))
                    .gte(afterBalanceWETH)
            ).to.be.true;
            expect(afterBalanceWBTC.sub(beforeBalanceWBTC).eq(0)).to.be.true;
            expect(afterBalanceUSDT.sub(beforeBalanceUSDT).eq(0)).to.be.true;
        });
    });

    const addLiquidity = async (usdtAmount: number, wBtcAmount: number, wEthAmount: number, minAmount: number) => {
        if (usdtAmount > 0) await fundAccount("USDT", await controllerSigner.getAddress(), usdtAmount);
        if (wBtcAmount > 0) await fundAccount("WBTC", await controllerSigner.getAddress(), wBtcAmount);
        if (wEthAmount > 0) await fundAccount("WETH", await controllerSigner.getAddress(), wEthAmount);

        return controller.deploy(
            CURVE_3POOL_V2_ADDRESS,
            [
                ethers.utils.parseUnits(usdtAmount.toString(), FundTokenDecimals.USDT.decimals),
                ethers.utils.parseUnits(wBtcAmount.toString(), FundTokenDecimals.WBTC.decimals),
                ethers.utils.parseUnits(wEthAmount.toString(), FundTokenDecimals.WETH.decimals),
            ],
            Amount(minAmount)
        );
    };

    const addLiquidityNoMinCheckRevert = async (usdtAmount: number, wBtcAmount: number, wEthAmount: number) => {
        await expect(addLiquidity(usdtAmount, wBtcAmount, wEthAmount, 0)).to.not.be.reverted;
    };
});
