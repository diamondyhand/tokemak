import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import {deployMockContract, MockContract} from "ethereum-waffle";
import * as timeMachine from "ganache-time-traveler";
import {artifacts, ethers, network} from "hardhat";
import {CurveControllerPool3} from "../../typechain";
import {getContractAddress} from "@ethersproject/address";
import {JsonRpcSigner} from "@ethersproject/providers";
import {fundAccount, getLpTokenBalance, getTokenBalance, pad, tokenAmount, toNumber} from "../utilities/fundAccount";

const ACCESS_CONTROL = artifacts.require("@openzeppelin/contracts/access/AccessControl.sol");

const CURVE_3POOL_ADDRESS = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7";
const CURVE_3POOL_LP_TOKEN_ADDRESS = "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490";
const CURVE_ADDRESS_PROVIDER_ADDRESS = "0x0000000022D53366457F9d5E68Ec105046FC4383";

describe("Test Curve 3 Coin Controller Against 3Pool", () => {
    let controller: CurveControllerPool3;
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
        const curveControllerFactory = await ethers.getContractFactory("CurveControllerPool3");
        controller = (await curveControllerFactory
            .connect(deployer)
            .deploy(
                controllerAddress,
                accessControl.address,
                addressRegistry.address,
                CURVE_ADDRESS_PROVIDER_ADDRESS
            )) as unknown as CurveControllerPool3;

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
            const usdcAmount = 1000;
            const daiAmount = 1000;
            const usdtAmount = 1000;

            await addLiquidityNoMinCheckRevert(usdcAmount, daiAmount, usdtAmount);
        });
        it("Can deploy various amounts of each token", async () => {
            const usdcAmount = 3478;
            const daiAmount = 1;
            const usdtAmount = 134789;

            await addLiquidityNoMinCheckRevert(usdcAmount, daiAmount, usdtAmount);
        });
        it("Can deploy USDC only", async () => {
            const usdcAmount = 1000;
            const daiAmount = 0;
            const usdtAmount = 0;

            await addLiquidityNoMinCheckRevert(usdcAmount, daiAmount, usdtAmount);
        });
        it("Can deploy DAI only", async () => {
            const usdcAmount = 0;
            const daiAmount = 1000;
            const usdtAmount = 0;

            await addLiquidityNoMinCheckRevert(usdcAmount, daiAmount, usdtAmount);
        });
        it("Can deploy USDT only", async () => {
            const usdcAmount = 0;
            const daiAmount = 0;
            const usdtAmount = 1000;

            await addLiquidityNoMinCheckRevert(usdcAmount, daiAmount, usdtAmount);
        });

        it("Reverts when min amount isn't met", async () => {
            const usdcAmount = 0;
            const daiAmount = 0;
            const usdtAmount = 1000;

            await expect(addLiquidity(usdcAmount, daiAmount, usdtAmount, usdtAmount * 2)).to.be.revertedWith(
                "Slippage screwed you"
            );
        });
    });

    describe("Withdraw Imbalance", () => {
        it("Can remove USDC only", async () => {
            const usdcAmount = 1000;
            const daiAmount = 0;
            const usdtAmount = 0;
            const lp = 900;
            const withdrawAmount = 100;
            const token = "USDC";

            await addLiquidity(usdcAmount, daiAmount, usdtAmount, lp);

            const beforeBalance = await getTokenBalance(token, controller.address);

            await controller
                .connect(controllerSigner)
                .withdrawImbalance(
                    CURVE_3POOL_ADDRESS,
                    [
                        ethers.utils.parseUnits("0", 18),
                        ethers.utils.parseUnits(withdrawAmount.toString(), 6),
                        ethers.utils.parseUnits("0", 6),
                    ],
                    ethers.utils.parseUnits(lp.toString(), 18)
                );

            const afterBalance = await getTokenBalance(token, controller.address);

            expect(beforeBalance.add(tokenAmount(token, withdrawAmount)).eq(afterBalance)).to.be.true;
        });

        it("Can remove DAI only", async () => {
            const usdcAmount = 0;
            const daiAmount = 1000;
            const usdtAmount = 0;
            const lp = 900;
            const withdrawAmount = 100;
            const token = "DAI";

            await addLiquidity(usdcAmount, daiAmount, usdtAmount, lp);

            const beforeBalance = await getTokenBalance(token, controller.address);

            await controller
                .connect(controllerSigner)
                .withdrawImbalance(
                    CURVE_3POOL_ADDRESS,
                    [
                        ethers.utils.parseUnits(withdrawAmount.toString(), 18),
                        ethers.utils.parseUnits("0".toString(), 6),
                        ethers.utils.parseUnits("0", 6),
                    ],
                    ethers.utils.parseUnits(lp.toString(), 18)
                );

            const afterBalance = await getTokenBalance(token, controller.address);

            expect(beforeBalance.add(tokenAmount(token, withdrawAmount)).eq(afterBalance)).to.be.true;
        });

        it("Can remove USDT only", async () => {
            const usdcAmount = 0;
            const daiAmount = 0;
            const usdtAmount = 1000;
            const lp = 900;
            const withdrawAmount = 100;
            const token = "USDT";

            await addLiquidity(usdcAmount, daiAmount, usdtAmount, lp);

            const beforeBalance = await getTokenBalance(token, controller.address);

            await controller
                .connect(controllerSigner)
                .withdrawImbalance(
                    CURVE_3POOL_ADDRESS,
                    [
                        ethers.utils.parseUnits("0", 18),
                        ethers.utils.parseUnits("0", 6),
                        ethers.utils.parseUnits(withdrawAmount.toString(), 6),
                    ],
                    ethers.utils.parseUnits(lp.toString(), 18)
                );

            const afterBalance = await getTokenBalance(token, controller.address);

            expect(beforeBalance.add(tokenAmount(token, withdrawAmount)).eq(afterBalance)).to.be.true;
        });

        it("Can remove two coins", async () => {
            const usdcAmount = 0;
            const daiAmount = 90;
            const usdtAmount = 1000;
            const lp = 900;

            await addLiquidity(usdcAmount, daiAmount, usdtAmount, lp);

            const beforeDaiBalance = await getTokenBalance("DAI", controller.address);
            const beforeUSDTBalance = await getTokenBalance("USDT", controller.address);

            await controller
                .connect(controllerSigner)
                .withdrawImbalance(
                    CURVE_3POOL_ADDRESS,
                    [
                        ethers.utils.parseUnits(daiAmount.toString(), 18),
                        ethers.utils.parseUnits("0", 6),
                        ethers.utils.parseUnits("800".toString(), 6),
                    ],
                    ethers.utils.parseUnits(lp.toString(), 18)
                );

            const afterDaiBalance = await getTokenBalance("DAI", controller.address);
            const afterUSDTBalance = await getTokenBalance("USDT", controller.address);

            expect(beforeDaiBalance.add(tokenAmount("DAI", daiAmount)).eq(afterDaiBalance)).to.be.true;
            expect(beforeUSDTBalance.add(tokenAmount("USDT", 800)).eq(afterUSDTBalance)).to.be.true;
        });
    });

    describe("Withdraw", () => {
        it("Can withdraw it all", async () => {
            const usdcAmount = 1000;
            const daiAmount = 200;
            const usdtAmount = 0;
            const lp = 1100;
            const randomFee = 2;

            const deployedBalanceTotal = ethers.utils.parseUnits((usdcAmount + daiAmount + usdtAmount).toString(), 18);

            const beforeBalanceUsdc = await getTokenBalance("USDC", controller.address);
            const beforeBalanceDai = await getTokenBalance("DAI", controller.address);
            const beforeBalanceUSDT = await getTokenBalance("USDT", controller.address);
            const beforeBalanceTotal = beforeBalanceDai.add(pad(beforeBalanceUsdc, 12)).add(pad(beforeBalanceUSDT, 12));

            await addLiquidity(usdcAmount, daiAmount, usdtAmount, lp);

            const lpBalance = await getLpTokenBalance(controller.address, CURVE_3POOL_LP_TOKEN_ADDRESS);

            await controller
                .connect(controllerSigner)
                .withdraw(CURVE_3POOL_ADDRESS, lpBalance, [
                    ethers.utils.parseUnits("0", 18),
                    ethers.utils.parseUnits("0", 6),
                    ethers.utils.parseUnits("0", 6),
                ]);

            const afterBalanceDai = await getTokenBalance("DAI", controller.address);
            const afterBalanceUsdc = await getTokenBalance("USDC", controller.address);
            const afterBalanceUSDT = await getTokenBalance("USDT", controller.address);
            const afterBalanceTotal = afterBalanceDai.add(pad(afterBalanceUsdc, 12)).add(pad(afterBalanceUSDT, 12));

            expect(beforeBalanceUSDT.lt(afterBalanceUSDT)).to.be.true;

            expect(toNumber(afterBalanceTotal.sub(beforeBalanceTotal), 18)).to.be.gte(
                toNumber(deployedBalanceTotal, 18) - randomFee
            );
        });

        it("Can withdraw a 1/4", async () => {
            const usdcAmount = 1000;
            const daiAmount = 200;
            const usdtAmount = 0;
            const lp = 1100;
            const randomFee = 2;

            const deployedBalanceTotal = ethers.utils.parseUnits((usdcAmount + daiAmount + usdtAmount).toString(), 18);

            const beforeBalanceUsdc = await getTokenBalance("USDC", controller.address);
            const beforeBalanceDai = await getTokenBalance("DAI", controller.address);
            const beforeBalanceUSDT = await getTokenBalance("USDT", controller.address);
            const beforeBalanceTotal = beforeBalanceDai.add(pad(beforeBalanceUsdc, 12)).add(pad(beforeBalanceUSDT, 12));

            await addLiquidity(usdcAmount, daiAmount, usdtAmount, lp);

            const lpBalance = await getLpTokenBalance(controller.address, CURVE_3POOL_LP_TOKEN_ADDRESS);

            await controller
                .connect(controllerSigner)
                .withdraw(CURVE_3POOL_ADDRESS, lpBalance.div(4), [
                    ethers.utils.parseUnits("0", 18),
                    ethers.utils.parseUnits("0", 6),
                    ethers.utils.parseUnits("0", 6),
                ]);

            const afterBalanceDai = await getTokenBalance("DAI", controller.address);
            const afterBalanceUsdc = await getTokenBalance("USDC", controller.address);
            const afterBalanceUSDT = await getTokenBalance("USDT", controller.address);
            const afterBalanceTotal = afterBalanceDai.add(pad(afterBalanceUsdc, 12)).add(pad(afterBalanceUSDT, 12));

            expect(beforeBalanceUSDT.lt(afterBalanceUSDT)).to.be.true;

            expect(toNumber(afterBalanceTotal.sub(beforeBalanceTotal), 18)).to.be.gte(
                toNumber(deployedBalanceTotal, 18) / 4 - randomFee
            );
        });
    });

    describe("Withdraw one coin", () => {
        it("Can withdraw it all in USDC", async () => {
            const usdcAmount = 1000;
            const daiAmount = 1000;
            const usdtAmount = 1000;
            const lp = 2900;
            const randomFee = 2;

            await addLiquidity(usdcAmount, daiAmount, usdtAmount, lp);

            const beforeBalanceUSDC = await getTokenBalance("USDC", controller.address);
            const beforeBalanceUSDT = await getTokenBalance("USDT", controller.address);
            const beforeBalanceDAI = await getTokenBalance("DAI", controller.address);

            const lpBalance = await getLpTokenBalance(controller.address, CURVE_3POOL_LP_TOKEN_ADDRESS);

            await controller
                .connect(controllerSigner)
                .withdrawOneCoin(
                    CURVE_3POOL_ADDRESS,
                    lpBalance,
                    1,
                    ethers.utils.parseUnits((usdcAmount - randomFee).toString(), 6)
                );

            const afterBalanceUSDC = await getTokenBalance("USDC", controller.address);
            const afterBalanceUSDT = await getTokenBalance("USDT", controller.address);
            const afterBalanceDAI = await getTokenBalance("DAI", controller.address);

            expect(
                beforeBalanceUSDC
                    .add(tokenAmount("USDC", usdcAmount + daiAmount + usdtAmount + randomFee))
                    .gte(afterBalanceUSDC)
            ).to.be.true;

            expect(afterBalanceDAI.sub(beforeBalanceDAI).eq(0)).to.be.true;
            expect(afterBalanceUSDT.sub(beforeBalanceUSDT).eq(0)).to.be.true;
        });

        it("Can withdraw it all in USDT", async () => {
            const usdcAmount = 1000;
            const daiAmount = 1000;
            const usdtAmount = 1000;
            const lp = 2900;
            const randomFee = 2;

            await addLiquidity(usdcAmount, daiAmount, usdtAmount, lp);

            const beforeBalanceUSDC = await getTokenBalance("USDC", controller.address);
            const beforeBalanceUSDT = await getTokenBalance("USDT", controller.address);
            const beforeBalanceDAI = await getTokenBalance("DAI", controller.address);

            const lpBalance = await getLpTokenBalance(controller.address, CURVE_3POOL_LP_TOKEN_ADDRESS);

            await controller
                .connect(controllerSigner)
                .withdrawOneCoin(
                    CURVE_3POOL_ADDRESS,
                    lpBalance,
                    2,
                    ethers.utils.parseUnits((usdtAmount - randomFee).toString(), 6)
                );

            const afterBalanceUSDC = await getTokenBalance("USDC", controller.address);
            const afterBalanceUSDT = await getTokenBalance("USDT", controller.address);
            const afterBalanceDAI = await getTokenBalance("DAI", controller.address);

            expect(
                beforeBalanceUSDT
                    .add(tokenAmount("USDT", usdcAmount + daiAmount + usdtAmount + randomFee))
                    .gte(afterBalanceUSDT)
            ).to.be.true;

            expect(afterBalanceDAI.sub(beforeBalanceDAI).eq(0)).to.be.true;
            expect(afterBalanceUSDC.sub(beforeBalanceUSDC).eq(0)).to.be.true;
        });

        it("Can withdraw it all in DAI", async () => {
            const usdcAmount = 1000;
            const daiAmount = 1000;
            const usdtAmount = 1000;
            const lp = 2900;
            const randomFee = 2;

            await addLiquidity(usdcAmount, daiAmount, usdtAmount, lp);

            const beforeBalanceUSDC = await getTokenBalance("USDC", controller.address);
            const beforeBalanceUSDT = await getTokenBalance("USDT", controller.address);
            const beforeBalanceDAI = await getTokenBalance("DAI", controller.address);

            const lpBalance = await getLpTokenBalance(controller.address, CURVE_3POOL_LP_TOKEN_ADDRESS);

            await controller
                .connect(controllerSigner)
                .withdrawOneCoin(
                    CURVE_3POOL_ADDRESS,
                    lpBalance,
                    0,
                    ethers.utils.parseUnits((daiAmount - randomFee).toString(), 18)
                );

            const afterBalanceUSDC = await getTokenBalance("USDC", controller.address);
            const afterBalanceUSDT = await getTokenBalance("USDT", controller.address);
            const afterBalanceDAI = await getTokenBalance("DAI", controller.address);

            expect(
                beforeBalanceDAI
                    .add(tokenAmount("DAI", usdcAmount + daiAmount + usdtAmount + randomFee))
                    .gte(afterBalanceDAI)
            ).to.be.true;

            expect(afterBalanceUSDT.sub(beforeBalanceUSDT).eq(0)).to.be.true;
            expect(afterBalanceUSDC.sub(beforeBalanceUSDC).eq(0)).to.be.true;
        });
    });

    const addLiquidity = async (usdcAmount: number, daiAmount: number, usdtAmount: number, minAmount: number) => {
        if (usdcAmount > 0) await fundAccount("USDC", controllerSigner._address, usdcAmount);
        if (daiAmount > 0) await fundAccount("DAI", controllerSigner._address, daiAmount);
        if (usdtAmount > 0) await fundAccount("USDT", controllerSigner._address, usdtAmount);

        return controller.deploy(
            CURVE_3POOL_ADDRESS,
            [
                ethers.utils.parseUnits(daiAmount.toString(), 18),
                ethers.utils.parseUnits(usdcAmount.toString(), 6),
                ethers.utils.parseUnits(usdtAmount.toString(), 6),
            ],
            ethers.utils.parseUnits(minAmount.toString(), 18)
        );
    };

    const addLiquidityNoMinCheckRevert = async (usdcAmount: number, daiAmount: number, usdtAmount: number) => {
        await expect(addLiquidity(usdcAmount, daiAmount, usdtAmount, 0)).to.not.be.reverted;
    };
});
