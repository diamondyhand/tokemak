// import {ethers, upgrades, artifacts, waffle} from "hardhat";
// import {MockContract} from "@ethereum-waffle/mock-contract";
// import * as timeMachine from "ganache-time-traveler";
// import {DelegateFunction, ERC1271WalletMock} from "../typechain";
// import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
// import {expect} from "chai";
// import {Wallet} from "@ethersproject/wallet";

// import {
//     personalSign,
//     EI712Sign,
//     DelegateMap,
//     DelegateMapView,
//     SignatureType,
//     FunctionsListPayload,
//     DelegatePayload,
//     PrimaryTypes,
// } from "../test-integration/utilities/delegateFunction";

// const {deployMockContract} = waffle;
// const IFxStateSender = artifacts.require("IFxStateSender");
// const {AddressZero: ZERO_ADDRESS} = ethers.constants;

// let deployer: SignerWithAddress;
// let user1: SignerWithAddress;
// let user2: SignerWithAddress;
// let destinationOnL2: SignerWithAddress;
// let fxStateSender: MockContract;

// let delegateFunction: DelegateFunction;
// let contractERC1271: ERC1271WalletMock;

// let snapshotId: string;

// const wallet1 = new ethers.Wallet(
//     "0x1a6cfb855acda05003dfe3992997bb17da824ea1fc6057674b27f5cc739e7864",
//     ethers.provider
// );

// const wallet2 = new ethers.Wallet(
//     "0x1e61f28b0175f32ad0a82cb763b53509f8d0389e58639912b29aa4c82669327a",
//     ethers.provider
// );

// const rewardsFunctionKey = ethers.utils.formatBytes32String("rewards");
// const votingFunctionKey = ethers.utils.formatBytes32String("voting");

// let delegateMaps: DelegateMap[];
// let delegatePayload: DelegatePayload;
// let delegatePayload2: DelegatePayload;

// describe("Test DelegateFunctions", () => {
//     before(async () => {
//         [deployer, user1, user2, destinationOnL2] = await ethers.getSigners();

//         // deploy ERC1271 contract and set the ownership to wallet.address
//         const contractERC1271Factory = await ethers.getContractFactory("ERC1271WalletMock");
//         contractERC1271 = await contractERC1271Factory.deploy(wallet1.address);

//         fxStateSender = await deployMockContract(deployer, IFxStateSender.abi);
//         fxStateSender.mock.sendMessageToChild.returns();

//         // deploy DelegateFunction contract
//         const delegateFunctionFactory = await ethers.getContractFactory("DelegateFunction", deployer);
//         delegateFunction = (await upgrades.deployProxy(delegateFunctionFactory, [], {
//             unsafeAllow: ["state-variable-assignment", "state-variable-immutable"],
//         })) as DelegateFunction;

//         delegateMaps = [
//             {
//                 functionId: rewardsFunctionKey,
//                 otherParty: user1.address,
//                 mustRelinquish: false,
//             },
//             {
//                 functionId: votingFunctionKey,
//                 otherParty: user1.address,
//                 mustRelinquish: false,
//             },
//         ];

//         delegatePayload = {sets: delegateMaps, nonce: 0};

//         delegatePayload2 = {
//             sets: [
//                 {
//                     functionId: rewardsFunctionKey,
//                     otherParty: user1.address,
//                     mustRelinquish: false,
//                 },
//                 {
//                     functionId: votingFunctionKey,
//                     otherParty: user1.address,
//                     mustRelinquish: true,
//                 },
//             ],
//             nonce: 0,
//         };
//     });

//     beforeEach(async () => {
//         const snapshot = await timeMachine.takeSnapshot();
//         snapshotId = snapshot["result"] as string;
//     });

//     afterEach(async () => {
//         await timeMachine.revertToSnapshot(snapshotId);
//     });

//     describe("Setup Contract", () => {
//         it("Allows to setup allowed functions", async () => {
//             await expect(
//                 delegateFunction
//                     .connect(deployer)
//                     .setAllowedFunctions([{id: rewardsFunctionKey}, {id: votingFunctionKey}])
//             ).to.not.be.reverted;
//         });
//     });

//     describe("Test Set Destination", async () => {
//         it("Reverts on non owner call", async () => {
//             await expect(
//                 delegateFunction.connect(user1).setDestinations(fxStateSender.address, destinationOnL2.address)
//             ).to.be.revertedWith("CANNOT_CONTROL_EVENTS");
//         });

//         it("Reverts when destination on L1 is zero address", async () => {
//             await expect(
//                 delegateFunction.connect(deployer).setDestinations(ZERO_ADDRESS, destinationOnL2.address)
//             ).to.be.revertedWith("INVALID_FX_ADDRESS");
//         });

//         it("Reverts when destination on L2 address is 0", async () => {
//             await expect(
//                 delegateFunction.connect(deployer).setDestinations(fxStateSender.address, ZERO_ADDRESS)
//             ).to.be.revertedWith("INVALID_DESTINATION_ADDRESS");
//         });

//         it("Correctly stores all data", async () => {
//             await delegateFunction.connect(deployer).setDestinations(fxStateSender.address, destinationOnL2.address);

//             const destinationsStruct = await delegateFunction.destinations();
//             expect(destinationsStruct.fxStateSender).to.equal(fxStateSender.address);
//             expect(destinationsStruct.destinationOnL2).to.equal(destinationOnL2.address);
//         });

//         it("Emits an event with correct args", async () => {
//             const tx = await delegateFunction
//                 .connect(deployer)
//                 .setDestinations(fxStateSender.address, destinationOnL2.address);
//             const receipt = await tx.wait();
//             const eventArgs = (receipt as any).events[0].args;
//             expect(eventArgs.fxStateSender).to.equal(fxStateSender.address);
//             expect(eventArgs.destinationOnL2).to.equal(destinationOnL2.address);
//         });
//     });

//     describe("Nonce guardrail", () => {
//         it("Rejects when same nonce is used twice", async () => {
//             await fundAccountWithETH(wallet1);

//             await delegateFunction
//                 .connect(deployer)
//                 .setAllowedFunctions([{id: rewardsFunctionKey}, {id: votingFunctionKey}]);

//             const signature = EI712Sign(
//                 delegateFunction.address,
//                 delegatePayload,
//                 PrimaryTypes.DelegatePayload,
//                 wallet1.privateKey
//             );

//             await delegateFunction
//                 .connect(wallet1)
//                 .delegateWithEIP1271(contractERC1271.address, delegatePayload, signature, SignatureType.EIP712);

//             const removePayload: FunctionsListPayload = {
//                 sets: [rewardsFunctionKey],
//                 nonce: 0,
//             };

//             const signatureCancel = EI712Sign(
//                 delegateFunction.address,
//                 removePayload,
//                 PrimaryTypes.FunctionsListPayload,
//                 wallet1.privateKey
//             );

//             await expect(
//                 delegateFunction
//                     .connect(wallet1)
//                     .removeDelegationWithEIP1271(
//                         contractERC1271.address,
//                         removePayload,
//                         signatureCancel,
//                         SignatureType.EIP712
//                     )
//             ).to.be.revertedWith("INVALID_NONCE");
//         });
//     });

//     describe("Delegate functions", () => {
//         beforeEach(async () => {
//             await delegateFunction.connect(deployer).setDestinations(fxStateSender.address, destinationOnL2.address);

//             const tx = await delegateFunction
//                 .connect(deployer)
//                 .setAllowedFunctions([{id: rewardsFunctionKey}, {id: votingFunctionKey}]);
//             await tx.wait();
//         });

//         it("Allows to delegate multiple function in a single call", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);

//             const delegations = await delegateFunction.connect(deployer).getDelegations(deployer.address);

//             expect(delegations.length).to.be.equal(2);
//             expect(areDelegationEquals(delegateMaps[0], delegations[0])).to.be.true;
//             expect(areDelegationEquals(delegateMaps[1], delegations[1])).to.be.true;
//         });

//         it("Does not allow delegation when paused", async () => {
//             await delegateFunction.connect(deployer).pause();
//             await expect(delegateFunction.connect(deployer).delegate(delegateMaps)).to.be.revertedWith(
//                 "Pausable: paused"
//             );
//         });

//         it("Allows to replace pending delegations", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);

//             const delegateMapsForUser2 = delegateMaps.map((item) => ({
//                 ...item,
//                 otherParty: user2.address,
//             }));
//             await delegateFunction.connect(deployer).delegate(delegateMapsForUser2);

//             const delegations = await delegateFunction.connect(deployer).getDelegations(deployer.address);

//             expect(delegations.length).to.be.equal(2);
//             expect(areDelegationEquals(delegateMapsForUser2[0], delegations[0])).to.be.true;
//             expect(areDelegationEquals(delegateMapsForUser2[1], delegations[1])).to.be.true;
//         });

//         it("Allows to delegate get one delegation", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);

//             const delegation = await delegateFunction
//                 .connect(deployer)
//                 .getDelegation(deployer.address, votingFunctionKey);

//             expect(delegation.functionId).to.be.equal(votingFunctionKey);
//         });

//         it("Allows to reject delegation", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);

//             await delegateFunction
//                 .connect(user1)
//                 .rejectDelegation([{originalParty: deployer.address, functionId: votingFunctionKey}]);

//             const delegations = await delegateFunction.connect(deployer).getDelegations(deployer.address);

//             const cleanedDelegations = cleanDelegations(delegations);

//             expect(cleanedDelegations.length).to.be.equal(1);
//             expect(cleanedDelegations[0].functionId).to.be.equal(rewardsFunctionKey);
//         });

//         it("Does not allow reject delegation when paused", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);
//             await delegateFunction.connect(deployer).pause();

//             await expect(
//                 delegateFunction
//                     .connect(user1)
//                     .rejectDelegation([{originalParty: deployer.address, functionId: votingFunctionKey}])
//             ).to.be.revertedWith("Pausable: paused");
//         });

//         it("Allows to accept delegation", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);

//             await delegateFunction.connect(user1).acceptDelegation([
//                 {originalParty: deployer.address, functionId: votingFunctionKey},
//                 {originalParty: deployer.address, functionId: rewardsFunctionKey},
//             ]);

//             const delegations = await delegateFunction.connect(deployer).getDelegations(deployer.address);

//             const cleanedDelegations = cleanDelegations(delegations);

//             expect(cleanedDelegations.length).to.be.equal(2);
//             expect(cleanedDelegations[0].pending).to.be.equal(false);
//             expect(cleanedDelegations[1].pending).to.be.equal(false);
//         });

//         it("Allows to accept delegation on behalf of", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);

//             await delegateFunction.connect(deployer).acceptDelegationOnBehalfOf(
//                 [user1.address],
//                 [
//                     [
//                         {originalParty: deployer.address, functionId: votingFunctionKey},
//                         {originalParty: deployer.address, functionId: rewardsFunctionKey},
//                     ],
//                 ]
//             );

//             const delegations = await delegateFunction.connect(deployer).getDelegations(deployer.address);

//             const cleanedDelegations = cleanDelegations(delegations);

//             expect(cleanedDelegations.length).to.be.equal(2);
//             expect(cleanedDelegations[0].pending).to.be.equal(false);
//             expect(cleanedDelegations[1].pending).to.be.equal(false);
//         });

//         it("Only allows owner to accept on behalf of", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);

//             await expect(
//                 delegateFunction.connect(user2).acceptDelegationOnBehalfOf(
//                     [user1.address],
//                     [
//                         [
//                             {originalParty: deployer.address, functionId: votingFunctionKey},
//                             {originalParty: deployer.address, functionId: rewardsFunctionKey},
//                         ],
//                     ]
//                 )
//             ).to.be.revertedWith("Ownable: caller is not the owner");
//         });

//         it("Does not allow accepting delegation when paused", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);
//             await delegateFunction.connect(deployer).pause();

//             await expect(
//                 delegateFunction.connect(user1).acceptDelegation([
//                     {originalParty: deployer.address, functionId: votingFunctionKey},
//                     {originalParty: deployer.address, functionId: rewardsFunctionKey},
//                 ])
//             ).to.be.revertedWith("Pausable: paused");

//             await expect(
//                 delegateFunction.connect(deployer).acceptDelegationOnBehalfOf(
//                     [user1.address],
//                     [
//                         [
//                             {originalParty: deployer.address, functionId: votingFunctionKey},
//                             {originalParty: deployer.address, functionId: rewardsFunctionKey},
//                         ],
//                     ]
//                 )
//             ).to.be.revertedWith("Pausable: paused");
//         });

//         it("Allows to cancel pending delegation", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);

//             await delegateFunction.connect(deployer).cancelPendingDelegation([rewardsFunctionKey]);

//             const delegations = await delegateFunction.connect(deployer).getDelegations(deployer.address);

//             const cleanedDelegations = cleanDelegations(delegations);

//             expect(cleanedDelegations.length).to.be.equal(1);
//             expect(cleanedDelegations[0].functionId).to.be.equal(votingFunctionKey);
//         });

//         it("Does not allow cancel pending delegation when paused", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);
//             await delegateFunction.connect(deployer).pause();
//             await expect(
//                 delegateFunction.connect(deployer).cancelPendingDelegation([rewardsFunctionKey])
//             ).to.be.revertedWith("Pausable: paused");
//         });

//         it("Allows to remove delegation", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);

//             await delegateFunction.connect(deployer).removeDelegation([rewardsFunctionKey]);

//             const delegations = await delegateFunction.connect(deployer).getDelegations(deployer.address);

//             const cleanedDelegations = cleanDelegations(delegations);

//             expect(cleanedDelegations.length).to.be.equal(1);
//             expect(cleanedDelegations[0].functionId).to.be.equal(votingFunctionKey);
//         });

//         it("Does not allow remove delegation when paused", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);
//             await delegateFunction.connect(deployer).pause();
//             await expect(delegateFunction.connect(deployer).removeDelegation([rewardsFunctionKey])).to.be.revertedWith(
//                 "Pausable: paused"
//             );
//         });

//         it("Allows to relinquish delegation", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);

//             await delegateFunction.connect(user1).acceptDelegation([
//                 {originalParty: deployer.address, functionId: votingFunctionKey},
//                 {originalParty: deployer.address, functionId: rewardsFunctionKey},
//             ]);
//             await delegateFunction
//                 .connect(user1)
//                 .relinquishDelegation([{originalParty: deployer.address, functionId: rewardsFunctionKey}]);

//             const delegations = await delegateFunction.connect(deployer).getDelegations(deployer.address);

//             const cleanedDelegations = cleanDelegations(delegations);

//             expect(cleanedDelegations.length).to.be.equal(1);
//             expect(cleanedDelegations[0].functionId).to.be.equal(votingFunctionKey);
//         });

//         it("Does not allow relinquish delegation when paused", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);

//             await delegateFunction.connect(user1).acceptDelegation([
//                 {originalParty: deployer.address, functionId: votingFunctionKey},
//                 {originalParty: deployer.address, functionId: rewardsFunctionKey},
//             ]);

//             await delegateFunction.connect(deployer).pause();

//             await expect(
//                 delegateFunction
//                     .connect(user1)
//                     .relinquishDelegation([{originalParty: deployer.address, functionId: rewardsFunctionKey}])
//             ).to.be.revertedWith("Pausable: paused");
//         });

//         it("Allows to relinquish delegation when accepted on behalf of", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);

//             await delegateFunction.connect(deployer).acceptDelegationOnBehalfOf(
//                 [user1.address],
//                 [
//                     [
//                         {originalParty: deployer.address, functionId: votingFunctionKey},
//                         {originalParty: deployer.address, functionId: rewardsFunctionKey},
//                     ],
//                 ]
//             );
//             await delegateFunction
//                 .connect(user1)
//                 .relinquishDelegation([{originalParty: deployer.address, functionId: rewardsFunctionKey}]);

//             const delegations = await delegateFunction.connect(deployer).getDelegations(deployer.address);

//             const cleanedDelegations = cleanDelegations(delegations);

//             expect(cleanedDelegations.length).to.be.equal(1);
//             expect(cleanedDelegations[0].functionId).to.be.equal(votingFunctionKey);
//         });

//         it("Reverts when trying to accept a delegation that is not assigned to the user", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);
//             await expect(
//                 delegateFunction
//                     .connect(user2)
//                     .acceptDelegation([{originalParty: deployer.address, functionId: votingFunctionKey}])
//             ).to.be.revertedWith("NOT_ASSIGNED");
//         });

//         it("Reverts when trying to accept a delegation that is not assigned to the user when accepting on behalf of", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);
//             await expect(
//                 delegateFunction
//                     .connect(deployer)
//                     .acceptDelegationOnBehalfOf(
//                         [user2.address],
//                         [[{originalParty: deployer.address, functionId: votingFunctionKey}]]
//                     )
//             ).to.be.revertedWith("NOT_ASSIGNED");
//         });

//         it("Reverts when trying to accept a delegation twice", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);
//             await delegateFunction
//                 .connect(user1)
//                 .acceptDelegation([{originalParty: deployer.address, functionId: votingFunctionKey}]);
//             await expect(
//                 delegateFunction
//                     .connect(user1)
//                     .acceptDelegation([{originalParty: deployer.address, functionId: votingFunctionKey}])
//             ).to.be.revertedWith("ALREADY_ACCEPTED");
//         });

//         it("Reverts when trying to accept a delegation twice using using on behalf of for both", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);
//             await delegateFunction
//                 .connect(deployer)
//                 .acceptDelegationOnBehalfOf(
//                     [user1.address],
//                     [[{originalParty: deployer.address, functionId: votingFunctionKey}]]
//                 );
//             await expect(
//                 delegateFunction
//                     .connect(deployer)
//                     .acceptDelegationOnBehalfOf(
//                         [user1.address],
//                         [[{originalParty: deployer.address, functionId: votingFunctionKey}]]
//                     )
//             ).to.be.revertedWith("ALREADY_ACCEPTED");
//         });

//         it("Reverts when trying to accept a delegation twice using using on behalf of for first", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);
//             await delegateFunction
//                 .connect(deployer)
//                 .acceptDelegationOnBehalfOf(
//                     [user1.address],
//                     [[{originalParty: deployer.address, functionId: votingFunctionKey}]]
//                 );
//             await expect(
//                 delegateFunction
//                     .connect(user1)
//                     .acceptDelegation([{originalParty: deployer.address, functionId: votingFunctionKey}])
//             ).to.be.revertedWith("ALREADY_ACCEPTED");
//         });

//         it("Reverts when trying to accept a delegation twice using using on behalf of for second", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);
//             await delegateFunction
//                 .connect(user1)
//                 .acceptDelegation([{originalParty: deployer.address, functionId: votingFunctionKey}]);
//             await expect(
//                 delegateFunction
//                     .connect(deployer)
//                     .acceptDelegationOnBehalfOf(
//                         [user1.address],
//                         [[{originalParty: deployer.address, functionId: votingFunctionKey}]]
//                     )
//             ).to.be.revertedWith("ALREADY_ACCEPTED");
//         });

//         it("Reverts when trying to relinquish a pending delegation", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);

//             await expect(
//                 delegateFunction
//                     .connect(user1)
//                     .relinquishDelegation([{originalParty: deployer.address, functionId: rewardsFunctionKey}])
//             ).to.be.revertedWith("NOT_YET_ACCEPTED");
//         });

//         it("Reverts when trying to relinquish a delegation with no originalParty", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);
//             await delegateFunction.connect(user1).acceptDelegation([
//                 {originalParty: deployer.address, functionId: votingFunctionKey},
//                 {originalParty: deployer.address, functionId: rewardsFunctionKey},
//             ]);
//             await expect(
//                 delegateFunction
//                     .connect(user1)
//                     .relinquishDelegation([{originalParty: ZERO_ADDRESS, functionId: rewardsFunctionKey}])
//             ).to.be.revertedWith("NOT_SETUP");
//         });

//         it("Reverts when trying to relinquish a delegation with no originalParty when accept on behalf olf", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);
//             await delegateFunction.connect(deployer).acceptDelegationOnBehalfOf(
//                 [user1.address],
//                 [
//                     [
//                         {originalParty: deployer.address, functionId: votingFunctionKey},
//                         {originalParty: deployer.address, functionId: rewardsFunctionKey},
//                     ],
//                 ]
//             );
//             await expect(
//                 delegateFunction
//                     .connect(user1)
//                     .relinquishDelegation([{originalParty: ZERO_ADDRESS, functionId: rewardsFunctionKey}])
//             ).to.be.revertedWith("NOT_SETUP");
//         });

//         it("Reverts when trying to remove a delegation when mustRelinquish is set to true", async () => {
//             const delegateMapsMustRelinquish = delegateMaps.map((item) => ({
//                 ...item,
//                 mustRelinquish: true,
//             }));
//             await delegateFunction.connect(deployer).delegate(delegateMapsMustRelinquish);
//             await expect(delegateFunction.connect(deployer).removeDelegation([rewardsFunctionKey])).to.be.revertedWith(
//                 "EXISTING_MUST_RELINQUISH"
//             );
//         });

//         it("Reverts when trying to remove a delegation that is not set", async () => {
//             const delegateMapsMustRelinquish = delegateMaps.map((item) => ({
//                 ...item,
//                 mustRelinquish: true,
//             }));
//             await delegateFunction.connect(deployer).delegate(delegateMapsMustRelinquish);
//             await expect(delegateFunction.connect(user1).removeDelegation([rewardsFunctionKey])).to.be.revertedWith(
//                 "NOT_SETUP"
//             );
//         });

//         it("Reverts when trying to cancel a not pending delegation", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);
//             await delegateFunction.connect(user1).acceptDelegation([
//                 {originalParty: deployer.address, functionId: votingFunctionKey},
//                 {originalParty: deployer.address, functionId: rewardsFunctionKey},
//             ]);
//             await expect(
//                 delegateFunction.connect(deployer).cancelPendingDelegation([rewardsFunctionKey])
//             ).to.be.revertedWith("NOT_PENDING");
//         });

//         it("Reverts when trying to cancel a not pending delegation that was accepted on behalf of", async () => {
//             await delegateFunction.connect(deployer).delegate(delegateMaps);
//             await delegateFunction.connect(deployer).acceptDelegationOnBehalfOf(
//                 [user1.address],
//                 [
//                     [
//                         {originalParty: deployer.address, functionId: votingFunctionKey},
//                         {originalParty: deployer.address, functionId: rewardsFunctionKey},
//                     ],
//                 ]
//             );
//             await expect(
//                 delegateFunction.connect(deployer).cancelPendingDelegation([rewardsFunctionKey])
//             ).to.be.revertedWith("NOT_PENDING");
//         });

//         it("Reverts when trying to delegate to oneself", async () => {
//             await expect(
//                 delegateFunction.connect(user1).delegate([
//                     {
//                         functionId: rewardsFunctionKey,
//                         otherParty: user1.address,
//                         mustRelinquish: false,
//                     },
//                 ])
//             ).to.be.revertedWith("NO_SELF");
//         });
//     });

//     describe("Delegate functions using EIP-1271 signature validation", () => {
//         beforeEach(async () => {
//             const tx = await delegateFunction
//                 .connect(deployer)
//                 .setAllowedFunctions([{id: rewardsFunctionKey}, {id: votingFunctionKey}]);
//             await tx.wait();
//         });

//         it("Allows to delegate functions on behalf of a contract wallet using 'EIP-1271' and 'EIP-712' signature validation", async () => {
//             await fundAccountWithETH(wallet1);

//             const signature = EI712Sign(
//                 delegateFunction.address,
//                 delegatePayload,
//                 PrimaryTypes.DelegatePayload,
//                 wallet1.privateKey
//             );

//             await delegateFunction
//                 .connect(wallet1)
//                 .delegateWithEIP1271(contractERC1271.address, delegatePayload, signature, SignatureType.EIP712);

//             const delegations = await delegateFunction.connect(deployer).getDelegations(contractERC1271.address);

//             expect(delegations.length).to.be.equal(2);
//             expect(areDelegationEquals(delegateMaps[0], delegations[0])).to.be.true;
//             expect(areDelegationEquals(delegateMaps[1], delegations[1])).to.be.true;
//         });

//         it("Does not allows to delegate functions on behalf of a contract wallet using 'EIP-1271' and 'EIP-712' signature validation when paused", async () => {
//             await fundAccountWithETH(wallet1);

//             const signature = EI712Sign(
//                 delegateFunction.address,
//                 delegatePayload,
//                 PrimaryTypes.DelegatePayload,
//                 wallet1.privateKey
//             );

//             await delegateFunction.connect(deployer).pause();
//             await expect(
//                 delegateFunction
//                     .connect(wallet1)
//                     .delegateWithEIP1271(contractERC1271.address, delegatePayload, signature, SignatureType.EIP712)
//             ).to.be.revertedWith("Pausable: paused");
//         });

//         it("Allows to delegate functions on behalf of a contract wallet using 'EIP-1271' and 'personal_sign' signature validation", async () => {
//             await fundAccountWithETH(wallet1);

//             const signature = personalSign(
//                 delegateFunction.address,
//                 delegatePayload,
//                 PrimaryTypes.DelegatePayload,
//                 wallet1.privateKey
//             );

//             await delegateFunction
//                 .connect(wallet1)
//                 .delegateWithEIP1271(contractERC1271.address, delegatePayload, signature, SignatureType.EthSign);

//             const delegations = await delegateFunction.connect(deployer).getDelegations(contractERC1271.address);

//             expect(delegations.length).to.be.equal(2);
//             expect(areDelegationEquals(delegateMaps[0], delegations[0])).to.be.true;
//             expect(areDelegationEquals(delegateMaps[1], delegations[1])).to.be.true;
//         });

//         it("Rejects when EIP-1271 signature fails", async () => {
//             await fundAccountWithETH(wallet2);

//             const signature = EI712Sign(
//                 delegateFunction.address,
//                 delegatePayload,
//                 PrimaryTypes.DelegatePayload,
//                 wallet2.privateKey
//             );

//             await expect(
//                 delegateFunction
//                     .connect(wallet2)
//                     .delegateWithEIP1271(contractERC1271.address, delegatePayload, signature, SignatureType.EIP712)
//             ).to.be.revertedWith("INVALID_SIGNATURE");
//         });

//         it("Rejects when sent payload is different from signed payload", async () => {
//             await fundAccountWithETH(wallet2);

//             const signature = EI712Sign(
//                 delegateFunction.address,
//                 delegatePayload,
//                 PrimaryTypes.DelegatePayload,
//                 wallet2.privateKey
//             );

//             await expect(
//                 delegateFunction
//                     .connect(wallet2)
//                     .delegateWithEIP1271(contractERC1271.address, delegatePayload2, signature, SignatureType.EIP712)
//             ).to.be.revertedWith("INVALID_SIGNATURE");
//         });
//     });

//     describe("Cancel & Remove Delegations EIP-1271 signature validation", () => {
//         beforeEach(async () => {
//             await delegateFunction
//                 .connect(deployer)
//                 .setAllowedFunctions([{id: rewardsFunctionKey}, {id: votingFunctionKey}]);

//             const signatureDelegate = EI712Sign(
//                 delegateFunction.address,
//                 delegatePayload,
//                 PrimaryTypes.DelegatePayload,
//                 wallet1.privateKey
//             );
//             await fundAccountWithETH(wallet1);

//             await delegateFunction
//                 .connect(wallet1)
//                 .delegateWithEIP1271(contractERC1271.address, delegatePayload, signatureDelegate, SignatureType.EIP712);
//         });

//         it("Allows to cancel delegated functions on behalf of a contract wallet using 'EIP-1271' and 'EIP-712' signature validation", async () => {
//             // nonce 0 has been used by delegateWithEIP1271 call in beforeEach
//             const cancelPayload: FunctionsListPayload = {
//                 sets: [rewardsFunctionKey],
//                 nonce: 1,
//             };

//             const signatureCancel = EI712Sign(
//                 delegateFunction.address,
//                 cancelPayload,
//                 PrimaryTypes.FunctionsListPayload,
//                 wallet1.privateKey
//             );

//             await delegateFunction
//                 .connect(wallet1)
//                 .cancelPendingDelegationWithEIP1271(
//                     contractERC1271.address,
//                     cancelPayload,
//                     signatureCancel,
//                     SignatureType.EIP712
//                 );

//             let delegations = (await delegateFunction
//                 .connect(deployer)
//                 .getDelegations(contractERC1271.address)) as DelegateMapView[];
//             delegations = cleanDelegations(delegations);

//             expect(delegations.length).to.be.equal(1);
//             expect(delegations[0].functionId).to.be.equal(votingFunctionKey);
//         });

//         it("Does not allow to cancel delegated functions on behalf of a contract wallet using 'EIP-1271' and 'EIP-712' signature validation when paused", async () => {
//             // nonce 0 has been used by delegateWithEIP1271 call in beforeEach
//             const cancelPayload: FunctionsListPayload = {
//                 sets: [rewardsFunctionKey],
//                 nonce: 1,
//             };

//             const signatureCancel = EI712Sign(
//                 delegateFunction.address,
//                 cancelPayload,
//                 PrimaryTypes.FunctionsListPayload,
//                 wallet1.privateKey
//             );

//             await delegateFunction.connect(deployer).pause();

//             await expect(
//                 delegateFunction
//                     .connect(wallet1)
//                     .cancelPendingDelegationWithEIP1271(
//                         contractERC1271.address,
//                         cancelPayload,
//                         signatureCancel,
//                         SignatureType.EIP712
//                     )
//             ).to.be.revertedWith("Pausable: paused");
//         });

//         it("Allows to cancel delegated functions on behalf of a contract wallet using 'EIP-1271' and 'personal_sign' signature validation", async () => {
//             // nonce 0 has been used by delegateWithEIP1271 call in beforeEach
//             const cancelPayload: FunctionsListPayload = {
//                 sets: [rewardsFunctionKey],
//                 nonce: 1,
//             };

//             const signatureCancel = personalSign(
//                 delegateFunction.address,
//                 cancelPayload,
//                 PrimaryTypes.FunctionsListPayload,
//                 wallet1.privateKey
//             );

//             await delegateFunction
//                 .connect(wallet1)
//                 .cancelPendingDelegationWithEIP1271(
//                     contractERC1271.address,
//                     cancelPayload,
//                     signatureCancel,
//                     SignatureType.EthSign
//                 );

//             let delegations = (await delegateFunction
//                 .connect(deployer)
//                 .getDelegations(contractERC1271.address)) as DelegateMapView[];
//             delegations = cleanDelegations(delegations);

//             expect(delegations.length).to.be.equal(1);
//             expect(delegations[0].functionId).to.be.equal(votingFunctionKey);
//         });

//         it("Allows to remove delegated functions on behalf of a contract wallet using 'EIP-1271' and 'EIP-712' signature validation", async () => {
//             // nonce 0 has been used by delegateWithEIP1271 call in beforeEach
//             const removePayload: FunctionsListPayload = {
//                 sets: [rewardsFunctionKey],
//                 nonce: 1,
//             };

//             const signatureCancel = EI712Sign(
//                 delegateFunction.address,
//                 removePayload,
//                 PrimaryTypes.FunctionsListPayload,
//                 wallet1.privateKey
//             );

//             await delegateFunction
//                 .connect(wallet1)
//                 .removeDelegationWithEIP1271(
//                     contractERC1271.address,
//                     removePayload,
//                     signatureCancel,
//                     SignatureType.EIP712
//                 );

//             let delegations = (await delegateFunction
//                 .connect(deployer)
//                 .getDelegations(contractERC1271.address)) as DelegateMapView[];
//             delegations = cleanDelegations(delegations);

//             expect(delegations.length).to.be.equal(1);
//             expect(delegations[0].functionId).to.be.equal(votingFunctionKey);
//         });

//         it("Does not allows to remove delegated functions on behalf of a contract wallet using 'EIP-1271' and 'EIP-712' signature validation when paused", async () => {
//             // nonce 0 has been used by delegateWithEIP1271 call in beforeEach
//             const removePayload: FunctionsListPayload = {
//                 sets: [rewardsFunctionKey],
//                 nonce: 1,
//             };

//             const signatureCancel = EI712Sign(
//                 delegateFunction.address,
//                 removePayload,
//                 PrimaryTypes.FunctionsListPayload,
//                 wallet1.privateKey
//             );

//             await delegateFunction.connect(deployer).pause();

//             await expect(
//                 delegateFunction
//                     .connect(wallet1)
//                     .removeDelegationWithEIP1271(
//                         contractERC1271.address,
//                         removePayload,
//                         signatureCancel,
//                         SignatureType.EIP712
//                     )
//             ).to.be.revertedWith("Pausable: paused");
//         });

//         it("Allows to remove delegated functions on behalf of a contract wallet using 'EIP-1271' and 'personal_sign' signature validation", async () => {
//             // nonce 0 has been used by delegateWithEIP1271 call in beforeEach
//             const removePayload: FunctionsListPayload = {
//                 sets: [rewardsFunctionKey],
//                 nonce: 1,
//             };

//             const signatureCancel = personalSign(
//                 delegateFunction.address,
//                 removePayload,
//                 PrimaryTypes.FunctionsListPayload,
//                 wallet1.privateKey
//             );

//             await delegateFunction
//                 .connect(wallet1)
//                 .removeDelegationWithEIP1271(
//                     contractERC1271.address,
//                     removePayload,
//                     signatureCancel,
//                     SignatureType.EthSign
//                 );

//             let delegations = (await delegateFunction
//                 .connect(deployer)
//                 .getDelegations(contractERC1271.address)) as DelegateMapView[];
//             delegations = cleanDelegations(delegations);

//             expect(delegations.length).to.be.equal(1);
//             expect(delegations[0].functionId).to.be.equal(votingFunctionKey);
//         });
//     });
// });

// const fundAccountWithETH = async (account: Wallet, amount = 500000) => {
//     let etherBal = ethers.utils.parseEther(amount.toString()).toHexString();
//     if (etherBal.startsWith("0x0")) etherBal = "0x" + etherBal.substring(3);

//     await ethers.provider.send("hardhat_setBalance", [await account.getAddress(), etherBal]);
// };

// const areDelegationEquals = (delegateMap: DelegateMap, delegateMapView: DelegateMapView): boolean =>
//     delegateMap.functionId === delegateMapView.functionId &&
//     delegateMap.mustRelinquish === delegateMapView.mustRelinquish &&
//     delegateMap.otherParty === delegateMapView.otherParty;

// const cleanDelegations = (delegations: DelegateMapView[]): DelegateMapView[] =>
//     delegations.filter((d) => d.functionId !== "0x0000000000000000000000000000000000000000000000000000000000000000");
