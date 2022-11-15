import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import * as timeMachine from "ganache-time-traveler";
import { BalanceTracker, BalanceTracker__factory } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Test BalanceTracker", () => {
    const mockTTokeAddress = "0x107d1e6C0C4D5364a3FeaF9614A8a3DE223f0EC8";
    const mockStakingTokeAddress = "0x6765673d7EA4da091651fDc034A1C79DCa525D25";
    const tokens = [mockTTokeAddress, mockStakingTokeAddress];

    const fxRootTunnelAddress = "0x0000000000000000000000000000000000001001";

    let snapshotId: string;
    let eventProxy: SignerWithAddress;
    let deployer: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;

    let balanceTrackerFactory: BalanceTracker__factory;
    let balanceTracker: BalanceTracker;

    const getTestBalance = (user: SignerWithAddress, token: string, amount = "100") => ({
        account: user.address,
        token: token,
        amount: ethers.utils.parseUnits(amount, 18),
    });

    before(async () => {
        [deployer, eventProxy, user1, user2] = await ethers.getSigners();
        balanceTrackerFactory = await ethers.getContractFactory("BalanceTracker");
        balanceTracker = (await upgrades.deployProxy(balanceTrackerFactory, [eventProxy.address])) as BalanceTracker;
    });

    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"] as string;
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    describe("constructor", () => {
        it("should revert if event proxy address is zero", async () => {
            await expect(
                upgrades.deployProxy(balanceTrackerFactory, [ethers.constants.AddressZero])
            ).to.be.revertedWith("INVALID_ROOT_PROXY");
        });
    });

    describe("supported tokens", () => {
        it("should reverts if provided tokens array to be added is empty ", async () => {
            await expect(balanceTracker.addSupportedTokens([])).to.be.revertedWith("NO_TOKENS");
        });

        it("should reverts if one of the provided tokens to be added already exist ", async () => {
            await balanceTracker.addSupportedTokens(tokens);
            await expect(balanceTracker.addSupportedTokens(tokens)).to.be.revertedWith("ADD_FAIL");
        });

        it("should reverts if one of the provided tokens to be removed already does not exist ", async () => {
            await expect(balanceTracker.removeSupportedTokens(tokens)).to.be.revertedWith("REMOVE_FAIL");
        });

        it("should reverts if provided tokens array to be removed is empty ", async () => {
            await expect(balanceTracker.removeSupportedTokens([])).to.be.revertedWith("NO_TOKENS");
        });

        it("should add supported tokens", async () => {
            await balanceTracker.addSupportedTokens(tokens);
            const supportedTokens = await balanceTracker.getSupportedTokens();
            expect(supportedTokens.length).to.equal(tokens.length);
            expect(supportedTokens[0]).to.equal(tokens[0]);
            expect(supportedTokens[1]).to.equal(tokens[1]);
        });

        it("should remove supported tokens", async () => {
            await balanceTracker.addSupportedTokens(tokens);
            await balanceTracker.removeSupportedTokens([tokens[0]]);
            const supportedTokens = await balanceTracker.getSupportedTokens();
            expect(supportedTokens.length).to.equal(tokens.length - 1);
            expect(supportedTokens[0]).to.equal(tokens[1]);
        });

        it("should revert if supported token is re-added", async () => {
            await balanceTracker.addSupportedTokens(tokens);
            await balanceTracker.removeSupportedTokens(tokens);
            await expect(balanceTracker.addSupportedTokens(tokens)).to.be.revertedWith("TOKEN_WAS_REMOVED");
        });
    });

    describe("balance management", () => {
        before(async () => {
            await balanceTracker.addSupportedTokens(tokens);
        });

        describe("getBalance", () => {
            it("should return zeros when user has no balance", async () => {
                const balances = await balanceTracker.getBalance(user1.address, tokens);
                expect(balances.length).to.equal(tokens.length);

                balances.forEach((balance: any) => {
                    expect(balance.token).to.equal(ethers.constants.AddressZero);
                    expect(balance.amount).to.equal(0);
                });
            });

            it("should return the balance when the user has one", async () => {
                const testBalance = getTestBalance(user1, mockStakingTokeAddress);
                await balanceTracker.setBalance([testBalance]);

                const balances = await balanceTracker.getBalance(user1.address, [mockStakingTokeAddress]);
                expect(balances.length).to.equal(1);
                expect(balances[0].token).to.equal(mockStakingTokeAddress);
                expect(balances[0].amount).to.equal(testBalance.amount);
            });
        });

        describe("setBalance", () => {
            it("should be callable by the owner only", async () => {
                const testBalance = getTestBalance(user1, mockStakingTokeAddress);
                await expect(balanceTracker.connect(user2).setBalance([testBalance])).to.be.revertedWith(
                    "Ownable: caller is not the owner"
                );
            });

            it("should revert if user address is zero", async () => {
                const testBalance = getTestBalance(user1, mockTTokeAddress);
                testBalance.account = ethers.constants.AddressZero;
                await expect(balanceTracker.setBalance([testBalance])).to.be.revertedWith("INVALID_ACCOUNT_ADDRESS");
            });

            it("should revert if token address is zero", async () => {
                const testBalance = getTestBalance(user1, ethers.constants.AddressZero);
                await expect(balanceTracker.setBalance([testBalance])).to.be.revertedWith("INVALID_TOKEN_ADDRESS");
            });

            it("should set user balances", async () => {
                const testBalancesUser1 = [
                    getTestBalance(user1, mockStakingTokeAddress, "100"),
                    getTestBalance(user1, mockTTokeAddress, "500"),
                ];

                const testBalancesUser2 = [getTestBalance(user2, mockTTokeAddress, "1000")];

                const testBalances = [...testBalancesUser1, ...testBalancesUser2];
                await balanceTracker.setBalance(testBalances);

                const expectedTTokeBalance = testBalances
                    .filter((x) => x.token === mockTTokeAddress)
                    .reduce((acc, val) => acc.add(val.amount), ethers.BigNumber.from(0));

                expect(await balanceTracker.totalTokenBalances(mockTTokeAddress)).to.equal(expectedTTokeBalance);

                const expectedStakedTokeBalance = testBalances
                    .filter((x) => x.token === mockStakingTokeAddress)
                    .reduce((acc, val) => acc.add(val.amount), ethers.BigNumber.from(0));

                expect(await balanceTracker.totalTokenBalances(mockStakingTokeAddress)).to.equal(
                    expectedStakedTokeBalance
                );

                const user1Balances = await balanceTracker.getBalance(user1.address, [
                    mockStakingTokeAddress,
                    mockTTokeAddress,
                ]);

                expect(user1Balances.length).to.equal(testBalancesUser1.length);

                testBalancesUser1.forEach((bal, idx) => {
                    expect(user1Balances[idx].token).to.equal(bal.token);
                    expect(user1Balances[idx].amount).to.equal(bal.amount);
                });

                const user2Balances = await balanceTracker.getBalance(user2.address, [mockTTokeAddress]);

                expect(user2Balances.length).to.equal(testBalancesUser2.length);

                testBalancesUser2.forEach((bal, idx) => {
                    expect(user2Balances[idx].token).to.equal(bal.token);
                    expect(user2Balances[idx].amount).to.equal(bal.amount);
                });

                const logs = await balanceTracker.queryFilter(balanceTracker.filters.BalanceUpdate());
                expect(logs.length).to.equal(testBalances.length);

                logs.forEach((log: any, idx: any) => {
                    expect(log.args.account).to.equal(testBalances[idx].account);
                    expect(log.args.token).to.equal(testBalances[idx].token);
                    expect(log.args.amount).to.equal(testBalances[idx].amount);
                    expect(log.args.stateSynced).to.be.false;
                    expect(log.args.applied).to.be.true;
                });
            });

            it("should not set a balance if it is already set", async () => {
                const firstSetBalance = getTestBalance(user1, mockTTokeAddress, "9999");
                const secondSetBalance = getTestBalance(user1, mockTTokeAddress, "1");

                await balanceTracker.setBalance([firstSetBalance, secondSetBalance]);

                const userBalances = await balanceTracker.getBalance(user1.address, [mockTTokeAddress]);
                expect(userBalances.length).to.equal(1);
                expect(userBalances[0].token).to.equal(mockTTokeAddress);
                expect(userBalances[0].amount).to.equal(firstSetBalance.amount);

                const logs = await balanceTracker.queryFilter(balanceTracker.filters.BalanceUpdate());
                expect(logs.length).to.equal(2);
                expect(logs[0].args.applied).to.be.true;
                expect(logs[1].args.applied).to.be.false;
            });
        });

        describe("processMessageFromRoot", () => {
            const eventType = ethers.utils.formatBytes32String("Deposit");

            const getDataPayload = (user = user1.address, token = mockTTokeAddress, amount = "1") => {
                return ethers.utils.defaultAbiCoder.encode(
                    ["tuple(bytes32,address,address,uint256)"],
                    [[ethers.utils.formatBytes32String("Deposit"), user, token, amount]]
                );
            };

            it("should only allow event proxy to call it", async () => {
                const eventType = ethers.utils.formatBytes32String("Deposit");
                const emptyData = ethers.utils.formatBytes32String("");
                await expect(
                    balanceTracker.connect(deployer).onEventReceive(fxRootTunnelAddress, eventType, emptyData)
                ).to.be.revertedWith("EVENT_PROXY_ONLY");
            });

            it("should revert if user address is zero", async () => {
                const payload = getDataPayload(ethers.constants.AddressZero);

                await expect(
                    balanceTracker.connect(eventProxy).onEventReceive(fxRootTunnelAddress, eventType, payload)
                ).to.be.revertedWith("INVALID_ACCOUNT_ADDRESS");
            });

            it("should revert on bad event type", async () => {
                const payload = getDataPayload(user1.address);
                const withdrawRequest = ethers.utils.formatBytes32String("Withdrawal Request");
                const deposit = ethers.utils.formatBytes32String("Deposit");
                const transfer = ethers.utils.formatBytes32String("Transfer");
                const withdraw = ethers.utils.formatBytes32String("Withdraw");
                const slash = ethers.utils.formatBytes32String("Slash");
                const bad = ethers.utils.formatBytes32String("Bad");

                await expect(
                    balanceTracker.connect(eventProxy).onEventReceive(fxRootTunnelAddress, withdrawRequest, payload)
                ).to.not.be.revertedWith("INVALID_EVENT_TYPE");

                await expect(
                    balanceTracker.connect(eventProxy).onEventReceive(fxRootTunnelAddress, deposit, payload)
                ).to.not.be.revertedWith("INVALID_EVENT_TYPE");

                await expect(
                    balanceTracker.connect(eventProxy).onEventReceive(fxRootTunnelAddress, transfer, payload)
                ).to.not.be.revertedWith("INVALID_EVENT_TYPE");

                await expect(
                    balanceTracker.connect(eventProxy).onEventReceive(fxRootTunnelAddress, withdraw, payload)
                ).to.not.be.revertedWith("INVALID_EVENT_TYPE");

                await expect(
                    balanceTracker.connect(eventProxy).onEventReceive(fxRootTunnelAddress, slash, payload)
                ).to.not.be.revertedWith("INVALID_EVENT_TYPE");

                await expect(
                    balanceTracker.connect(eventProxy).onEventReceive(fxRootTunnelAddress, bad, payload)
                ).to.be.revertedWith("INVALID_EVENT_TYPE");
            });

            it("should revert if token address is zero", async () => {
                const payload = getDataPayload(undefined, ethers.constants.AddressZero);
                await expect(
                    balanceTracker.connect(eventProxy).onEventReceive(fxRootTunnelAddress, eventType, payload)
                ).to.be.revertedWith("INVALID_TOKEN_ADDRESS");
            });

            it("should update a user balance", async () => {
                await balanceTracker
                    .connect(eventProxy)
                    .onEventReceive(fxRootTunnelAddress, eventType, getDataPayload());

                const [log] = await balanceTracker.queryFilter(balanceTracker.filters.BalanceUpdate());

                expect(log.args.account).to.be.equal(user1.address);
                expect(log.args.token).to.be.equal(mockTTokeAddress);
                expect(log.args.amount).to.be.equal(1);
                expect(log.args.stateSynced).to.be.true;
                expect(log.args.applied).to.be.true;

                const userBalances = await balanceTracker.getBalance(user1.address, [mockTTokeAddress]);

                expect(userBalances.length).to.equal(1);
                expect(userBalances[0].token).to.equal(mockTTokeAddress);
                expect(userBalances[0].amount).to.equal(1);
            });

            it("should overwrite existing balances for a user", async () => {
                const balances = [1234, 999, 1, 10000, 2, 800, 99999999];

                for (const balance of balances) {
                    const updatePayload = getDataPayload(user1.address, mockTTokeAddress, balance.toString());

                    await balanceTracker
                        .connect(eventProxy)
                        .onEventReceive(fxRootTunnelAddress, eventType, updatePayload);

                    const userBalance = (await balanceTracker.getBalance(user1.address, [mockTTokeAddress]))[0];

                    const totalBalance = await balanceTracker.totalTokenBalances(mockTTokeAddress);

                    expect(userBalance.amount).to.equal(balance);
                    expect(totalBalance).to.equal(balance);
                }
            });
        });
    });
});
