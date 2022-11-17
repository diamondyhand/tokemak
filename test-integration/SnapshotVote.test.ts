import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import * as timeMachine from "ganache-time-traveler";
import {ethers, network} from "hardhat";
import {Staking, SnapshotToke, ERC20, DelegateFunction} from "../typechain";
import {Environment, getContractAddressByEnvironmentAndName, Contract} from "../scripts/config";
import {fundAccount} from "./utilities/fundAccount";
import {BigNumber} from "ethers";

const TokeAmount = (amount: number) => {
    return ethers.utils.parseEther(amount.toString());
};

describe("Snapshot Toke", () => {
    const DEFAULT_USER1_AMOUNT_RAW = 10000;
    const DEFAULT_USER1_AMOUNT = TokeAmount(DEFAULT_USER1_AMOUNT_RAW);
    const DEFAULT_USER3_AMOUNT = TokeAmount(DEFAULT_USER1_AMOUNT_RAW);
    const DEPLOYER_TOKE_AT_BLOCK = BigNumber.from("6315245969000000000");
    const DEPLOYER_STAKING_AT_BLOCK = BigNumber.from("7150000000000000000");
    const VOTE_FUNCTION_ID = ethers.utils.formatBytes32String("voting");

    let snapshotToke: SnapshotToke;
    let snapshotId: string;
    let deployer: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;
    let staking: Staking;
    let toke: ERC20;
    let delegation: DelegateFunction;

    let startBlock: number;

    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot.result as string;
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    before(async () => {
        startBlock = await ethers.provider.getBlockNumber();
        await network.provider.request({
            method: "hardhat_reset",
            params: [
                {
                    forking: {
                        jsonRpcUrl: "https://eth-mainnet.alchemyapi.io/v2/" + process.env.ALCHEMY_API_KEY,
                        blockNumber: 14844035,
                    },
                },
            ],
        });

        [, user1, user2, user3] = await ethers.getSigners();
        deployer = await getImpersonatedSigner("0x9e0bcE7ec474B481492610eB9dd5D69EB03718D5");

        const ENV = Environment.MAINNET;
        const stakingAddress = getContractAddressByEnvironmentAndName(ENV, Contract.STAKING);
        const tokeAddress = getContractAddressByEnvironmentAndName(ENV, Contract.TOKE);
        const delegateAddress = getContractAddressByEnvironmentAndName(ENV, Contract.DELEGATE);
        const snapshotTokeFactory = await ethers.getContractFactory("SnapshotToke", deployer);
        snapshotToke = await snapshotTokeFactory.deploy(
            getContractAddressByEnvironmentAndName(ENV, Contract.SUSHI_POOL),
            stakingAddress,
            delegateAddress,
            tokeAddress
        );

        staking = await ethers.getContractAt("Staking", stakingAddress);
        toke = await ethers.getContractAt("Toke", tokeAddress);
        delegation = await ethers.getContractAt("DelegateFunction", delegateAddress);

        await fundAccount("TOKE", user1.address, DEFAULT_USER1_AMOUNT_RAW * 2);
        await toke.connect(user1).transfer(user3.address, DEFAULT_USER1_AMOUNT);
    });

    after(async () => {
        await network.provider.request({
            method: "hardhat_reset",
            params: [
                {
                    forking: {
                        jsonRpcUrl: "https://eth-mainnet.alchemyapi.io/v2/" + process.env.ALCHEMY_API_KEY,
                        blockNumber: startBlock,
                    },
                },
            ],
        });
    });

    describe("Simple Wallet Balance Checks", async () => {
        it("Has a balance in wallet", async () => {
            const bal = await snapshotToke.balanceOf(user1.address);
            expect(bal).to.be.equal(DEFAULT_USER1_AMOUNT);
        });
        it("Has a balance in wallet - deployer", async () => {
            const bal = await snapshotToke.balanceOf(deployer.address);
            expect(bal).to.be.equal(DEPLOYER_TOKE_AT_BLOCK.add(DEPLOYER_STAKING_AT_BLOCK));
        });
        it("Does not have a balance in wallet", async () => {
            const bal = await snapshotToke.balanceOf(user2.address);
            expect(bal).to.be.equal(TokeAmount(0));
        });
        it("Has a balance in staking schedule 0", async () => {
            const amount = TokeAmount(1);
            await staking.connect(deployer).depositFor(user2.address, amount, 0);
            const bal = await snapshotToke.balanceOf(user2.address);
            expect(bal).to.be.equal(amount);
        });
        it("Has a balance in staking schedule 1", async () => {
            const amount = TokeAmount(1);
            await staking.connect(deployer).depositFor(user2.address, amount, 1);
            const bal = await snapshotToke.balanceOf(user2.address);
            expect(bal).to.be.equal(amount);
        });
        it("Has a balance in both staking schedule 0 and 1", async () => {
            const amount = TokeAmount(1);
            await staking.connect(deployer).depositFor(user2.address, amount, 0);
            await staking.connect(deployer).depositFor(user2.address, amount, 1);
            const bal = await snapshotToke.balanceOf(user2.address);
            expect(bal).to.be.equal(amount.mul(2));
        });
        it("Has a balance in wallet and in staking schedule 0", async () => {
            const amount = TokeAmount(1);
            await staking.connect(deployer).depositFor(user1.address, amount, 0);
            const bal = await snapshotToke.balanceOf(user1.address);
            expect(bal).to.be.equal(amount.add(DEFAULT_USER1_AMOUNT));
        });
        it("Has a balance in wallet and in staking schedule 1", async () => {
            const amount = TokeAmount(1);
            await staking.connect(deployer).depositFor(user1.address, amount, 1);
            const bal = await snapshotToke.balanceOf(user1.address);
            expect(bal).to.be.equal(amount.add(DEFAULT_USER1_AMOUNT));
        });
        it("Has a balance in wallet and in both staking schedule 0 and 1", async () => {
            const amount = TokeAmount(1);
            await staking.connect(deployer).depositFor(user1.address, amount, 0);
            await staking.connect(deployer).depositFor(user1.address, amount, 1);
            const bal = await snapshotToke.balanceOf(user1.address);
            expect(bal).to.be.equal(amount.mul(2).add(DEFAULT_USER1_AMOUNT));
        });
    });

    describe("Multiple delegations to single account", () => {
        it("Adds up multiple delegations", async () => {
            // Setup two delegations to user 2
            await delegation.connect(deployer).unpause();

            await delegation.connect(user1).delegate([
                {
                    functionId: VOTE_FUNCTION_ID,
                    otherParty: user2.address,
                    mustRelinquish: false,
                },
            ]);

            await delegation.connect(user3).delegate([
                {
                    functionId: VOTE_FUNCTION_ID,
                    otherParty: user2.address,
                    mustRelinquish: false,
                },
            ]);

            const user2BalBefore = await snapshotToke.balanceOf(user2.address);

            // Have user 2 accept those delegations
            await delegation.connect(user2).acceptDelegation([
                {
                    originalParty: user1.address,
                    functionId: VOTE_FUNCTION_ID,
                },
                {
                    originalParty: user3.address,
                    functionId: VOTE_FUNCTION_ID,
                },
            ]);
            await expect(
                snapshotToke
                    .connect(user1)
                    .addDelegations([user1.address, user3.address], [user2.address, user2.address])
            ).to.be.revertedWith("Ownable: caller is not the owner");
            await snapshotToke
                .connect(deployer)
                .addDelegations([user1.address, user3.address], [user2.address, user2.address]);

            const user2BalAfter = await snapshotToke.balanceOf(user2.address);

            expect(user2BalBefore).to.be.equal(BigNumber.from(0));
            expect(user2BalAfter).to.be.equal(DEFAULT_USER1_AMOUNT.add(DEFAULT_USER1_AMOUNT));

            await expect(
                snapshotToke
                    .connect(user1)
                    .removeDelegations([user1.address, user3.address], [user2.address, user2.address])
            ).to.be.revertedWith("Ownable: caller is not the owner");
            await snapshotToke.connect(deployer).removeDelegations([user1.address], [user2.address]);

            const user1BalAfterRemovalRound1 = await snapshotToke.balanceOf(user1.address);
            const user2BalAfterRemovalRound1 = await snapshotToke.balanceOf(user2.address);
            const user3BalAfterRemovalRound1 = await snapshotToke.balanceOf(user3.address);

            expect(user1BalAfterRemovalRound1).to.be.equal(DEFAULT_USER1_AMOUNT);
            expect(user2BalAfterRemovalRound1).to.be.equal(DEFAULT_USER3_AMOUNT);
            expect(user3BalAfterRemovalRound1).to.be.equal(BigNumber.from(0));

            await snapshotToke.connect(deployer).removeDelegations([user3.address], [user2.address]);

            const user1BalAfterRemovalRound2 = await snapshotToke.balanceOf(user1.address);
            const user2BalAfterRemovalRound2 = await snapshotToke.balanceOf(user2.address);
            const user3BalAfterRemovalRound2 = await snapshotToke.balanceOf(user3.address);

            expect(user1BalAfterRemovalRound2).to.be.equal(DEFAULT_USER1_AMOUNT);
            expect(user2BalAfterRemovalRound2).to.be.equal(BigNumber.from(0));
            expect(user3BalAfterRemovalRound2).to.be.equal(DEFAULT_USER3_AMOUNT);
        });
    });

    describe("Delegation Calculation", () => {
        const SOURCE_WALLET = "0x623FbEa50b12eCb9e730D07ec745Bd7B090b292F";
        const SOURCE_BALANCE = ethers.BigNumber.from("169799000000000000000000");
        const DELEGATED_TO_WALLET = "0xD80fD2bc63Af1999d4dEd29F835b7613dBd1252D";

        it("Only delegates balance when setup", async () => {
            const originalBalance = await snapshotToke.balanceOf(SOURCE_WALLET);
            const sourceBefore = await snapshotToke.balanceOf(DELEGATED_TO_WALLET);

            await snapshotToke.connect(deployer).addDelegation(SOURCE_WALLET, DELEGATED_TO_WALLET);

            const delegatedBalanceAfter = await snapshotToke.balanceOf(DELEGATED_TO_WALLET);

            expect(sourceBefore).to.be.equal(BigNumber.from(0));
            expect(originalBalance).to.be.equal(SOURCE_BALANCE);
            expect(delegatedBalanceAfter).to.be.equal(SOURCE_BALANCE);
        });

        it("Zeroes balance of originator when delegated", async () => {
            const delegatedBalanceBefore = await snapshotToke.balanceOf(DELEGATED_TO_WALLET);

            await snapshotToke.connect(deployer).addDelegation(SOURCE_WALLET, DELEGATED_TO_WALLET);

            const sourceBalAfter = await snapshotToke.balanceOf(SOURCE_WALLET);

            expect(delegatedBalanceBefore).to.be.equal(BigNumber.from(0));
            expect(sourceBalAfter).to.be.equal(BigNumber.from(0));
        });

        it("Stops delegating when source delegation is removed", async () => {
            // Get balance before delegating
            const originalBalance = await snapshotToke.balanceOf(SOURCE_WALLET);

            // Delegate the balance away
            await snapshotToke.connect(deployer).addDelegation(SOURCE_WALLET, DELEGATED_TO_WALLET);

            // Get balance of account we delegated to
            const delegatedBalanceAfter = await snapshotToke.balanceOf(DELEGATED_TO_WALLET);

            expect(originalBalance).to.be.equal(SOURCE_BALANCE);
            expect(delegatedBalanceAfter).to.be.equal(SOURCE_BALANCE);

            // Remove delegation from delegate function source
            const sourceWalletSigner = await getImpersonatedSigner(SOURCE_WALLET);
            await delegation.connect(deployer).unpause();
            await delegation.connect(sourceWalletSigner).removeDelegation([VOTE_FUNCTION_ID]);

            //
            const sourceBalanceAfterRemoval = await snapshotToke.balanceOf(SOURCE_WALLET);
            const delegatedBalanceAfterRemoval = await snapshotToke.balanceOf(DELEGATED_TO_WALLET);

            expect(sourceBalanceAfterRemoval).to.be.equal(SOURCE_BALANCE);
            expect(delegatedBalanceAfterRemoval).to.be.equal(BigNumber.from(0));
        });

        it("Stops delegating when local delegation is removed", async () => {
            // Get balance before delegating
            const originalBalance = await snapshotToke.balanceOf(SOURCE_WALLET);

            // Delegate the balance away
            await snapshotToke.connect(deployer).addDelegation(SOURCE_WALLET, DELEGATED_TO_WALLET);

            // Get balance of account we delegated to
            const delegatedBalanceAfter = await snapshotToke.balanceOf(DELEGATED_TO_WALLET);

            expect(originalBalance).to.be.equal(SOURCE_BALANCE);
            expect(delegatedBalanceAfter).to.be.equal(SOURCE_BALANCE);

            // Remove delegation from delegation locally
            await snapshotToke.connect(deployer).removeDelegation(SOURCE_WALLET, DELEGATED_TO_WALLET);

            const sourceBalanceAfterRemoval = await snapshotToke.balanceOf(SOURCE_WALLET);
            const delegatedBalanceAfterRemoval = await snapshotToke.balanceOf(DELEGATED_TO_WALLET);

            expect(sourceBalanceAfterRemoval).to.be.equal(SOURCE_BALANCE);
            expect(delegatedBalanceAfterRemoval).to.be.equal(BigNumber.from(0));
        });

        it("Stops delegating when a delegation that was setup is removed and is re-added but is still pending", async () => {
            // Get balance before delegating
            const originalBalance = await snapshotToke.balanceOf(SOURCE_WALLET);

            // Delegate the balance away
            await snapshotToke.connect(deployer).addDelegation(SOURCE_WALLET, DELEGATED_TO_WALLET);

            // Get balance of account we delegated to
            const delegatedBalanceAfter = await snapshotToke.balanceOf(DELEGATED_TO_WALLET);

            expect(originalBalance).to.be.equal(SOURCE_BALANCE);
            expect(delegatedBalanceAfter).to.be.equal(SOURCE_BALANCE);

            // Remove delegation from delegate function source
            const sourceWalletSigner = await getImpersonatedSigner(SOURCE_WALLET);
            await delegation.connect(deployer).unpause();
            await delegation.connect(sourceWalletSigner).removeDelegation([VOTE_FUNCTION_ID]);

            //Ensure balances went back to original wallets
            const sourceBalanceAfterRemoval = await snapshotToke.balanceOf(SOURCE_WALLET);
            const delegatedBalanceAfterRemoval = await snapshotToke.balanceOf(DELEGATED_TO_WALLET);

            expect(sourceBalanceAfterRemoval).to.be.equal(SOURCE_BALANCE);
            expect(delegatedBalanceAfterRemoval).to.be.equal(BigNumber.from(0));

            // Setup the delegation again, so it should still be pending
            await delegation.connect(sourceWalletSigner).delegate([
                {
                    otherParty: DELEGATED_TO_WALLET,
                    functionId: VOTE_FUNCTION_ID,
                    mustRelinquish: false,
                },
            ]);

            // Still pending so balances should still be original wallets
            const sourceBalanceAfterReAddButPending = await snapshotToke.balanceOf(SOURCE_WALLET);
            const delegatedBalanceAfterReAddButPending = await snapshotToke.balanceOf(DELEGATED_TO_WALLET);

            expect(sourceBalanceAfterReAddButPending).to.be.equal(SOURCE_BALANCE);
            expect(delegatedBalanceAfterReAddButPending).to.be.equal(BigNumber.from(0));

            // Accept the delegation
            const delegatedWalletSigner = await getImpersonatedSigner(DELEGATED_TO_WALLET);
            await delegation.connect(delegatedWalletSigner).acceptDelegation([
                {
                    originalParty: SOURCE_WALLET,
                    functionId: VOTE_FUNCTION_ID,
                },
            ]);

            // Delegation is valid again, balance should show up in the delegated to wallet
            const sourceBalanceAfterReAdd = await snapshotToke.balanceOf(SOURCE_WALLET);
            const delegatedBalanceAfterReAdd = await snapshotToke.balanceOf(DELEGATED_TO_WALLET);

            expect(sourceBalanceAfterReAdd).to.be.equal(BigNumber.from(0));
            expect(delegatedBalanceAfterReAdd).to.be.equal(SOURCE_BALANCE);
        });
    });

    describe("Delegation Management", () => {
        const SOURCE_WALLET = "0x2F98b68ecfaD1DCd797AEdBCd4d8015f217203e1";
        const DELEGATED_TO_WALLET = "0x22F2ea96BC91F1Eb9d232B60b3DA9c2F04776905";

        it("Allows delegations that are backed by DelegateFunction contract", async () => {
            await expect(snapshotToke.connect(deployer).addDelegation(SOURCE_WALLET, DELEGATED_TO_WALLET)).to.not.be
                .reverted;
        });

        it("Emits event on successfull setup", async () => {
            await expect(snapshotToke.connect(deployer).addDelegation(SOURCE_WALLET, DELEGATED_TO_WALLET))
                .to.emit(snapshotToke, "DelegationSetup")
                .withArgs(SOURCE_WALLET, DELEGATED_TO_WALLET, deployer.address);
        });

        it("Only allows owner to setup delegations", async () => {
            await expect(
                snapshotToke.connect(user1).addDelegation(SOURCE_WALLET, DELEGATED_TO_WALLET)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Does not allow address 0's for consideration on setup", async () => {
            await expect(
                snapshotToke.connect(deployer).addDelegation(ethers.constants.AddressZero, SOURCE_WALLET)
            ).to.be.revertedWith("INVALID_FROM");
            await expect(
                snapshotToke.connect(deployer).addDelegation(SOURCE_WALLET, ethers.constants.AddressZero)
            ).to.be.revertedWith("INVALID_TO");
        });

        it("Prevents delegations that have a mismatch otherParty", async () => {
            await expect(snapshotToke.connect(deployer).addDelegation(SOURCE_WALLET, user1.address)).to.be.revertedWith(
                "INVALID_DELEGATION"
            );
        });

        it("Prevents delegations that have no match at all", async () => {
            await expect(snapshotToke.connect(deployer).addDelegation(user1.address, user2.address)).to.be.revertedWith(
                "INVALID_DELEGATION"
            );
        });

        it("Prevents duplicate delegations", async () => {
            await expect(snapshotToke.connect(deployer).addDelegation(SOURCE_WALLET, DELEGATED_TO_WALLET)).to.not.be
                .reverted;
            await expect(
                snapshotToke.connect(deployer).addDelegation(SOURCE_WALLET, DELEGATED_TO_WALLET)
            ).to.be.revertedWith("ALREADY_ADDED");
        });

        it("Prevents delegations that are still pending", async () => {
            await delegation.connect(deployer).unpause();
            await delegation.connect(user1).delegate([
                {
                    functionId: VOTE_FUNCTION_ID,
                    otherParty: user2.address,
                    mustRelinquish: false,
                },
            ]);

            await expect(snapshotToke.connect(deployer).addDelegation(user1.address, user2.address)).to.be.revertedWith(
                "DELEGATION_PENDING"
            );

            await delegation.connect(user2).acceptDelegation([
                {
                    originalParty: user1.address,
                    functionId: VOTE_FUNCTION_ID,
                },
            ]);

            await expect(snapshotToke.connect(deployer).addDelegation(user1.address, user2.address)).to.not.be.reverted;
        });

        it("Does not allow address 0's for consideration on removal", async () => {
            await expect(
                snapshotToke.connect(deployer).removeDelegation(ethers.constants.AddressZero, SOURCE_WALLET)
            ).to.be.revertedWith("INVALID_FROM");
            await expect(
                snapshotToke.connect(deployer).removeDelegation(SOURCE_WALLET, ethers.constants.AddressZero)
            ).to.be.revertedWith("INVALID_TO");
        });

        it("Requires mapping to be setup for removal", async () => {
            await snapshotToke.connect(deployer).addDelegation(SOURCE_WALLET, DELEGATED_TO_WALLET);

            await expect(snapshotToke.connect(deployer).removeDelegation(SOURCE_WALLET, DELEGATED_TO_WALLET)).to.not.be
                .reverted;

            await expect(
                snapshotToke.connect(deployer).removeDelegation(SOURCE_WALLET, user1.address)
            ).to.be.revertedWith("DOES_NOT_EXIST");
        });

        it("Only allows owner to remove", async () => {
            await snapshotToke.connect(deployer).addDelegation(SOURCE_WALLET, DELEGATED_TO_WALLET);

            await expect(
                snapshotToke.connect(user1).removeDelegation(SOURCE_WALLET, DELEGATED_TO_WALLET)
            ).to.be.revertedWith("Ownable: caller is not the owner");

            await expect(snapshotToke.connect(deployer).removeDelegation(SOURCE_WALLET, DELEGATED_TO_WALLET)).to.not.be
                .reverted;
        });

        it("Emits event on successful removal", async () => {
            await snapshotToke.connect(deployer).addDelegation(SOURCE_WALLET, DELEGATED_TO_WALLET);

            await expect(snapshotToke.connect(deployer).removeDelegation(SOURCE_WALLET, DELEGATED_TO_WALLET))
                .to.emit(snapshotToke, "DelegationRemoved")
                .withArgs(SOURCE_WALLET, DELEGATED_TO_WALLET, deployer.address);

            await expect(
                snapshotToke.connect(deployer).removeDelegation(SOURCE_WALLET, user1.address)
            ).to.be.revertedWith("DOES_NOT_EXIST");
        });
    });

    describe("Sushi Pool Checks", () => {
        const TEST_USER_SUSHI_LP = "0xecdb932301bd2db3aa798c43feb46e0e55547929";
        const TEST_USER_SUSHI_LP_TOKE_BALANCE = ethers.BigNumber.from("277088108925063286380792");

        it("Has staked SUSHI LP and gives balances", async () => {
            //Uni pool has  4,224,418.602314165476570158 TOKE at this point
            //Total Supply of UNI Pool is 188621.808533564388543745
            //User has staked 12372.083628255891165038
            //That's 6.559201% of the pool
            //4,224,418.602314165476570158 * 6.559201% = 277088.107207177

            const bal = await snapshotToke.balanceOf(TEST_USER_SUSHI_LP);
            expect(bal).to.be.equal(TEST_USER_SUSHI_LP_TOKE_BALANCE);
        });

        it("Has staked SUSHI LP, wallet, and staking schedule 0 balance", async () => {
            const amount = TokeAmount(1);
            await staking.connect(deployer).depositFor(TEST_USER_SUSHI_LP, amount, 0);
            await toke.connect(deployer).transfer(TEST_USER_SUSHI_LP, amount);

            const bal = await snapshotToke.balanceOf(TEST_USER_SUSHI_LP);
            expect(bal).to.be.equal(TEST_USER_SUSHI_LP_TOKE_BALANCE.add(amount.mul(2)));
        });

        it("Has staked SUSHI LP and staking schedule 0 balance", async () => {
            const amount = TokeAmount(1);
            await staking.connect(deployer).depositFor(TEST_USER_SUSHI_LP, amount, 0);

            const bal = await snapshotToke.balanceOf(TEST_USER_SUSHI_LP);
            expect(bal).to.be.equal(TEST_USER_SUSHI_LP_TOKE_BALANCE.add(amount));
        });

        it("Has staked SUSHI LP and staking schedule 1 balance", async () => {
            const amount = TokeAmount(1);
            await staking.connect(deployer).depositFor(TEST_USER_SUSHI_LP, amount, 1);

            const bal = await snapshotToke.balanceOf(TEST_USER_SUSHI_LP);
            expect(bal).to.be.equal(TEST_USER_SUSHI_LP_TOKE_BALANCE.add(amount));
        });

        it("Has staked SUSHI LP and staking schedule 0 and 1 balance and wallet", async () => {
            const amount = TokeAmount(1);
            await staking.connect(deployer).depositFor(TEST_USER_SUSHI_LP, amount, 0);
            await staking.connect(deployer).depositFor(TEST_USER_SUSHI_LP, amount, 1);
            await toke.connect(deployer).transfer(TEST_USER_SUSHI_LP, amount);

            const bal = await snapshotToke.balanceOf(TEST_USER_SUSHI_LP);
            expect(bal).to.be.equal(TEST_USER_SUSHI_LP_TOKE_BALANCE.add(amount.mul(3)));
        });
    });
});

async function getImpersonatedSigner(address: string): Promise<SignerWithAddress> {
    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address],
    });

    await network.provider.send("hardhat_setBalance", [
        address,
        "0x3635c9adc5dea00000", // 1000 eth
    ]);

    return ethers.getSigner(address);
}
