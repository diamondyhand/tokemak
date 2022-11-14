import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import {artifacts, ethers, network} from "hardhat";
import * as timeMachine from "ganache-time-traveler";
import {deployMockContract, MockContract} from "ethereum-waffle";
import {getContractAddress} from "@ethersproject/address";

import {
    ConvexController,
    ConvexController__factory,
    IConvexBaseRewards__factory,
    IConvexBaseRewards,
    IERC20,
} from "../typechain";

const ERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/ERC20.sol");
const ACCESS_CONTROL = artifacts.require("@openzeppelin/contracts/access/AccessControl.sol");

const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60;

const CURVE_TOKEN = "0xD533a949740bb3306d119CC777fa900bA034cd52";
const CONVEX_TOKEN = "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B";

const CURVE_3_POOL_LP_TOKEN = "0x6c3f90f043a72fa612cbac8115ee7e52bde6e490";
const CURVE_3_POOL_WHALE = "0x8174b025f8ab32708a85d036ce9e74a5b21727f7";
const CURVE_3_POOL_TRANSFER_AMT = ethers.utils.parseEther("1000000");

const CONVEX_BOOSTER = "0xF403C135812408BFbE8713b5A23a04b3D48AAE31";
const CONVEX_3_POOL_ID = 9;
const CONVEX_3_POOL_REWARD = "0x689440f2Ff927E1f24c72F1087E1FAF471eCe1c8";

describe("Convex Controller", () => {
    let snapshotId: string;

    let convexController: ConvexController;
    let addressRegistry: MockContract;
    let accessControl: MockContract;
    let curve3PoolLpToken: IERC20;
    let convex3PoolBaseReward: IConvexBaseRewards;

    let deployer: SignerWithAddress;
    let controller: SignerWithAddress;

    before(async () => {
        [deployer] = await ethers.getSigners();
        const curve3PoolWhaleSigner = await getImpersonatedSigner(CURVE_3_POOL_WHALE);

        accessControl = await deployMockContract(deployer, ACCESS_CONTROL.abi);
        await accessControl.mock.hasRole.returns(true);

        const addressRegistryArtifact = artifacts.require("AddressRegistry");
        addressRegistry = await deployMockContract(deployer, addressRegistryArtifact.abi);

        const transactionCount = await deployer.getTransactionCount();
        const controllerAddress = getContractAddress({
            from: deployer.address,
            nonce: transactionCount,
        });

        controller = await getImpersonatedSigner(controllerAddress);

        await network.provider.send("hardhat_setBalance", [
            controllerAddress,
            ethers.utils.parseEther("10").toHexString(),
        ]);

        const factory = new ConvexController__factory(deployer);
        convexController = await factory.deploy(
            controllerAddress,
            accessControl.address,
            addressRegistry.address,
            CONVEX_BOOSTER
        );

        await network.provider.send("hardhat_setBalance", [
            CURVE_3_POOL_WHALE,
            ethers.utils.parseEther("10").toHexString(),
        ]);

        curve3PoolLpToken = await ethers.getContractAt(ERC20.abi, CURVE_3_POOL_LP_TOKEN);
        await curve3PoolLpToken
            .connect(curve3PoolWhaleSigner)
            .transfer(convexController.address, CURVE_3_POOL_TRANSFER_AMT);
        convex3PoolBaseReward = await IConvexBaseRewards__factory.connect(CONVEX_3_POOL_REWARD, deployer);
    });

    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    const defaultAmount = ethers.utils.parseEther("1000000");

    const runDefaultDeposit = () =>
        convexController
            .connect(controller)
            .depositAndStake(CURVE_3_POOL_LP_TOKEN, CONVEX_3_POOL_REWARD, CONVEX_3_POOL_ID, defaultAmount);

    describe("depositAndStake", () => {
        it("should be able to deposit (stake)", async () => {
            await addressRegistry.mock.checkAddress.returns(true);

            expect(await convex3PoolBaseReward.callStatic.balanceOf(controller.address)).to.equal(0);

            await expect(runDefaultDeposit()).to.not.be.reverted;

            expect(await convex3PoolBaseReward.callStatic.balanceOf(controller.address)).to.equal(defaultAmount);
        });

        it("should be no allowance after deposit is complete", async () => {
            await addressRegistry.mock.checkAddress.returns(true);

            const startingApproval = 100000000;
            await curve3PoolLpToken.connect(controller).approve(CONVEX_BOOSTER, startingApproval);
            expect(await curve3PoolLpToken.allowance(controller.address, CONVEX_BOOSTER)).to.equal(startingApproval);

            await expect(runDefaultDeposit()).to.not.be.reverted;

            expect(await curve3PoolLpToken.allowance(controller.address, CONVEX_BOOSTER)).to.equal(0);
        });
    });

    describe("withdrawStake", () => {
        it("should withdraw and unwrap a staked position", async () => {
            await addressRegistry.mock.checkAddress.returns(true);
            await runDefaultDeposit();

            const balanceBefore = await curve3PoolLpToken.balanceOf(controller.address);

            const amountToRemain = 455;
            const withdrawAmount = defaultAmount.sub(amountToRemain);

            await expect(
                convexController
                    .connect(controller)
                    .withdrawStake(CURVE_3_POOL_LP_TOKEN, CONVEX_3_POOL_REWARD, withdrawAmount)
            ).to.not.be.reverted;

            const balanceAfter = await curve3PoolLpToken.balanceOf(controller.address);

            expect(balanceAfter.sub(balanceBefore)).to.equal(withdrawAmount);
            expect(await convex3PoolBaseReward.callStatic.balanceOf(controller.address)).to.equal(amountToRemain);
        });
    });

    describe("claimRewards", () => {
        it("should claim CRV and CVX rewards", async () => {
            await addressRegistry.mock.checkAddress.returns(true);

            const curveToken = await ethers.getContractAt(ERC20.abi, CURVE_TOKEN);
            const convexToken = await ethers.getContractAt(ERC20.abi, CONVEX_TOKEN);

            await runDefaultDeposit();

            expect(await curveToken.balanceOf(controller.address)).to.equal(0);
            expect(await convexToken.balanceOf(controller.address)).to.equal(0);

            await ethers.provider.send("evm_increaseTime", [ONE_WEEK_IN_SECONDS]);
            await ethers.provider.send("evm_mine", []);

            await expect(
                convexController.connect(controller).claimRewards(CONVEX_3_POOL_REWARD, [
                    {
                        token: curveToken.address,
                        minAmount: 1,
                    },
                    {
                        token: convexToken.address,
                        minAmount: 1,
                    },
                ])
            ).to.not.be.reverted;

            expect(await curveToken.balanceOf(controller.address)).to.not.equal(0);
            expect(await convexToken.balanceOf(controller.address)).to.not.equal(0);
        });
    });
});

async function getImpersonatedSigner(address: string): Promise<SignerWithAddress> {
    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address],
    });

    return ethers.getSigner(address);
}
