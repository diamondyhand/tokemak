// import { Assertion, expect } from "chai";
// import * as timeMachine from "ganache-time-traveler";
// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import { artifacts, ethers, waffle, upgrades } from "hardhat";
// import { VoteTracker } from "../typechain";
// import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
// import { BaseContract, Signer, Wallet } from "ethers";
// import { MockContract } from "ethereum-waffle";
// import {
//     getTokenMultiplier,
//     personalSignVote,
//     Signature,
//     signVote,
//     UserVoteAllocationItem,
//     UserVotePayload,
//     VoteAmount,
//     VoteTokenMultiplier,
// } from "../test-integration/utilities/vote";

// Assertion.addMethod("withManuallyValidatedArgs", function (x, validate) {
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const derivedPromise = (this as any).promise.then(() => {
//         // eslint-disable-next-line @typescript-eslint/no-this-alias
//         const g = this;
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         const values = (g as any).logs.map((l: any) => {
//             return x.interface.parseLog(l).args;
//         });
//         for (let i = 0; i < values.length; i++) {
//             validate(values[i]);
//         }
//     });
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     (this as any).then = derivedPromise.then.bind(derivedPromise);
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     (this as any).catch = derivedPromise.catch.bind(derivedPromise);
//     return this;
// });
// declare global {
//     // eslint-disable-next-line @typescript-eslint/no-namespace
//     export namespace Chai {
//         interface EmitAssertion {
//             withManuallyValidatedArgs<T extends BaseContract & { filters: unknown }>(
//                 contract: T,
//                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                 checker: (ar: any[]) => void
//             ): Promise<void>;
//         }
//     }
// }

// const { deployMockContract } = waffle;
// const ERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/ERC20.sol");
// const IBalanceTracker = artifacts.require("IBalanceTracker");
// const ZERO_ADDRESS = ethers.constants.AddressZero;

// let deployer: SignerWithAddress;
// let eventProxy: SignerWithAddress;
// let voteToken1: SignerWithAddress;
// let voteToken2: SignerWithAddress;
// let proxySubmitter: SignerWithAddress;
// let nonProxySubmitter: SignerWithAddress;
// let other: SignerWithAddress;
// let voteTracker: VoteTracker;
// let snapshotId: string;

// const reactor1Key: string = ethers.utils.formatBytes32String("token1");
// const reactor2Key: string = ethers.utils.formatBytes32String("token2");
// const reactor3Key: string = ethers.utils.formatBytes32String("token3");
// const reactor4Key: string = ethers.utils.formatBytes32String("token4");
// const initialVoteSession: string = ethers.utils.formatBytes32String("1");

// const multiplier1 = 1;
// const multiplier2 = 0.5;
// let voteMultiplier1: VoteTokenMultiplier;
// let voteMultiplier2: VoteTokenMultiplier;

// let asset1: MockContract;
// let asset2: MockContract;
// let asset3: MockContract;
// let asset4: MockContract;

// let balanceTracker: MockContract;

// const voterWallet1Public = "0x8b2dd881e7991020acb8754f8e997c951099a6a1";
// const voterWallet1 = new ethers.Wallet(
//     "0x1a6cfb855acda05003dfe3992997bb17da824ea1fc6057674b27f5cc739e7864",
//     ethers.provider
// );

// const voterWallet2Public = "0xa53f5e2ae31c4a3c506485a55a0a2fa09973ce8b";
// const voterWallet2 = new ethers.Wallet(
//     "0x1e61f28b0175f32ad0a82cb763b53509f8d0389e58639912b29aa4c82669327a",
//     ethers.provider
// );

// const voterWallet3Public = "0x6800cb2d1ef216993a3b87c69b536b32d1a0d64a";
// const voterWallet3 = new ethers.Wallet(
//     "0xf16c6889261e333af2db8cd9d3fa88c8ef7d0abd4cffff184cd83be080013c4a",
//     ethers.provider
// );

// describe("Test VoteTracker", () => {
//     beforeEach(async () => {
//         const snapshot = await timeMachine.takeSnapshot();
//         snapshotId = snapshot["result"] as string;
//     });

//     afterEach(async () => {
//         await timeMachine.revertToSnapshot(snapshotId);
//     });

//     before(async () => {
//         [deployer, eventProxy, voteToken1, voteToken2, proxySubmitter, nonProxySubmitter, other] =
//             await ethers.getSigners();

//         voteMultiplier1 = getTokenMultiplier(voteToken1.address, multiplier1);
//         voteMultiplier2 = getTokenMultiplier(voteToken2.address, multiplier2);

//         balanceTracker = await deployMockContract(deployer, IBalanceTracker.abi);

//         asset1 = await deployMockContract(deployer, ERC20.abi);
//         asset2 = await deployMockContract(deployer, ERC20.abi);
//         asset3 = await deployMockContract(deployer, ERC20.abi);
//         asset4 = await deployMockContract(deployer, ERC20.abi);

//         const voteTrackerFactory = await ethers.getContractFactory("VoteTracker");

//         voteTracker = (await upgrades.deployProxy(
//             voteTrackerFactory,
//             [eventProxy.address, initialVoteSession, balanceTracker.address, 1, [voteMultiplier1, voteMultiplier2]],
//             {
//                 unsafeAllow: ["state-variable-assignment", "state-variable-immutable"],
//             }
//         )) as VoteTracker;

//         await voteTracker.connect(deployer).setReactorKeys(
//             [
//                 { token: asset1.address, key: reactor1Key },
//                 { token: asset2.address, key: reactor2Key },
//             ],
//             true
//         );

//         await voteTracker.connect(deployer).setProxySubmitters([proxySubmitter.address], true);
//     });

//     describe("Constructor", () => {
//         it("should revert when vote tokens are empty", async () => {
//             const voteTrackerFactory = await ethers.getContractFactory("VoteTracker");
//             await expect(
//                 upgrades.deployProxy(
//                     voteTrackerFactory,
//                     [eventProxy.address, initialVoteSession, balanceTracker.address, 1, []],
//                     {
//                         unsafeAllow: ["state-variable-assignment", "state-variable-immutable"],
//                     }
//                 )
//             ).to.be.revertedWith("NO_VOTE_TOKENS");
//         });
//         it("Saves the currentVoteSessionKey it was given", async () => {
//             const settings = await voteTracker.getSettings();
//             expect(settings.voteSessionKey).to.be.equal(initialVoteSession);
//         });

//         it("Saves the voting tokens", async () => {
//             const votingTokens = await voteTracker.getVotingTokens();
//             expect(votingTokens.length).to.be.equal(2);
//             expect(votingTokens).to.contain(voteToken1.address);
//             expect(votingTokens).to.contain(voteToken1.address);
//         });

//         it("Saves the reactorKeys it was given as allowed", async () => {
//             const keys = await voteTracker.getReactorKeys();

//             const key1 = keys.filter((x) => x == reactor1Key);
//             const key2 = keys.filter((x) => x == reactor2Key);

//             expect(keys.length).to.be.equal(2);
//             expect(key1.length).to.be.equal(1);
//             expect(key2.length).to.be.equal(1);
//         });

//         it("Saves the voteMultipliers it was given", async () => {
//             const token1 = await voteTracker.votingTokens(0);
//             const token2 = await voteTracker.votingTokens(1);
//             const multi1 = await voteTracker.voteMultipliers(voteMultiplier1.token);
//             const multi2 = await voteTracker.voteMultipliers(voteMultiplier2.token);

//             expect(token1).to.be.equal(voteMultiplier1.token);
//             expect(token2).to.be.equal(voteMultiplier2.token);
//             expect(multi1).to.be.equal(voteMultiplier1.multiplier);
//             expect(multi2).to.be.equal(voteMultiplier2.multiplier);
//         });

//         it("Sets the domain hash", async () => {
//             const separator = await voteTracker.currentDomainSeparator();
//             expect(separator.length).to.be.greaterThan(0);
//         });

//         it("Sets the current signing chain id", async () => {
//             const separator = await voteTracker.currentSigningChainId();
//             expect(separator).to.be.equal("1");
//         });

//         //TODO: Proxy Submitter
//         //Probably want to actually remove and do this as a separate call
//         //so that we can have multiple easily

//         it("Saves the balance tracker address it was given", async () => {
//             const settings = await voteTracker.settings();
//             expect(settings.balanceTrackerAddress).to.be.equal(balanceTracker.address);
//         });
//     });

//     describe("Voting multipliers", () => {
//         it("Set the voting token", async () => {
//             await expect(voteTracker.setVoteMultiplers([voteMultiplier1, voteMultiplier2])).to.emit(
//                 voteTracker,
//                 "VoteMultipliersSet"
//             );
//         });

//         it("Should revert when duplicates are submitted", async () => {
//             await expect(voteTracker.setVoteMultiplers([voteMultiplier1, voteMultiplier1])).to.be.revertedWith(
//                 "ALREADY_EXISTS"
//             );
//         });
//     });

//     describe("Voting Validation", () => {
//         it("Validates the signer against the account in the payload", async () => {
//             await mockBalanceTrackerWithZeroAmounts();

//             //Good Payload
//             const goodVote = defaultVote(0, 31337, initialVoteSession, 0);
//             const votePayload = signVote(voteTracker.address, goodVote, voterWallet1.privateKey);
//             await vote(voteTracker, proxySubmitter, goodVote, votePayload);

//             //Bad Payload
//             const badVote = defaultVote(1, 31337, initialVoteSession, 0);
//             const badPayload = signVote(voteTracker.address, badVote, voterWallet2.privateKey);
//             await expect(vote(voteTracker, proxySubmitter, badVote, badPayload)).to.be.revertedWith("MISMATCH_SIGNER");
//         });

//         it("Can sign using 'eth_sign'", async () => {
//             await mockBalanceTrackerWithZeroAmounts();

//             const goodVote = defaultVote(0, 31337, initialVoteSession, 0);
//             const votePayload = personalSignVote(voteTracker.address, goodVote, voterWallet1.privateKey, 1);
//             await vote(voteTracker, proxySubmitter, goodVote, votePayload);
//         });

//         it("Does not allow a message to be sent more than once", async () => {
//             await mockBalanceTrackerWithZeroAmounts();

//             const goodVote = defaultVote(0, 31337, initialVoteSession, 0);
//             const votePayload = signVote(voteTracker.address, goodVote, voterWallet1.privateKey);
//             await voteTracker.connect(proxySubmitter).vote(goodVote, votePayload);

//             await expect(vote(voteTracker, proxySubmitter, goodVote, votePayload)).to.be.revertedWith("INVALID_NONCE");
//         });

//         it("Only allows a vote for the current session", async () => {
//             await mockBalanceTrackerWithZeroAmounts();

//             const goodVote = defaultVote(0, 31337, ethers.utils.formatBytes32String("2"));
//             const votePayload = signVote(voteTracker.address, goodVote, voterWallet1.privateKey);
//             await expect(vote(voteTracker, proxySubmitter, goodVote, votePayload)).to.be.revertedWith(
//                 "NOT_CURRENT_VOTE_SESSION"
//             );
//         });

//         it("Only allows payloads signed for this chain", async () => {
//             await mockBalanceTrackerWithZeroAmounts();

//             const badVote = defaultVote(0, 2, initialVoteSession, 0);
//             const votePayload = signVote(voteTracker.address, badVote, voterWallet1.privateKey);
//             await expect(vote(voteTracker, proxySubmitter, badVote, votePayload)).to.be.revertedWith(
//                 "INVALID_PAYLOAD_CHAIN"
//             );
//         });

//         it("Forces domain chain to match network when its not a proxy submitter", async () => {
//             await mockBalanceTrackerWithZeroAmounts();
//             await fundAccountWithETH(voterWallet1, ethers.provider);

//             const voteObj = defaultVote(0, 31337, initialVoteSession, 0);
//             let votePayload = signVote(voteTracker.address, voteObj, voterWallet1.privateKey, 30);
//             await expect(vote(voteTracker, voterWallet1, voteObj, votePayload)).to.be.revertedWith("MISMATCH_SIGNER");
//             votePayload = signVote(voteTracker.address, voteObj, voterWallet1.privateKey, 1);
//             await expect(vote(voteTracker, voterWallet1, voteObj, votePayload)).to.not.be.reverted;
//         });

//         it("Allows a different 'signed on' chain", async () => {
//             await mockBalanceTrackerWithZeroAmounts();

//             const goodVote = defaultVote(0, 31337, initialVoteSession, 0);
//             const votePayload = signVote(voteTracker.address, goodVote, voterWallet1.privateKey, 1);
//             await expect(vote(voteTracker, proxySubmitter, goodVote, votePayload)).to.not.be.reverted;
//         });

//         it("Enforces rate limit for proxy submissions", async () => {
//             await mockBalanceTrackerWithZeroAmounts();
//             await voteTracker.connect(deployer).setProxyRateLimit(5);

//             const firstVote = defaultVote(0, 31337, initialVoteSession, 0);
//             const votePayload = signVote(voteTracker.address, firstVote, voterWallet1.privateKey);
//             await vote(voteTracker, proxySubmitter, firstVote, votePayload);

//             const secondVote = defaultVote(1, 31337, initialVoteSession, 0);
//             const secondVotePayload = signVote(voteTracker.address, secondVote, voterWallet1.privateKey);
//             await expect(vote(voteTracker, proxySubmitter, secondVote, secondVotePayload)).to.be.revertedWith(
//                 "TOO_FREQUENT_VOTING"
//             );

//             await advanceBlocks(5);

//             await vote(voteTracker, proxySubmitter, secondVote, secondVotePayload);
//         });

//         it("Allows voters paying their own gas to vote as often as they'd like", async () => {
//             await mockBalanceTrackerWithZeroAmounts();
//             await voteTracker.connect(deployer).setProxyRateLimit(10);

//             //Multiple votes as not proxy
//             const firstVote = defaultVote(0, 31337, initialVoteSession, 0);
//             const votePayload = signVote(voteTracker.address, firstVote, voterWallet1.privateKey);
//             await vote(voteTracker, nonProxySubmitter, firstVote, votePayload);

//             const secondVote = defaultVote(1, 31337, initialVoteSession, 0);
//             const secondVotePayload = signVote(voteTracker.address, secondVote, voterWallet1.privateKey);
//             await vote(voteTracker, nonProxySubmitter, secondVote, secondVotePayload);

//             const thirdVote = defaultVote(2, 31337, initialVoteSession, 0);
//             const thirdVotePayload = signVote(voteTracker.address, thirdVote, voterWallet1.privateKey);
//             await vote(voteTracker, nonProxySubmitter, thirdVote, thirdVotePayload);

//             //Proxy Vote
//             const fourthVote = defaultVote(3, 31337, initialVoteSession, 0);
//             const fourthVotePayload = signVote(voteTracker.address, fourthVote, voterWallet1.privateKey);
//             await vote(voteTracker, proxySubmitter, fourthVote, fourthVotePayload);

//             //1 block later, not proxy vote
//             const fifthVote = defaultVote(4, 31337, initialVoteSession, 0);
//             const fifthVoteVotePayload = signVote(voteTracker.address, fifthVote, voterWallet1.privateKey);
//             await vote(voteTracker, nonProxySubmitter, fifthVote, fifthVoteVotePayload);

//             //2 blocks after original proxy, try again, should fail as the limit is 10 blocks
//             const sixthVote = defaultVote(5, 31337, initialVoteSession, 0);
//             const sixthVotePayload = signVote(voteTracker.address, sixthVote, voterWallet1.privateKey);
//             await expect(vote(voteTracker, proxySubmitter, sixthVote, sixthVotePayload)).to.be.revertedWith(
//                 "TOO_FREQUENT_VOTING"
//             );

//             //Same payload as the not proxy submitter should still work
//             await vote(voteTracker, nonProxySubmitter, sixthVote, sixthVotePayload);
//         });

//         it("Ensures the vote totals add up", async () => {
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(100), 0);
//             await voteTracker.connect(deployer).setProxyRateLimit(5);

//             const firstVote = defaultVote(0);
//             firstVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(50),
//             });
//             firstVote.allocations.push({
//                 reactorKey: reactor2Key,
//                 amount: VoteAmount(45),
//             });
//             let votePayload = signVote(voteTracker.address, firstVote, voterWallet1.privateKey);
//             await expect(vote(voteTracker, proxySubmitter, firstVote, votePayload)).to.be.revertedWith(
//                 "VOTE_TOTAL_MISMATCH"
//             );

//             firstVote.allocations[1].amount = VoteAmount(50);
//             votePayload = signVote(voteTracker.address, firstVote, voterWallet1.privateKey);
//             await vote(voteTracker, proxySubmitter, firstVote, votePayload);
//         });

//         it("Ensures vote placement is only to allowed reactors", async () => {
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(100), 0);

//             const firstVote = defaultVote(0);
//             firstVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(50),
//             });
//             firstVote.allocations.push({
//                 reactorKey: ethers.utils.formatBytes32String("token3"),
//                 amount: VoteAmount(50),
//             });
//             const votePayload = signVote(voteTracker.address, firstVote, voterWallet1.privateKey);

//             await expect(vote(voteTracker, proxySubmitter, firstVote, votePayload)).to.be.revertedWith(
//                 "PLACEMENT_NOT_ALLOWED"
//             );
//         });
//     });

//     describe("Vote Persistence", () => {
//         it("User votes and details are saved when user has no previous votes", async () => {
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(100), 0);

//             //100 Votes are in here
//             const firstVote = defaultVote(0);

//             firstVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(40),
//             });
//             firstVote.allocations.push({
//                 reactorKey: reactor2Key,
//                 amount: VoteAmount(60),
//             });
//             const votePayload = signVote(voteTracker.address, firstVote, voterWallet1.privateKey);

//             //Validate starting user info
//             let userVoteDetails = await voteTracker.getUserVotes(firstVote.account);
//             let details = userVoteDetails.details;
//             let votes = userVoteDetails.votes;
//             expect(details.totalUsedVotes).to.be.equal(0);
//             expect(details.totalAvailableVotes).to.be.equal(0);
//             expect(votes.length).to.be.equal(0);

//             //Validate starting system info
//             let systemInfo = await voteTracker.getSystemVotes();
//             validateSystemVotes(systemInfo, initialVoteSession, 0, 0, 0);

//             //Perform 1st system
//             await vote(voteTracker, proxySubmitter, firstVote, votePayload);

//             //Validate ending user info
//             userVoteDetails = await voteTracker.getUserVotes(firstVote.account);
//             details = userVoteDetails.details;
//             votes = userVoteDetails.votes;

//             expect(details.totalUsedVotes).to.be.equal(VoteAmount(100));
//             expect(details.totalAvailableVotes).to.be.equal(VoteAmount(100));
//             expect(votes.length).to.be.equal(2);
//             expect(votes[0].reactorKey).to.be.equal(reactor1Key);
//             expect(votes[0].amount).to.be.equal(VoteAmount(40));
//             expect(votes[1].reactorKey).to.be.equal(reactor2Key);
//             expect(votes[1].amount).to.be.equal(VoteAmount(60));

//             //Validate system info
//             systemInfo = await voteTracker.getSystemVotes();
//             validateSystemVotes(systemInfo, initialVoteSession, 100, 40, 60);
//         });

//         it("User votes and details are updated when user update only one of his votes", async () => {
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(100), 0);

//             //100 Votes are in here
//             const firstVote = defaultVote(0);

//             firstVote.allocations.push(
//                 { reactorKey: reactor1Key, amount: VoteAmount(40) },
//                 { reactorKey: reactor2Key, amount: VoteAmount(60) }
//             );
//             const votePayload = signVote(voteTracker.address, firstVote, voterWallet1.privateKey);

//             //Validate starting user info
//             let userVoteDetails = await voteTracker.getUserVotes(firstVote.account);
//             let details = userVoteDetails.details;
//             let votes = userVoteDetails.votes;
//             expect(details.totalUsedVotes).to.be.equal(0);
//             expect(details.totalAvailableVotes).to.be.equal(0);
//             expect(votes.length).to.be.equal(0);

//             //Validate starting system info
//             let systemInfo = await voteTracker.getSystemVotes();
//             validateSystemVotes(systemInfo, initialVoteSession, 0, 0, 0);

//             //Perform 1st system
//             await vote(voteTracker, proxySubmitter, firstVote, votePayload);

//             //Validate ending user info
//             userVoteDetails = await voteTracker.getUserVotes(firstVote.account);
//             details = userVoteDetails.details;
//             votes = userVoteDetails.votes;

//             expect(details.totalUsedVotes).to.be.equal(VoteAmount(100));
//             expect(details.totalAvailableVotes).to.be.equal(VoteAmount(100));
//             expect(votes.length).to.be.equal(2);
//             expect(votes[0].reactorKey).to.be.equal(reactor1Key);
//             expect(votes[0].amount).to.be.equal(VoteAmount(40));
//             expect(votes[1].reactorKey).to.be.equal(reactor2Key);
//             expect(votes[1].amount).to.be.equal(VoteAmount(60));

//             const secondUserVote = defaultVote(1, 31337, initialVoteSession, 90);
//             secondUserVote.account = voterWallet1Public;
//             secondUserVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(30),
//             });
//             const secondUserVotePayload = signVote(voteTracker.address, secondUserVote, voterWallet1.privateKey);
//             await vote(voteTracker, proxySubmitter, secondUserVote, secondUserVotePayload);

//             userVoteDetails = await voteTracker.getUserVotes(secondUserVote.account);
//             details = userVoteDetails.details;
//             votes = userVoteDetails.votes;

//             expect(details.totalUsedVotes).to.be.equal(VoteAmount(90));
//             expect(details.totalAvailableVotes).to.be.equal(VoteAmount(100));
//             expect(votes.length).to.be.equal(2);
//             expect(votes[0].reactorKey).to.be.equal(reactor1Key);
//             expect(votes[0].amount).to.be.equal(VoteAmount(30));
//             expect(votes[1].reactorKey).to.be.equal(reactor2Key);
//             expect(votes[1].amount).to.be.equal(VoteAmount(60));

//             //Validate system info
//             systemInfo = await voteTracker.getSystemVotes();
//             validateSystemVotes(systemInfo, initialVoteSession, 90, 30, 60);
//         });

//         it("User votes and details are updated during subsequent votes", async () => {
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(100), 0);

//             //100 Votes are in here
//             const firstVote = defaultVote(0);

//             firstVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(40),
//             });
//             firstVote.allocations.push({
//                 reactorKey: reactor2Key,
//                 amount: VoteAmount(60),
//             });
//             const votePayload = signVote(voteTracker.address, firstVote, voterWallet1.privateKey);

//             //Validate starting user info
//             let userVoteDetails = await voteTracker.getUserVotes(firstVote.account);
//             let details = userVoteDetails.details;
//             let votes = userVoteDetails.votes;
//             expect(details.totalUsedVotes).to.be.equal(0);
//             expect(details.totalAvailableVotes).to.be.equal(0);
//             expect(votes.length).to.be.equal(0);

//             //Validate starting system info
//             let systemInfo = await voteTracker.getSystemVotes();
//             validateSystemVotes(systemInfo, initialVoteSession, 0, 0, 0);

//             //Perform 1st vote
//             await vote(voteTracker, proxySubmitter, firstVote, votePayload);

//             //Validate ending user info
//             userVoteDetails = await voteTracker.getUserVotes(firstVote.account);
//             details = userVoteDetails.details;
//             votes = userVoteDetails.votes;

//             expect(details.totalUsedVotes).to.be.equal(VoteAmount(100));
//             expect(details.totalAvailableVotes).to.be.equal(VoteAmount(100));
//             expect(votes.length).to.be.equal(2);
//             expect(votes[0].reactorKey).to.be.equal(reactor1Key);
//             expect(votes[0].amount).to.be.equal(VoteAmount(40));
//             expect(votes[1].reactorKey).to.be.equal(reactor2Key);
//             expect(votes[1].amount).to.be.equal(VoteAmount(60));

//             //Validate system info
//             systemInfo = await voteTracker.getSystemVotes();
//             validateSystemVotes(systemInfo, initialVoteSession, 100, 40, 60);

//             await timeMachine.advanceBlock();
//             await timeMachine.advanceBlock();

//             //Second Vote
//             //100 Votes are in here
//             const secondVote = defaultVote(1);

//             secondVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(30),
//             });
//             secondVote.allocations.push({
//                 reactorKey: reactor2Key,
//                 amount: VoteAmount(70),
//             });

//             const secondVotePayload = signVote(voteTracker.address, secondVote, voterWallet1.privateKey);

//             //Perform 2nd vote
//             await vote(voteTracker, proxySubmitter, secondVote, secondVotePayload);

//             //Validate ending user info
//             userVoteDetails = await voteTracker.getUserVotes(secondVote.account);
//             details = userVoteDetails.details;
//             votes = userVoteDetails.votes;

//             expect(details.totalUsedVotes).to.be.equal(VoteAmount(100));
//             expect(details.totalAvailableVotes).to.be.equal(VoteAmount(100));
//             expect(votes.length).to.be.equal(2);
//             expect(votes[0].reactorKey).to.be.equal(reactor1Key);
//             expect(votes[0].amount).to.be.equal(VoteAmount(30));
//             expect(votes[1].reactorKey).to.be.equal(reactor2Key);
//             expect(votes[1].amount).to.be.equal(VoteAmount(70));

//             //Validate system info
//             systemInfo = await voteTracker.getSystemVotes();
//             validateSystemVotes(systemInfo, initialVoteSession, 100, 30, 70);
//         });

//         it("User votes and details are updated when zero'ing votes when allocations are 0", async () => {
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(100), 0);

//             //100 Votes are in here
//             const firstVote = defaultVote(0);

//             firstVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(40),
//             });
//             firstVote.allocations.push({
//                 reactorKey: reactor2Key,
//                 amount: VoteAmount(60),
//             });
//             const votePayload = signVote(voteTracker.address, firstVote, voterWallet1.privateKey);

//             //Validate starting user info
//             let userVoteDetails = await voteTracker.getUserVotes(firstVote.account);
//             let details = userVoteDetails.details;
//             let votes = userVoteDetails.votes;
//             expect(details.totalUsedVotes).to.be.equal(0);
//             expect(details.totalAvailableVotes).to.be.equal(0);
//             expect(votes.length).to.be.equal(0);

//             //Validate starting system info
//             let systemInfo = await voteTracker.getSystemVotes();
//             validateSystemVotes(systemInfo, initialVoteSession, 0, 0, 0);

//             //Perform 1st vote
//             await vote(voteTracker, proxySubmitter, firstVote, votePayload);

//             //Validate ending user info
//             userVoteDetails = await voteTracker.getUserVotes(firstVote.account);
//             details = userVoteDetails.details;
//             votes = userVoteDetails.votes;

//             expect(details.totalUsedVotes).to.be.equal(VoteAmount(100));
//             expect(details.totalAvailableVotes).to.be.equal(VoteAmount(100));
//             expect(votes.length).to.be.equal(2);
//             expect(votes[0].reactorKey).to.be.equal(reactor1Key);
//             expect(votes[0].amount).to.be.equal(VoteAmount(40));
//             expect(votes[1].reactorKey).to.be.equal(reactor2Key);
//             expect(votes[1].amount).to.be.equal(VoteAmount(60));

//             //Validate system info
//             systemInfo = await voteTracker.getSystemVotes();
//             validateSystemVotes(systemInfo, initialVoteSession, 100, 40, 60);

//             await timeMachine.advanceBlock();
//             await timeMachine.advanceBlock();

//             //Second Vote
//             //100 Votes are in here
//             const secondVote = defaultVote(1);
//             secondVote.totalVotes = "0";
//             secondVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(0),
//             });
//             secondVote.allocations.push({
//                 reactorKey: reactor2Key,
//                 amount: VoteAmount(0),
//             });
//             const secondVotePayload = signVote(voteTracker.address, secondVote, voterWallet1.privateKey);

//             //Perform 2nd vote
//             await vote(voteTracker, proxySubmitter, secondVote, secondVotePayload);

//             //Validate ending user info
//             userVoteDetails = await voteTracker.getUserVotes(secondVote.account);
//             details = userVoteDetails.details;
//             votes = userVoteDetails.votes;

//             expect(details.totalUsedVotes).to.be.equal(VoteAmount(0));
//             expect(details.totalAvailableVotes).to.be.equal(VoteAmount(100));
//             expect(votes.length).to.be.equal(0);
//         });

//         it("System votes are the aggregate of multiple users", async () => {
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(100), 0);

//             //100 Votes are in here
//             const firstUserVote = defaultVote(0);

//             firstUserVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(40),
//             });
//             firstUserVote.allocations.push({
//                 reactorKey: reactor2Key,
//                 amount: VoteAmount(60),
//             });
//             const firstUserVotePayload = signVote(voteTracker.address, firstUserVote, voterWallet1.privateKey);

//             const secondUserVote = defaultVote(0);
//             secondUserVote.account = voterWallet2Public;
//             secondUserVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(10),
//             });
//             secondUserVote.allocations.push({
//                 reactorKey: reactor2Key,
//                 amount: VoteAmount(90),
//             });
//             const secondUserVotePayload = signVote(voteTracker.address, secondUserVote, voterWallet2.privateKey);

//             //Validate starting user info
//             let userVoteDetails = await voteTracker.getUserVotes(firstUserVote.account);
//             let details = userVoteDetails.details;
//             let votes = userVoteDetails.votes;
//             expect(details.totalUsedVotes).to.be.equal(0);
//             expect(details.totalAvailableVotes).to.be.equal(0);
//             expect(votes.length).to.be.equal(0);

//             //Validate starting system info
//             let systemInfo = await voteTracker.getSystemVotes();
//             validateSystemVotes(systemInfo, initialVoteSession, 0, 0, 0);

//             //Perform 1st system
//             await vote(voteTracker, proxySubmitter, firstUserVote, firstUserVotePayload);
//             await vote(voteTracker, proxySubmitter, secondUserVote, secondUserVotePayload);

//             //Validate ending user info
//             userVoteDetails = await voteTracker.getUserVotes(firstUserVote.account);
//             details = userVoteDetails.details;
//             votes = userVoteDetails.votes;

//             expect(details.totalUsedVotes).to.be.equal(VoteAmount(100));

//             userVoteDetails = await voteTracker.getUserVotes(secondUserVote.account);
//             details = userVoteDetails.details;
//             votes = userVoteDetails.votes;

//             expect(details.totalUsedVotes).to.be.equal(VoteAmount(100));

//             //Validate system info
//             systemInfo = await voteTracker.getSystemVotes();
//             validateSystemVotes(systemInfo, initialVoteSession, 200, 50, 150);
//         });

//         it("System votes are updated with multiple users when a user updates", async () => {
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(100), 0);

//             //100 Votes are in here
//             const firstUserVote = defaultVote(0);

//             firstUserVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(40),
//             });
//             firstUserVote.allocations.push({
//                 reactorKey: reactor2Key,
//                 amount: VoteAmount(60),
//             });
//             const firstUserVotePayload = signVote(voteTracker.address, firstUserVote, voterWallet1.privateKey);

//             const secondUserVote = defaultVote(0);
//             secondUserVote.account = voterWallet2Public;
//             secondUserVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(10),
//             });
//             secondUserVote.allocations.push({
//                 reactorKey: reactor2Key,
//                 amount: VoteAmount(90),
//             });
//             const secondUserVotePayload = signVote(voteTracker.address, secondUserVote, voterWallet2.privateKey);

//             //Validate starting user info
//             let userVoteDetails = await voteTracker.getUserVotes(firstUserVote.account);
//             let details = userVoteDetails.details;
//             let votes = userVoteDetails.votes;
//             expect(details.totalUsedVotes).to.be.equal(0);
//             expect(details.totalAvailableVotes).to.be.equal(0);
//             expect(votes.length).to.be.equal(0);

//             //Validate starting system info
//             let systemInfo = await voteTracker.getSystemVotes();
//             validateSystemVotes(systemInfo, initialVoteSession, 0, 0, 0);

//             //Perform 1st system
//             await vote(voteTracker, proxySubmitter, firstUserVote, firstUserVotePayload);
//             await vote(voteTracker, proxySubmitter, secondUserVote, secondUserVotePayload);

//             //Validate ending user info
//             userVoteDetails = await voteTracker.getUserVotes(firstUserVote.account);
//             details = userVoteDetails.details;
//             votes = userVoteDetails.votes;

//             expect(details.totalUsedVotes).to.be.equal(VoteAmount(100));

//             userVoteDetails = await voteTracker.getUserVotes(secondUserVote.account);
//             details = userVoteDetails.details;
//             votes = userVoteDetails.votes;

//             expect(details.totalUsedVotes).to.be.equal(VoteAmount(100));

//             //Validate system info
//             systemInfo = await voteTracker.getSystemVotes();
//             validateSystemVotes(systemInfo, initialVoteSession, 200, 50, 150);

//             //User should now be able to vote with 150 votes
//             //Token balance is 200 but 1 of the tokens has a .5 multiplier
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(100), VoteAmount(100));

//             const thirdUserVote = defaultVote(0, 31337, initialVoteSession, 150);
//             thirdUserVote.account = voterWallet3Public;
//             thirdUserVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(150),
//             });
//             const thirdUserVotePayload = signVote(voteTracker.address, thirdUserVote, voterWallet3.privateKey);
//             await vote(voteTracker, proxySubmitter, thirdUserVote, thirdUserVotePayload);

//             userVoteDetails = await voteTracker.getUserVotes(thirdUserVote.account);
//             details = userVoteDetails.details;
//             votes = userVoteDetails.votes;

//             expect(details.totalUsedVotes).to.be.equal(VoteAmount(150));

//             //Validate system info
//             systemInfo = await voteTracker.getSystemVotes();
//             validateSystemVotes(systemInfo, initialVoteSession, 350, 200, 150);
//         });

//         it("System votes are updated with multiple users when a user zero's their votes", async () => {
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(100), 0);

//             //100 Votes are in here
//             const firstUserVote = defaultVote(0);

//             firstUserVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(40),
//             });
//             firstUserVote.allocations.push({
//                 reactorKey: reactor2Key,
//                 amount: VoteAmount(60),
//             });
//             const firstUserVotePayload = signVote(voteTracker.address, firstUserVote, voterWallet1.privateKey);

//             const secondUserVote = defaultVote(0);
//             secondUserVote.account = voterWallet2Public;
//             secondUserVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(10),
//             });
//             secondUserVote.allocations.push({
//                 reactorKey: reactor2Key,
//                 amount: VoteAmount(90),
//             });
//             const secondUserVotePayload = signVote(voteTracker.address, secondUserVote, voterWallet2.privateKey);

//             //Validate starting user info
//             let userVoteDetails = await voteTracker.getUserVotes(firstUserVote.account);
//             let details = userVoteDetails.details;
//             let votes = userVoteDetails.votes;
//             expect(details.totalUsedVotes).to.be.equal(0);
//             expect(details.totalAvailableVotes).to.be.equal(0);
//             expect(votes.length).to.be.equal(0);

//             //Validate starting system info
//             let systemInfo = await voteTracker.getSystemVotes();
//             validateSystemVotes(systemInfo, initialVoteSession, 0, 0, 0);

//             //Perform 1st system
//             await vote(voteTracker, proxySubmitter, firstUserVote, firstUserVotePayload);
//             await vote(voteTracker, proxySubmitter, secondUserVote, secondUserVotePayload);

//             //Validate ending user info
//             userVoteDetails = await voteTracker.getUserVotes(firstUserVote.account);
//             details = userVoteDetails.details;
//             votes = userVoteDetails.votes;

//             expect(details.totalUsedVotes).to.be.equal(VoteAmount(100));

//             userVoteDetails = await voteTracker.getUserVotes(secondUserVote.account);
//             details = userVoteDetails.details;
//             votes = userVoteDetails.votes;

//             expect(details.totalUsedVotes).to.be.equal(VoteAmount(100));

//             //Validate system info
//             systemInfo = await voteTracker.getSystemVotes();
//             validateSystemVotes(systemInfo, initialVoteSession, 200, 50, 150);

//             //User should now be able to vote with 150 votes
//             //Token balance is 200 but 1 of the tokens has a .5 multiplier
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(100), VoteAmount(100));

//             const thirdUserVote = defaultVote(1, 31337, initialVoteSession, 0);
//             thirdUserVote.allocations.push(
//                 { reactorKey: reactor1Key, amount: VoteAmount(0) },
//                 { reactorKey: reactor2Key, amount: VoteAmount(0) }
//             );
//             thirdUserVote.account = voterWallet2Public;
//             const thirdUserVotePayload = signVote(voteTracker.address, thirdUserVote, voterWallet2.privateKey);
//             await vote(voteTracker, proxySubmitter, thirdUserVote, thirdUserVotePayload);

//             userVoteDetails = await voteTracker.getUserVotes(secondUserVote.account);
//             details = userVoteDetails.details;
//             votes = userVoteDetails.votes;

//             expect(details.totalUsedVotes).to.be.equal(VoteAmount(0));

//             //Validate system info
//             systemInfo = await voteTracker.getSystemVotes();
//             validateSystemVotes(systemInfo, initialVoteSession, 100, 40, 60);
//         });

//         it("System votes go to zero's when all users zero their votes", async () => {
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(100), 0);

//             //100 Votes are in here
//             const firstUserVote = defaultVote(0);

//             firstUserVote.allocations.push(
//                 { reactorKey: reactor1Key, amount: VoteAmount(40) },
//                 { reactorKey: reactor2Key, amount: VoteAmount(60) }
//             );

//             const firstUserVotePayload = signVote(voteTracker.address, firstUserVote, voterWallet1.privateKey);

//             const secondUserVote = defaultVote(0);
//             secondUserVote.account = voterWallet2Public;
//             secondUserVote.allocations.push(
//                 { reactorKey: reactor1Key, amount: VoteAmount(10) },
//                 { reactorKey: reactor2Key, amount: VoteAmount(90) }
//             );
//             const secondUserVotePayload = signVote(voteTracker.address, secondUserVote, voterWallet2.privateKey);

//             //Validate starting user info
//             let userVoteDetails = await voteTracker.getUserVotes(firstUserVote.account);
//             let details = userVoteDetails.details;
//             let votes = userVoteDetails.votes;
//             expect(details.totalUsedVotes).to.be.equal(0);
//             expect(details.totalAvailableVotes).to.be.equal(0);
//             expect(votes.length).to.be.equal(0);

//             //Validate starting system info
//             let systemInfo = await voteTracker.getSystemVotes();
//             validateSystemVotes(systemInfo, initialVoteSession, 0, 0, 0);

//             //Perform 1st system
//             await vote(voteTracker, proxySubmitter, firstUserVote, firstUserVotePayload);
//             await vote(voteTracker, proxySubmitter, secondUserVote, secondUserVotePayload);

//             //Validate ending user info
//             userVoteDetails = await voteTracker.getUserVotes(firstUserVote.account);
//             details = userVoteDetails.details;
//             votes = userVoteDetails.votes;

//             expect(details.totalUsedVotes).to.be.equal(VoteAmount(100));

//             userVoteDetails = await voteTracker.getUserVotes(secondUserVote.account);
//             details = userVoteDetails.details;
//             votes = userVoteDetails.votes;

//             expect(details.totalUsedVotes).to.be.equal(VoteAmount(100));

//             //Validate system info
//             systemInfo = await voteTracker.getSystemVotes();
//             validateSystemVotes(systemInfo, initialVoteSession, 200, 50, 150);

//             //User should now be able to vote with 150 votes
//             //Token balance is 200 but 1 of the tokens has a .5 multiplier
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(100), VoteAmount(100));

//             const thirdUserVote = defaultVote(1, 31337, initialVoteSession, 0);
//             thirdUserVote.allocations.push(
//                 { reactorKey: reactor1Key, amount: VoteAmount(0) },
//                 { reactorKey: reactor2Key, amount: VoteAmount(0) }
//             );
//             thirdUserVote.account = voterWallet2Public;
//             const thirdUserVotePayload = signVote(voteTracker.address, thirdUserVote, voterWallet2.privateKey);
//             await vote(voteTracker, proxySubmitter, thirdUserVote, thirdUserVotePayload);

//             userVoteDetails = await voteTracker.getUserVotes(secondUserVote.account);
//             details = userVoteDetails.details;
//             votes = userVoteDetails.votes;

//             expect(details.totalUsedVotes).to.be.equal(VoteAmount(0));

//             const fourthUserVote = defaultVote(1, 31337, initialVoteSession, 0);
//             fourthUserVote.allocations.push(
//                 { reactorKey: reactor1Key, amount: VoteAmount(0) },
//                 { reactorKey: reactor2Key, amount: VoteAmount(0) }
//             );
//             fourthUserVote.account = voterWallet1Public;
//             const fourthUserVotePayload = signVote(voteTracker.address, fourthUserVote, voterWallet1.privateKey);
//             await vote(voteTracker, proxySubmitter, fourthUserVote, fourthUserVotePayload);

//             userVoteDetails = await voteTracker.getUserVotes(firstUserVote.account);
//             details = userVoteDetails.details;
//             votes = userVoteDetails.votes;

//             expect(details.totalUsedVotes).to.be.equal(VoteAmount(0));

//             //Validate system info
//             systemInfo = await voteTracker.getSystemVotes();
//             validateSystemVotes(systemInfo, initialVoteSession, 0, 0, 0);
//         });
//     });

//     describe("Calls to updateUserVoteTotals with multiple accounts", () => {
//         it("Updates multiple accounts", async () => {
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(1000), 0);

//             await voteTracker.connect(deployer).setReactorKeys(
//                 [
//                     { token: asset3.address, key: reactor3Key },
//                     { token: asset4.address, key: reactor4Key },
//                 ],
//                 true
//             );

//             const firstVote = defaultVote(0);
//             firstVote.totalVotes = VoteAmount(1000);
//             firstVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(200),
//             });
//             firstVote.allocations.push({
//                 reactorKey: reactor2Key,
//                 amount: VoteAmount(600),
//             });
//             firstVote.allocations.push({
//                 reactorKey: reactor3Key,
//                 amount: VoteAmount(100),
//             });
//             firstVote.allocations.push({
//                 reactorKey: reactor4Key,
//                 amount: VoteAmount(100),
//             });
//             const votePayload = signVote(voteTracker.address, firstVote, voterWallet1.privateKey);

//             //Perform 1st system
//             await vote(voteTracker, proxySubmitter, firstVote, votePayload);

//             const secondVote = defaultVote(0);
//             secondVote.account = voterWallet2.address;
//             secondVote.totalVotes = VoteAmount(1000);
//             secondVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(200),
//             });
//             secondVote.allocations.push({
//                 reactorKey: reactor2Key,
//                 amount: VoteAmount(600),
//             });
//             secondVote.allocations.push({
//                 reactorKey: reactor3Key,
//                 amount: VoteAmount(100),
//             });
//             secondVote.allocations.push({
//                 reactorKey: reactor4Key,
//                 amount: VoteAmount(100),
//             });
//             const secondVotePayload = signVote(voteTracker.address, secondVote, voterWallet2.privateKey);

//             await vote(voteTracker, proxySubmitter, secondVote, secondVotePayload);

//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(100), 0);

//             await voteTracker.connect(deployer).updateUserVoteTotals([voterWallet1.address, voterWallet2.address]);

//             const voter1 = await voteTracker.getUserVotes(voterWallet1.address);
//             const voter2 = await voteTracker.getUserVotes(voterWallet2.address);

//             const validateVote = (
//                 voter: [
//                     [BigNumber, BigNumber] & {
//                         totalUsedVotes: BigNumber;
//                         totalAvailableVotes: BigNumber;
//                     },
//                     ([string, BigNumber] & { reactorKey: string; amount: BigNumber })[]
//                 ] & {
//                     details: [BigNumber, BigNumber] & {
//                         totalUsedVotes: BigNumber;
//                         totalAvailableVotes: BigNumber;
//                     };
//                     votes: ([string, BigNumber] & {
//                         reactorKey: string;
//                         amount: BigNumber;
//                     })[];
//                 },
//                 reactorKey: string,
//                 newAmount: number
//             ) => {
//                 expect(voter.votes.find((x) => x.reactorKey == reactorKey)?.amount.toString()).to.be.equal(
//                     VoteAmount(newAmount)
//                 );
//             };

//             validateVote(voter1, reactor1Key, 20);
//             validateVote(voter1, reactor2Key, 60);
//             validateVote(voter1, reactor3Key, 10);
//             validateVote(voter1, reactor4Key, 10);
//             validateVote(voter2, reactor1Key, 20);
//             validateVote(voter2, reactor2Key, 60);
//             validateVote(voter2, reactor3Key, 10);
//             validateVote(voter2, reactor4Key, 10);
//         });
//     });

//     describe("updateUserVoteTotal address 0 check", () => {
//         it("Reverts", async () => {
//             await expect(voteTracker.updateUserVoteTotals([ZERO_ADDRESS])).to.be.revertedWith("INVALID_ADDRESS");
//         });
//     });

//     describe("Vote Balance Decrement Rounding", () => {
//         it("Keeps reactor amounts and totalUsed in sync", async () => {
//             //Setup the reactors with for our test data
//             const reactors = {
//                 zrx: "0xe41d2489571d322189246dafa5ebde1f4699f498",
//                 oneinch: "0x111111111117dc0aa78b770fa6a738034120c302",
//                 aave: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
//                 spell: "0x090185f2135308bad17527004364ebcc2d37e5f6",
//                 mist: "0x88acdd2a6425c3faae4bc9650fd7e27e0bebb7ab",
//                 alpha: "0xa1faa113cbe53436df28ff0aee54275c13b40975",
//                 api3: "0x0b38210ea11411557c13457D4dA7dC6ea731B88a",
//                 axs: "0xbb0e17ef65f82ab018d8edd776e8dd940327b28b",
//                 badger: "0x3472a5a71965499acd81997a54bba8d852c6e53d",
//                 bal: "0xba100000625a3754423978a60c9317c58a424e3d",
//                 bnt: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
//                 band: "0xba11d00c5f74255f56a5e366f4f77f5a186d7f55",
//                 bank: "0x2d94aa3e47d9d5024503ca8491fce9a2fb4da198",
//                 bond: "0x0391d2021f89dc339f60fff84546ea23e337750f",
//                 bit: "0x1a4b46696b2bb4794eb3d4c26f1c55f9170fa4c5",
//                 link: "0x514910771af9ca656af840dff83e8264ecf986ca",
//                 comp: "0xc00e94cb662c3520282e6f5717214004a7f26888",
//                 cvx: "0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b",
//                 cream: "0x2ba592F78dB6436527729929AAf6c908497cB200",
//                 crv: "0xd533a949740bb3306d119cc777fa900ba034cd52",
//                 ftm: "0x4e15361fd6b4bb609fa63c81a2be19d873717870",
//                 tribe: "0xc7283b66eb1eb5fb86327f08e1b5816b0720212b",
//                 ilv: "0x767fe9edc9e0df98e07454847909b5e959d7ca0e",
//                 ldo: "0x5a98fcbea516cf06857215779fd812ca3bef1b32",
//                 lqty: "0x6dea81c8171d0ba574754ef6f8b412f2ed88c54d",
//                 mkr: "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
//                 near: "0x85F17Cf997934a597031b2E18a9aB6ebD4B9f6a4",
//                 matic: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
//                 rgt: "0xD291E7a03283640FDc51b121aC401383A46cC623",
//                 rai: "0x03ab458634910aad20ef5f1c8ee96f1d6ac54919",
//                 ren: "0x408e41876cccdc0f92210600ef50372656052a38",
//                 rune: "0x3155ba85d5f96b2d030a4966af206230e46849cb",
//                 snx: "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f",
//                 uni: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
//                 visr: "0xf938424f7210f31df2aee3011291b658f872e91e",
//                 yfi: "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e",
//                 ygg: "0x25f8087ead173b73d6e8b84329989a8eea16cf73",
//                 gro: "0x3ec8798b81485a254928b70cda1cf0a2bb0b74d7",
//                 perp: "0xbc396689893d065f41bc2c6ecbee5e0085233447",
//                 ice: "0xf16e81dce15b08f326220742020379b855b87df9",
//                 fox: "0xc770eefad204b5180df6a14ee197d99d808ee52d",
//                 temple: "0x470ebf5f030ed85fc1ed4c2d36b9dd02e77cf1b7",
//                 index: "0x0954906da0bf32d5479e25f46056d22f08464cab",
//                 luna: "0xd2877702675e6cEb975b4A1dFf9fb7BAF4C91ea9",
//                 apw: "0x4104b135dbc9609fc1a9490e61369036497660c8",
//             } as Record<string, string>;
//             const reactorKeys = Object.keys(reactors).map((x) => {
//                 return {
//                     token: reactors[x],
//                     key: ethers.utils.formatBytes32String(`${x}-default`),
//                 };
//             });
//             const reactorSetup = await voteTracker.connect(deployer).setReactorKeys(reactorKeys, true);
//             await reactorSetup.wait();

//             await mockBalanceTrackerWithGivenAmounts("1179632087531190064497", 0);

//             await voteTracker.connect(deployer).updateUserVoteTotals([voterWallet1Public]);

//             const populatePayloadData = async (payload: {
//                 account: string;
//                 voteSessionKey: string;
//                 nonce: string;
//                 chainId: number;
//                 totalVotes: string;
//                 allocations: { reactorKey: string; amount: string }[];
//             }) => {
//                 const getUserVotes = await voteTracker.getUserVotes(voterWallet1Public);
//                 let currentTotal = getUserVotes.votes.reduce((x, i) => {
//                     return x.add(i.amount);
//                 }, BigNumber.from("0"));

//                 for (let i = 0; i < payload.allocations.length; i++) {
//                     const alloc = payload.allocations[i];
//                     const existingVote = getUserVotes.votes.find(
//                         (x) => x.reactorKey.toLowerCase() == alloc.reactorKey.toLowerCase()
//                     );
//                     if (existingVote) {
//                         currentTotal = currentTotal.sub(existingVote.amount);
//                     }
//                     currentTotal = currentTotal.add(alloc.amount);
//                 }

//                 payload.totalVotes = currentTotal.toString();
//                 return payload;
//             };

//             let firstVote = {
//                 account: voterWallet1Public,
//                 voteSessionKey: initialVoteSession,
//                 nonce: "0",
//                 chainId: 1,
//                 totalVotes: "-",
//                 allocations: [
//                     {
//                         reactorKey: "0x6f6e65696e63682d64656661756c740000000000000000000000000000000000",
//                         amount: "250000000000000000000",
//                     },
//                 ],
//             };
//             firstVote = await populatePayloadData(firstVote);
//             const firstVoteSig = signVote(voteTracker.address, firstVote, voterWallet1.privateKey);
//             await vote(voteTracker, proxySubmitter, firstVote, firstVoteSig);

//             let secondVote = {
//                 account: voterWallet1Public,
//                 voteSessionKey: initialVoteSession,
//                 nonce: "1",
//                 chainId: 1,
//                 totalVotes: "-",
//                 allocations: [
//                     {
//                         reactorKey: "0x736e782d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x72756e652d64656661756c740000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x696c762d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x7267742d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x7370656c6c2d64656661756c7400000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x7261692d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x6c7174792d64656661756c740000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x6c696e6b2d64656661756c740000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x6d6b722d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x626f6e642d64656661756c740000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x7967672d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x6d6973742d64656661756c740000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x766973722d64656661756c740000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x616c7068612d64656661756c7400000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x74726962652d64656661756c7400000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x6372762d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x7a72782d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x66746d2d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x6c756e612d64656661756c740000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x62616e6b2d64656661756c740000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x616176652d64656661756c740000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x756e692d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x6c646f2d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x6376782d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x6178732d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x6261646765722d64656661756c74000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x617069332d64656661756c740000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x67726f2d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x6e6561722d64656661756c740000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x6d617469632d64656661756c7400000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x72656e2d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x62616c2d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x6170772d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x7966692d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x637265616d2d64656661756c7400000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x6269742d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x62616e642d64656661756c740000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x636f6d702d64656661756c740000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x626e742d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x666f782d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x6963652d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x706572702d64656661756c740000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x696e6465782d64656661756c7400000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                 ],
//             };
//             secondVote = await populatePayloadData(secondVote);
//             const secondVoteSig = signVote(voteTracker.address, secondVote, voterWallet1.privateKey);
//             await vote(voteTracker, proxySubmitter, secondVote, secondVoteSig);

//             let thirdVote = {
//                 account: voterWallet1Public,
//                 voteSessionKey: initialVoteSession,
//                 nonce: "2",
//                 chainId: 1,
//                 totalVotes: "-",
//                 allocations: [
//                     {
//                         reactorKey: "0x7261692d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "300000000000000000000",
//                     },
//                 ],
//             };
//             thirdVote = await populatePayloadData(thirdVote);
//             const thirdVoteSig = signVote(voteTracker.address, thirdVote, voterWallet1.privateKey);
//             await vote(voteTracker, proxySubmitter, thirdVote, thirdVoteSig);

//             let fourthVote = {
//                 account: voterWallet1Public,
//                 voteSessionKey: initialVoteSession,
//                 nonce: "3",
//                 chainId: 1,
//                 totalVotes: "-",
//                 allocations: [
//                     {
//                         reactorKey: "0x6f6e65696e63682d64656661756c740000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                 ],
//             };
//             fourthVote = await populatePayloadData(fourthVote);
//             const fourthVoteSig = signVote(voteTracker.address, fourthVote, voterWallet1.privateKey);
//             await vote(voteTracker, proxySubmitter, fourthVote, fourthVoteSig);

//             await mockBalanceTrackerWithGivenAmounts("1282619704864353743145", 0);

//             await voteTracker.connect(deployer).updateUserVoteTotals([voterWallet1Public]);

//             let fifthVote = {
//                 account: voterWallet1Public,
//                 voteSessionKey: initialVoteSession,
//                 nonce: "4",
//                 chainId: 1,
//                 totalVotes: "-",
//                 allocations: [
//                     {
//                         reactorKey: "0x7261692d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                     {
//                         reactorKey: "0x666f782d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1239619704864353743145",
//                     },
//                 ],
//             };
//             fifthVote = await populatePayloadData(fifthVote);
//             const fifthVoteSig = signVote(voteTracker.address, fifthVote, voterWallet1.privateKey);
//             await vote(voteTracker, proxySubmitter, fifthVote, fifthVoteSig);

//             let sixthVote = {
//                 account: voterWallet1Public,
//                 voteSessionKey: initialVoteSession,
//                 nonce: "5",
//                 chainId: 1,
//                 totalVotes: "-",
//                 allocations: [] as { reactorKey: string; amount: string }[],
//             };
//             sixthVote = await populatePayloadData(sixthVote);
//             const sixthVoteSig = signVote(voteTracker.address, sixthVote, voterWallet1.privateKey);
//             await vote(voteTracker, proxySubmitter, sixthVote, sixthVoteSig);

//             await mockBalanceTrackerWithGivenAmounts("564755795202726327561", 0);

//             await voteTracker.connect(deployer).updateUserVoteTotals([voterWallet1Public]);

//             await mockBalanceTrackerWithGivenAmounts("1217414970487966982814", 0);

//             await voteTracker.connect(deployer).updateUserVoteTotals([voterWallet1Public]);

//             let seventhVote = {
//                 account: voterWallet1Public,
//                 voteSessionKey: initialVoteSession,
//                 nonce: "6",
//                 chainId: 1,
//                 totalVotes: "-",
//                 allocations: [] as { reactorKey: string; amount: string }[],
//             };
//             seventhVote = await populatePayloadData(seventhVote);
//             const seventhVoteSig = signVote(voteTracker.address, seventhVote, voterWallet1.privateKey);
//             await vote(voteTracker, proxySubmitter, seventhVote, seventhVoteSig);

//             await mockBalanceTrackerWithGivenAmounts("652659175285240655253", 0);

//             await voteTracker.connect(deployer).updateUserVoteTotals([voterWallet1Public]);

//             await mockBalanceTrackerWithGivenAmounts("1217414970487966982814", 0);

//             await voteTracker.connect(deployer).updateUserVoteTotals([voterWallet1Public]);

//             await mockBalanceTrackerWithGivenAmounts("1455454586132981551260", 0);

//             await voteTracker.connect(deployer).updateUserVoteTotals([voterWallet1Public]);

//             let eigthVote = {
//                 account: voterWallet1Public,
//                 voteSessionKey: initialVoteSession,
//                 nonce: "7",
//                 chainId: 1,
//                 totalVotes: "-",
//                 allocations: [] as { reactorKey: string; amount: string }[],
//             };
//             eigthVote = await populatePayloadData(eigthVote);
//             const eigthVoteSig = signVote(voteTracker.address, eigthVote, voterWallet1.privateKey);
//             await vote(voteTracker, proxySubmitter, eigthVote, eigthVoteSig);

//             let ninthVote = {
//                 account: voterWallet1Public,
//                 voteSessionKey: initialVoteSession,
//                 nonce: "8",
//                 chainId: 1,
//                 totalVotes: "-",
//                 allocations: [
//                     {
//                         reactorKey: "0x7261692d64656661756c74000000000000000000000000000000000000000000",
//                         amount: "1000000000000000000",
//                     },
//                 ],
//             };
//             ninthVote = await populatePayloadData(ninthVote);
//             const ninthVoteSig = signVote(voteTracker.address, ninthVote, voterWallet1.privateKey);

//             await expect(voteTracker.connect(proxySubmitter).vote(ninthVote, ninthVoteSig)).to.not.be.reverted;
//         });
//     });

//     describe("Side-effects of a Withdrawal Request", () => {
//         it("Emits an WithdrawalRequestApplied event that contains their vote totals before the change is applied", async () => {
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(100), 0);

//             const firstVote = defaultVote(0);

//             firstVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(40),
//             });
//             firstVote.allocations.push({
//                 reactorKey: reactor2Key,
//                 amount: VoteAmount(60),
//             });
//             const votePayload = signVote(voteTracker.address, firstVote, voterWallet1.privateKey);

//             await vote(voteTracker, proxySubmitter, firstVote, votePayload);

//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(10), 0);

//             const eventName = ethers.utils.formatBytes32String("Withdrawal Request");
//             const withdrawalWrapper = ethers.utils.defaultAbiCoder.encode(
//                 ["bytes32", "address", "address", "uint256"],
//                 [eventName, voterWallet1Public, asset1.address, 10]
//             );
//             await expect(
//                 voteTracker.connect(eventProxy).onEventReceive(eventProxy.address, eventName, withdrawalWrapper)
//             )
//                 .to.emit(voteTracker, "WithdrawalRequestApplied")
//                 .withManuallyValidatedArgs<VoteTracker>(voteTracker, (args: any[]) => {
//                     expect(args[0].toLowerCase()).to.equal(voterWallet1Public.toLowerCase());

//                     validateUserInfo(args[1], 10, 10, 2)
//                         .validateReactor(0, reactor1Key, 4)
//                         .validateReactor(1, reactor2Key, 6);
//                 });

//             const afterChange = await voteTracker.getUserVotes(voterWallet1Public);

//             validateUserInfo(afterChange, 10, 10, 2)
//                 .validateReactor(0, reactor1Key, 4)
//                 .validateReactor(1, reactor2Key, 6);
//         });
//     });

//     describe("Voting After a Full Balance Removal", () => {
//         it("Allows you recast your votes", async () => {
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(100), 0);

//             const firstVote = defaultVote(0);

//             firstVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(100),
//             });
//             const votePayload = signVote(voteTracker.address, firstVote, voterWallet1.privateKey);

//             //Perform 1st system
//             await vote(voteTracker, proxySubmitter, firstVote, votePayload);

//             //Remove All Votes
//             await mockBalanceTrackerWithGivenAmounts(0, 0);

//             //Trigger Update
//             await voteTracker.connect(deployer).updateUserVoteTotals([firstVote.account]);

//             //Give them voting power back
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(100), 0);

//             const secondVote = defaultVote(1);

//             secondVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(100),
//             });
//             const secondVotePayload = signVote(voteTracker.address, secondVote, voterWallet1.privateKey);

//             await expect(vote(voteTracker, proxySubmitter, secondVote, secondVotePayload)).to.not.be.reverted;
//         });
//     });

//     describe("Vote Amounts During a Balance Change", () => {
//         it("Doesn't add additional votes when a balance increases", async () => {
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(100), 0);

//             const firstVote = defaultVote(0);

//             firstVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(40),
//             });
//             firstVote.allocations.push({
//                 reactorKey: reactor2Key,
//                 amount: VoteAmount(60),
//             });
//             const votePayload = signVote(voteTracker.address, firstVote, voterWallet1.privateKey);

//             //Perform 1st system
//             await vote(voteTracker, proxySubmitter, firstVote, votePayload);

//             //First vote validation
//             let userVotes = await voteTracker.getUserVotes(firstVote.account);
//             validateUserInfo(userVotes, 100, 100, 2)
//                 .validateReactor(0, reactor1Key, 40)
//                 .validateReactor(1, reactor2Key, 60);

//             //Add Votes
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(200), 0);

//             //Trigger Update
//             await voteTracker.connect(deployer).updateUserVoteTotals([firstVote.account]);

//             userVotes = await voteTracker.getUserVotes(firstVote.account);

//             validateUserInfo(userVotes, 100, 200, 2)
//                 .validateReactor(0, reactor1Key, 40)
//                 .validateReactor(1, reactor2Key, 60);
//         });

//         it("Decrements votes proportionately when a balance decreases", async () => {
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(200), 0);

//             const firstVote = defaultVote(0, 31337, initialVoteSession, 200);

//             firstVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(80),
//             });
//             firstVote.allocations.push({
//                 reactorKey: reactor2Key,
//                 amount: VoteAmount(120),
//             });
//             const votePayload = signVote(voteTracker.address, firstVote, voterWallet1.privateKey);

//             //Perform 1st system
//             await vote(voteTracker, proxySubmitter, firstVote, votePayload);

//             //First vote validation
//             let userVotes = await voteTracker.getUserVotes(firstVote.account);
//             validateUserInfo(userVotes, 200, 200, 2)
//                 .validateReactor(0, reactor1Key, 80)
//                 .validateReactor(1, reactor2Key, 120);

//             //Removes Votes
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(85), 0);

//             //Trigger Update
//             await voteTracker.connect(deployer).updateUserVoteTotals([firstVote.account]);

//             userVotes = await voteTracker.getUserVotes(firstVote.account);

//             validateUserInfo(userVotes, 85, 85, 2)
//                 .validateReactor(0, reactor1Key, 34)
//                 .validateReactor(1, reactor2Key, 51);

//             //With a result in decimals

//             //Removes Votes
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(84), 0);

//             //Trigger Update
//             await voteTracker.connect(deployer).updateUserVoteTotals([firstVote.account]);

//             userVotes = await voteTracker.getUserVotes(firstVote.account);

//             validateUserInfo(userVotes, 84, 84, 2)
//                 .validateReactor(0, reactor1Key, 33.6)
//                 .validateReactor(1, reactor2Key, 50.4);
//         });

//         it("Decrements votes proportionately when a balance decreases", async () => {
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(200), 0);

//             const firstVote = defaultVote(0, 31337, initialVoteSession, 200);

//             firstVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(80),
//             });
//             firstVote.allocations.push({
//                 reactorKey: reactor2Key,
//                 amount: VoteAmount(120),
//             });
//             const votePayload = signVote(voteTracker.address, firstVote, voterWallet1.privateKey);

//             //Perform 1st system
//             await vote(voteTracker, proxySubmitter, firstVote, votePayload);

//             //First vote validation
//             let userVotes = await voteTracker.getUserVotes(firstVote.account);
//             validateUserInfo(userVotes, 200, 200, 2)
//                 .validateReactor(0, reactor1Key, 80)
//                 .validateReactor(1, reactor2Key, 120);

//             //Remove Votes
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(100), 0);

//             //Trigger Update
//             await voteTracker.connect(deployer).updateUserVoteTotals([firstVote.account]);

//             userVotes = await voteTracker.getUserVotes(firstVote.account);

//             validateUserInfo(userVotes, 100, 100, 2)
//                 .validateReactor(0, reactor1Key, 40)
//                 .validateReactor(1, reactor2Key, 60);
//         });

//         it("Votes are removed from available first on a balance decrease", async () => {
//             //200 Available, only voted with 100
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(200), 0);

//             const firstVote = defaultVote(0);

//             firstVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(40),
//             });
//             firstVote.allocations.push({
//                 reactorKey: reactor2Key,
//                 amount: VoteAmount(60),
//             });
//             const votePayload = signVote(voteTracker.address, firstVote, voterWallet1.privateKey);

//             //Perform 1st system
//             await vote(voteTracker, proxySubmitter, firstVote, votePayload);

//             //First vote validation
//             let userVotes = await voteTracker.getUserVotes(firstVote.account);
//             validateUserInfo(userVotes, 100, 200, 2)
//                 .validateReactor(0, reactor1Key, 40)
//                 .validateReactor(1, reactor2Key, 60);

//             //Decrease available to 100
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(100), 0);

//             //Trigger Update
//             await voteTracker.connect(deployer).updateUserVoteTotals([firstVote.account]);

//             userVotes = await voteTracker.getUserVotes(firstVote.account);

//             validateUserInfo(userVotes, 100, 100, 2)
//                 .validateReactor(0, reactor1Key, 40)
//                 .validateReactor(1, reactor2Key, 60);
//         });

//         it("Votes are removed from available first, then used, on a balance decrease", async () => {
//             //200 Available, only voted with 100
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(200), 0);

//             const firstVote = defaultVote(0);

//             firstVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(40),
//             });
//             firstVote.allocations.push({
//                 reactorKey: reactor2Key,
//                 amount: VoteAmount(60),
//             });
//             const votePayload = signVote(voteTracker.address, firstVote, voterWallet1.privateKey);

//             //Perform 1st system
//             await vote(voteTracker, proxySubmitter, firstVote, votePayload);

//             //First vote validation
//             let userVotes = await voteTracker.getUserVotes(firstVote.account);
//             validateUserInfo(userVotes, 100, 200, 2)
//                 .validateReactor(0, reactor1Key, 40)
//                 .validateReactor(1, reactor2Key, 60);

//             //Decrease available to 50
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(50), 0);

//             //Trigger Update
//             await voteTracker.connect(deployer).updateUserVoteTotals([firstVote.account]);

//             userVotes = await voteTracker.getUserVotes(firstVote.account);

//             validateUserInfo(userVotes, 50, 50, 2)
//                 .validateReactor(0, reactor1Key, 20)
//                 .validateReactor(1, reactor2Key, 30);
//         });

//         it("Votes are removed completely when vote balance goes to 0", async () => {
//             //200 Available, only voted with 100
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(200), 0);

//             const firstVote = defaultVote(0);

//             firstVote.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(40),
//             });
//             firstVote.allocations.push({
//                 reactorKey: reactor2Key,
//                 amount: VoteAmount(60),
//             });
//             const votePayload = signVote(voteTracker.address, firstVote, voterWallet1.privateKey);

//             //Perform 1st system
//             await vote(voteTracker, proxySubmitter, firstVote, votePayload);

//             //First vote validation
//             let userVotes = await voteTracker.getUserVotes(firstVote.account);
//             validateUserInfo(userVotes, 100, 200, 2)
//                 .validateReactor(0, reactor1Key, 40)
//                 .validateReactor(1, reactor2Key, 60);

//             //Decrease available to 50
//             await mockBalanceTrackerWithGivenAmounts(0, 0);

//             //Trigger Update
//             await voteTracker.connect(deployer).updateUserVoteTotals([firstVote.account]);

//             userVotes = await voteTracker.getUserVotes(firstVote.account);

//             validateUserInfo(userVotes, 0, 0, 0);
//         });
//     });

//     describe("Testing pauseability", () => {
//         it("Initially is not paused", async () => {
//             expect(await voteTracker.paused()).to.equal(false);
//         });

//         it("Pauses correctly, emits Paused event", async () => {
//             const tx = await voteTracker.connect(deployer).pause();
//             const receipt = await tx.wait();

//             expect(await voteTracker.paused()).to.equal(true);
//             expect(receipt.events![0].event).to.equal("Paused");
//             expect(receipt.events![0].args!.account).to.equal(deployer.address);
//         });

//         it("Unpauses correctly, emits UnPaused event", async () => {
//             await voteTracker.connect(deployer).pause();
//             const tx = await voteTracker.connect(deployer).unpause();
//             const receipt = await tx.wait();

//             expect(await voteTracker.paused()).to.equal(false);
//             expect(receipt.events![0].event).to.equal("Unpaused");
//             expect(receipt.events![0].args!.account).to.equal(deployer.address);
//         });

//         it("Rejects when caller is not owner", async () => {
//             await expect(voteTracker.connect(other).pause()).to.be.revertedWith("Ownable: caller is not the owner");
//             await voteTracker.connect(deployer).pause();
//             await expect(voteTracker.connect(other).unpause()).to.be.revertedWith("Ownable: caller is not the owner");
//         });

//         it("Vote function pauses correctly", async () => {
//             await voteTracker.connect(deployer).pause();
//             await mockBalanceTrackerWithZeroAmounts();

//             const goodVote = defaultVote(0, 31337, initialVoteSession, 0);
//             const votePayload = signVote(voteTracker.address, goodVote, voterWallet1.privateKey);
//             await expect(vote(voteTracker, proxySubmitter, goodVote, votePayload)).to.be.revertedWith(
//                 "Pausable: paused"
//             );
//         });
//     });

//     describe("Testing voting directly on Polygon", () => {
//         let votePayload: UserVotePayload;
//         beforeEach(async () => {
//             votePayload = defaultVote(0);
//             votePayload.account = nonProxySubmitter.address;
//             await mockBalanceTrackerWithGivenAmounts(VoteAmount(100), 0);
//         });

//         it("Rejects when message sender and userVotePayload.account don't match", async () => {
//             votePayload.account = deployer.address;
//             await expect(voteTracker.connect(nonProxySubmitter).voteDirect(votePayload)).to.be.revertedWith(
//                 "MUST_BE_SENDER"
//             );
//         });

//         it("Rejects on improper chainId", async () => {
//             votePayload.chainId = 4;
//             await expect(voteTracker.connect(nonProxySubmitter).voteDirect(votePayload)).to.be.revertedWith(
//                 "INVALID_PAYLOAD_CHAIN"
//             );
//         });

//         it("Correctly stores votes", async () => {
//             votePayload.allocations.push({
//                 reactorKey: reactor1Key,
//                 amount: VoteAmount(100),
//             });
//             await voteTracker.connect(nonProxySubmitter).voteDirect(votePayload);

//             const userVotes = await voteTracker.getUserVotes(nonProxySubmitter.address);
//             validateUserInfo(userVotes, 100, 100, 1).validateReactor(0, reactor1Key, 100);
//         });
//     });
// });

// const validateUserInfo = (
//     userInfo: [
//         [BigNumber, BigNumber] & {
//             totalUsedVotes: BigNumber;
//             totalAvailableVotes: BigNumber;
//         },
//         ([string, BigNumber] & {
//             reactorKey: string;
//             amount: BigNumber;
//         })[]
//     ] & {
//         details: [BigNumber, BigNumber] & {
//             totalUsedVotes: BigNumber;
//             totalAvailableVotes: BigNumber;
//         };
//         votes: ([string, BigNumber] & {
//             reactorKey: string;
//             amount: BigNumber;
//         })[];
//     },
//     used: number,
//     avail: number,
//     votesLength: number
// ) => {
//     expect(userInfo.details.totalUsedVotes).to.be.equal(VoteAmount(used));
//     expect(userInfo.details.totalAvailableVotes).to.be.equal(VoteAmount(avail));
//     expect(userInfo.votes.length).to.be.equal(votesLength);

//     return {
//         validateReactor: (index: number, key: string, amount: number) =>
//             _validateReactor(userInfo.votes, index, key, amount),
//     };
// };

// const _validateReactor = (
//     votes: ([string, BigNumber] & {
//         reactorKey: string;
//         amount: BigNumber;
//     })[] &
//         ([string, BigNumber] & {
//             reactorKey: string;
//             amount: BigNumber;
//         })[],
//     index: number,
//     key: string,
//     amount: number
// ) => {
//     expect(votes[index].reactorKey).to.be.equal(key);
//     expect(votes[index].amount).to.be.equal(VoteAmount(amount));

//     return {
//         validateReactor: (index: number, key: string, amount: number) => _validateReactor(votes, index, key, amount),
//     };
// };

// const validateSystemVotes = (
//     systemInfo: [
//         [string, BigNumber] & { voteSessionKey: string; totalVotes: BigNumber },
//         ([string, string, BigNumber] & {
//             token: string;
//             reactorKey: string;
//             totalVotes: BigNumber;
//         })[]
//     ] & {
//         details: [string, BigNumber] & {
//             voteSessionKey: string;
//             totalVotes: BigNumber;
//         };
//         votes: ([string, string, BigNumber] & {
//             token: string;
//             reactorKey: string;
//             totalVotes: BigNumber;
//         })[];
//     },
//     session: string,
//     totalVotes: number,
//     reactor1Votes: number,
//     reactor2Votes: number
// ) => {
//     expect(systemInfo.details.voteSessionKey).to.be.equal(session);
//     expect(systemInfo.details.totalVotes).to.be.equal(VoteAmount(totalVotes));
//     expect(systemInfo.votes.length).to.be.equal(2);
//     expect(systemInfo.votes[0].reactorKey).to.be.equal(reactor1Key);
//     expect(systemInfo.votes[0].token).to.be.equal(asset1.address);
//     expect(systemInfo.votes[0].totalVotes).to.be.equal(VoteAmount(reactor1Votes));
//     expect(systemInfo.votes[1].reactorKey).to.be.equal(reactor2Key);
//     expect(systemInfo.votes[1].token).to.be.equal(asset2.address);
//     expect(systemInfo.votes[1].totalVotes).to.be.equal(VoteAmount(reactor2Votes));
// };

// const fundAccountWithETH = async (account: Signer, provider: typeof ethers.provider, amount = 500000) => {
//     let etherBal = ethers.utils.parseEther(amount.toString()).toHexString();
//     if (etherBal.startsWith("0x0")) etherBal = "0x" + etherBal.substring(3);

//     await provider.send("hardhat_setBalance", [await account.getAddress(), etherBal]);
// };

// const defaultVote = (nonce: number, chainId = 31337, session: string = initialVoteSession, totalVotes = 100) => {
//     return {
//         account: voterWallet1Public,
//         voteSessionKey: session,
//         nonce: nonce,
//         chainId: chainId,
//         totalVotes: VoteAmount(totalVotes),
//         allocations: [] as UserVoteAllocationItem[],
//     };
// };

// const vote = async (
//     contract: VoteTracker,
//     submitter: SignerWithAddress | Wallet,
//     payload: UserVotePayload,
//     sig: Signature
// ) => {
//     await contract.connect(submitter).vote(payload, sig);
// };

// const advanceBlocks = async (blocks: number) => {
//     for (let i = 0; i < blocks; i++) {
//         await timeMachine.advanceBlock();
//     }
// };

// const mockBalanceTrackerWithZeroAmounts = async () => {
//     await balanceTracker.mock.getBalance.returns([
//         { token: voteToken1.address, amount: 0 },
//         { token: voteToken2.address, amount: 0 },
//     ]);
// };

// const mockBalanceTrackerWithGivenAmounts = async (vote1Amount: BigNumberish, vote2Amount: BigNumberish) => {
//     await balanceTracker.mock.getBalance.returns([
//         { token: voteToken1.address, amount: vote1Amount },
//         { token: voteToken2.address, amount: vote2Amount },
//     ]);
// };
