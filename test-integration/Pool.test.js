const {expect} = require("chai");
const timeMachine = require("ganache-time-traveler");
const {artifacts, ethers, waffle, upgrades} = require("hardhat");
const {AddressZero: ZERO_ADDRESS, MaxUint256} = ethers.constants;
const {deployMockContract} = waffle;
const WETHabi = require("../abis/WETH.json");
const IManager = artifacts.require("IManager");

describe("Pool Test", () => {
    let wethContract;
    let pool;
    let managerContract;
    let snapshotId;
    let deployer;
    let user1;
    let user2;
    let rebalancer;

    beforeEach(async () => {
        let snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    before(async () => {
        [deployer, user1, user2, rebalancer] = await ethers.getSigners();
        managerContract = await deployMockContract(deployer, IManager.abi);
        wethContract = await ethers.getContractAt(WETHabi, "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2");
        const poolFactory = await ethers.getContractFactory("Pool");
        pool = await upgrades.deployProxy(
            poolFactory,
            [wethContract.address, managerContract.address, "TOKE ASSET", "fAsset", rebalancer.address],
            {unsafeAllow: ["constructor"]}
        );

        // OBTAIN WETH
        await wethContract.connect(user1).deposit({value: "5000000000000000000"});
        await wethContract.connect(user2).deposit({value: "5000000000000000000"});
    });

    describe("Test Deposit For", async () => {
        it("Test deposit is successful on behalf of another", async () => {
            await wethContract.connect(user2).approve(pool.address, MaxUint256);

            await expect(pool.connect(user2).depositFor(user1.address, 10))
                .to.emit(pool, "Transfer")
                .withArgs(ZERO_ADDRESS, user1.address, 10);

            const totalSupply = await pool.totalSupply();
            expect(totalSupply).to.equal(10);
        });

        it("Test deposit is unsuccessful on behalf of another user without prior approval", async () => {
            //await wethContract.connect(user2).approve(pool.address, MaxUint256);

            await expect(pool.connect(user2).depositFor(user1.address, 10)).to.be.reverted;
        });
    });

    describe("Manager Approval", async () => {
        it("Can set allowance to 0", async () => {
            await pool.connect(deployer).approveManager(MaxUint256);
            const startingAllowance = await wethContract
                .connect(user2)
                .allowance(pool.address, managerContract.address);
            await pool.connect(deployer).approveManager(0);
            const endingAllowance = await wethContract.connect(user2).allowance(pool.address, managerContract.address);

            expect(startingAllowance.gt(endingAllowance)).to.be.equal(true);
            expect(endingAllowance).to.be.equal(0);
        });

        it("Can set allowance to max", async () => {
            await pool.connect(deployer).approveManager(MaxUint256);
            const startingAllowance = await wethContract
                .connect(user2)
                .allowance(pool.address, managerContract.address);
            await pool.connect(deployer).approveManager(0);
            const zeroAllowance = await wethContract.connect(user2).allowance(pool.address, managerContract.address);
            await pool.connect(deployer).approveManager(MaxUint256);
            const endingAllowance = await wethContract.connect(user2).allowance(pool.address, managerContract.address);

            expect(startingAllowance.gt(zeroAllowance)).to.be.equal(true);
            expect(zeroAllowance).to.be.equal(0);
            expect(endingAllowance).to.be.equal(MaxUint256);
        });

        it("Can increase allowance", async () => {
            await pool.connect(deployer).approveManager(MaxUint256);
            const startingAllowance = await wethContract
                .connect(user2)
                .allowance(pool.address, managerContract.address);
            await pool.connect(deployer).approveManager(0);
            const zeroAllowance = await wethContract.connect(user2).allowance(pool.address, managerContract.address);
            await pool.connect(deployer).approveManager(100);
            const endingAllowance = await wethContract.connect(user2).allowance(pool.address, managerContract.address);

            expect(startingAllowance.gt(zeroAllowance)).to.be.equal(true);
            expect(zeroAllowance).to.be.equal(0);
            expect(endingAllowance).to.be.equal(100);
        });

        it("Can decrease allowance", async () => {
            await pool.connect(deployer).approveManager(MaxUint256);
            const startingAllowance = await wethContract
                .connect(user2)
                .allowance(pool.address, managerContract.address);
            await pool.connect(deployer).approveManager(startingAllowance.sub(100));
            const endingAllowance = await wethContract.connect(user2).allowance(pool.address, managerContract.address);

            expect(endingAllowance).to.be.equal(startingAllowance.sub(100));
        });

        it("Can set allowance to itself", async () => {
            await pool.connect(deployer).approveManager(MaxUint256);
            const startingAllowance = await wethContract
                .connect(user2)
                .allowance(pool.address, managerContract.address);
            await pool.connect(deployer).approveManager(startingAllowance.sub(100));
            const endingAllowance = await wethContract.connect(user2).allowance(pool.address, managerContract.address);
            await pool.connect(deployer).approveManager(endingAllowance);
            const noChangeAllowance = await wethContract
                .connect(user2)
                .allowance(pool.address, managerContract.address);

            expect(endingAllowance).to.be.equal(startingAllowance.sub(100));
            expect(endingAllowance).to.be.equal(noChangeAllowance);
        });
    });
});
