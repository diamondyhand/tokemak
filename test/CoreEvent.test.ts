import {expect} from "chai";
import * as timeMachine from "ganache-time-traveler";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {artifacts, ethers, waffle} from "hardhat";
import {CoreEvent} from "../typechain";
import {MockContract} from "ethereum-waffle";
import {getRoot, getProof, MerkleTree} from "@airswap/merkle";

const ADDRESS_ZERO = ethers.constants.AddressZero;

const ZERO_ADDRESS = ethers.constants.AddressZero;
const {deployMockContract} = waffle;
const ERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20");

let deployer: SignerWithAddress;
let user1: SignerWithAddress;
let user2: SignerWithAddress;
let treasury: SignerWithAddress;
let coreContract: CoreEvent;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let snapshotId: any;
let mockToken1: MockContract;
let mockToken2: MockContract;
let mockToken3: MockContract;

describe("Test CoreEvent", () => {
    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    before(async () => {
        [deployer, user1, user2, treasury] = await ethers.getSigners();

        mockToken1 = await deployMockContract(deployer, ERC20.abi);
        mockToken2 = await deployMockContract(deployer, ERC20.abi);
        mockToken3 = await deployMockContract(deployer, ERC20.abi);

        const coreFactory = await ethers.getContractFactory("CoreEvent");
        coreContract = await coreFactory.deploy(treasury.address, [
            {token: mockToken1.address, maxUserLimit: 10000, systemFinalized: false},
            {token: mockToken2.address, maxUserLimit: 20000, systemFinalized: false},
        ]);
        await coreContract.deployed();
    });

    describe("Test Constructor", () => {
        it("Constructor adds correct supported tokens", async () => {
            const supportedTokens = await coreContract.getSupportedTokens();

            expect(supportedTokens[0].token).to.equal(mockToken1.address);
            expect(supportedTokens[0].maxUserLimit).to.equal(10000);
            expect(supportedTokens[1].token).to.equal(mockToken2.address);
            expect(supportedTokens[1].maxUserLimit).to.equal(20000);
        });
    });

    describe("Test setDuration()", () => {
        const duration = 100000;

        it("Stores proper values", async () => {
            await coreContract.connect(deployer).setDuration(duration);
            const durationInfo = await coreContract.durationInfo();

            const blockNum = await ethers.provider.getBlockNumber();

            expect(durationInfo.startingBlock).to.equal(blockNum);
            expect(durationInfo.blockDuration).to.equal(duration);
        });

        it("Emits a DurationSet event", async () => {
            await expect(coreContract.connect(deployer).setDuration(duration)).to.emit(coreContract, "DurationSet");
        });

        it("Reverts when anyone but owner calls function", async () => {
            await expect(coreContract.connect(user1).setDuration(duration)).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });

        it("Can only be called once", async () => {
            await coreContract.connect(deployer).setDuration(duration);
            await expect(coreContract.connect(deployer).setDuration(duration)).to.be.revertedWith("ALREADY_STARTED");
        });
    });

    describe("Increase Duration", () => {
        const duration = 2;

        it("Can only be called once started", async () => {
            await expect(coreContract.connect(deployer).increaseDuration(duration)).to.be.revertedWith("NOT_STARTED");
        });

        it("Cannot be used to decrease the duration", async () => {
            await coreContract.connect(deployer).setDuration(duration);
            await expect(coreContract.connect(deployer).increaseDuration(duration - 1)).to.be.revertedWith(
                "INCREASE_ONLY"
            );
        });

        it("Duration can be increased event after initial expiration", async () => {
            await coreContract.connect(deployer).setDuration(2);
            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();

            await expect(coreContract.connect(deployer).increaseDuration(duration + 1)).to.emit(
                coreContract,
                "DurationIncreased"
            );
        });

        it("Duration cannot be increased once a rate has been set", async () => {
            await coreContract.connect(deployer).setDuration(2);
            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();

            await approveRates(null, 1, 1, 1, 1);
            await expect(coreContract.connect(deployer).increaseDuration(duration + 1)).to.be.revertedWith(
                "STAGE1_LOCKED"
            );
        });

        it("Duration cannot be increased once a token has been set to not swap", async () => {
            await coreContract.connect(deployer).setDuration(2);
            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();

            await coreContract.connect(deployer).setNoSwap([mockToken1.address]);
            await expect(coreContract.connect(deployer).increaseDuration(duration + 1)).to.be.revertedWith(
                "STAGE1_LOCKED"
            );
        });

        it("Duration can be increased", async () => {
            await coreContract.connect(deployer).setDuration(duration);
            await coreContract.connect(deployer).increaseDuration(duration + 1);
            const durationInfo = await coreContract.durationInfo();
            expect(durationInfo.blockDuration).to.be.equal(duration + 1);
        });

        it("Increasing duration does not change starting block", async () => {
            await coreContract.connect(deployer).setDuration(5);
            const initialDurationInfo = await coreContract.durationInfo();
            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();
            await coreContract.connect(deployer).increaseDuration(6);
            const extendedDuration = await coreContract.durationInfo();

            expect(extendedDuration.blockDuration).to.be.equal(6);
            expect(initialDurationInfo.startingBlock).to.be.equal(extendedDuration.startingBlock);
        });

        it("Emits event with updated information", async () => {
            await coreContract.connect(deployer).setDuration(duration);
            await coreContract.connect(deployer).increaseDuration(duration + 1);
            const durationInfo = await coreContract.durationInfo();
            expect(durationInfo.blockDuration).to.be.equal(duration + 1);
        });
    });

    describe("Test addSupportedTokens()", async () => {
        it("Reverts when no tokens are submitted", async () => {
            await expect(coreContract.connect(deployer).addSupportedTokens([])).to.be.revertedWith("NO_TOKENS");
        });

        it("Reverts on duplicate", async () => {
            await expect(
                coreContract.connect(deployer).addSupportedTokens([
                    {
                        token: mockToken1.address,
                        maxUserLimit: 3000,
                        systemFinalized: false,
                    },
                ])
            ).to.be.revertedWith("DUPLICATE_TOKEN");
        });

        it("Deployer can add supported token", async () => {
            await coreContract.connect(deployer).addSupportedTokens([
                {
                    token: mockToken3.address,
                    maxUserLimit: 3000,
                    systemFinalized: false,
                },
            ]);

            const supportedTokens = await coreContract.connect(deployer).getSupportedTokens();

            expect(supportedTokens[2].token).to.equal(mockToken3.address);
            expect(supportedTokens[2].maxUserLimit).to.equal(3000);
        });

        it("Emits a SupportedTokensAdded event", async () => {
            const tx = await coreContract.connect(deployer).addSupportedTokens([
                {
                    token: mockToken3.address,
                    maxUserLimit: 3000,
                    systemFinalized: false,
                },
            ]);
            const receipt = await tx.wait();

            expect(receipt.events?.[0].event).to.equal("SupportedTokensAdded");
            expect(receipt.events?.[0].args?.[0][0].token).to.equal(mockToken3.address);
            expect(receipt.events?.[0].args?.[0][0].maxUserLimit).to.equal(3000);
        });

        it("Reverts when anyone but owner calls function", async () => {
            await expect(
                coreContract.connect(user1).addSupportedTokens([
                    {
                        token: mockToken3.address,
                        maxUserLimit: 3000,
                        systemFinalized: false,
                    },
                ])
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Forces system finalized to be false", async () => {
            await expect(
                coreContract.connect(deployer).addSupportedTokens([
                    {
                        token: mockToken3.address,
                        maxUserLimit: 3000,
                        systemFinalized: true,
                    },
                ])
            ).to.be.revertedWith("FINALIZED_MUST_BE_FALSE");
        });
    });

    // Necessary due to beforeEach setting duration for rest of test cases for deposit()
    describe("Test deposit() revert when duration not set", () => {
        it("Reverts when event duration has not been set", async () => {
            expect((await coreContract.durationInfo()).startingBlock).to.equal(0);
            await expect(
                coreContract.connect(user1).deposit([{token: mockToken1.address, amount: 10}], [])
            ).to.be.revertedWith("NOT_STARTED");
        });
    });

    describe("Test deposit()", () => {
        beforeEach(async () => {
            await coreContract.connect(deployer).setDuration(5);
            await mockToken1.mock.transferFrom.returns(true);
        });

        it("Reverts when duration has been reached", async () => {
            timeMachine.advanceBlock();
            timeMachine.advanceBlock();
            timeMachine.advanceBlock();

            await expect(
                coreContract.connect(user1).deposit([{token: mockToken1.address, amount: 10}], [])
            ).to.be.revertedWith("RATES_LOCKED");
        });

        it("Does not revert when within deposit period", async () => {
            timeMachine.advanceBlock();

            await expect(coreContract.connect(user1).deposit([{token: mockToken1.address, amount: 10}], [])).to.not.be
                .reverted;
        });

        it("Reverts when TokenData array is empty", async () => {
            await expect(coreContract.connect(user1).deposit([], [])).to.be.revertedWith("NO_TOKENS");
        });

        it("Reverts on unsupported token", async () => {
            await mockToken3.mock.transferFrom.returns(true);
            await expect(
                coreContract.connect(user1).deposit([{token: mockToken3.address, amount: 10}], [])
            ).to.be.revertedWith("NOT_SUPPORTED");
        });

        it("Reverts on supported and unsupported tokens", async () => {
            await mockToken3.mock.transferFrom.returns(true);
            await expect(
                coreContract.connect(user1).deposit(
                    [
                        {token: mockToken1.address, amount: 10},
                        {token: mockToken3.address, amount: 15},
                    ],
                    []
                )
            ).to.be.revertedWith("NOT_SUPPORTED");
        });

        it("Reverts on 0 amount", async () => {
            await expect(
                coreContract.connect(user1).deposit([{token: mockToken1.address, amount: 0}], [])
            ).to.be.revertedWith("0_BALANCE");
        });

        it("Reverts on 0 amount with multiple tokens", async () => {
            await mockToken2.mock.transferFrom.returns(true);
            await expect(
                coreContract.connect(user1).deposit(
                    [
                        {token: mockToken1.address, amount: 10},
                        {token: mockToken2.address, amount: 0},
                    ],
                    []
                )
            ).to.be.revertedWith("0_BALANCE");
        });

        it("Reverts on overage", async () => {
            await expect(
                coreContract.connect(user1).deposit([{token: mockToken1.address, amount: 10100}], [])
            ).to.be.revertedWith("OVER_LIMIT");
        });

        it("Reverts with overage on one of two tokens", async () => {
            await mockToken2.mock.transferFrom.returns(true);
            await expect(
                coreContract.connect(user1).deposit(
                    [
                        {token: mockToken1.address, amount: 24},
                        {token: mockToken2.address, amount: 24000},
                    ],
                    []
                )
            ).to.be.revertedWith("OVER_LIMIT");
        });

        it("Reverts when second deposit of singular asset exceeds limit", async () => {
            await expect(coreContract.connect(user1).deposit([{token: mockToken1.address, amount: 5000}], [])).to.not.be
                .reverted;

            timeMachine.advanceBlock();

            await expect(
                coreContract.connect(user1).deposit([{token: mockToken1.address, amount: 6000}], [])
            ).to.be.revertedWith("OVER_LIMIT");
        });

        it("Should emit a 'Deposited' event with the proper args", async () => {
            await mockToken2.mock.transferFrom.returns(true);

            const tx = await coreContract.connect(user1).deposit(
                [
                    {token: mockToken1.address, amount: 10},
                    {token: mockToken2.address, amount: 20},
                ],
                []
            );
            const receipt = await tx.wait();
            const eventArgs = receipt.events?.[0].args;

            expect(eventArgs?.depositor).to.equal(user1.address);
            expect(eventArgs?.tokenInfo[0].token).to.equal(mockToken1.address);
            expect(eventArgs?.tokenInfo[0].amount).to.equal(10);
            expect(eventArgs?.tokenInfo[1].token).to.equal(mockToken2.address);
            expect(eventArgs?.tokenInfo[1].amount).to.equal(20);
        });

        it("Should deposit the correct amount for a single deposit", async () => {
            await coreContract.connect(user1).deposit([{token: mockToken1.address, amount: 10}], []);

            const accountDataArr = await coreContract.getAccountData(user1.address);
            expect(accountDataArr[0].depositedBalance).to.equal(10);
        });

        it("Should store balances of multiple tokens", async () => {
            await mockToken2.mock.transferFrom.returns(true);
            await coreContract.connect(user1).deposit(
                [
                    {token: mockToken1.address, amount: 14},
                    {token: mockToken2.address, amount: 25},
                ],
                []
            );

            const accountDataArr = await coreContract.getAccountData(user1.address);
            expect(accountDataArr[0].depositedBalance).to.equal(14);
            expect(accountDataArr[1].depositedBalance).to.equal(25);
        });

        it("Correct deposits for multiple deposits of same token", async () => {
            await mockToken2.mock.transferFrom.returns(true);
            await coreContract.connect(user1).deposit([{token: mockToken2.address, amount: 13}], []);

            const accountDataArray = await coreContract.getAccountData(user1.address);
            expect(accountDataArray[0].depositedBalance).to.equal(0);
            expect(accountDataArray[1].depositedBalance).to.equal(13);

            await coreContract.connect(user1).deposit(
                [
                    {token: mockToken1.address, amount: 20},
                    {token: mockToken2.address, amount: 3},
                ],
                []
            );

            const accountDataArr2 = await coreContract.getAccountData(user1.address);
            expect(accountDataArr2[0].token).to.equal(mockToken1.address);
            expect(accountDataArr2[0].depositedBalance).to.equal(20);
            expect(accountDataArr2[1].token).to.equal(mockToken2.address);
            expect(accountDataArr2[1].depositedBalance).to.equal(16);
        });
    });

    describe("Test withdraw()", async () => {
        beforeEach(async () => {
            await coreContract.connect(deployer).setDuration(7);
            await mockToken1.mock.transferFrom.returns(true);
            await mockToken1.mock.transfer.returns(true);
        });

        it("Reverts when rates are locked", async () => {
            await coreContract.connect(user1).deposit([{token: mockToken1.address, amount: 10}], []);
            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();

            await expect(
                coreContract.connect(user1).withdraw([{token: mockToken1.address, amount: 5}])
            ).to.be.revertedWith("RATES_LOCKED");
        });

        it("Reverts on empty array", async () => {
            await expect(coreContract.connect(user1).withdraw([])).to.be.revertedWith("NO_TOKENS");
        });

        it("Reverts on zero balance", async () => {
            await coreContract.connect(user1).deposit([{token: mockToken1.address, amount: 10}], []);

            await expect(
                coreContract.connect(user1).withdraw([{token: mockToken1.address, amount: 0}])
            ).to.be.revertedWith("ZERO_BALANCE");
        });

        it("Reverts with both zero and non-zero balance", async () => {
            await mockToken2.mock.transferFrom.returns(true);
            await mockToken2.mock.transfer.returns(true);
            await coreContract.connect(user1).deposit(
                [
                    {token: mockToken1.address, amount: 10},
                    {token: mockToken2.address, amount: 12},
                ],
                []
            );

            await expect(
                coreContract.connect(user1).withdraw([
                    {token: mockToken1.address, amount: 3},
                    {token: mockToken2.address, amount: 0},
                ])
            ).to.be.revertedWith("ZERO_BALANCE");
        });

        it("User cannot withdraw without deposit", async () => {
            await expect(
                coreContract.connect(user1).withdraw([{token: mockToken1.address, amount: 5}])
            ).to.be.revertedWith("ZERO_ADDRESS");
        });

        // No deposit here, zero address would revert on deposit
        it("Reverts on zero address", async () => {
            await expect(coreContract.connect(user1).withdraw([{token: ADDRESS_ZERO, amount: 20}])).to.be.revertedWith(
                "ZERO_ADDRESS"
            );
        });

        it("Does not allow for a withdrawal greater than a deposit", async () => {
            await coreContract.connect(user1).deposit([{token: mockToken1.address, amount: 10}], []);

            await expect(
                coreContract.connect(user1).withdraw([{token: mockToken1.address, amount: 15}])
            ).to.be.revertedWith("INSUFFICIENT_FUNDS");
        });

        it("Reverts onv multiple withdrawals, one overage", async () => {
            await mockToken2.mock.transfer.returns(true);
            await mockToken2.mock.transferFrom.returns(true);
            await coreContract.connect(user1).deposit(
                [
                    {token: mockToken1.address, amount: 20},
                    {token: mockToken2.address, amount: 10},
                ],
                []
            );

            await expect(
                coreContract.connect(user1).withdraw([
                    {token: mockToken1.address, amount: 10},
                    {token: mockToken2.address, amount: 15},
                ])
            ).to.be.revertedWith("INSUFFICIENT_FUNDS");

            const userBalance = await coreContract.getAccountData(user1.address);

            expect(userBalance[0].depositedBalance).to.equal(20);
            expect(userBalance[1].depositedBalance).to.equal(10);
        });

        it("Should emit a 'Withdrawn' event", async () => {
            await coreContract.connect(user1).deposit([{token: mockToken1.address, amount: 10}], []);

            const tx = await coreContract.connect(user1).withdraw([{token: mockToken1.address, amount: 10}]);
            const receipt = await tx.wait();
            const eventArgs = receipt.events?.[0].args;
            expect(eventArgs?.withdrawer).to.equal(user1.address);
            expect(eventArgs?.tokenInfo[0].amount).to.equal(10);
            expect(eventArgs?.tokenInfo[0].token).to.equal(mockToken1.address);
        });

        it("Stores the correct balances after a withdrawal", async () => {
            await coreContract.connect(user1).deposit([{token: mockToken1.address, amount: 10}], []);

            const balancesBeforeWithdraw = await coreContract.getAccountData(user1.address);
            expect(balancesBeforeWithdraw[0].token).to.equal(mockToken1.address);
            expect(balancesBeforeWithdraw[0].depositedBalance).to.equal(10);

            await coreContract.connect(user1).withdraw([{token: mockToken1.address, amount: 2}]);

            const balanceAfterFirstWithdraw = await coreContract.getAccountData(user1.address);
            expect(balanceAfterFirstWithdraw[0].token).to.equal(mockToken1.address);
            expect(balanceAfterFirstWithdraw[0].depositedBalance).to.equal(8);

            await coreContract.connect(user1).withdraw([{token: mockToken1.address, amount: 3}]);

            const balanceAfterSecondWithdrawal = await coreContract.getAccountData(user1.address);
            expect(balanceAfterSecondWithdrawal[0].token).to.equal(mockToken1.address);
            expect(balanceAfterSecondWithdrawal[0].depositedBalance).to.equal(5);
        });
    });

    describe("Set Rates", async () => {
        it("Forces you to wait until the round ends", async () => {
            await coreContract.connect(deployer).setDuration(2);

            const linkRate = {
                token: mockToken1.address,
                tokeNumerator: 2,
                tokeDenominator: 1,
                overNumerator: 30,
                overDenominator: 100,
                pool: ZERO_ADDRESS,
            };

            await expect(coreContract.connect(deployer).setRates([linkRate])).to.be.revertedWith("TOO_EARLY");

            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();

            await expect(coreContract.connect(deployer).setRates([linkRate])).to.not.be.revertedWith("TOO_EARLY");
        });

        it("Allows an empty pool", async () => {
            await coreContract.connect(deployer).setDuration(1);

            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();

            const linkRate = {
                token: mockToken1.address,
                tokeNumerator: 2,
                tokeDenominator: 1,
                overNumerator: 30,
                overDenominator: 100,
                pool: ZERO_ADDRESS,
            };

            await expect(coreContract.connect(deployer).setRates([linkRate])).to.not.be.reverted;
        });

        it("Doesn't allow any rates with a 0 in numerator or denominator", async () => {
            await coreContract.connect(deployer).setDuration(1);

            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();

            const badTokeDenom = {
                token: mockToken1.address,
                tokeNumerator: 1,
                tokeDenominator: 0,
                overNumerator: 30,
                overDenominator: 100,
                pool: ZERO_ADDRESS,
            };
            const badOverNumer = {
                token: mockToken1.address,
                tokeNumerator: 1,
                tokeDenominator: 1,
                overNumerator: 0,
                overDenominator: 100,
                pool: ZERO_ADDRESS,
            };
            const badOverDenom = {
                token: mockToken1.address,
                tokeNumerator: 1,
                tokeDenominator: 1,
                overNumerator: 1,
                overDenominator: 0,
                pool: ZERO_ADDRESS,
            };

            //TOKE Numer == 0 is valid, means delete

            await expect(coreContract.connect(deployer).setRates([badTokeDenom])).to.be.revertedWith(
                "INVALID_TOKE_DENOMINATOR"
            );
            await expect(coreContract.connect(deployer).setRates([badOverNumer])).to.be.revertedWith(
                "INVALID_OVER_NUMERATOR"
            );
            await expect(coreContract.connect(deployer).setRates([badOverDenom])).to.be.revertedWith(
                "INVALID_OVER_DENOMINATOR"
            );
        });

        it("Can only set rates for supported tokens", async () => {
            await coreContract.connect(deployer).setDuration(1);

            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();

            const badToken = {
                token: mockToken3.address,
                tokeNumerator: 2,
                tokeDenominator: 1,
                overNumerator: 30,
                overDenominator: 100,
                pool: ZERO_ADDRESS,
            };

            await expect(coreContract.connect(deployer).setRates([badToken])).to.be.revertedWith("UNSUPPORTED_ADDRESS");

            const goodToken = {
                token: mockToken1.address,
                tokeNumerator: 2,
                tokeDenominator: 1,
                overNumerator: 30,
                overDenominator: 100,
                pool: ZERO_ADDRESS,
            };

            await expect(coreContract.connect(deployer).setRates([goodToken])).to.not.be.revertedWith(
                "UNSUPPORTED_ADDRESS"
            );
        });

        it("Can delete a rate if its not finalized", async () => {
            await mockToken2.mock.transfer.returns(true);
            await mockToken2.mock.transferFrom.returns(true);
            await mockToken2.mock.balanceOf.returns(1);

            await coreContract.connect(deployer).setDuration(1);

            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();

            const token1 = {
                token: mockToken1.address,
                tokeNumerator: 2,
                tokeDenominator: 1,
                overNumerator: 30,
                overDenominator: 100,
                pool: ZERO_ADDRESS,
            };
            const token2 = {
                token: mockToken2.address,
                tokeNumerator: 4,
                tokeDenominator: 2,
                overNumerator: 60,
                overDenominator: 100,
                pool: ZERO_ADDRESS,
            };

            await coreContract.connect(deployer).setRates([token1, token2]);
            const initialRates = await coreContract.connect(user1).getRates();

            token1.tokeNumerator = 0;

            await coreContract.connect(deployer).setRates([token1]);
            const updatedRates = await coreContract.connect(user1).getRates();

            const initialToken1Rate = initialRates.filter((x) => x.token == token1.token)[0];
            const initialToken2Rate = initialRates.filter((x) => x.token == token2.token)[0];
            const updatedToken1RateAr = updatedRates.filter((x) => x.token == token1.token);
            const updatedToken2Rate = updatedRates.filter((x) => x.token == token2.token)[0];

            await coreContract.connect(deployer).transferToTreasury([mockToken2.address]);
            token2.tokeNumerator = 0;

            await expect(coreContract.connect(deployer).setRates([token2])).to.be.revertedWith("ALREADY_FINALIZED");

            expect(initialToken1Rate.tokeNumerator).to.be.equal(2);
            expect(initialToken2Rate.tokeNumerator).to.be.equal(4);
            expect(initialRates.length).to.be.equal(2);

            expect(updatedToken1RateAr.length).to.be.equal(0);
            expect(updatedToken2Rate.token).to.be.equal(token2.token);
            expect(updatedToken2Rate.tokeNumerator).to.be.equal(4);
        });

        it("Can update a rate if its not finalized", async () => {
            await mockToken1.mock.transfer.returns(true);
            await mockToken1.mock.transferFrom.returns(true);
            await mockToken1.mock.balanceOf.returns(1);

            await coreContract.connect(deployer).setDuration(1);

            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();

            const token1 = {
                token: mockToken1.address,
                tokeNumerator: 2,
                tokeDenominator: 1,
                overNumerator: 30,
                overDenominator: 100,
                pool: ZERO_ADDRESS,
            };

            await coreContract.connect(deployer).setRates([token1]);
            const initialRates = await coreContract.connect(user1).getRates();

            token1.tokeNumerator = 4;

            await coreContract.connect(deployer).setRates([token1]);
            const updatedRates = await coreContract.connect(user1).getRates();

            await coreContract.connect(deployer).transferToTreasury([mockToken1.address]);

            token1.tokeNumerator = 6;

            expect(initialRates[0].tokeNumerator).to.be.equal(2);
            expect(updatedRates[0].tokeNumerator).to.be.equal(4);

            await expect(coreContract.connect(deployer).setRates([token1])).to.be.revertedWith("ALREADY_FINALIZED");
        });
    });

    describe("Test Finalize", () => {
        beforeEach(async () => {
            await mockToken1.mock.approve.returns(true);
            await mockToken1.mock.transfer.returns(true);
            await mockToken1.mock.transferFrom.returns(true);
            await mockToken1.mock.balanceOf.returns(1);
        });

        it("Reverts if deposit / withdraw period has not ended", async () => {
            await coreContract.setDuration(5);
            await timeMachine.advanceBlock();

            await expect(
                coreContract.connect(user1).finalize([{token: mockToken1.address, sendToFarming: false}])
            ).to.be.revertedWith("TOO_EARLY");
        });

        it("Reverts when TokenFaming array is empty", async () => {
            await coreContract.connect(deployer).setDuration(1);
            await expect(coreContract.connect(user1).finalize([])).to.be.revertedWith("NO_TOKENS");
        });

        it("Reverts when treasury transfer is not complete", async () => {
            await coreContract.connect(deployer).setDuration(1);
            await expect(
                coreContract.connect(user1).finalize([{token: mockToken1.address, sendToFarming: false}])
            ).to.be.revertedWith("NOT_SYSTEM_FINALIZED");
        });

        it("Reverts on zero address", async () => {
            await coreContract.connect(deployer).setDuration(1);
            await approveRates(null, 2, 1, 30, 100);
            await coreContract.connect(deployer).transferToTreasury([mockToken1.address]);

            await expect(
                coreContract.connect(user1).finalize([{token: ZERO_ADDRESS, sendToFarming: false}])
            ).to.be.revertedWith("ZERO_ADDRESS");
        });

        it("Reverts on insufficient funds", async () => {
            await coreContract.connect(deployer).setDuration(4);
            await coreContract.connect(user1).deposit([{token: mockToken1.address, amount: 10}], []);

            await coreContract.connect(user1).withdraw([{token: mockToken1.address, amount: 10}]);

            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();
            await approveRates(null, 2, 1, 30, 100);
            await coreContract.connect(deployer).transferToTreasury([mockToken1.address]);

            await expect(
                coreContract.connect(user1).finalize([{token: mockToken1.address, sendToFarming: false}])
            ).to.be.revertedWith("INSUFFICIENT_FUNDS");
        });

        it("Prevents a user from finalizing more than once", async () => {
            await coreContract.connect(deployer).setDuration(4);
            await coreContract.connect(user1).deposit([{token: mockToken1.address, amount: 10}], []);

            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();
            await approveRates(null, 2, 1, 30, 100);
            await coreContract.connect(deployer).transferToTreasury([mockToken1.address]);

            await coreContract.connect(user1).finalize([{token: mockToken1.address, sendToFarming: false}]);

            await expect(
                coreContract.connect(user1).finalize([{token: mockToken1.address, sendToFarming: false}])
            ).to.be.revertedWith("ALREADY_FINALIZED");
        });

        it("Reverts when ineffective amount is 0", async () => {
            await coreContract.connect(deployer).setDuration(3);
            await coreContract.connect(user1).deposit([{token: mockToken1.address, amount: 10}], []);

            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();
            await approveRates(null, 2, 1, 100, 100);
            await coreContract.connect(deployer).transferToTreasury([mockToken1.address]);

            await expect(
                coreContract.connect(user1).finalize([{token: mockToken1.address, sendToFarming: false}])
            ).to.be.revertedWith("NOTHING_TO_MOVE");
        });

        it("Reverts if pool address is zero address", async () => {
            await coreContract.connect(deployer).setDuration(3);
            await coreContract.connect(user1).deposit([{token: mockToken1.address, amount: 10}], []);

            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();
            await approveRates(null, 2, 1, 30, 100);
            await coreContract.connect(deployer).transferToTreasury([mockToken1.address]);

            await expect(
                coreContract.connect(user1).finalize([{token: mockToken1.address, sendToFarming: true}])
            ).to.be.revertedWith("NO_FARMING");
        });
    });

    describe("Test transferToTreasury()", () => {
        beforeEach(async () => {
            await coreContract.connect(deployer).setDuration(4);
            await mockToken1.mock.transferFrom.returns(true);
            await mockToken1.mock.transfer.returns(true);
        });

        it("Reverts when deposit / withdraw period has not ended yet", async () => {
            await expect(coreContract.connect(deployer).transferToTreasury([mockToken1.address])).to.be.revertedWith(
                "TOO_EARLY"
            );
        });

        it("Reverts when rates havent been published", async () => {
            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();

            await expect(coreContract.connect(deployer).transferToTreasury([mockToken1.address])).to.be.revertedWith(
                "NO_SWAP_TOKEN"
            );
        });

        it("Emits a 'TreasuryTransfer' events with correct args", async () => {
            await coreContract.connect(user1).deposit([{token: mockToken1.address, amount: 10}], []);
            await approveRates(null, 2, 1, 30, 100);
            await mockToken1.mock.balanceOf.returns(10);

            const tx = await coreContract.connect(deployer).transferToTreasury([mockToken1.address]);
            const receipt = await tx.wait();

            expect(receipt.events?.[0].event).to.equal("TreasuryTransfer");
            expect(receipt.events?.[0].args?.[0][0].token).to.equal(mockToken1.address);
            expect(receipt.events?.[0].args?.[0][0].amount).to.equal(3);
        });

        it("Wont allow a treasury transfer for the same token more than once", async () => {
            await coreContract.connect(user1).deposit([{token: mockToken1.address, amount: 10}], []);
            await approveRates(null, 2, 1, 30, 100);
            await mockToken1.mock.balanceOf.returns(10);

            await coreContract.connect(deployer).transferToTreasury([mockToken1.address]);

            await expect(coreContract.connect(deployer).transferToTreasury([mockToken1.address])).to.be.revertedWith(
                "ALREADY_FINALIZED"
            );
        });
    });

    describe("Get Account Data", () => {
        beforeEach(async () => {
            await coreContract.connect(deployer).setDuration(5);
            await mockToken1.mock.transferFrom.returns(true);
            await mockToken2.mock.transferFrom.returns(true);
        });
        it("Token is populated regardless of deposit made", async () => {
            await coreContract.connect(user1).deposit([{token: mockToken1.address, amount: 10}], []);

            const accountDataArr = await coreContract.getAccountData(user1.address);
            expect(accountDataArr[0].token).to.equal(mockToken1.address);
            expect(accountDataArr[0].depositedBalance).to.equal(10);
            expect(accountDataArr[1].token).to.equal(mockToken2.address);
            expect(accountDataArr[1].depositedBalance).to.equal(0);
        });
    });

    describe("Whitelist", async () => {
        beforeEach(async () => {
            await coreContract.connect(deployer).setDuration(5);
            await mockToken1.mock.transferFrom.returns(true);
            await mockToken2.mock.transferFrom.returns(true);
        });

        it("Allows included user to deposit", async () => {
            const tree = new MerkleTree([ethers.utils.keccak256(user1.address)]);
            const root = getRoot(tree);
            await coreContract.connect(deployer).configureWhitelist({enabled: true, root: root});
            const proof = getProof(tree, ethers.utils.keccak256(user1.address));

            await coreContract.connect(user1).deposit([{token: mockToken1.address, amount: 10}], proof);
        });

        it("Blocks someone from using anothers proof", async () => {
            const user1Tree = new MerkleTree([ethers.utils.keccak256(user1.address)]);
            const user1Root = getRoot(user1Tree);
            await coreContract.connect(deployer).configureWhitelist({enabled: true, root: user1Root});
            const user1Proof = getProof(user1Tree, ethers.utils.keccak256(user1.address));

            await expect(
                coreContract.connect(user2).deposit([{token: mockToken1.address, amount: 10}], user1Proof)
            ).to.be.revertedWith("PROOF_INVALID");
        });

        it("Disabled whitelist check lets anyone through", async () => {
            const user1Tree = new MerkleTree([ethers.utils.keccak256(user1.address)]);
            const user1Root = getRoot(user1Tree);
            await coreContract.connect(deployer).configureWhitelist({enabled: false, root: user1Root});
            const user1Proof = getProof(user1Tree, ethers.utils.keccak256(user1.address));

            await coreContract.connect(user2).deposit([{token: mockToken1.address, amount: 10}], user1Proof);
        });
    });

    describe("Set No-Swap", () => {
        beforeEach(async () => {
            await coreContract.connect(deployer).setDuration(2);
        });

        it("Is only callable after deposit/withdraw period", async () => {
            await expect(coreContract.connect(deployer).setNoSwap([mockToken1.address])).to.be.revertedWith(
                "TOO_EARLY"
            );
        });

        it("Only allows supported tokens", async () => {
            await timeMachine.advanceBlock();
            await expect(coreContract.connect(deployer).setNoSwap([mockToken3.address])).to.be.revertedWith(
                "UNSUPPORTED_ADDRESS"
            );
        });
        it("Is only callable once per token", async () => {
            await timeMachine.advanceBlock();
            await coreContract.connect(deployer).setNoSwap([mockToken1.address]);
            await expect(coreContract.connect(deployer).setNoSwap([mockToken1.address])).to.be.revertedWith(
                "ALREADY_FINALIZED"
            );
        });
        it("Emits event", async () => {
            await timeMachine.advanceBlock();
            await expect(coreContract.connect(deployer).setNoSwap([mockToken1.address]))
                .to.emit(coreContract, "SetNoSwap")
                .withArgs([mockToken1.address]);
        });
    });

    describe("Rate and Treasury State Transition", () => {
        it("Won't allow finalization before end of duration", async () => {
            await coreContract.connect(deployer).setDuration(100);
            await expect(coreContract.connect(deployer).setNoSwap([mockToken1.address])).to.be.revertedWith(
                "TOO_EARLY"
            );
            await expect(coreContract.connect(deployer).transferToTreasury([mockToken1.address])).to.be.revertedWith(
                "TOO_EARLY"
            );
        });
        it("Won't allow rate change once finalized via treasury transfer", async () => {
            await mockToken1.mock.balanceOf.returns(10);
            await mockToken1.mock.transferFrom.returns(true);
            await mockToken1.mock.transfer.returns(true);

            await coreContract.connect(deployer).setDuration(1);
            await timeMachine.advanceBlock();
            await approveRates(mockToken1.address, 1, 1, 1, 1);
            await coreContract.connect(deployer).transferToTreasury([mockToken1.address]);
            await expect(approveRates(mockToken1.address, 1, 1, 1, 1)).to.be.revertedWith("ALREADY_FINALIZED");
        });
        it("Won't allow rate change once finalized via no-swap", async () => {
            await mockToken1.mock.balanceOf.returns(10);
            await mockToken1.mock.transferFrom.returns(true);
            await mockToken1.mock.transfer.returns(true);

            await coreContract.connect(deployer).setDuration(1);
            await timeMachine.advanceBlock();
            await coreContract.connect(deployer).setNoSwap([mockToken1.address]);
            await expect(approveRates(mockToken1.address, 1, 1, 1, 1)).to.be.revertedWith("ALREADY_FINALIZED");
        });
        it("Won't allow a no-swap set if a rate has already been published", async () => {
            await mockToken1.mock.balanceOf.returns(10);
            await mockToken1.mock.transferFrom.returns(true);
            await mockToken1.mock.transfer.returns(true);

            await coreContract.connect(deployer).setDuration(1);
            await timeMachine.advanceBlock();
            await approveRates(mockToken1.address, 1, 1, 1, 1);
            await expect(coreContract.connect(deployer).setNoSwap([mockToken1.address])).to.be.revertedWith(
                "ALREADY_SET_TO_SWAP"
            );
            await approveRates(mockToken1.address, 0, 1, 1, 1);
            await expect(coreContract.connect(deployer).setNoSwap([mockToken1.address])).to.emit(
                coreContract,
                "SetNoSwap"
            );
        });
    });
});

async function approveRates(
    tokenAddr: string | null,
    tokeNum: number | null,
    tokeDenom: number | null,
    overNum: number | null,
    overDenom: number | null
) {
    const token = {
        token: tokenAddr || mockToken1.address,
        tokeNumerator: tokeNum || 0,
        tokeDenominator: tokeDenom || 0,
        overNumerator: overNum || 0,
        overDenominator: overDenom || 0,
        pool: ZERO_ADDRESS,
    };
    await coreContract.connect(deployer).setRates([token]);
}
