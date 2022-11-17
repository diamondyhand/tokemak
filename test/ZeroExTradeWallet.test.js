const { expect } = require("chai");
const timeMachine = require("ganache-time-traveler");
const { ethers, artifacts, waffle } = require("hardhat");
const { AddressZero } = ethers.constants;
const { deployMockContract } = waffle;
const ERC20 = artifacts.require("ERC20");

describe("Test ZeroExTradeWallet", () => {
    let tradeWalletFactory;
    let tradeWallet;
    let snapshotId;
    let deployer;
    let manager;
    let token1;
    let token2;
    let token3;
    let user1;

    const exchangeProxyAddress = "0xDef1C0ded9bec7F1a1670819833240f027b25EfF";

    beforeEach(async () => {
        let snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    before(async () => {
        [deployer, manager, user1] = await ethers.getSigners();
        tradeWalletFactory = await ethers.getContractFactory("ZeroExTradeWallet");
        tradeWallet = await tradeWalletFactory.deploy(exchangeProxyAddress, manager.address);

        token1 = await deployMockContract(deployer, ERC20.abi);
        token2 = await deployMockContract(deployer, ERC20.abi);
        token3 = await deployMockContract(deployer, ERC20.abi);
    });

    describe("Constructor Arguments", async () => {
        it("constructor fails on router 0 address", async () => {
            await expect(tradeWalletFactory.deploy(AddressZero, manager.address)).to.be.revertedWith("INVALID_ROUTER");
        });

        it("constructor fails on manager 0 address", async () => {
            await expect(tradeWalletFactory.deploy(exchangeProxyAddress, AddressZero)).to.be.revertedWith(
                "INVALID_MANAGER"
            );
        });
    });

    describe("Initialization", async () => {
        it("router is set properly", async () => {
            const name = await tradeWallet.connect(user1).zeroExRouter();
            expect(name).to.equal(exchangeProxyAddress);
        });

        it("manager is set properly", async () => {
            const name = await tradeWallet.connect(user1).manager();
            expect(name).to.equal(manager.address);
        });

        it("owner is the deployer", async () => {
            expect(await tradeWallet.owner()).to.equal(deployer.address);
        });
    });

    describe("Whitelisting Tokens", () => {
        it("Does not let anyone but the owner whitelist tokens", async () => {
            await expect(
                tradeWallet.connect(user1).whitelistTokens([token1.address, token2.address])
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Returns proper whitelisted tokens", async () => {
            await tradeWallet.connect(deployer).whitelistTokens([token1.address, token2.address]);
            let addresses = await tradeWallet.getTokens();
            expect(addresses[0]).to.equal(token1.address);
            expect(addresses[1]).to.equal(token2.address);
        });

        it("Does not add duplicate addresses", async () => {
            await expect(
                tradeWallet.connect(deployer).whitelistTokens([token1.address, token2.address, token1.address])
            ).to.be.revertedWith("ADD_FAIL");
        });
    });

    describe("Removing Whitelisted Tokens", async () => {
        it("Should remove one of two whitelisted tokens", async () => {
            await tradeWallet.connect(deployer).whitelistTokens([token1.address, token2.address]);
            let addresses = await tradeWallet.getTokens();
            expect(addresses[0]).to.equal(token1.address);
            expect(addresses[1]).to.equal(token2.address);

            await tradeWallet.connect(deployer).removeWhitelistedTokens([token1.address]);
            let addressesAfterRemoval = await tradeWallet.getTokens();
            expect(addressesAfterRemoval[0]).to.equal(token2.address);
        });
    });

    describe("Deposit", async () => {
        before(async () => {
            await tradeWallet.connect(deployer).whitelistTokens([token1.address, token2.address]);
        });

        it("deposit fails when not by manager", async () => {
            await expect(
                tradeWallet.connect(user1).deposit([token1.address, token2.address], [10, 20])
            ).to.be.revertedWith("INVALID_MANAGER");
        });

        it("initial deposit succeeds by manager", async () => {
            const token1Bal = 10;
            await token1.mock.transferFrom.returns(true);
            await token1.mock.allowance.returns(0);
            await token1.mock.balanceOf.returns(token1Bal);
            await token1.mock.approve.returns(true);

            const token2Bal = 20;
            await token2.mock.transferFrom.returns(true);
            await token2.mock.allowance.returns(0);
            await token2.mock.balanceOf.returns(token2Bal);
            await token2.mock.approve.returns(true);

            await expect(tradeWallet.connect(manager).deposit([token1.address, token2.address], [token1Bal, token2Bal]))
                .to.not.be.reverted;

            const registeredTokens = await tradeWallet.connect(deployer).getTokens();
            expect(registeredTokens.length).to.equal(2);
            expect(registeredTokens[0]).to.equal(token1.address);
            expect(registeredTokens[1]).to.equal(token2.address);
        });

        it("subsequent deposit succeeds by manager", async () => {
            const token1Allownace = 15;
            const token1Bal = 10;
            await token1.mock.transferFrom.returns(true);
            await token1.mock.allowance.returns(token1Allownace);
            await token1.mock.balanceOf.returns(token1Bal);
            await token1.mock.increaseAllowance.returns(true);
            await token1.mock.decreaseAllowance.returns(true);
            // no approval since it's not run

            const token2Allownace = 25;
            const token2Bal = 20;
            await token2.mock.transferFrom.returns(true);
            await token2.mock.allowance.returns(token2Allownace);
            await token2.mock.balanceOf.returns(token2Bal);
            await token2.mock.increaseAllowance.returns(true);
            await token2.mock.decreaseAllowance.returns(true);
            // no approval since it's not run

            await expect(tradeWallet.connect(manager).deposit([token1.address, token2.address], [token1Bal, token2Bal]))
                .to.not.be.reverted;

            const registeredTokens = await tradeWallet.connect(deployer).getTokens();
            expect(registeredTokens.length).to.equal(2);
            expect(registeredTokens[0]).to.equal(token1.address);
            expect(registeredTokens[1]).to.equal(token2.address);
        });

        it("Reverts when non-whitelisted token address passed in", async () => {
            await token3.mock.transferFrom.returns(true);
            await token3.mock.allowance.returns(10);
            await token3.mock.balanceOf.returns(10);

            await expect(tradeWallet.connect(manager).deposit([token3.address], [10])).to.be.revertedWith(
                "ADDRESS_NOT_WHITELISTED"
            );
        });
    });

    describe("Withdraw", async () => {
        before(async () => {
            await tradeWallet.connect(deployer).removeWhitelistedTokens([token1.address, token2.address]);

            await tradeWallet.connect(deployer).whitelistTokens([token1.address, token2.address]);
        });

        it("withraw fails when not by manager", async () => {
            await expect(
                tradeWallet.connect(user1).withdraw([token1.address, token2.address], [10, 20])
            ).to.be.revertedWith("INVALID_MANAGER");
        });

        it("withdraw succeeds by manager", async () => {
            const token1Bal = 10;
            await token1.mock.transferFrom.returns(true);
            await token1.mock.allowance.returns(0);
            await token1.mock.balanceOf.returns(token1Bal);
            await token1.mock.approve.returns(true);

            const token2Bal = 20;
            await token2.mock.transferFrom.returns(true);
            await token2.mock.allowance.returns(0);
            await token2.mock.balanceOf.returns(token2Bal);
            await token2.mock.approve.returns(true);

            await tradeWallet.connect(manager).deposit([token1.address, token2.address], [token1Bal, token2Bal]);
            const registeredTokensDeposit = await tradeWallet.connect(deployer).getTokens();
            expect(registeredTokensDeposit.length).to.equal(2);

            // balance mocked to 1 in order to prevent removal of tokens
            await token1.mock.transfer.returns(true);
            await token1.mock.balanceOf.returns(1);
            await token2.mock.transfer.returns(true);
            await token2.mock.balanceOf.returns(1);

            await tradeWallet.connect(manager).withdraw([token1.address, token2.address], [token1Bal, token2Bal]);

            const registeredTokensWithdraw = await tradeWallet.connect(deployer).getTokens();
            expect(registeredTokensWithdraw.length).to.equal(2);
        });

        it.skip("withdraw succeeds by manager and zero's out token list", async () => {
            const token1Bal = 10;
            await token1.mock.transferFrom.returns(true);
            await token1.mock.allowance.returns(0);
            await token1.mock.balanceOf.returns(token1Bal);
            await token1.mock.approve.returns(true);

            const token2Bal = 20;
            await token2.mock.transferFrom.returns(true);
            await token2.mock.allowance.returns(0);
            await token2.mock.balanceOf.returns(token2Bal);
            await token2.mock.approve.returns(true);

            await tradeWallet.connect(manager).deposit([token1.address, token2.address], [token1Bal, token2Bal]);
            const registeredTokensDeposit = await tradeWallet.connect(deployer).getTokens();
            expect(registeredTokensDeposit.length).to.equal(2);

            // balance mocked to 0 in order to remove tokens
            await token1.mock.transfer.returns(true);
            await token1.mock.balanceOf.returns(0);
            await token2.mock.transfer.returns(true);
            await token2.mock.balanceOf.returns(0);

            await tradeWallet.connect(manager).withdraw([token1.address, token2.address], [token1Bal, token2Bal]);

            const registeredTokensWithdraw = await tradeWallet.connect(deployer).getTokens();
            expect(registeredTokensWithdraw.length).to.equal(0);
        });

        it("Reverts when non-whitelisted token address passed in", async () => {
            await token3.mock.transferFrom.returns(true);
            await token3.mock.allowance.returns(10);
            await token3.mock.balanceOf.returns(10);

            await expect(tradeWallet.connect(manager).withdraw([token3.address], [10])).to.be.revertedWith(
                "ADDRESS_NOT_WHITELISTED"
            );
        });
    });

    describe("Signer Authorization", () => {
        it("fails when registering signer as 0 address", async () => {
            await expect(
                tradeWallet.connect(deployer).registerAllowedOrderSigner(AddressZero, true)
            ).to.be.revertedWith("INVALID_SIGNER");
        });

    });
});
