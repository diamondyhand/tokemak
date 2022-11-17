const {expect, Assertion} = require("chai");
const timeMachine = require("ganache-time-traveler");
const {artifacts, ethers, upgrades, network} = require("hardhat");
const ERC20 = artifacts.require("ERC20");
const chainlinkAggregatorV3 = artifacts.require("@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol");
const {MaxUint256} = ethers.constants;
const BN = ethers.BigNumber;

Assertion.addMethod("withManuallyValidatedArgs", function (x, validate) {
    const derivedPromise = this.promise.then(() => {
        const g = this;
        const values = g.logs.map((l) => {
            return x.interface.parseLog(l).args;
        });
        for (let i = 0; i < values.length; i++) {
            validate(values[i]);
        }
    });
    this.then = derivedPromise.then.bind(derivedPromise);
    this.catch = derivedPromise.catch.bind(derivedPromise);
    return this;
});

describe("Test Defi-Round", () => {
    let defiContract;
    let snapshotId;
    let deployer;
    let user1;
    let treasury;

    const WETH_WHALE_ADDRESS = "0x4a18a50a8328b42773268B4b436254056b7d70CE";
    const DAI_WHALE_ADDRESS = "0x5D38B4e4783E34e2301A2a36c39a03c45798C4dD";
    const USDC_WHALE_ADDRESS = "0x0548F59fEE79f8832C299e01dCA5c76F034F558e";

    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const DAI_ADDRESS = "0x6b175474e89094c44da98b954eedeac495271d0f";
    const USDC_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

    const WETH_ORACLE_ADDRESS = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
    const DAI_ORACLE_ADDRESS = "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9";
    const USDC_ORACLE_ADDRESS = "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6";

    const CYCLE_DURATION = 2; // blocks

    let weth;
    let dai;
    let usdc;

    let wethOracle;
    let daiOracle;
    let usdcOracle;

    let managerContract;

    let wethGenesisPool;
    let daiGenesisPool;
    let usdcGenesisPool;

    let rebalancer;

    let usdcWhale;

    const defaultWethLimit = 50;
    const defaultDaiLimit = 100000;
    const defaultUsdcLimit = 100000;

    const defaultOversubPct = 1.5;
    const defaultLastLookDuration = 2;

    beforeEach(async () => {
        let snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    before(async () => {
        [deployer, user1, treasury, rebalancer] = await ethers.getSigners();

        //Asset contracts
        weth = await ethers.getContractAt(ERC20.abi, WETH_ADDRESS);
        dai = await ethers.getContractAt(ERC20.abi, DAI_ADDRESS);
        usdc = await ethers.getContractAt(ERC20.abi, USDC_ADDRESS);

        //Chainlink Oracles for those assets
        wethOracle = await ethers.getContractAt(chainlinkAggregatorV3.abi, WETH_ORACLE_ADDRESS);
        daiOracle = await ethers.getContractAt(chainlinkAggregatorV3.abi, DAI_ORACLE_ADDRESS);
        usdcOracle = await ethers.getContractAt(chainlinkAggregatorV3.abi, USDC_ORACLE_ADDRESS);

        const cycleStartTime = (await ethers.provider.getBlock("latest")).timestamp + 10;

        // Deploy Manager
        const managerFactory = await ethers.getContractFactory("Manager");
        managerContract = await upgrades.deployProxy(managerFactory, [CYCLE_DURATION, cycleStartTime], {
            unsafeAllow: ["delegatecall", "constructor", "state-variable-assignment", "state-variable-immutable"],
        });
        await managerContract.deployed();
        //Deploy our Pools

        const poolFactory = await ethers.getContractFactory("Pool");

        wethGenesisPool = await upgrades.deployProxy(
            poolFactory,
            [WETH_ADDRESS, managerContract.address, "TokemakWethPool", "tWETH", rebalancer.address],
            {unsafeAllow: ["constructor"]}
        );
        await wethGenesisPool.deployed();

        daiGenesisPool = await upgrades.deployProxy(
            poolFactory,
            [DAI_ADDRESS, managerContract.address, "TokemakDaiPool", "tDAI", rebalancer.address],
            {unsafeAllow: ["constructor"]}
        );
        await daiGenesisPool.deployed();

        usdcGenesisPool = await upgrades.deployProxy(
            poolFactory,
            [USDC_ADDRESS, managerContract.address, "TokemakUsdcPool", "tUSDC", rebalancer.address],
            {unsafeAllow: ["constructor"]}
        );
        await usdcGenesisPool.deployed();

        // Register pools to manager
        await managerContract.registerPool(wethGenesisPool.address);
        await managerContract.registerPool(daiGenesisPool.address);
        await managerContract.registerPool(usdcGenesisPool.address);

        // Deploy TOKE

        const defiFactory = await ethers.getContractFactory("DefiRound");
        defiContract = await defiFactory.deploy(WETH_ADDRESS, treasury.address, maxTotalValue);

        await deployer.sendTransaction({
            value: ethers.utils.parseEther("10.0"),
            to: WETH_WHALE_ADDRESS,
        });
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [WETH_WHALE_ADDRESS],
        });

        await deployer.sendTransaction({
            value: ethers.utils.parseEther("10.0"),
            to: DAI_WHALE_ADDRESS,
        });
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [DAI_WHALE_ADDRESS],
        });

        await deployer.sendTransaction({
            value: ethers.utils.parseEther("10.0"),
            to: USDC_WHALE_ADDRESS,
        });
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [USDC_WHALE_ADDRESS],
        });
    });

    const WETHAmount = (number) => {
        return ethers.utils.parseUnits(number.toString(), 18);
    };
    const DAIAmount = (number) => {
        return ethers.utils.parseUnits(number.toString(), 18);
    };
    const USDCAmount = (number) => {
        return ethers.utils.parseUnits(number.toString(), 6);
    };
    const WETHDeposit = (number) => {
        return [WETH_ADDRESS, WETHAmount(number)];
    };
    const DAIDeposit = (number) => {
        return [DAI_ADDRESS, DAIAmount(number)];
    };
    const USDCDeposit = (number) => {
        return [USDC_ADDRESS, USDCAmount(number)];
    };
    const USDValue = (number) => {
        return ethers.utils.parseUnits(number.toString(), 8);
    };
    const ParseWETHNumber = (number, precision) => {
        return Number(Number(ethers.utils.formatUnits(number.toString(), 18)).toFixed(precision));
    };

    const ParseUSDCNumber = (number, precision) => {
        return Number(Number(ethers.utils.formatUnits(number.toString(), 6)).toFixed(precision));
    };

    const maxTotalValue = USDValue(60000000);

    describe("Deposit", async () => {
        it("Requires pre-approval", async () => {
            const usdcBalance = 1500;

            await publishSupportedTokens();

            usdcWhale = await ethers.provider.getSigner(USDC_WHALE_ADDRESS);

            await expect(defiContract.connect(usdcWhale).deposit(USDCDeposit(usdcBalance), [])).to.be.revertedWith(
                "ERC20: transfer amount exceeds allowance"
            );

            await usdc.connect(usdcWhale).increaseAllowance(defiContract.address, USDCAmount(usdcBalance));

            await defiContract.connect(usdcWhale).deposit(USDCDeposit(usdcBalance), []);
        });

        it("Converts ETH to WETH and deposits to contract", async () => {
            const ethAmount = 4.7;

            await publishSupportedTokens();

            usdcWhale = await ethers.provider.getSigner(USDC_WHALE_ADDRESS);

            const contractBalanceBefore = await weth.connect(user1).balanceOf(defiContract.address);

            await defiContract.connect(usdcWhale).deposit(WETHDeposit(ethAmount), [], {
                value: WETHAmount(ethAmount),
            });

            const contractBalanceAfter = await weth.connect(user1).balanceOf(defiContract.address);

            expect(ParseWETHNumber(contractBalanceAfter.sub(contractBalanceBefore), 1)).to.equal(ethAmount);
        });

        it("Updates total value", async () => {
            const usdcBalance = 1500;

            await publishSupportedTokens();

            usdcWhale = await ethers.provider.getSigner(USDC_WHALE_ADDRESS);

            await usdc.connect(usdcWhale).increaseAllowance(defiContract.address, USDCAmount(usdcBalance));

            const usdcRoundData = await usdcOracle.connect(user1).latestRoundData();

            const totalBefore = await defiContract.connect(user1).totalValue();

            await defiContract.connect(usdcWhale).deposit(USDCDeposit(usdcBalance), []);

            const totalAfter = await defiContract.connect(user1).totalValue();

            expect(totalAfter.sub(totalBefore)).to.be.equal(usdcRoundData[1].mul(BN.from(usdcBalance)));
        });
    });

    describe("Stage 2", async () => {
        it("WETH converted back to ETH on request", async () => {
            //ETH to ETH
            const ethAmount = 4.7;

            await publishSupportedTokens();

            const wethWhale = await ethers.provider.getSigner(WETH_WHALE_ADDRESS);

            const whaleBalanceBeforeDeposit = await ethers.provider.getBalance(WETH_WHALE_ADDRESS);

            const contractBalanceBefore = await weth.connect(user1).balanceOf(defiContract.address);

            const depositResult = await defiContract.connect(wethWhale).deposit(WETHDeposit(ethAmount), [], {
                value: WETHAmount(ethAmount),
            });
            const depositReceipt = await ethers.provider.getTransactionReceipt(depositResult.hash);
            const depositGasUsed = depositReceipt.gasUsed;

            const contractBalanceAfter = await weth.connect(user1).balanceOf(defiContract.address);

            const whaleBalanceAfterDeposit = await ethers.provider.getBalance(WETH_WHALE_ADDRESS);

            expect(ParseWETHNumber(contractBalanceAfter.sub(contractBalanceBefore), 1)).to.equal(ethAmount);

            const tokePrice = 10;

            await publishRates(tokePrice);

            const withdrawResult = await defiContract.connect(wethWhale).withdraw(WETHDeposit(ethAmount), true);
            const withdrawReceipt = await ethers.provider.getTransactionReceipt(withdrawResult.hash);
            const withdrawGasUsed = withdrawReceipt.gasUsed;

            const whaleBalanceAfterWithdraw = await ethers.provider.getBalance(WETH_WHALE_ADDRESS);

            expect(
                whaleBalanceAfterDeposit.add(WETHAmount(ethAmount)).add(depositGasUsed.mul(depositResult.gasPrice))
            ).to.be.equal(whaleBalanceBeforeDeposit);

            expect(whaleBalanceBeforeDeposit).to.be.equal(
                whaleBalanceAfterWithdraw
                    .add(depositGasUsed.mul(depositResult.gasPrice))
                    .add(withdrawGasUsed.mul(withdrawResult.gasPrice))
            );
        });

        it("Can submit ETH but get WETH during withdraw", async () => {
            //ETH to WETH
            const ethAmount = 4.7;

            await publishSupportedTokens();

            const wethWhale = await ethers.provider.getSigner(WETH_WHALE_ADDRESS);

            const whaleEthBalanceBeforeDeposit = await ethers.provider.getBalance(WETH_WHALE_ADDRESS);

            const contractBalanceBefore = await weth.connect(user1).balanceOf(defiContract.address);

            const depositResult = await defiContract.connect(wethWhale).deposit(WETHDeposit(ethAmount), [], {
                value: WETHAmount(ethAmount),
            });
            const depositReceipt = await ethers.provider.getTransactionReceipt(depositResult.hash);
            const depositGasUsed = depositReceipt.gasUsed;

            const contractBalanceAfter = await weth.connect(user1).balanceOf(defiContract.address);

            expect(ParseWETHNumber(contractBalanceAfter.sub(contractBalanceBefore), 1)).to.equal(ethAmount);

            const tokePrice = 10;

            await publishRates(tokePrice);

            const whaleWethBalanceBeforeWithdraw = await weth.connect(user1).balanceOf(WETH_WHALE_ADDRESS);

            const withdrawResult = await defiContract.connect(wethWhale).withdraw(WETHDeposit(ethAmount), false);
            const withdrawReceipt = await ethers.provider.getTransactionReceipt(withdrawResult.hash);
            const withdrawGasUsed = withdrawReceipt.gasUsed;

            const whaleEthBalanceAfterWithdraw = await ethers.provider.getBalance(WETH_WHALE_ADDRESS);
            const whatlWethBalanceAfterWithdraw = await weth.connect(user1).balanceOf(WETH_WHALE_ADDRESS);

            //Confirm withdraw didn't go back as ETH
            expect(whaleEthBalanceBeforeDeposit.sub(WETHAmount(ethAmount))).to.be.equal(
                whaleEthBalanceAfterWithdraw
                    .add(depositGasUsed.mul(depositResult.gasPrice))
                    .add(withdrawGasUsed.mul(withdrawResult.gasPrice))
            );

            //Confirm withdraw increased WETH balance by amount
            expect(whaleWethBalanceBeforeWithdraw.add(WETHAmount(ethAmount))).to.be.equal(
                whatlWethBalanceAfterWithdraw
            );
        });

        it("Can submit WETH and get WETH during withdraw", async () => {
            //WETH to WETH
            const ethAmount = 4.7;

            await publishSupportedTokens();

            const wethWhale = await ethers.provider.getSigner(WETH_WHALE_ADDRESS);

            const whaleWethBalanceBeforeDeposit = await weth.connect(user1).balanceOf(WETH_WHALE_ADDRESS);

            const contractBalanceBefore = await weth.connect(user1).balanceOf(defiContract.address);

            await weth.connect(wethWhale).approve(defiContract.address, WETHAmount(ethAmount));
            await defiContract.connect(wethWhale).deposit(WETHDeposit(ethAmount), []);

            const contractBalanceAfter = await weth.connect(user1).balanceOf(defiContract.address);

            const whaleWethBalanceAfterDeposit = await weth.connect(user1).balanceOf(WETH_WHALE_ADDRESS);

            expect(ParseWETHNumber(contractBalanceAfter.sub(contractBalanceBefore), 1)).to.equal(ethAmount);

            const tokePrice = 10;

            await publishRates(tokePrice);

            await defiContract.connect(wethWhale).withdraw(WETHDeposit(ethAmount), false);

            const whatlWethBalanceAfterWithdraw = await weth.connect(user1).balanceOf(WETH_WHALE_ADDRESS);

            expect(whaleWethBalanceAfterDeposit.add(WETHAmount(ethAmount))).to.be.equal(whaleWethBalanceBeforeDeposit);
            expect(whaleWethBalanceBeforeDeposit).to.be.equal(whatlWethBalanceAfterWithdraw);
        });

        it("Can submit WETH and get ETH during withdraw", async () => {
            //WETH to ETH
            const ethAmount = 4.7;

            await publishSupportedTokens();

            const wethWhale = await ethers.provider.getSigner(WETH_WHALE_ADDRESS);

            const whaleEthBalanceBeforeWithdraw = await ethers.provider.getBalance(WETH_WHALE_ADDRESS);

            const contractBalanceBefore = await weth.connect(user1).balanceOf(defiContract.address);

            const approveResult = await weth.connect(wethWhale).approve(defiContract.address, WETHAmount(ethAmount));
            const approveReceipt = await ethers.provider.getTransactionReceipt(approveResult.hash);
            const approveGasUsed = approveReceipt.gasUsed;

            const depositResult = await defiContract.connect(wethWhale).deposit(WETHDeposit(ethAmount), []);
            const depositReceipt = await ethers.provider.getTransactionReceipt(depositResult.hash);

            const depositGasUsed = depositReceipt.gasUsed;

            const contractBalanceAfter = await weth.connect(user1).balanceOf(defiContract.address);

            expect(ParseWETHNumber(contractBalanceAfter.sub(contractBalanceBefore), 1)).to.equal(ethAmount);

            const tokePrice = 10;

            await publishRates(tokePrice);

            const withdrawResult = await defiContract.connect(wethWhale).withdraw(WETHDeposit(ethAmount), true);
            const withdrawReceipt = await ethers.provider.getTransactionReceipt(withdrawResult.hash);
            const withdrawGasUsed = withdrawReceipt.gasUsed;

            const whaleEthBalanceAfterWithdraw = await ethers.provider.getBalance(WETH_WHALE_ADDRESS);

            expect(
                whaleEthBalanceBeforeWithdraw
                    .sub(approveGasUsed.mul(approveResult.gasPrice))
                    .sub(depositGasUsed.mul(depositResult.gasPrice))
                    .sub(withdrawGasUsed.mul(withdrawResult.gasPrice))
                    .add(WETHAmount(ethAmount))
            ).to.be.equal(whaleEthBalanceAfterWithdraw);
        });
    });

    describe("Finalize Assets", async () => {
        it("Reverts when transfer to treasury is not complete", async () => {
            const ethAmt = 5;

            await publishSupportedTokens();

            const wethWhale = await ethers.provider.getSigner(WETH_WHALE_ADDRESS);
            await weth.connect(wethWhale).approve(defiContract.address, WETHAmount(ethAmt));
            await defiContract.connect(wethWhale).deposit(WETHDeposit(ethAmt), []);

            await expect(defiContract.connect(wethWhale).finalizeAssets(false)).to.be.revertedWith("NOT_SYSTEM_FINAL");
        });

        it("Reverts when no over-subscription", async () => {
            const ethAmt = 5;

            await publishSupportedTokens();

            const wethWhale = await ethers.provider.getSigner(WETH_WHALE_ADDRESS);
            await weth.connect(wethWhale).transfer(user1.address, WETHAmount(ethAmt));

            await weth.connect(user1).approve(defiContract.address, WETHAmount(ethAmt));
            await defiContract.connect(user1).deposit(WETHDeposit(ethAmt), []);

            const tokePrice = 8.75;

            await publishRates(tokePrice, 0, 0, 0, 1, MaxUint256);
            await goToStage3();
            await transferToTreasury();
            await expect(defiContract.connect(user1).finalizeAssets(false)).to.be.revertedWith("NOTHING_TO_MOVE");
        });

        it("Allows a rate such that all funds could be pulled to treasury in an emergency", async () => {
            const ethAmt = 5;

            await publishSupportedTokens();

            const wethWhale = await ethers.provider.getSigner(WETH_WHALE_ADDRESS);
            await weth.connect(wethWhale).transfer(user1.address, WETHAmount(ethAmt));

            await weth.connect(user1).approve(defiContract.address, WETHAmount(ethAmt));
            await defiContract.connect(user1).deposit(WETHDeposit(ethAmt), []);

            await defiContract.connect(deployer).publishRates(
                [
                    [weth.address, increaseBNPrecision(BN.from("1"), 18), increaseBNPrecision(BN.from("1"), 18)],
                    [dai.address, increaseBNPrecision(BN.from("1"), 18), increaseBNPrecision(BN.from("1"), 18)],
                    [usdc.address, increaseBNPrecision(BN.from("1"), 6), increaseBNPrecision(BN.from("1"), 18)],
                ],
                [1, 1],
                1
            );

            await goToStage3();
            await transferToTreasury();

            const defiBalance = await weth.connect(deployer).balanceOf(defiContract.address);
            const treasuryBalance = await weth.connect(deployer).balanceOf(treasury.address);

            expect(defiBalance).to.be.equal(0);
            expect(treasuryBalance).to.be.equal(WETHAmount(ethAmt));
        });

        it("Setting depositToGenesis to true", async () => {
            const ethAmt = 10;

            await publishSupportedTokens();

            const wethWhale = await ethers.provider.getSigner(WETH_WHALE_ADDRESS);
            await weth.connect(wethWhale).approve(defiContract.address, WETHAmount(ethAmt));
            await defiContract.connect(wethWhale).deposit(WETHDeposit(ethAmt), []);

            const tokePrice = 8.75;

            await publishRates(tokePrice);
            await goToStage3(1, MaxUint256);
            await transferToTreasury();

            const arr = [];

            await expect(defiContract.connect(wethWhale).finalizeAssets(true))
                .to.emit(weth, "Transfer")
                .withManuallyValidatedArgs(weth, (args) => {
                    arr.push(args);
                })
                .and.to.emit(defiContract, "GenesisTransfer")
                .withManuallyValidatedArgs(defiContract, (args) => {
                    expect(args[0]).to.equal(WETH_WHALE_ADDRESS);
                    expect(ParseWETHNumber(args[1], 2)).to.equal(2.5);
                })
                .and.to.emit(defiContract, "AssetsFinalized")
                .withManuallyValidatedArgs(defiContract, (args) => {
                    expect(args[0]).to.equal(WETH_WHALE_ADDRESS);
                    expect(args[1]).to.equal(weth.address);
                    expect(ParseWETHNumber(args[2], 2)).to.equal(2.5);
                });

            expect(arr[0][0]).to.equal(defiContract.address);
            expect(arr[0][1]).to.equal(wethGenesisPool.address);
            expect(ParseWETHNumber(arr[0][2], 2)).to.equal(2.5);
        });

        it("Using just ETH when in range with round numbers", async () => {
            const ethAmt = 5;

            await publishSupportedTokens();

            const wethWhale = await ethers.provider.getSigner(WETH_WHALE_ADDRESS);
            await weth.connect(wethWhale).approve(defiContract.address, WETHAmount(ethAmt));
            await defiContract.connect(wethWhale).deposit(WETHDeposit(ethAmt), []);

            const tokePrice = 5;

            await publishRates(tokePrice);
            await goToStage3(1, MaxUint256);
            await transferToTreasury();

            const arr = [];

            await expect(defiContract.connect(wethWhale).finalizeAssets(false))
                .to.emit(weth, "Transfer")
                .withManuallyValidatedArgs(weth, (args) => {
                    arr.push(args);
                })
                .and.to.emit(defiContract, "AssetsFinalized")
                .withManuallyValidatedArgs(defiContract, (args) => {
                    expect(args[0].toUpperCase()).to.equal(WETH_WHALE_ADDRESS.toUpperCase());
                    expect(args[1].toUpperCase()).to.equal(weth.address.toUpperCase());
                    expect(ParseWETHNumber(args[2], 2)).to.equal(1.25);
                });

            expect(arr[0][0]).to.equal(defiContract.address);
            expect(arr[0][1]).to.equal(WETH_WHALE_ADDRESS);
            expect(ParseWETHNumber(arr[0][2], 2)).to.equal(1.25);
        });

        it("Using just USDC when in range with round numbers", async () => {
            const usdcBalance = 1500;

            await publishSupportedTokens();

            const usdcWhale = await ethers.provider.getSigner(USDC_WHALE_ADDRESS);
            await usdc.connect(usdcWhale).approve(usdcGenesisPool.address, USDCAmount(usdcBalance));
            await usdc.connect(usdcWhale).approve(defiContract.address, USDCAmount(usdcBalance));
            await defiContract.connect(usdcWhale).deposit(USDCDeposit(usdcBalance), []);

            const tokePrice = 5; //USDC Price = $1

            await publishRates(tokePrice);
            await goToStage3(1, MaxUint256);
            await transferToTreasury();

            const arr = [];

            await expect(defiContract.connect(usdcWhale).finalizeAssets(false))
                .to.emit(usdc, "Transfer")
                .withManuallyValidatedArgs(usdc, (args) => {
                    arr.push(args);
                })
                .and.to.emit(defiContract, "AssetsFinalized")
                .withManuallyValidatedArgs(defiContract, (args) => {
                    expect(args[0].toUpperCase()).to.equal(USDC_WHALE_ADDRESS.toUpperCase());
                    expect(args[1].toUpperCase()).to.equal(usdc.address.toUpperCase());
                    expect(ParseUSDCNumber(args[2], 0)).to.equal(375);
                });

            expect(arr[0][0]).to.equal(defiContract.address);
            expect(arr[0][1]).to.equal(USDC_WHALE_ADDRESS);
            expect(ParseUSDCNumber(arr[0][2], 0)).to.equal(375);
        });

        it("Using just USDC when in range", async () => {
            const usdcBalance = 1500;

            await publishSupportedTokens();

            const usdcWhale = await ethers.provider.getSigner(USDC_WHALE_ADDRESS);
            await usdc.connect(usdcWhale).approve(defiContract.address, USDCAmount(usdcBalance));
            await defiContract.connect(usdcWhale).deposit(USDCDeposit(usdcBalance), []);

            const tokePrice = 8.75;

            await publishRates(tokePrice);
            await goToStage3(1, MaxUint256);
            await transferToTreasury();

            const arr = [];

            await expect(defiContract.connect(usdcWhale).finalizeAssets(false))
                .to.emit(usdc, "Transfer")
                .withManuallyValidatedArgs(usdc, (args) => {
                    arr.push(args);
                })
                .and.to.emit(defiContract, "AssetsFinalized")
                .withManuallyValidatedArgs(defiContract, (args) => {
                    expect(args[0].toUpperCase()).to.equal(USDC_WHALE_ADDRESS.toUpperCase());
                    expect(args[1].toUpperCase()).to.equal(usdc.address.toUpperCase());
                    expect(ParseUSDCNumber(args[2], 0)).to.equal(375);
                });

            expect(arr[0][0]).to.equal(defiContract.address);
            expect(arr[0][1]).to.equal(USDC_WHALE_ADDRESS);
            expect(ParseUSDCNumber(arr[0][2])).to.equal(375);
        });

        it("Using just USDC when in range", async () => {
            const usdcBalance = 1500.234789;

            await publishSupportedTokens();

            const usdcWhale = ethers.provider.getSigner(USDC_WHALE_ADDRESS);
            await usdc.connect(usdcWhale).approve(defiContract.address, USDCAmount(usdcBalance));
            await defiContract.connect(usdcWhale).deposit(USDCDeposit(usdcBalance), []);

            const tokePrice = 8.75; //USDC Price

            await publishRates(tokePrice);
            await goToStage3(1, MaxUint256);
            await transferToTreasury();

            const arr = [];

            await expect(defiContract.connect(usdcWhale).finalizeAssets(false))
                .to.emit(usdc, "Transfer")
                .withManuallyValidatedArgs(usdc, (args) => {
                    arr.push(args);
                })
                .and.to.emit(defiContract, "AssetsFinalized")
                .withManuallyValidatedArgs(defiContract, (args) => {
                    expect(args[0].toUpperCase()).to.equal(USDC_WHALE_ADDRESS.toUpperCase());
                    expect(args[1].toUpperCase()).to.equal(usdc.address.toUpperCase());
                    expect(ParseUSDCNumber(args[2], 6)).to.equal(375.058697);
                });

            expect(arr[0][0]).to.equal(defiContract.address);
            expect(arr[0][1]).to.equal(USDC_WHALE_ADDRESS);
            expect(ParseUSDCNumber(arr[0][2], 6)).to.equal(375.058697);
        });

        it("Using just ETH when over", async () => {
            const ethAmt = 5;

            await publishSupportedTokens();

            const wethWhale = await ethers.provider.getSigner(WETH_WHALE_ADDRESS);
            await weth.connect(wethWhale).approve(defiContract.address, WETHAmount(ethAmt));
            await defiContract.connect(wethWhale).deposit(WETHDeposit(ethAmt), []);

            const tokePrice = 10;

            await publishRates(tokePrice);
            await goToStage3(1.5, MaxUint256); //You get to use 75% of your funds for TOKE
            await transferToTreasury();

            const arr = [];

            await expect(defiContract.connect(wethWhale).finalizeAssets(false))
                .to.emit(weth, "Transfer")
                .withManuallyValidatedArgs(weth, (args) => {
                    arr.push(args);
                })
                .and.to.emit(defiContract, "AssetsFinalized")
                .withManuallyValidatedArgs(defiContract, (args) => {
                    expect(args[0].toUpperCase()).to.equal(WETH_WHALE_ADDRESS.toUpperCase());
                    expect(args[1].toUpperCase()).to.equal(weth.address.toUpperCase());
                    expect(ParseWETHNumber(args[2], 2)).to.equal(1.25);
                });

            expect(arr[0][0]).to.equal(defiContract.address);
            expect(arr[0][1]).to.equal(WETH_WHALE_ADDRESS);
            expect(ParseWETHNumber(arr[0][2], 2)).to.equal(1.25);
        });

        it("Using just USDC when over", async () => {
            const usdcBalance = 5000;

            await publishSupportedTokens();

            const usdcWhale = await ethers.provider.getSigner(USDC_WHALE_ADDRESS);
            usdc.connect(usdcWhale).approve(defiContract.address, USDCAmount(usdcBalance));
            await defiContract.connect(usdcWhale).deposit(USDCDeposit(usdcBalance), []);

            const tokePrice = 10;

            await publishRates(tokePrice);
            await goToStage3(1.5, MaxUint256); //1.5 = 1-((1.5-1)/2) = You get use 75% of your funds for TOKE
            await transferToTreasury();

            const arr = [];

            await expect(defiContract.connect(usdcWhale).finalizeAssets(false))
                .to.emit(usdc, "Transfer")
                .withManuallyValidatedArgs(usdc, (args) => {
                    arr.push(args);
                })
                .and.to.emit(defiContract, "AssetsFinalized")
                .withManuallyValidatedArgs(defiContract, (args) => {
                    expect(args[0].toUpperCase()).to.equal(USDC_WHALE_ADDRESS.toUpperCase());
                    expect(args[1].toUpperCase()).to.equal(usdc.address.toUpperCase());
                    expect(ParseUSDCNumber(args[2], 0)).to.equal(1250);
                });

            expect(arr[0][0]).to.equal(defiContract.address);
            expect(arr[0][1]).to.equal(USDC_WHALE_ADDRESS);
            expect(ParseUSDCNumber(arr[0][2], 0)).to.equal(1250);
        });

        it("Is prevented when transfer to treasury hasn't occured", async () => {
            const usdcBalance = 5000;

            await publishSupportedTokens();

            const usdcWhale = await ethers.provider.getSigner(USDC_WHALE_ADDRESS);
            usdc.connect(usdcWhale).approve(defiContract.address, USDCAmount(usdcBalance));
            await defiContract.connect(usdcWhale).deposit(USDCDeposit(usdcBalance), []);

            const tokePrice = 10;

            await publishRates(tokePrice);
            await goToStage3(1.5, MaxUint256); //1.5 = 1-((1.5-1)/2) = You get use 75% of your funds for TOKE

            await expect(defiContract.connect(usdcWhale).finalizeAssets(false)).to.be.revertedWith("NOT_SYSTEM_FINAL");
        });
    });

    it("Can submit ETH but get WETH during withdraw", async () => {
        //ETH to WETH
        const ethAmount = 4.7;

        await publishSupportedTokens();

        const wethWhale = await ethers.provider.getSigner(WETH_WHALE_ADDRESS);

        const whaleEthBalanceBeforeDeposit = await ethers.provider.getBalance(WETH_WHALE_ADDRESS);

        const contractBalanceBefore = await weth.connect(user1).balanceOf(defiContract.address);

        const depositResult = await defiContract.connect(wethWhale).deposit(WETHDeposit(ethAmount), [], {
            value: WETHAmount(ethAmount),
        });
        const depositReceipt = await ethers.provider.getTransactionReceipt(depositResult.hash);
        const depositGasUsed = depositReceipt.gasUsed;

        const contractBalanceAfter = await weth.connect(user1).balanceOf(defiContract.address);

        expect(ParseWETHNumber(contractBalanceAfter.sub(contractBalanceBefore), 1)).to.equal(ethAmount);

        const tokePrice = 10;

        await publishRates(tokePrice);

        const whaleWethBalanceBeforeWithdraw = await weth.connect(user1).balanceOf(WETH_WHALE_ADDRESS);

        const withdrawResult = await defiContract.connect(wethWhale).withdraw(WETHDeposit(ethAmount), false);
        const withdrawReceipt = await ethers.provider.getTransactionReceipt(withdrawResult.hash);
        const withdrawGasUsed = withdrawReceipt.gasUsed;

        const whaleEthBalanceAfterWithdraw = await ethers.provider.getBalance(WETH_WHALE_ADDRESS);
        const whatlWethBalanceAfterWithdraw = await weth.connect(user1).balanceOf(WETH_WHALE_ADDRESS);

        //Confirm withdraw didn't go back as ETH
        expect(whaleEthBalanceBeforeDeposit.sub(WETHAmount(ethAmount))).to.be.equal(
            whaleEthBalanceAfterWithdraw
                .add(depositGasUsed.mul(depositResult.gasPrice))
                .add(withdrawGasUsed.mul(withdrawResult.gasPrice))
        );

        //Confirm withdraw increased WETH balance by amount
        expect(whaleWethBalanceBeforeWithdraw.add(WETHAmount(ethAmount))).to.be.equal(whatlWethBalanceAfterWithdraw);
    });

    describe("Full Cycle", () => {
        it("Funds end up in treasury when in range", async () => {
            const ethAmount = 4.7;
            const daiAmount = 1000;

            //Setup, Stage 1
            await publishSupportedTokens();

            const wethWhale = await ethers.provider.getSigner(WETH_WHALE_ADDRESS);
            const daiWhale = await ethers.provider.getSigner(DAI_WHALE_ADDRESS);

            //Approvals
            await weth.connect(wethWhale).approve(defiContract.address, WETHAmount(ethAmount));
            await dai.connect(daiWhale).approve(defiContract.address, DAIAmount(daiAmount));

            //User Deposits
            await defiContract.connect(wethWhale).deposit(WETHDeposit(ethAmount), []);
            await defiContract.connect(daiWhale).deposit(DAIDeposit(daiAmount), []);

            //Go to Stage 2
            const tokePrice = 10;
            await publishRates(tokePrice, 0, 0, 0, 1); //In Range, Last Look is 2 blocks

            //One user withdraws some funds
            await defiContract.connect(wethWhale).withdraw(WETHDeposit(2), false);

            //Go to Stage 3
            await goToStage3();

            await defiContract.connect(deployer).transferToTreasury();

            const wethTreasuryBalance = await weth.connect(treasury.address).balanceOf(treasury.address);
            const daiTreasuryBalance = await dai.connect(treasury.address).balanceOf(treasury.address);

            expect(wethTreasuryBalance).to.be.equal(WETHAmount(2.7));
            expect(daiTreasuryBalance).to.be.equal(DAIAmount(daiAmount));
        });

        it("Funds end up in treasury when oversubscribed", async () => {
            const ethAmount = 4.7;
            const daiAmount = 1000;

            //Setup, Stage 1
            await publishSupportedTokens();

            const wethWhale = await ethers.provider.getSigner(WETH_WHALE_ADDRESS);
            const daiWhale = await ethers.provider.getSigner(DAI_WHALE_ADDRESS);

            //Approvals
            await weth.connect(wethWhale).approve(defiContract.address, WETHAmount(ethAmount));
            await dai.connect(daiWhale).approve(defiContract.address, DAIAmount(daiAmount));

            //User Deposits
            await defiContract.connect(wethWhale).deposit(WETHDeposit(ethAmount), []);
            await defiContract.connect(daiWhale).deposit(DAIDeposit(daiAmount), []);

            //Go to Stage 2
            const tokePrice = 10;
            await publishRates(tokePrice, 0, 0, 0, 1.5); //In Range, Last Look is 2 blocks

            //One user withdraws some funds
            await defiContract.connect(wethWhale).withdraw(WETHDeposit(2), false);

            //Go to Stage 3
            await goToStage3();

            await defiContract.connect(deployer).transferToTreasury();

            const wethTreasuryBalance = await weth.connect(treasury.address).balanceOf(treasury.address);
            const daiTreasuryBalance = await dai.connect(treasury.address).balanceOf(treasury.address);

            expect(wethTreasuryBalance).to.be.equal(WETHAmount(2.025)); //2.7 left, 75% towards TOKE
            expect(daiTreasuryBalance).to.be.equal(DAIAmount(750));
        });
    });

    const transferToTreasury = async () => {
        await defiContract.connect(deployer).transferToTreasury();
    };

    const goToStage3 = async () => {
        //Default block duration is 2
        await timeMachine.advanceBlock();
        await timeMachine.advanceBlock();
        await timeMachine.advanceBlock();
    };

    const publishSupportedTokens = async (wethLimit = 0, daiLimit = 0, usdcLimit = 0) => {
        await defiContract.connect(deployer).addSupportedTokens([
            [weth.address, wethOracle.address, wethGenesisPool.address, WETHAmount(wethLimit || defaultWethLimit)],
            [dai.address, daiOracle.address, daiGenesisPool.address, DAIAmount(daiLimit || defaultDaiLimit)],
            [usdc.address, usdcOracle.address, usdcGenesisPool.address, USDCAmount(usdcLimit || defaultUsdcLimit)],
        ]);
    };

    const calculateTokeRate = (numerator, tokePrice) => {
        const toke = decimalToFraction(tokePrice);
        const assetPrice = decimalToFraction(numerator);
        return {
            numerator: BN.from(assetPrice.bottom.toString()).mul(BN.from(toke.top.toString())),
            demoninator: BN.from(assetPrice.top.toString()).mul(BN.from(toke.bottom.toString())),
        };
    };

    const publishRates = async (usdTokePrice, ethPriceArg, daiPriceArg, usdcPriceArg, pctOver, lastLookDuration) => {
        const wethRoundData = await wethOracle.connect(user1).latestRoundData();
        const daiRoundData = await daiOracle.connect(user1).latestRoundData();
        const usdcRoundData = await usdcOracle.connect(user1).latestRoundData();

        const ethPrice = ethPriceArg || Number(wethRoundData[1]);
        const daiPrice = daiPriceArg || Number(daiRoundData[1]);
        const usdcPrice = usdcPriceArg || Number(usdcRoundData[1]);

        const wethRate = calculateTokeRate(ethPrice, usdTokePrice);
        const daiRate = calculateTokeRate(daiPrice, usdTokePrice);
        const usdcRate = calculateTokeRate(usdcPrice, usdTokePrice);

        let pct = pctOver || defaultOversubPct;
        let duration = lastLookDuration || defaultLastLookDuration;
        const rate = decimalToFraction(1 - (pct - 1) / 2);

        await defiContract.connect(deployer).publishRates(
            [
                //Numerator needs to be in asset precision, demoniator needs to be in TOKE precision
                [
                    WETH_ADDRESS,
                    increaseBNPrecision(wethRate.numerator, 18),
                    increaseBNPrecision(wethRate.demoninator, 18),
                ],
                [DAI_ADDRESS, increaseBNPrecision(daiRate.numerator, 18), increaseBNPrecision(daiRate.demoninator, 18)],
                [
                    USDC_ADDRESS,
                    increaseBNPrecision(usdcRate.numerator, 6),
                    increaseBNPrecision(usdcRate.demoninator, 18),
                ],
            ],
            [BN.from(rate.top), BN.from(rate.bottom)],
            duration
        );
    };

    const increaseBNPrecision = (bn, precision) => {
        return bn.mul(BN.from("10").pow(precision));
    };

    const gcd = (a, b) => {
        return b ? gcd(b, a % b) : a;
    };

    const decimalToFraction = (_decimal) => {
        if (_decimal == parseInt(_decimal)) {
            return {
                top: parseInt(_decimal),
                bottom: 1,
                display: parseInt(_decimal) + "/" + 1,
            };
        } else {
            var top = _decimal.toString().includes(".") ? _decimal.toString().replace(/\d+[.]/, "") : 0;
            var bottom = Math.pow(10, top.toString().replace("-", "").length);
            if (_decimal >= 1) {
                top = +top + Math.floor(_decimal) * bottom;
            } else if (_decimal <= -1) {
                top = +top + Math.ceil(_decimal) * bottom;
            }

            var x = Math.abs(gcd(top, bottom));
            return {
                top: top / x,
                bottom: bottom / x,
            };
        }
    };
});
