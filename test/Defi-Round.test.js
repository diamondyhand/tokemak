const {expect, Assertion} = require("chai");
const timeMachine = require("ganache-time-traveler");
const {artifacts, ethers, waffle} = require("hardhat");
const {deployMockContract} = waffle;
const ERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/ERC20.sol");
const chainlink = artifacts.require("@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol");
const pool = artifacts.require("Pool");
const BN = ethers.BigNumber;
const {getRoot, getProof, MerkleTree} = require("@airswap/merkle");

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
    let user2;
    let treasury;

    let weth;
    let dai;
    let usdc;
    let tokeToken;

    let wethOracle;
    let daiOracle;
    let usdcOracle;

    let wethGenesisPool;
    let daiGenesisPool;
    let usdcGenesisPool;

    const defaulUsdValueOfEth = 4020.15;
    const defaulUsdValueOfDai = 0.99;
    const defaulUsdValueOfUsdc = 1.0;

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
        [deployer, user1, user2] = await ethers.getSigners();
        weth = await deployMockContract(deployer, ERC20.abi);
        treasury = await deployMockContract(deployer, ERC20.abi);

        const DefiRoundFactory = await ethers.getContractFactory("DefiRound");
        defiContract = await DefiRoundFactory.deploy(weth.address, treasury.address, maxTotalValue.toString());

        tokeToken = await deployMockContract(deployer, ERC20.abi);

        wethOracle = await deployMockContract(deployer, chainlink.abi);
        await weth.mock.decimals.returns(18);

        dai = await deployMockContract(deployer, ERC20.abi);
        daiOracle = await deployMockContract(deployer, chainlink.abi);
        await dai.mock.decimals.returns(18);

        usdc = await deployMockContract(deployer, ERC20.abi);
        usdcOracle = await deployMockContract(deployer, chainlink.abi);
        await usdc.mock.decimals.returns(6);

        wethGenesisPool = await deployMockContract(deployer, pool.abi);
        daiGenesisPool = await deployMockContract(deployer, pool.abi);
        usdcGenesisPool = await deployMockContract(deployer, pool.abi);
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
        return [weth.address, WETHAmount(number)];
    };
    const DAIDeposit = (number) => {
        return [dai.address, DAIAmount(number)];
    };
    const USDCDeposit = (number) => {
        return [usdc.address, USDCAmount(number)];
    };
    const USDValue = (number) => {
        return ethers.utils.parseUnits(number.toString(), 8);
    };
    const ParseTokeRate = (number, ratePrecision, precision) => {
        return Number(
            Number(
                ethers.utils.formatUnits(number[1].mul(BN.from("10").pow(18)).div(number[2]), ratePrecision).toString()
            ).toFixed(precision)
        );
    };
    const ParseUsdRate = (number, precision) => {
        return Number(Number(ethers.utils.formatUnits(number.toString(), 8)).toFixed(precision));
    };
    const ParseTokeValue = (number, precision) => {
        return Number(Number(ethers.utils.formatUnits(number.toString(), 18)).toFixed(precision));
    };
    const ParseWethValue = (number, precision) => {
        return Number(Number(ethers.utils.formatUnits(number.toString(), 18)).toFixed(precision));
    };
    // const ParseUsdcValue = (number, precision) => {
    //   return Number(
    //     Number(ethers.utils.formatUnits(number.toString(), 6)).toFixed(precision)
    //   );
    // };
    const SetUSDValuesOfTheTokens = async (ethAmount, daiAmount, usdcAmount) => {
        await wethOracle.mock.latestRoundData.returns(0, USDValue(ethAmount), 0, 0, 0);
        await daiOracle.mock.latestRoundData.returns(0, USDValue(daiAmount), 0, 0, 0);
        await usdcOracle.mock.latestRoundData.returns(0, USDValue(usdcAmount), 0, 0, 0);
    };

    const maxTotalValue = USDValue(60000000);

    describe("Publish Rates", async () => {
        it("Accepts and returns data when in range", async () => {
            const tokePrice = 5;

            await publishSupportedTokens();
            await publishRates(tokePrice, 10, 1, 1);
            const rates = await defiContract.connect(deployer).getRates([weth.address, dai.address, usdc.address]);

            expect(rates.length).to.equal(3);
            expect(ParseTokeRate(rates[0], 18, 1)).to.equal(0.5);
            expect(ParseTokeRate(rates[1], 18, 0)).to.equal(5);
            expect(ParseTokeRate(rates[2], 6, 0)).to.equal(5);
        });

        it("Accepts and returns data when in range with 2 precision TOKE price", async () => {
            const tokePrice = 5.25;

            await publishSupportedTokens();
            await publishRates(tokePrice, 49.875, 1, 2);
            const rates = await defiContract.connect(deployer).getRates([weth.address, dai.address, usdc.address]);

            expect(rates.length).to.equal(3);
            expect(ParseTokeRate(rates[0], 18, 8)).to.equal(0.10526316);
            expect(ParseTokeRate(rates[1], 18, 2)).to.equal(5.25);
            expect(ParseTokeRate(rates[2], 6, 3)).to.equal(2.625);
        });

        it("Accepts and returns data when in range with 8 precision TOKE price", async () => {
            const tokePrice = 5.25781243;

            await publishSupportedTokens();
            await publishRates(tokePrice, 49.87511178, 0.99999999, 1.01);
            const rates = await defiContract.connect(deployer).getRates([weth.address, dai.address, usdc.address]);

            expect(rates.length).to.equal(3);
            expect(ParseTokeRate(rates[0], 18, 8)).to.equal(0.10541956);
            expect(ParseTokeRate(rates[1], 18, 8)).to.equal(5.25781248);
            expect(ParseTokeRate(rates[2], 6, 6)).to.equal(5.205754); //Rate can only be as precise as the least precise token
        });

        it("Accepts and returns data when min subscribed", async () => {
            const tokePrice = 2;

            await publishSupportedTokens();
            await publishRates(tokePrice, 10, 1, 1);
            const rates = await defiContract.connect(deployer).getRates([weth.address, dai.address, usdc.address]);

            expect(rates.length).to.equal(3);
            expect(ParseTokeRate(rates[0], 18, 1)).to.equal(0.2);
            expect(ParseTokeRate(rates[1], 18, 0)).to.equal(2);
            expect(ParseTokeRate(rates[2], 6, 0)).to.equal(2);
        });

        it("Accepts and returns data when max subscribed", async () => {
            const tokePrice = 10;

            await publishSupportedTokens();
            await publishRates(tokePrice, 10, 2, 1);
            const rates = await defiContract.connect(deployer).getRates([weth.address, dai.address, usdc.address]);

            expect(rates.length).to.equal(3);
            expect(ParseTokeRate(rates[0], 18, 0)).to.equal(1);
            expect(ParseTokeRate(rates[1], 18, 0)).to.equal(5);
            expect(ParseTokeRate(rates[2], 6, 0)).to.equal(10);
        });

        it("Emits a RatesPublished event", async () => {
            await publishSupportedTokens();
            expect(
                await defiContract.connect(deployer).publishRates(
                    [
                        [weth.address, 1, 3],
                        [dai.address, 1, 3],
                        [usdc.address, 1, 3],
                    ],
                    [1, 1],
                    1
                )
            ).to.emit(defiContract, "RatesPublished");
        });
    });

    describe("Deposit", async () => {
        it("With ETH only calculates correct account value", async () => {
            const ethAmt = 5;

            await weth.mock.balanceOf.returns(WETHAmount(ethAmt));
            await weth.mock.transfer.returns(true);
            await weth.mock.transferFrom.returns(true);
            await dai.mock.balanceOf.returns(0);
            await usdc.mock.balanceOf.returns(0);

            await publishSupportedTokens();
            await SetUSDValuesOfTheTokens(1000, defaulUsdValueOfDai, defaulUsdValueOfUsdc);
            await defiContract.connect(user1).deposit(WETHDeposit(ethAmt), []);

            const value = await defiContract.connect(user1).accountBalance(user1.address);

            expect(ParseUsdRate(value, 0)).to.equal(5000);
        });

        it("With DAI only calculates correct account value", async () => {
            const daiAmt = 1505.99;

            await weth.mock.balanceOf.returns(0);
            await dai.mock.balanceOf.returns(DAIAmount(daiAmt));
            await dai.mock.transfer.returns(true);
            await dai.mock.transferFrom.returns(true);
            await usdc.mock.balanceOf.returns(0);

            await publishSupportedTokens();
            await SetUSDValuesOfTheTokens(1000, 0.99999999, defaulUsdValueOfUsdc);
            await defiContract.connect(user1).deposit(DAIDeposit(daiAmt), []);

            const value = await defiContract.connect(user1).accountBalance(user1.address);

            expect(ParseUsdRate(value, 8)).to.equal(1505.98998494);
        });

        it("With USDC only calculates correct account value", async () => {
            const amt = 1505.736398;

            await weth.mock.balanceOf.returns(0);
            await dai.mock.balanceOf.returns(0);
            await usdc.mock.balanceOf.returns(USDCAmount(amt));
            await usdc.mock.transfer.returns(true);
            await usdc.mock.transferFrom.returns(true);

            await publishSupportedTokens();
            await SetUSDValuesOfTheTokens(1000, 1, 1.01272948);
            await defiContract.connect(user1).deposit(USDCDeposit(amt), []);

            const value = await defiContract.connect(user1).accountBalance(user1.address);

            expect(ParseUsdRate(value, 8)).to.equal(1524.90363936);
        });

        it("Should emit a Deposited event", async () => {
            const ethAmt = 2.23;
            const daiAmt = 1209.45;
            const usdcAmt = 2376.19;

            await weth.mock.balanceOf.returns(WETHAmount(ethAmt));
            await weth.mock.transfer.returns(true);
            await weth.mock.transferFrom.returns(true);
            await dai.mock.balanceOf.returns(DAIAmount(daiAmt));
            await dai.mock.transfer.returns(true);
            await dai.mock.transferFrom.returns(true);
            await usdc.mock.balanceOf.returns(USDCAmount(usdcAmt));
            await usdc.mock.transfer.returns(true);
            await usdc.mock.transferFrom.returns(true);

            await publishSupportedTokens();
            await SetUSDValuesOfTheTokens(3457.21, 1.01, 0.97);
            expect(await defiContract.connect(deployer).deposit(USDCDeposit(usdcAmt), [])).to.emit(
                defiContract,
                "Deposited"
            );
        });

        it("Should revert when attempting to withdraw 0 tokens", async () => {
            await weth.mock.balanceOf.returns(0);
            await weth.mock.transferFrom.returns(true);

            await publishSupportedTokens();
            await SetUSDValuesOfTheTokens(defaulUsdValueOfEth, defaulUsdValueOfUsdc, defaulUsdValueOfDai);

            await publishRates(5);

            await expect(defiContract.connect(user1).withdraw([weth.address, 0], false)).to.be.revertedWith(
                "INVALID_AMOUNT"
            );
        });

        it("Should allow user to withdraw deposited tokens", async () => {
            const ethAmt = 1.5;

            await weth.mock.balanceOf.returns(WETHAmount(ethAmt));
            await weth.mock.transferFrom.returns(true);
            await weth.mock.transfer.returns(true);
            await dai.mock.balanceOf.returns(0);
            await usdc.mock.balanceOf.returns(0);

            await publishSupportedTokens();
            await SetUSDValuesOfTheTokens(defaulUsdValueOfEth, defaulUsdValueOfUsdc, defaulUsdValueOfDai);

            await defiContract.connect(user1).deposit(WETHDeposit(ethAmt), []);

            await publishRates(2);

            const value = await defiContract.connect(user1).accountBalance(user1.address);

            expect(ParseUsdRate(value, 3)).to.equal(ethAmt * defaulUsdValueOfEth);

            await defiContract.connect(user1).withdraw(WETHDeposit(ethAmt), false);

            const valueAfterWithdraw = await defiContract.connect(user1).accountBalance(user1.address);

            expect(ParseUsdRate(valueAfterWithdraw, 3)).to.equal(0);
        });

        it("Should allow for a partial withdrawal", async () => {});

        it("Should allow for a withdrawal in Eth instead of WETH", async () => {});
    });

    describe("Withdraw", () => {
        it("Should revert when in stage 1", async () => {
            const ethAmt = 3;

            await weth.mock.transferFrom.returns(true);
            await weth.mock.balanceOf.returns(WETHAmount(ethAmt));

            await publishSupportedTokens();
            await SetUSDValuesOfTheTokens(defaulUsdValueOfEth, defaulUsdValueOfUsdc, defaulUsdValueOfDai);

            await expect(defiContract.connect(user1).withdraw(WETHDeposit(ethAmt), false)).to.be.revertedWith(
                "WITHDRAWS_NOT_ACCEPTED"
            );
        });

        it("Should revert when an unsupported token is claimed", async () => {
            const ethAmt = 3;

            await weth.mock.transferFrom.returns(true);

            await weth.mock.balanceOf.returns(WETHAmount(ethAmt));

            await publishSupportedTokens();
            await SetUSDValuesOfTheTokens(defaulUsdValueOfEth, defaulUsdValueOfUsdc, defaulUsdValueOfDai);

            await publishRates(5);

            await expect(defiContract.connect(user1).withdraw([tokeToken.address, 1], false)).to.be.revertedWith(
                "UNSUPPORTED_TOKEN"
            );
        });

        it("Should revert when attempting to withdraw 0 tokens", async () => {
            await weth.mock.balanceOf.returns(0);
            await weth.mock.transferFrom.returns(true);

            await publishSupportedTokens();
            await SetUSDValuesOfTheTokens(defaulUsdValueOfEth, defaulUsdValueOfUsdc, defaulUsdValueOfDai);

            await publishRates(5);

            await expect(defiContract.connect(user1).withdraw([weth.address, 0], false)).to.be.revertedWith(
                "INVALID_AMOUNT"
            );
        });

        it("should revert when a user withdraws more than their balance", async () => {
            const daiAmt = 1123.3;

            await dai.mock.balanceOf.returns(DAIAmount(daiAmt));
            await dai.mock.transfer.returns(true);
            await dai.mock.transferFrom.returns(true);
            await weth.mock.balanceOf.returns(0);
            await usdc.mock.balanceOf.returns(0);

            await publishSupportedTokens();
            await SetUSDValuesOfTheTokens(defaulUsdValueOfEth, defaulUsdValueOfUsdc, defaulUsdValueOfDai);

            await defiContract.connect(user1).deposit(DAIDeposit(daiAmt), []);

            await publishRates(5);

            await expect(defiContract.connect(user1).withdraw(DAIDeposit(2000), false)).to.be.revertedWith(
                "SafeMath: subtraction overflow"
            );
        });

        it("Should allow user to withdraw deposited tokens", async () => {
            const ethAmt = 1.5;

            await weth.mock.balanceOf.returns(WETHAmount(ethAmt));
            await weth.mock.transferFrom.returns(true);
            await weth.mock.transfer.returns(true);
            await dai.mock.balanceOf.returns(0);
            await usdc.mock.balanceOf.returns(0);

            await publishSupportedTokens();
            await SetUSDValuesOfTheTokens(defaulUsdValueOfEth, defaulUsdValueOfUsdc, defaulUsdValueOfDai);

            await defiContract.connect(user1).deposit(WETHDeposit(ethAmt), []);

            await publishRates(2);

            const value = await defiContract.connect(user1).accountBalance(user1.address);

            expect(ParseUsdRate(value, 3)).to.equal(ethAmt * defaulUsdValueOfEth);

            await defiContract.connect(user1).withdraw(WETHDeposit(ethAmt), false);

            const valueAfterWithdraw = await defiContract.connect(user1).accountBalance(user1.address);

            expect(ParseUsdRate(valueAfterWithdraw, 3)).to.equal(0);
        });

        it("Should allow for a partial withdrawal", async () => {
            const usdcAmt = 1234.5;
            const userWithdrawal = 100;

            await usdc.mock.balanceOf.returns(USDCAmount(usdcAmt));
            await usdc.mock.transferFrom.returns(true);
            await usdc.mock.transfer.returns(true);
            await dai.mock.balanceOf.returns(0);
            await weth.mock.balanceOf.returns(0);

            await publishSupportedTokens();
            await SetUSDValuesOfTheTokens(defaulUsdValueOfEth, defaulUsdValueOfUsdc, defaulUsdValueOfDai);

            await defiContract.connect(user1).deposit(USDCDeposit(usdcAmt), []);

            await publishRates(4);

            await defiContract.connect(user1).withdraw(USDCDeposit(userWithdrawal), false);

            const value = await defiContract.connect(user1).accountBalance(user1.address);

            expect(ParseUsdRate(value, 3)).to.equal(usdcAmt - userWithdrawal);
        });

        it("Should not allow you to deposit one token and withdraw another", async () => {
            const usdcAmt = 1234.5;

            await usdc.mock.balanceOf.returns(USDCAmount(usdcAmt));
            await usdc.mock.transferFrom.returns(true);
            await usdc.mock.transfer.returns(true);
            await dai.mock.balanceOf.returns(0);
            await weth.mock.balanceOf.returns(0);

            await publishSupportedTokens();
            await SetUSDValuesOfTheTokens(defaulUsdValueOfEth, defaulUsdValueOfUsdc, defaulUsdValueOfDai);

            await defiContract.connect(user1).deposit(USDCDeposit(usdcAmt), []);

            await publishRates(4);

            await expect(defiContract.connect(user1).withdraw(WETHDeposit(usdcAmt), false)).to.be.revertedWith(
                "INVALID_TOKEN"
            );
        });
    });

    describe("Get Total Value", async () => {
        it("Calculates when only single coin deposited", async () => {
            const usdcBalance = 1500;
            const usdcValue = 1;

            await weth.mock.balanceOf.returns(0);
            await dai.mock.balanceOf.returns(0);
            await usdc.mock.balanceOf.returns(USDCAmount(usdcBalance));
            await usdc.mock.transfer.returns(true);
            await usdc.mock.transferFrom.returns(true);

            await publishSupportedTokens();
            await SetUSDValuesOfTheTokens(defaulUsdValueOfEth, defaulUsdValueOfDai, usdcValue);
            await defiContract.connect(user1).deposit(USDCDeposit(usdcBalance), []);

            const totalValue = await defiContract.connect(user1).totalValue();

            expect(ParseUsdRate(totalValue, 8)).to.equal(1500);
        });
    });

    //Going to Stage 3. Purpose of this changed, need to see what is still relevant

    describe("Going to Stage 2", async () => {
        it("fails when called by not owner", async () => {
            // pass in dummy data
            await expect(defiContract.connect(user1).publishRates([], [1, 1], 1)).to.be.revertedWith(
                "caller is not the owner"
            );
        });

        it("fails if last look duration has not passed", async () => {
            await expect(defiContract.connect(deployer).publishRates([], [1, 1], 0)).to.be.revertedWith(
                "INVALID_DURATION"
            );
        });

        it("fails if overNumerator is not greater than 0", async () => {
            await expect(defiContract.connect(deployer).publishRates([], [0, 1], 2)).to.be.revertedWith(
                "INVALID_NUMERATOR"
            );
        });

        it("fails if overdenominator is not greater than 0", async () => {
            await expect(defiContract.connect(deployer).publishRates([], [1, 0], 2)).to.be.revertedWith(
                "INVALID_DENOMINATOR"
            );
        });

        it("passes if all conditions are satisfied", async () => {
            await defiContract.connect(deployer).publishRates([], [2, 3], 2);
            const block = await ethers.provider.getBlock();

            const currentStage = await defiContract.currentStage();
            const lastLookExpiration = await defiContract.lastLookExpiration();
            const [overNumerator, overDenominator] = await defiContract.overSubscriptionRate();

            expect(currentStage).to.equal(1);
            expect(lastLookExpiration).to.equal(block.number + 2);
            expect(overNumerator).to.equal(2);
            expect(overDenominator).to.equal(3);
        });

        it("emits a RatesPublished event", async () => {
            expect(await defiContract.connect(deployer).publishRates([], [1, 1], 2)).to.emit(
                defiContract,
                "RatesPublished"
            );
        });
    });

    describe("Get Account Data", async () => {
        beforeEach(async () => {
            await publishSupportedTokens();
        });
        it("correctly fetches account data if there was never any deposit", async () => {
            const accountData = await defiContract.connect(user1).getAccountData(user1.address);
            expect(accountData.length).to.equal(3);
            expect(accountData[0].token).to.equal(weth.address);
            expect(accountData[1].token).to.equal(dai.address);
            expect(accountData[2].token).to.equal(usdc.address);
        });

        it("correctly fetches account data amongst all deposits", async () => {
            // the balance of the contract is 0
            await dai.mock.transferFrom.returns(true);
            await dai.mock.balanceOf.returns(0);

            await usdc.mock.transferFrom.returns(true);
            await usdc.mock.balanceOf.returns(0);

            await weth.mock.transferFrom.returns(true);
            await weth.mock.balanceOf.returns(0);

            // Every token is worth $1
            await SetUSDValuesOfTheTokens(1, 1, 1);

            // token deposit value is >= minIndividualValue
            await defiContract.connect(user1).deposit(WETHDeposit(defaultWethLimit), []);

            const tokens = await defiContract.connect(user1).getAccountData(user1.address);
            expect(tokens.length).to.equal(3);
            expect(tokens[0].token).to.equal(weth.address);
            expect(tokens[0].initialDeposit).to.equal(WETHAmount(defaultWethLimit));
            expect(tokens[0].currentBalance).to.equal(WETHAmount(defaultWethLimit));
            expect(tokens[1].token).to.equal(dai.address);
            expect(tokens[2].token).to.equal(usdc.address);
        });
        it("Returns even when rates not published", async () => {
            const ethAmt = 1.55;
            const daiAmt = 100;
            const usdcAmt = 200;

            await weth.mock.balanceOf.returns(WETHAmount(ethAmt));
            await weth.mock.transfer.returns(true);
            await weth.mock.transferFrom.returns(true);
            await dai.mock.balanceOf.returns(DAIAmount(daiAmt));
            await dai.mock.transfer.returns(true);
            await dai.mock.transferFrom.returns(true);
            await usdc.mock.balanceOf.returns(USDCAmount(usdcAmt));
            await usdc.mock.transfer.returns(true);
            await usdc.mock.transferFrom.returns(true);

            await SetUSDValuesOfTheTokens(defaulUsdValueOfEth, defaulUsdValueOfDai, defaulUsdValueOfUsdc);
            await defiContract.connect(user1).deposit(WETHDeposit(ethAmt), []);

            const tokePrice = 10;

            await publishRates(tokePrice);

            const accountData = await defiContract.connect(user1).getAccountData(user1.address);
            expect(accountData[0].token).to.be.equal(weth.address);
            expect(ParseWethValue(accountData[0].currentBalance, 2)).to.be.equal(ethAmt);

            expect(accountData[1].token).to.be.equal(dai.address);

            expect(accountData[2].token).to.be.equal(usdc.address);
        });

        it("Returns effective/ineffective amounts after rates are published", async () => {
            const ethAmt = 1.55;
            const daiAmt = 100;
            const usdcAmt = 200;

            await weth.mock.balanceOf.returns(WETHAmount(ethAmt));
            await weth.mock.transfer.returns(true);
            await weth.mock.transferFrom.returns(true);
            await dai.mock.balanceOf.returns(DAIAmount(daiAmt));
            await dai.mock.transfer.returns(true);
            await dai.mock.transferFrom.returns(true);
            await usdc.mock.balanceOf.returns(USDCAmount(usdcAmt));
            await usdc.mock.transfer.returns(true);
            await usdc.mock.transferFrom.returns(true);

            await SetUSDValuesOfTheTokens(defaulUsdValueOfEth, defaulUsdValueOfDai, defaulUsdValueOfUsdc);
            await defiContract.connect(user1).deposit(WETHDeposit(ethAmt), []);

            const tokePrice = 10;

            await publishRates(tokePrice, 0, 0, 0, 1.5);

            const accountData = await defiContract.connect(user1).getAccountData(user1.address);
            expect(accountData[0].token).to.be.equal(weth.address);
            expect(ParseWethValue(accountData[0].currentBalance, 2)).to.be.equal(ethAmt);
            expect(ParseWethValue(accountData[0].effectiveAmt, 4)).to.be.equal(1.1625);
            expect(ParseWethValue(accountData[0].ineffectiveAmt, 4)).to.be.equal(0.3875);
            expect(ParseTokeValue(accountData[0].actualTokeReceived, 7)).to.be.equal(467.3424375);
        });
    });

    describe("Whitelist", async () => {
        beforeEach(async () => {
            await publishSupportedTokens();
        });
        it("Allows included user to deposit", async () => {
            const ethAmt = 1.55;

            await weth.mock.balanceOf.returns(WETHAmount(ethAmt));
            await weth.mock.transfer.returns(true);
            await weth.mock.transferFrom.returns(true);
            await dai.mock.balanceOf.returns(0);
            await usdc.mock.balanceOf.returns(0);

            await SetUSDValuesOfTheTokens(defaulUsdValueOfEth, defaulUsdValueOfDai, defaulUsdValueOfUsdc);

            const tree = new MerkleTree([ethers.utils.keccak256(user1.address)]);
            const root = getRoot(tree);
            await defiContract.connect(deployer).configureWhitelist([true, root]);
            const proof = getProof(tree, ethers.utils.keccak256(user1.address));

            await defiContract.connect(user1).deposit(WETHDeposit(ethAmt), proof);
        });
        it("Blocks someone from using anothers proof", async () => {
            const ethAmt = 1.55;

            await weth.mock.balanceOf.returns(WETHAmount(ethAmt));
            await weth.mock.transfer.returns(true);
            await weth.mock.transferFrom.returns(true);
            await dai.mock.balanceOf.returns(0);
            await usdc.mock.balanceOf.returns(0);

            await SetUSDValuesOfTheTokens(defaulUsdValueOfEth, defaulUsdValueOfDai, defaulUsdValueOfUsdc);

            const user1Tree = new MerkleTree([ethers.utils.keccak256(user1.address)]);
            const user1Root = getRoot(user1Tree);
            await defiContract.connect(deployer).configureWhitelist([true, user1Root]);
            const user1Proof = getProof(user1Tree, ethers.utils.keccak256(user1.address));

            await expect(defiContract.connect(user2).deposit(WETHDeposit(ethAmt), user1Proof)).to.be.revertedWith(
                "PROOF_INVALID"
            );
        });
        it("Disabled whitelist check lets anyone through", async () => {
            const ethAmt = 1.55;

            await weth.mock.balanceOf.returns(WETHAmount(ethAmt));
            await weth.mock.transfer.returns(true);
            await weth.mock.transferFrom.returns(true);
            await dai.mock.balanceOf.returns(0);
            await usdc.mock.balanceOf.returns(0);

            await SetUSDValuesOfTheTokens(defaulUsdValueOfEth, defaulUsdValueOfDai, defaulUsdValueOfUsdc);

            const user1Tree = new MerkleTree([ethers.utils.keccak256(user1.address)]);
            const user1Root = getRoot(user1Tree);
            await defiContract.connect(deployer).configureWhitelist([false, user1Root]);
            const user1Proof = getProof(user1Tree, ethers.utils.keccak256(user1.address));

            await expect(defiContract.connect(user2).deposit(WETHDeposit(ethAmt), user1Proof)).to.be.not.revertedWith(
                "ROOT_NOT_ENABLED"
            );
        });
    });

    describe("Adding Supported Tokens", async () => {
        let wethSupportedTokenData;
        let daiSupportedTokenData;
        let usdcSupportedTokenData;
        let supportedTokenArray;

        before(async () => {
            wethSupportedTokenData = {
                token: weth.address,
                oracle: wethOracle.address,
                genesis: wethGenesisPool.address,
                maxLimit: WETHAmount(35),
            };

            daiSupportedTokenData = {
                token: dai.address,
                oracle: daiOracle.address,
                genesis: daiGenesisPool.address,
                maxLimit: DAIAmount(100000),
            };

            usdcSupportedTokenData = {
                token: usdc.address,
                oracle: usdcOracle.address,
                genesis: usdcGenesisPool.address,
                maxLimit: USDCAmount(100000),
            };

            supportedTokenArray = [wethSupportedTokenData, daiSupportedTokenData, usdcSupportedTokenData];
        });

        it("Should not allow another user to add a supported token", async () => {
            await expect(defiContract.connect(user1).addSupportedTokens(supportedTokenArray)).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });

        it("Should allow deployer to add supported tokens", async () => {
            await expect(defiContract.connect(deployer).addSupportedTokens(supportedTokenArray)).to.not.be.reverted;
        });

        it("Emits a SupportedTokensAdded event", async () => {
            expect(await defiContract.connect(deployer).addSupportedTokens([])).to.emit(
                defiContract,
                "SupportedTokensAdded"
            );
        });
    });

    describe("Getting supported tokens", () => {
        let tokens;
        beforeEach(async () => {
            await publishSupportedTokens();
            tokens = await defiContract.getSupportedTokens();
        });

        it("Should return the correct token addresses", async () => {
            expect(tokens).to.include(weth.address);
            expect(tokens).to.include(dai.address);
            expect(tokens).to.include(usdc.address);
        });
    });

    describe("Getting Genesis Pools", () => {
        let genesisPools;
        beforeEach(async () => {
            await publishSupportedTokens();
            genesisPools = await defiContract.getGenesisPools([weth.address, dai.address, usdc.address]);
        });

        it("Should return the correct genesis addresses", async () => {
            expect(genesisPools).to.include(wethGenesisPool.address);
            expect(genesisPools).to.include(daiGenesisPool.address);
            expect(genesisPools).to.include(usdcGenesisPool.address);
        });
    });

    describe("Getting oracle addresses", async () => {
        let oracles;
        beforeEach(async () => {
            await publishSupportedTokens();
            oracles = await defiContract.getTokenOracles([weth.address, dai.address, usdc.address]);
        });

        it("Should return the correct oracle addresses", async () => {
            expect(oracles).to.include(wethOracle.address);
            expect(oracles).to.include(daiOracle.address);
            expect(oracles).to.include(usdcOracle.address);
        });
    });

    // const goToStage3 = async () => {
    //   //Default block duration is 2
    //   await timeMachine.advanceBlock();
    //   await timeMachine.advanceBlock();
    //   await timeMachine.advanceBlock();
    // };

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

    const publishRates = async (usdTokePrice, ethPrice, daiPrice, usdcPrice, pctOver, lastLookDuration) => {
        await SetUSDValuesOfTheTokens(
            ethPrice || defaulUsdValueOfEth,
            daiPrice || defaulUsdValueOfDai,
            usdcPrice || defaulUsdValueOfUsdc
        );

        const wethRate = calculateTokeRate(ethPrice || defaulUsdValueOfEth, usdTokePrice);
        const daiRate = calculateTokeRate(daiPrice || defaulUsdValueOfDai, usdTokePrice);
        const usdcRate = calculateTokeRate(usdcPrice || defaulUsdValueOfUsdc, usdTokePrice);

        let pct = pctOver || defaultOversubPct;
        let duration = lastLookDuration || defaultLastLookDuration;

        const rate = decimalToFraction(1 - (pct - 1) / 2);

        await defiContract.connect(deployer).publishRates(
            [
                //Numerator needs to be in asset precision, demoniator needs to be in TOKE precision
                [
                    weth.address,
                    increaseBNPrecision(wethRate.numerator, 18),
                    increaseBNPrecision(wethRate.demoninator, 18),
                ],
                [dai.address, increaseBNPrecision(daiRate.numerator, 18), increaseBNPrecision(daiRate.demoninator, 18)],
                [
                    usdc.address,
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
