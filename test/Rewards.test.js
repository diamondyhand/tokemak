// const {expect} = require("chai");
// const {ethers, artifacts, waffle} = require("hardhat");
// const {deployMockContract} = waffle;
// const {
//     expectRevert, // Assertions for transactions that should fail
// } = require("@openzeppelin/test-helpers");
// const {assert} = require("chai");
// const {ZERO_ADDRESS} = require("@openzeppelin/test-helpers/src/constants");
// const timeMachine = require("ganache-time-traveler");
// const erc20Artifact = artifacts.require("@openzeppelin/contracts/token/ERC20/ERC20.sol");

// // HARDHAT DEFAULT MNEMONIC
// const SIGNER = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
// const ROTATED_SIGNER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
// const SIGNER_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
// const ROTATED_SIGNER_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

// // Hardhat default is 3133 but currently "hardhat" network
// // is configured with chainId = 1 to reflect forked mainnet.
// const DEV_CHAIN_ID = 1;

// async function generateSignature(key, contract, cycle, recipient, amount, chain = DEV_CHAIN_ID) {
//     const domain = {
//         name: "TOKE Distribution",
//         version: "1",
//         chainId: chain,
//         verifyingContract: contract,
//     };
//     const types = {
//         Recipient: [
//             {name: "chainId", type: "uint256"},
//             {name: "cycle", type: "uint256"},
//             {name: "wallet", type: "address"},
//             {name: "amount", type: "uint256"},
//         ],
//     };
//     const data = {
//         chainId: chain,
//         cycle: cycle,
//         wallet: recipient,
//         amount: amount,
//     };

//     const provider = ethers.provider;
//     const wallet = new ethers.Wallet(key, provider);
//     let signature = await wallet._signTypedData(domain, types, data);
//     signature = signature.slice(2);
//     const r = "0x" + signature.substring(0, 64);
//     const s = "0x" + signature.substring(64, 128);
//     const v = parseInt(signature.substring(128, 130), 16);
//     return {r, s, v};
// }

// describe("Rewards Unit Test", () => {
//     let owner;
//     let recipient1;
//     let recipient2;

//     let rewardsFactory;
//     let rewardDistributor;
//     let mockToken;
//     let realToken;
//     let snapshotId;

//     beforeEach(async () => {
//         const snapshot = await timeMachine.takeSnapshot();
//         snapshotId = snapshot["result"];
//     });

//     afterEach(async () => {
//         await timeMachine.revertToSnapshot(snapshotId);
//     });

//     before(async () => {
//         [owner, recipient1, recipient2] = await ethers.getSigners();
//         mockToken = await deployMockContract(owner, erc20Artifact.abi);
//         rewardsFactory = await ethers.getContractFactory("Rewards");
//         rewardDistributor = await rewardsFactory.deploy(mockToken.address, SIGNER);

//         const tokeFactory = await ethers.getContractFactory("Toke");
//         realToken = await tokeFactory.deploy();
//     });

//     describe("Test Constructor", async () => {
//         it("Test Invalid TOKE Address", async () => {
//             await expectRevert(rewardsFactory.deploy(ZERO_ADDRESS, SIGNER), "Invalid TOKE Address");
//         });

//         it("Test Invalid Signer Address", async () => {
//             await expectRevert(rewardsFactory.deploy(mockToken.address, ZERO_ADDRESS), "Invalid Signer Address");
//         });
//     });

//     describe("Test Defaults", async () => {
//         it("Test TOKE Contract set", async () => {
//             const tokenAddress = await rewardDistributor.tokeToken();
//             assert.equal(tokenAddress, mockToken.address);
//         });

//         it("Test Signer set", async () => {
//             const signerAddress = await rewardDistributor.rewardsSigner();
//             assert.equal(signerAddress.toLowerCase(), SIGNER);
//         });

//         it("Test Owner is set", async () => {
//             const ownerAddress = await rewardDistributor.owner();
//             assert(ownerAddress, owner);
//         });
//     });

//     describe("Test Setters", async () => {
//         it("Test setting signer by not owner", async () => {
//             await expectRevert.unspecified(rewardDistributor.connect(recipient1).setSigner(ROTATED_SIGNER));
//         });

//         it("Test setting signer to 0 address fails", async () => {
//             await expectRevert.unspecified(rewardDistributor.setSigner(ZERO_ADDRESS));
//         });

//         it("Test setting signer", async () => {
//             await rewardDistributor.setSigner(ROTATED_SIGNER);
//             const newSigner = await rewardDistributor.rewardsSigner();
//             assert(newSigner, ROTATED_SIGNER);
//         });

//         it("Test event emit", async () => {
//             await expect(rewardDistributor.setSigner(ROTATED_SIGNER))
//                 .to.emit(rewardDistributor, "SignerSet")
//                 .withArgs(ROTATED_SIGNER);
//         });
//     });

//     describe("Test Claiming", async () => {
//         it("Test Signature mismatch", async () => {
//             const {r, s, v} = await generateSignature(
//                 SIGNER_KEY,
//                 rewardDistributor.address,
//                 "1",
//                 recipient1.address,
//                 1
//             );

//             const recipientData = [DEV_CHAIN_ID, "1", recipient1.address, 2];
//             await expectRevert(
//                 rewardDistributor.connect(recipient1).claim(recipientData, v, r, s),
//                 "Invalid Signature"
//             );
//         });

//         it("Test claimable must be greater than 0", async () => {
//             const {r, s, v} = await generateSignature(
//                 SIGNER_KEY,
//                 rewardDistributor.address,
//                 "1",
//                 recipient1.address,
//                 0
//             );

//             const recipientData = [DEV_CHAIN_ID, "1", recipient1.address, 0];
//             await expectRevert(
//                 rewardDistributor.connect(recipient1).claim(recipientData, v, r, s),
//                 "Invalid claimable amount"
//             );
//         });

//         it("Test claiming more than available balance of contract", async () => {
//             const amount = 10;
//             await mockToken.mock.balanceOf.withArgs(rewardDistributor.address).returns(amount - 1);

//             const sig1 = await generateSignature(
//                 SIGNER_KEY,
//                 rewardDistributor.address,
//                 "1",
//                 recipient1.address,
//                 amount
//             );
//             let recipientData = [DEV_CHAIN_ID, "1", recipient1.address, amount];
//             await expectRevert(
//                 rewardDistributor.connect(recipient1).claim(recipientData, sig1.v, sig1.r, sig1.s),
//                 "Insufficient Funds"
//             );
//         });

//         it("Test claiming for another user", async () => {
//             const amount = 10;
//             const sig1 = await generateSignature(
//                 SIGNER_KEY,
//                 rewardDistributor.address,
//                 "1",
//                 recipient1.address,
//                 amount
//             );
//             let recipientData = [DEV_CHAIN_ID, "1", recipient1.address, amount];

//             // another recipient claims
//             await expectRevert(
//                 rewardDistributor.connect(recipient2).claim(recipientData, sig1.v, sig1.r, sig1.s),
//                 "Sender wallet Mismatch"
//             );
//         });

//         it("Test all funds can be removed from contract", async () => {
//             const amount = 10;
//             await mockToken.mock.transfer.withArgs(recipient1.address, amount).returns(true);
//             await mockToken.mock.balanceOf.withArgs(rewardDistributor.address).returns(amount);

//             const sig1 = await generateSignature(
//                 SIGNER_KEY,
//                 rewardDistributor.address,
//                 "1",
//                 recipient1.address,
//                 amount
//             );
//             let recipientData = [DEV_CHAIN_ID, "1", recipient1.address, amount];
//             await rewardDistributor.connect(recipient1).claim(recipientData, sig1.v, sig1.r, sig1.s);
//         });

//         it("Test claiming when signer changes", async () => {
//             const amount = 10;
//             await mockToken.mock.transfer.withArgs(recipient1.address, amount).returns(true);
//             await mockToken.mock.balanceOf.withArgs(rewardDistributor.address).returns(amount);

//             const sig1 = await generateSignature(
//                 SIGNER_KEY,
//                 rewardDistributor.address,
//                 "1",
//                 recipient1.address,
//                 amount
//             );
//             let recipientData = [DEV_CHAIN_ID, "1", recipient1.address, amount];
//             await rewardDistributor.connect(recipient1).claim(recipientData, sig1.v, sig1.r, sig1.s);

//             await rewardDistributor.setSigner(ROTATED_SIGNER);

//             const sig2 = await generateSignature(
//                 ROTATED_SIGNER_KEY,
//                 rewardDistributor.address,
//                 "1",
//                 recipient1.address,
//                 amount * 2
//             );
//             recipientData = [DEV_CHAIN_ID, "1", recipient1.address, amount * 2];
//             await rewardDistributor.connect(recipient1).claim(recipientData, sig2.v, sig2.r, sig2.s);
//         });

//         it("Test Claim event is emitted", async () => {
//             const amount = 10;
//             await mockToken.mock.transfer.withArgs(recipient1.address, amount).returns(true);
//             await mockToken.mock.balanceOf.withArgs(rewardDistributor.address).returns(amount);

//             const sig1 = await generateSignature(
//                 SIGNER_KEY,
//                 rewardDistributor.address,
//                 "1",
//                 recipient1.address,
//                 amount
//             );

//             let recipientData = [DEV_CHAIN_ID, "1", recipient1.address, amount];
//             await expect(rewardDistributor.connect(recipient1).claim(recipientData, sig1.v, sig1.r, sig1.s))
//                 .to.emit(rewardDistributor, "Claimed")
//                 .withArgs(1, recipient1.address, amount);
//         });

//         it("Test reuse of signature", async () => {
//             const amount = 10;
//             await mockToken.mock.transfer.withArgs(recipient1.address, amount).returns(true);
//             await mockToken.mock.balanceOf.withArgs(rewardDistributor.address).returns(amount);

//             const sig1 = await generateSignature(
//                 SIGNER_KEY,
//                 rewardDistributor.address,
//                 "1",
//                 recipient1.address,
//                 amount
//             );
//             let recipientData = [DEV_CHAIN_ID, "1", recipient1.address, amount];
//             await rewardDistributor.connect(recipient1).claim(recipientData, sig1.v, sig1.r, sig1.s);

//             await expectRevert(
//                 rewardDistributor.connect(recipient1).claim(recipientData, sig1.v, sig1.r, sig1.s),
//                 "Invalid claimable amount"
//             );
//         });

//         it("Test successful signature and valid transfer", async () => {
//             const amount = 10;
//             const rewardsContract = await rewardsFactory.deploy(realToken.address, SIGNER);
//             await realToken.transfer(rewardsContract.address, amount);

//             const sig1 = await generateSignature(SIGNER_KEY, rewardsContract.address, "1", recipient1.address, amount);

//             let recipientData = [DEV_CHAIN_ID, "1", recipient1.address, amount];

//             expect(await realToken.balanceOf(recipient1.address)).to.equal(0);

//             await rewardsContract.connect(recipient1).claim(recipientData, sig1.v, sig1.r, sig1.s);

//             expect(await realToken.balanceOf(recipient1.address)).to.equal(amount);
//         });

//         it("Test amounts are accumulative", async () => {
//             let amount = 10;
//             await mockToken.mock.transfer.withArgs(recipient1.address, amount).returns(true);
//             await mockToken.mock.balanceOf.withArgs(rewardDistributor.address).returns(200);

//             const sig1 = await generateSignature(
//                 SIGNER_KEY,
//                 rewardDistributor.address,
//                 "1",
//                 recipient1.address,
//                 amount
//             );
//             let recipientData = [DEV_CHAIN_ID, "1", recipient1.address, amount];
//             await rewardDistributor.connect(recipient1).claim(recipientData, sig1.v, sig1.r, sig1.s);

//             amount = 90;
//             await mockToken.mock.transfer.withArgs(recipient1.address, amount).returns(true);

//             //signature is created using cycle > current cycle
//             const sig2 = await generateSignature(SIGNER_KEY, rewardDistributor.address, "2", recipient1.address, 100);
//             recipientData = [DEV_CHAIN_ID, "2", recipient1.address, 100];
//             await expect(rewardDistributor.connect(recipient1).claim(recipientData, sig2.v, sig2.r, sig2.s))
//                 .to.emit(rewardDistributor, "Claimed")
//                 .withArgs(2, recipient1.address, amount);
//         });

//         it("Claimed balances are tracked", async () => {
//             let amount = 10;
//             await mockToken.mock.transfer.withArgs(recipient1.address, amount).returns(true);
//             await mockToken.mock.balanceOf.withArgs(rewardDistributor.address).returns(200);

//             const sig1 = await generateSignature(
//                 SIGNER_KEY,
//                 rewardDistributor.address,
//                 "1",
//                 recipient1.address,
//                 amount
//             );
//             let recipientData = [DEV_CHAIN_ID, "1", recipient1.address, amount];
//             await rewardDistributor.connect(recipient1).claim(recipientData, sig1.v, sig1.r, sig1.s);

//             amount = 90;
//             await mockToken.mock.transfer.withArgs(recipient1.address, amount).returns(true);

//             recipientData = [DEV_CHAIN_ID, "2", recipient1.address, 100];

//             const claimable = await rewardDistributor.connect(recipient1).getClaimableAmount(recipientData);

//             expect(claimable.toString()).to.equal("90");
//         });
//     });
// });
