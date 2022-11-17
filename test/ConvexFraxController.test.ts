// import { expect } from "chai";
// import { artifacts, ethers, network } from "hardhat";
// import { deployMockContract, MockContract } from "ethereum-waffle";
// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import { JsonRpcSigner } from "@ethersproject/providers";
// import * as timeMachine from "ganache-time-traveler";

// import { ConvexFraxController, ConvexFraxController__factory } from "../typechain";
// import { getContractAddress } from "@ethersproject/address";
// import { ADD_LIQUIDITY_ROLE, MISC_OPERATION_ROLE, REMOVE_LIQUIDITY_ROLE } from "../test-integration/utilities/roles";
// import { formatBytes32String, parseUnits } from "ethers/lib/utils";

// const ACCESS_CONTROL = artifacts.require("@openzeppelin/contracts/access/AccessControl.sol");

// const ERC20Artfiact = artifacts.require("TestnetToken");
// const curveTokenAddress = "0x3175df0976dfa876431c2e9ee6bc45b65d3473cc";
// const randomAddress = "0x425A47AFDB74B4E361223463CF85287741Ac6926";
// const voteProxy = "0x59CFCD384746ec3035299D90782Be065e466800B";
// const staking = "0x963f487796d54d2f27bA6F3Fbe91154cA103b199";
// const whaleAddress = "0x4606326b4db89373f5377c316d3b0f6e55bc6a20";
// const crv = "0xD533a949740bb3306d119CC777fa900bA034cd52";
// const cvx = "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B";
// const fxs = "0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0";

// const lockTime = 604800; // 7 days
// const poolId = 9;
// const defaultAmount = parseUnits("1");

// describe("Convex Controller", () => {
//     let snapshotId: string;

//     let deployer: SignerWithAddress;

//     let addressRegistry: MockContract;
//     let accessControl: MockContract;

//     let managerAddress: string;
//     let convexControllerFactory: ConvexFraxController__factory;
//     let convexController: ConvexFraxController;

//     let controllerSigner: JsonRpcSigner;

//     before(async () => {
//         [deployer] = await ethers.getSigners();

//         accessControl = await deployMockContract(deployer, ACCESS_CONTROL.abi);
//         await accessControl.mock.hasRole.returns(true);

//         const addressRegistryArtifact = artifacts.require("AddressRegistry");
//         addressRegistry = await deployMockContract(deployer, addressRegistryArtifact.abi);
//         await addressRegistry.mock.checkAddress.returns(true);

//         const transactionCount = await deployer.getTransactionCount();
//         managerAddress = getContractAddress({
//             from: deployer.address,
//             nonce: transactionCount,
//         });

//         convexControllerFactory = new ConvexFraxController__factory(deployer);
//         convexController = await convexControllerFactory.deploy(
//             managerAddress,
//             accessControl.address,
//             addressRegistry.address,
//             voteProxy
//         );

//         //Get a reference to the controller as a signer so we can again
//         //make calls as the "Manager"
//         await network.provider.request({
//             method: "hardhat_impersonateAccount",
//             params: [convexController.address],
//         });

//         controllerSigner = await ethers.provider.getSigner(convexController.address);

//         const token = await ethers.getContractAt(ERC20Artfiact.abi, curveTokenAddress);

//         const balance = await token.balanceOf(whaleAddress);

//         let etherBal = ethers.utils.parseEther("5000").toHexString();
//         if (etherBal.startsWith("0x0")) etherBal = "0x" + etherBal.substring(3);
//         await ethers.provider.send("hardhat_setBalance", [whaleAddress, etherBal]);

//         await network.provider.request({ method: "hardhat_impersonateAccount", params: [whaleAddress] });
//         const whaleSigner = ethers.provider.getSigner(whaleAddress);

//         await token.connect(whaleSigner).transfer(convexController.address, balance);
//     });

//     beforeEach(async () => {
//         const snapshot = await timeMachine.takeSnapshot();
//         snapshotId = snapshot["result"];
//     });

//     afterEach(async () => {
//         await timeMachine.revertToSnapshot(snapshotId);
//     });

//     async function successfulDeposit(): Promise<string> {
//         await addressRegistry.mock.checkAddress.returns(true);

//         await convexController.depositAndStakeLockedCurveLp(
//             poolId,
//             curveTokenAddress,
//             staking,
//             defaultAmount,
//             lockTime
//         );

//         const lockedStakes = await convexController.callStatic.lockedStakesOf(poolId, convexController.address);

//         return lockedStakes[0].kek_id;
//     }

//     describe("constructor", () => {
//         it("should revert if manager address is zero", async () => {
//             await expect(
//                 convexControllerFactory.deploy(
//                     ethers.constants.AddressZero,
//                     accessControl.address,
//                     addressRegistry.address,
//                     voteProxy
//                 )
//             ).to.be.revertedWith("INVALID_ADDRESS");
//         });

//         it("should revert if accessControl address is zero", async () => {
//             await expect(
//                 convexControllerFactory.deploy(
//                     ethers.constants.AddressZero,
//                     ethers.constants.AddressZero,
//                     addressRegistry.address,
//                     voteProxy
//                 )
//             ).to.be.revertedWith("INVALID_ADDRESS");
//         });

//         it("should revert if registry address is zero", async () => {
//             await expect(
//                 convexControllerFactory.deploy(
//                     managerAddress,
//                     accessControl.address,
//                     ethers.constants.AddressZero,
//                     voteProxy
//                 )
//             ).to.be.revertedWith("INVALID_ADDRESS");
//         });

//         it("should revert if Frax voter proxy address is zero", async () => {
//             await expect(
//                 convexControllerFactory.deploy(
//                     managerAddress,
//                     accessControl.address,
//                     addressRegistry.address,
//                     ethers.constants.AddressZero
//                 )
//             ).to.be.revertedWith("INVALID_FRAX_SYSTEM_BOOSTER_ADDRESS");
//         });
//     });

//     describe("depositAndStake", () => {
//         it("should revert if sender has not the role ADD_LIQUIDITY_ROLE", async () => {
//             await accessControl.mock.hasRole.withArgs(ADD_LIQUIDITY_ROLE, controllerSigner._address).returns(false);

//             await expect(
//                 convexController
//                     .connect(controllerSigner)
//                     .depositAndStakeLockedCurveLp(poolId, curveTokenAddress, staking, defaultAmount, lockTime)
//             ).to.be.revertedWith("NOT_ADD_LIQUIDITY_ROLE");
//         });

//         it("should revert if lp token is not registered", async () => {
//             await addressRegistry.mock.checkAddress.returns(false);
//             await expect(
//                 convexController.depositAndStakeLockedCurveLp(
//                     poolId,
//                     curveTokenAddress,
//                     staking,
//                     defaultAmount,
//                     lockTime
//                 )
//             ).to.be.revertedWith("INVALID_LP_TOKEN");
//         });

//         it("should revert if staking address is invalid", async () => {
//             await expect(
//                 convexController.depositAndStakeLockedCurveLp(
//                     poolId,
//                     curveTokenAddress,
//                     ethers.constants.AddressZero,
//                     defaultAmount,
//                     lockTime
//                 )
//             ).to.be.revertedWith("INVALID_STAKING_ADDRESS");
//         });

//         it("should revert if poolId / staking", async () => {
//             await expect(
//                 convexController.depositAndStakeLockedCurveLp(
//                     poolId,
//                     curveTokenAddress,
//                     randomAddress,
//                     defaultAmount,
//                     lockTime
//                 )
//             ).to.be.revertedWith("POOL_ID_STAKING_MISMATCH");
//         });

//         it("should revert if amount is zero", async () => {
//             await expect(
//                 convexController.depositAndStakeLockedCurveLp(poolId, curveTokenAddress, staking, 0, lockTime)
//             ).to.be.revertedWith("INVALID_AMOUNT");
//         });

//         it("should create a vault only once", async () => {
//             await expect(
//                 convexController.depositAndStakeLockedCurveLp(
//                     poolId,
//                     curveTokenAddress,
//                     staking,
//                     defaultAmount.div(2),
//                     lockTime
//                 )
//             ).to.emit(convexController, "VaultCreated");

//             await expect(
//                 convexController.depositAndStakeLockedCurveLp(
//                     poolId,
//                     curveTokenAddress,
//                     staking,
//                     defaultAmount.div(2),
//                     lockTime
//                 )
//             ).to.not.emit(convexController, "VaultCreated");
//         });

//         it("should successfully deposit and stack liquidity", async () => {
//             await convexController.depositAndStakeLockedCurveLp(
//                 poolId,
//                 curveTokenAddress,
//                 staking,
//                 defaultAmount,
//                 lockTime
//             );
//         });
//     });

//     describe("withdrawLockedAndUnwrap", () => {
//         it("should revert if sender has not the role REMOVE_LIQUIDITY_ROLE", async () => {
//             await accessControl.mock.hasRole.withArgs(REMOVE_LIQUIDITY_ROLE, controllerSigner._address).returns(false);

//             await expect(
//                 convexController
//                     .connect(controllerSigner)
//                     .withdrawLockedAndUnwrap(formatBytes32String("fake"), poolId, defaultAmount)
//             ).to.be.revertedWith("NOT_REMOVE_LIQUIDITY_ROLE");
//         });
//         it("should revert if stake is not found", async () => {
//             await successfulDeposit();

//             await expect(
//                 convexController.withdrawLockedAndUnwrap(formatBytes32String("fake"), poolId, defaultAmount)
//             ).to.be.revertedWith("Stake not found");
//         });

//         it("should revert if stake is still locked", async () => {
//             const kekId = await successfulDeposit();

//             await expect(convexController.withdrawLockedAndUnwrap(kekId, poolId, defaultAmount)).to.be.revertedWith(
//                 "Stake is still locked!"
//             );
//         });

//         it("should revert if withdrawn amount is less than expected amount", async () => {
//             const kekId = await successfulDeposit();

//             await timeMachine.advanceTime(lockTime + 60);

//             await expect(
//                 convexController.withdrawLockedAndUnwrap(kekId, poolId, defaultAmount.add("100"))
//             ).to.be.revertedWith("BALANCE_MUST_INCREASE");
//         });

//         it("should successfully withdraw locked and unwrap", async () => {
//             const kekId = await successfulDeposit();

//             await timeMachine.advanceTime(lockTime + 60);

//             await convexController.withdrawLockedAndUnwrap(kekId, poolId, defaultAmount);
//         });
//     });

//     describe("claimRewards", () => {
//         it("should revert if sender has not the role MISC_OPERATION_ROLE", async () => {
//             await accessControl.mock.hasRole.withArgs(MISC_OPERATION_ROLE, controllerSigner._address).returns(false);

//             await expect(
//                 convexController.connect(controllerSigner).claimRewards(poolId, [
//                     { token: fxs, minAmount: 1 },
//                     { token: crv, minAmount: 1 },
//                     { token: cvx, minAmount: 1 },
//                 ])
//             ).to.be.revertedWith("NOT_MISC_OPERATION_ROLE");
//         });

//         it("should successfully claim revert", async () => {
//             await convexController.depositAndStakeLockedCurveLp(
//                 poolId,
//                 curveTokenAddress,
//                 staking,
//                 defaultAmount,
//                 lockTime
//             );

//             await convexController.claimRewards(poolId, [
//                 { token: fxs, minAmount: 1 },
//                 { token: crv, minAmount: 1 },
//                 { token: cvx, minAmount: 1 },
//             ]);
//         });
//     });
// });
