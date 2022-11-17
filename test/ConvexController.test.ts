import {expect} from "chai";
import {artifacts, ethers, network} from "hardhat";
import {deployMockContract, MockContract} from "ethereum-waffle";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {JsonRpcSigner} from "@ethersproject/providers";
import * as timeMachine from "ganache-time-traveler";

import {ConvexController, ConvexController__factory} from "../typechain";
import {getContractAddress} from "@ethersproject/address";
import {ADD_LIQUIDITY_ROLE, MISC_OPERATION_ROLE, REMOVE_LIQUIDITY_ROLE} from "../test-integration/utilities/roles";

const ACCESS_CONTROL = artifacts.require("@openzeppelin/contracts/access/AccessControl.sol");

/*
 * Integration tests cover successful case. Unit tests focus exclusively
 * on the failure cases
 */

const randomAddress = "0x425A47AFDB74B4E361223463CF85287741Ac6926";

describe("Convex Controller", () => {
    let snapshotId: string;

    let deployer: SignerWithAddress;

    let addressRegistry: MockContract;
    let accessControl: MockContract;
    let convexBooster: MockContract;
    let lpToken: MockContract;
    let rewardToken: MockContract;
    let convexReward: MockContract;

    let managerAddress: string;
    let convexControllerFactory: ConvexController__factory;
    let convexController: ConvexController;

    let controllerSigner: JsonRpcSigner;

    before(async () => {
        [deployer] = await ethers.getSigners();

        accessControl = await deployMockContract(deployer, ACCESS_CONTROL.abi);
        await accessControl.mock.hasRole.returns(true);

        const addressRegistryArtifact = artifacts.require("AddressRegistry");
        addressRegistry = await deployMockContract(deployer, addressRegistryArtifact.abi);

        const convexBoosterArtifact = artifacts.require("IConvexBooster");
        convexBooster = await deployMockContract(deployer, convexBoosterArtifact.abi);

        const convexRewardArtifact = artifacts.require("IConvexBaseRewards");
        convexReward = await deployMockContract(deployer, convexRewardArtifact.abi);

        const erc20Artifact = artifacts.require("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20");
        lpToken = await deployMockContract(deployer, erc20Artifact.abi);
        rewardToken = await deployMockContract(deployer, erc20Artifact.abi);

        const transactionCount = await deployer.getTransactionCount();
        managerAddress = getContractAddress({
            from: deployer.address,
            nonce: transactionCount,
        });

        convexControllerFactory = new ConvexController__factory(deployer);
        convexController = await convexControllerFactory.deploy(
            managerAddress,
            accessControl.address,
            addressRegistry.address,
            convexBooster.address
        );

        //Get a reference to the controller as a signer so we can again
        //make calls as the "Manager"
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [convexController.address],
        });

        controllerSigner = await ethers.provider.getSigner(convexController.address);
    });

    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    describe("constructor", () => {
        it("should revert if manager address is zero", async () => {
            await expect(
                convexControllerFactory.deploy(
                    ethers.constants.AddressZero,
                    accessControl.address,
                    addressRegistry.address,
                    convexBooster.address
                )
            ).to.be.revertedWith("INVALID_ADDRESS");
        });

        it("should revert if accessControl address is zero", async () => {
            await expect(
                convexControllerFactory.deploy(
                    ethers.constants.AddressZero,
                    ethers.constants.AddressZero,
                    addressRegistry.address,
                    convexBooster.address
                )
            ).to.be.revertedWith("INVALID_ADDRESS");
        });

        it("should revert if registry address is zero", async () => {
            await expect(
                convexControllerFactory.deploy(
                    managerAddress,
                    accessControl.address,
                    ethers.constants.AddressZero,
                    convexBooster.address
                )
            ).to.be.revertedWith("INVALID_ADDRESS");
        });

        it("should revert if Convex Booster address is zero", async () => {
            await expect(
                convexControllerFactory.deploy(
                    managerAddress,
                    accessControl.address,
                    addressRegistry.address,
                    ethers.constants.AddressZero
                )
            ).to.be.revertedWith("INVALID_BOOSTER_ADDRESS");
        });
    });

    describe("depositAndStake", () => {
        it("should revert if sender has not the role ADD_LIQUIDITY_ROLE", async () => {
            await accessControl.mock.hasRole.withArgs(ADD_LIQUIDITY_ROLE, controllerSigner._address).returns(false);

            await expect(
                convexController.connect(controllerSigner).depositAndStake(lpToken.address, convexReward.address, 0, 1)
            ).to.be.revertedWith("NOT_ADD_LIQUIDITY_ROLE");
        });

        it("should revert if lp token is not registered", async () => {
            await addressRegistry.mock.checkAddress.returns(false);
            await expect(
                convexController.depositAndStake(lpToken.address, convexReward.address, 0, 1)
            ).to.be.revertedWith("INVALID_LP_TOKEN");
        });

        it("should revert if lp token is not registered", async () => {
            await addressRegistry.mock.checkAddress.returns(false);
            await expect(
                convexController.depositAndStake(lpToken.address, convexReward.address, 0, 1)
            ).to.be.revertedWith("INVALID_LP_TOKEN");
        });

        it("should revert if staking address is invalid", async () => {
            await addressRegistry.mock.checkAddress.returns(true);
            await expect(
                convexController.depositAndStake(lpToken.address, ethers.constants.AddressZero, 0, 1)
            ).to.be.revertedWith("INVALID_STAKING_ADDRESS");
        });

        it("should revert if amount is zero", async () => {
            await addressRegistry.mock.checkAddress.returns(true);
            await expect(
                convexController.depositAndStake(lpToken.address, convexReward.address, 0, 0)
            ).to.be.revertedWith("INVALID_AMOUNT");
        });

        it("should revert if poolId / lpToken mismatch", async () => {
            await addressRegistry.mock.checkAddress.returns(true);
            await convexBooster.mock.poolInfo.returns(...getPoolInfo(randomAddress, convexReward.address));
            await expect(
                convexController.depositAndStake(lpToken.address, convexReward.address, 0, 1)
            ).to.be.revertedWith("POOL_ID_LP_TOKEN_MISMATCH");
        });

        it("should revert if poolId / staking mismatch", async () => {
            await addressRegistry.mock.checkAddress.returns(true);
            await convexBooster.mock.poolInfo.returns(...getPoolInfo(lpToken.address, randomAddress));
            await expect(
                convexController.depositAndStake(lpToken.address, convexReward.address, 0, 1)
            ).to.be.revertedWith("POOL_ID_STAKING_MISMATCH");
        });

        it("should revert if deposit fails", async () => {
            await addressRegistry.mock.checkAddress.returns(true);
            await convexBooster.mock.poolInfo.returns(...getPoolInfo(lpToken.address, convexReward.address));
            await lpToken.mock.allowance.returns(0);
            await lpToken.mock.approve.returns(true);
            await convexBooster.mock.deposit.returns(false);
            await convexReward.mock.balanceOf.returns(0);

            await expect(
                convexController.depositAndStake(lpToken.address, convexReward.address, 0, 1)
            ).to.be.revertedWith("DEPOSIT_AND_STAKE_FAILED");
        });

        it("should revert if balance does not increase", async () => {
            await addressRegistry.mock.checkAddress.returns(true);
            await convexBooster.mock.poolInfo.returns(...getPoolInfo(lpToken.address, convexReward.address));
            await lpToken.mock.allowance.returns(0);
            await lpToken.mock.approve.returns(true);
            await convexBooster.mock.deposit.returns(true);
            await convexReward.mock.balanceOf.returns(0);

            await expect(
                convexController.depositAndStake(lpToken.address, convexReward.address, 0, 1)
            ).to.be.revertedWith("BALANCE_MUST_INCREASE");
        });
    });

    describe("withdrawStake", () => {
        it("should revert if sender has not the role REMOVE_LIQUIDITY_ROLE", async () => {
            await accessControl.mock.hasRole.withArgs(REMOVE_LIQUIDITY_ROLE, controllerSigner._address).returns(false);

            await expect(
                convexController.connect(controllerSigner).withdrawStake(lpToken.address, convexReward.address, 0)
            ).to.be.revertedWith("NOT_REMOVE_LIQUIDITY_ROLE");
        });
        it("should revert if lp token is not registered", async () => {
            await addressRegistry.mock.checkAddress.returns(false);
            await expect(convexController.withdrawStake(lpToken.address, convexReward.address, 0)).to.be.revertedWith(
                "INVALID_LP_TOKEN"
            );
        });

        it("should revert if staking address is invalid", async () => {
            await addressRegistry.mock.checkAddress.returns(true);
            await expect(
                convexController.withdrawStake(lpToken.address, ethers.constants.AddressZero, 0)
            ).to.be.revertedWith("INVALID_STAKING_ADDRESS");
        });

        it("should revert if amount is zero", async () => {
            await addressRegistry.mock.checkAddress.returns(true);
            await expect(convexController.withdrawStake(lpToken.address, convexReward.address, 0)).to.be.revertedWith(
                "INVALID_AMOUNT"
            );
        });

        it("should revert if withdraw fails", async () => {
            await addressRegistry.mock.checkAddress.returns(true);
            await lpToken.mock.balanceOf.returns(0);
            await convexReward.mock.withdrawAndUnwrap.returns(false);
            await expect(convexController.withdrawStake(lpToken.address, convexReward.address, 1)).to.be.revertedWith(
                "WITHDRAW_STAKE_FAILED"
            );
        });

        it("should revert if balance does not increase", async () => {
            await addressRegistry.mock.checkAddress.returns(true);
            await lpToken.mock.balanceOf.returns(0);
            await convexReward.mock.withdrawAndUnwrap.returns(true);
            await expect(convexController.withdrawStake(lpToken.address, convexReward.address, 1)).to.be.revertedWith(
                "BALANCE_MUST_INCREASE"
            );
        });
    });

    describe("claimRewards", () => {
        it("should revert if sender has not the role MISC_OPERATION_ROLE", async () => {
            await accessControl.mock.hasRole.withArgs(MISC_OPERATION_ROLE, controllerSigner._address).returns(false);

            await expect(
                convexController.connect(controllerSigner).claimRewards(convexReward.address, [])
            ).to.be.revertedWith("NOT_MISC_OPERATION_ROLE");
        });

        it("should revert if staking address is invalid", async () => {
            await expect(convexController.claimRewards(ethers.constants.AddressZero, [])).to.be.revertedWith(
                "INVALID_STAKING_ADDRESS"
            );
        });

        it("should revert if expected rewards array is empty", async () => {
            await expect(convexController.claimRewards(convexReward.address, [])).to.be.revertedWith(
                "INVALID_EXPECTED_REWARDS"
            );
        });

        it("should revert if invalid reward token address", async () => {
            await expect(
                convexController.claimRewards(convexReward.address, [
                    {token: ethers.constants.AddressZero, minAmount: 1},
                ])
            ).to.be.revertedWith("INVALID_REWARD_TOKEN_ADDRESS");
        });

        it("should revert if invalid min reward amount", async () => {
            await expect(
                convexController.claimRewards(convexReward.address, [{token: rewardToken.address, minAmount: 0}])
            ).to.be.revertedWith("INVALID_MIN_REWARD_AMOUNT");
        });

        it("should revert if claim fails", async () => {
            await rewardToken.mock.balanceOf.returns(0);
            await convexReward.mock.getReward.returns(false);
            await expect(
                convexController.claimRewards(convexReward.address, [{token: rewardToken.address, minAmount: 1}])
            ).to.be.revertedWith("CLAIM_REWARD_FAILED");
        });

        it("should revert if balance does not increase", async () => {
            await rewardToken.mock.balanceOf.returns(0);
            await convexReward.mock.getReward.returns(true);
            await expect(
                convexController.claimRewards(convexReward.address, [{token: rewardToken.address, minAmount: 1}])
            ).to.be.revertedWith("BALANCE_MUST_INCREASE");
        });
    });
});

function getPoolInfo(lpToken: string, staking: string) {
    return [lpToken, randomAddress, randomAddress, staking, randomAddress, false];
}
