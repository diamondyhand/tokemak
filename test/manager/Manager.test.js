const UniV2Test = require("./deployWithdraw/uniV2Test");
//const SushiV2Test = require("./deployWithdraw/sushiV2Test");

const {expect} = require("chai");
const timeMachine = require("ganache-time-traveler");
const {artifacts, ethers, network, upgrades} = require("hardhat");
const BalancerTest = require("./deployWithdraw/balancerTest");
const ZeroExTest = require("./deployWithdraw/zeroExTest");
const SushiV2Test = require("./deployWithdraw/sushiV2Test");
const SushiV1Test = require("./deployWithdraw/sushiV1Test");
const {MaxUint256} = ethers.constants;
const ERC20 = artifacts.require("ERC20");

const managerTest = (sushiTest, sushiText) => {
    describe("Test Manager " + sushiText, () => {
        let deployer;
        let manager;
        let fakeManager;
        let treasury;
        let user1;
        let registry;
        let daiPool;
        let usdcPool;
        let unregisteredPool;
        let daiContract;
        let usdcContract;
        let cycleStartTime;
        let rebalancer;
        const CYCLE_DURATION = 60; // seconds

        const DAI_ADDRESS = "0x6b175474e89094c44da98b954eedeac495271d0f";
        const USDC_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
        const DAI_WHALE_ADDRESS = "0x5D38B4e4783E34e2301A2a36c39a03c45798C4dD";
        const USDC_WHALE_ADDRESS = "0x55fe002aeff02f77364de339a1292923a15844b8";

        let controllers = [];
        const totalDai = 100000;
        const totalUsdc = 100000;

        let snapshotId;

        before(async () => {
            [deployer, fakeManager, user1, treasury, rebalancer] = await ethers.getSigners();
            cycleStartTime = (await ethers.provider.getBlock("latest")).timestamp + 10;

            // Provide Whales with sufficient Ether for transactions
            await deployer.sendTransaction({
                value: ethers.utils.parseEther("1.0"),
                to: DAI_WHALE_ADDRESS,
            });
            await deployer.sendTransaction({
                value: ethers.utils.parseEther("1.0"),
                to: USDC_WHALE_ADDRESS,
            });

            // Impersonate accounts
            await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [DAI_WHALE_ADDRESS],
            });
            await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [USDC_WHALE_ADDRESS],
            });

            // Setup Variables
            daiContract = await ethers.getContractAt(ERC20.abi, DAI_ADDRESS);
            usdcContract = await ethers.getContractAt(ERC20.abi, USDC_ADDRESS);

            // Deploy Manager
            const managerFactory = await ethers.getContractFactory("Manager");
            manager = await upgrades.deployProxy(managerFactory, [CYCLE_DURATION, cycleStartTime], {
                unsafeAllow: ["delegatecall", "constructor", "state-variable-assignment", "state-variable-immutable"],
            });
            await manager.deployed();

            // Deploy Registry
            const registryFactory = await ethers.getContractFactory("AddressRegistry");
            registry = await upgrades.deployProxy(registryFactory, [], {
                constructorArgs: ["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"],
                unsafeAllow: ["state-variable-assignment", "state-variable-immutable", "constructor"],
            });
            await registry.deployed();
            await registry.connect(deployer).addToRegistry([DAI_ADDRESS, USDC_ADDRESS], 0);

            controllers = [
                new UniV2Test(DAI_ADDRESS, USDC_ADDRESS, manager, registry),
                new sushiTest(DAI_ADDRESS, USDC_ADDRESS, manager, registry, 200, false, false, treasury.address),
                new BalancerTest(DAI_ADDRESS, USDC_ADDRESS, manager, registry),
                new ZeroExTest(daiContract, usdcContract, manager, registry),
            ];

            await Promise.all(
                controllers.map(async (x) => {
                    await x.setupAndDeploy();
                })
            );

            // Deploy Pools
            const poolFactory = await ethers.getContractFactory("Pool");
            daiPool = await upgrades.deployProxy(
                poolFactory,
                [DAI_ADDRESS, manager.address, "TokemakDaiPool", "TDAI", rebalancer.address],
                {unsafeAllow: ["constructor"]}
            );
            await daiPool.deployed();
            usdcPool = await upgrades.deployProxy(
                poolFactory,
                [USDC_ADDRESS, manager.address, "TokemakUsdcPool", "TUSDC", rebalancer.address],
                {unsafeAllow: ["constructor"]}
            );
            await usdcPool.deployed();
            unregisteredPool = await upgrades.deployProxy(
                poolFactory,
                [DAI_ADDRESS, manager.address, "UnregisteredPool", "UPool", rebalancer.address],
                {unsafeAllow: ["constructor"]}
            );
            await unregisteredPool.deployed();

            // Register pools to manager
            await manager.registerPool(daiPool.address);
            await manager.registerPool(usdcPool.address);

            await daiPool.connect(deployer).approveManager(MaxUint256);
            await usdcPool.connect(deployer).approveManager(MaxUint256);

            for (let i = 0; i < controllers.length; i++) {
                await manager.registerController(
                    ethers.utils.formatBytes32String(controllers[i].key),
                    controllers[i].controller.address
                );
            }

            const randoms = Array(controllers.length)
                .fill()
                .map(() => {
                    return Math.random() || 0.7097337262057505;
                });
            const sum = randoms.reduce((a, b) => a + b, 0);
            const distributions = randoms.map((x) => x / sum);

            const daiDecimals = await daiContract.decimals();
            const usdcDecimals = await usdcContract.decimals();

            let totalDaiOut = 0;
            let totalUsdcOut = 0;
            for (let i = 0; i < controllers.length; i++) {
                const desiredDai =
                    i === controllers.length - 1 ? totalDai - totalDaiOut : Math.round(totalDai * distributions[i]);
                const desiredUsdc =
                    i === controllers.length - 1 ? totalUsdc - totalUsdcOut : Math.round(totalUsdc * distributions[i]);

                totalDaiOut += desiredDai;
                totalUsdcOut += desiredUsdc;

                controllers[i].daiDesired = ethers.utils.parseUnits(desiredDai.toString(), daiDecimals.toString());
                controllers[i].daiAmountMin = ethers.utils.parseUnits(
                    Math.round(desiredDai * 0.9).toString(),
                    daiDecimals.toString()
                );

                controllers[i].usdcDesired = ethers.utils.parseUnits(desiredUsdc.toString(), usdcDecimals.toString());
                controllers[i].usdcAmountMin = ethers.utils.parseUnits(
                    Math.round(desiredUsdc * 0.9).toString(),
                    usdcDecimals.toString()
                );

                controllers[i].daiDecimals = daiDecimals;
                controllers[i].usdcDecimals = usdcDecimals;
            }

            await Promise.all(
                controllers.map(async (x) => {
                    if (x.perCycleSetup) await x.perCycleSetup(manager.address);
                })
            );
        });

        beforeEach(async () => {
            const timestamp = (await ethers.provider.getBlock()).timestamp;
            await manager.connect(deployer).setNextCycleStartTime(timestamp + 120);
            // await timeMachine.advanceTime(20);

            const snapshot = await timeMachine.takeSnapshot();
            snapshotId = snapshot["result"];
        });

        afterEach(async () => {
            await timeMachine.revertToSnapshot(snapshotId);
        });

        describe("Operation and Timing Checks", () => {
            it("Only allows liquidity pulls from pool during rollover period", async () => {
                //Deposit into pools

                const daiWhaleSigner = await ethers.provider.getSigner(DAI_WHALE_ADDRESS);
                await daiContract.connect(daiWhaleSigner).approve(daiPool.address, MaxUint256);
                const daiDecimals = await daiContract.decimals();
                await daiPool
                    .connect(daiWhaleSigner)
                    .deposit(ethers.utils.parseUnits(totalDai.toString(), daiDecimals.toString()));

                //Build and execute

                const daiPoolBal = await daiContract.balanceOf(daiPool.address);
                const cycleData = {
                    poolData: [{pool: daiPool.address, amount: daiPoolBal}],
                    cycleSteps: [],
                    poolsForWithdraw: [],
                    complete: false,
                    rewardsIpfsHash: "",
                };

                await timeMachine.advanceTime(130);

                await manager.connect(deployer).completeRollover("X");
                await expect(manager.connect(deployer).executeRollover(cycleData)).to.be.revertedWith(
                    "PREMATURE_EXECUTION"
                );

                await timeMachine.advanceTime(130);

                await manager.connect(deployer).executeRollover(cycleData);

                const managerDaiBalance = await daiContract.balanceOf(manager.address);
                const updateDaiPoolBalance = await daiContract.balanceOf(daiPool.address);

                expect(managerDaiBalance).to.be.equal(daiPoolBal);
                expect(updateDaiPoolBalance).to.be.equal(0);
            });

            it("Only allows liquidity pushes to pool during rollover period", async () => {
                //Deposit into pools

                const daiWhaleSigner = await ethers.provider.getSigner(DAI_WHALE_ADDRESS);
                await daiContract.connect(daiWhaleSigner).approve(daiPool.address, MaxUint256);
                const daiDecimals = await daiContract.decimals();
                await daiPool
                    .connect(daiWhaleSigner)
                    .deposit(ethers.utils.parseUnits(totalDai.toString(), daiDecimals.toString()));

                //Build and execute

                const daiPoolBal = await daiContract.balanceOf(daiPool.address);
                const cycleData = {
                    poolData: [{pool: daiPool.address, amount: daiPoolBal}],
                    cycleSteps: [],
                    poolsForWithdraw: [daiPool.address],
                    complete: false,
                    rewardsIpfsHash: "",
                };

                await timeMachine.advanceTime(130);

                await manager.connect(deployer).completeRollover("X");
                await expect(manager.connect(deployer).executeRollover(cycleData)).to.be.revertedWith(
                    "PREMATURE_EXECUTION"
                );

                await timeMachine.advanceTime(130);

                await manager.connect(deployer).executeRollover(cycleData);

                const updateDaiPoolBalance = await daiContract.balanceOf(daiPool.address);

                expect(updateDaiPoolBalance).to.be.equal(daiPoolBal);
            });

            it("Allows controller operations mid-cycle", async () => {
                //Deposit into pools

                // Add DAI Funds to pool (100k)
                const daiWhaleSigner = await ethers.provider.getSigner(DAI_WHALE_ADDRESS);
                await daiContract.connect(daiWhaleSigner).approve(daiPool.address, MaxUint256);
                const daiDecimals = await daiContract.decimals();
                await daiPool
                    .connect(daiWhaleSigner)
                    .deposit(ethers.utils.parseUnits(totalDai.toString(), daiDecimals.toString()));

                // Add USDC Funds to pool (100k)
                const usdcWhaleSigner = await ethers.provider.getSigner(USDC_WHALE_ADDRESS);
                await usdcContract.connect(usdcWhaleSigner).approve(usdcPool.address, MaxUint256);
                const usdcDecimals = await usdcContract.decimals();
                await usdcPool
                    .connect(usdcWhaleSigner)
                    .deposit(ethers.utils.parseUnits(totalUsdc.toString(), usdcDecimals.toString()));

                //////////////////////
                //Deployment
                //////////////////////

                const block = await ethers.provider.getBlock();

                await Promise.all(
                    controllers.map(async (x) => {
                        await x.saveBeforeExecuteState();
                    })
                );

                const daiPoolBal = await daiContract.balanceOf(daiPool.address);
                const usdcPoolBal = await usdcContract.balanceOf(usdcPool.address);

                const controllerTransferData = controllers.map((x) => {
                    x.block = block;
                    x.manager = manager;

                    return [ethers.utils.formatBytes32String(x.key), x.getStartCycleData()];
                });

                const cycleData = {
                    poolData: [
                        {pool: daiPool.address, amount: daiPoolBal},
                        {pool: usdcPool.address, amount: usdcPoolBal},
                    ],
                    cycleSteps: controllerTransferData,
                    poolsForWithdraw: [daiPool.address, usdcPool.address],
                    complete: true,
                    rewardsIpfsHash: "X",
                };

                timeMachine.advanceTime(130);

                await manager.connect(deployer).executeRollover(cycleData);

                await expect(manager.connect(deployer).completeRollover("X")).to.be.revertedWith("PREMATURE_EXECUTION");

                timeMachine.advanceTime(130);

                const IBalancerPool = artifacts.require("IBalancerPool");
                const exitPoolSignature = "exitPool(uint256,uint256[])";
                const poolInterface = new ethers.utils.Interface(IBalancerPool.abi);
                const removeLiquidityEncoded = poolInterface.encodeFunctionData(exitPoolSignature, [1, [1, 1]]);
                const removeLiquidityEncodedParams = "0x" + removeLiquidityEncoded.slice(10);
                const BalancerController = artifacts.require("BalancerController");
                const controllerInterface = new ethers.utils.Interface(BalancerController.abi);
                const balancerController = controllers.filter((x) => x.key == "balancer")[0];
                const balancerCycleData = controllerInterface.encodeFunctionData("withdraw(address,bytes)", [
                    balancerController.daiUsdcERC20.address,
                    removeLiquidityEncodedParams,
                ]);

                const maintenanceExecution = {
                    cycleSteps: [
                        {
                            controllerId: balancerController.controllerId,
                            data: balancerCycleData,
                        },
                    ],
                };

                await expect(manager.connect(deployer).executeMaintenance(maintenanceExecution)).to.not.be.reverted;
            });
        });

        describe("Full Execution", async () => {
            it("Runs", async () => {
                // Add DAI Funds to pool (100k)
                const daiWhaleSigner = await ethers.provider.getSigner(DAI_WHALE_ADDRESS);
                await daiContract.connect(daiWhaleSigner).approve(daiPool.address, MaxUint256);
                const daiDecimals = await daiContract.decimals();
                await daiPool
                    .connect(daiWhaleSigner)
                    .deposit(ethers.utils.parseUnits(totalDai.toString(), daiDecimals.toString()));

                // Add USDC Funds to pool (100k)
                const usdcWhaleSigner = await ethers.provider.getSigner(USDC_WHALE_ADDRESS);
                await usdcContract.connect(usdcWhaleSigner).approve(usdcPool.address, MaxUint256);
                const usdcDecimals = await usdcContract.decimals();
                await usdcPool
                    .connect(usdcWhaleSigner)
                    .deposit(ethers.utils.parseUnits(totalUsdc.toString(), usdcDecimals.toString()));

                // Check balances of pools
                const daiPoolBal1 = await daiContract.balanceOf(daiPool.address);
                const usdcPoolBal1 = await usdcContract.balanceOf(usdcPool.address);
                expect(daiPoolBal1).to.equal(ethers.utils.parseUnits(totalDai.toString(), daiDecimals.toString()));
                expect(usdcPoolBal1).to.equal(ethers.utils.parseUnits(totalUsdc.toString(), usdcDecimals.toString()));

                //////////////////////
                //Deployment
                //////////////////////

                const block = await ethers.provider.getBlock();

                await Promise.all(
                    controllers.map(async (x) => {
                        await x.saveBeforeExecuteState();
                    })
                );

                const daiPoolBal = await daiContract.balanceOf(daiPool.address);
                const usdcPoolBal = await usdcContract.balanceOf(usdcPool.address);

                const controllerTransferData = controllers.map((x) => {
                    x.block = block;
                    x.manager = manager;

                    return [ethers.utils.formatBytes32String(x.key), x.getStartCycleData()];
                });

                const cycleData = {
                    poolData: [
                        {pool: daiPool.address, amount: daiPoolBal},
                        {pool: usdcPool.address, amount: usdcPoolBal},
                    ],
                    cycleSteps: controllerTransferData,
                    poolsForWithdraw: [daiPool.address, usdcPool.address],
                    complete: true,
                    rewardsIpfsHash: "X",
                };

                await timeMachine.advanceTime(130);

                await manager.connect(deployer).executeRollover(cycleData);

                await Promise.all(
                    controllers.map(async (x) => {
                        await x.confirmAfterExecuteState();
                    })
                );

                //////////////////////
                //Cycle time
                //////////////////////

                await timeMachine.advanceTime(130);

                //////////////////////
                //Withdraw Phase, End of Cycle
                //////////////////////

                const block2 = await ethers.provider.getBlock();

                const controllerTransferData2 = [];

                for (let i = 0; i < controllers.length; i++) {
                    controllerTransferData2.push(await controllers[i].preWithdrawExecute(block2));
                }

                const cycleData2 = {
                    poolData: [],
                    cycleSteps: controllerTransferData2,
                    poolsForWithdraw: [daiPool.address, usdcPool.address],
                    complete: true,
                    rewardsIpfsHash: "X",
                };

                const daiPoolBalBefore = await daiContract.balanceOf(daiPool.address);
                const usdcPoolBalBefore = await usdcContract.balanceOf(usdcPool.address);

                await manager.connect(deployer).executeRollover(cycleData2);

                for (let i = 0; i < controllers.length; i++) {
                    await controllers[i].confirmPostWithdrawState();
                }

                const daiManagerBal = await daiContract.balanceOf(manager.address);
                const usdcManagerBal = await usdcContract.balanceOf(manager.address);

                // ensure manager holds no funds
                expect(daiManagerBal).to.equal(0);
                expect(usdcManagerBal).to.equal(0);

                const daiPoolBalAfter = await daiContract.balanceOf(daiPool.address);
                const usdcPoolBalAfter = await usdcContract.balanceOf(usdcPool.address);

                expect(daiPoolBalAfter).to.be.gt(daiPoolBalBefore);
                expect(usdcPoolBalAfter).to.be.gt(usdcPoolBalBefore);
            });
        });

        describe("Testing Uni and Sushi for revert on incorrect manager for 'to' variable", () => {
            it("Reverts properly", async () => {
                //Deposit into pools

                // Add DAI Funds to pool (100k)
                const daiWhaleSigner = await ethers.provider.getSigner(DAI_WHALE_ADDRESS);
                await daiContract.connect(daiWhaleSigner).approve(daiPool.address, MaxUint256);
                const daiDecimals = await daiContract.decimals();
                await daiPool
                    .connect(daiWhaleSigner)
                    .deposit(ethers.utils.parseUnits(totalDai.toString(), daiDecimals.toString()));

                // Add USDC Funds to pool (100k)
                const usdcWhaleSigner = await ethers.provider.getSigner(USDC_WHALE_ADDRESS);
                await usdcContract.connect(usdcWhaleSigner).approve(usdcPool.address, MaxUint256);
                const usdcDecimals = await usdcContract.decimals();
                await usdcPool
                    .connect(usdcWhaleSigner)
                    .deposit(ethers.utils.parseUnits(totalUsdc.toString(), usdcDecimals.toString()));

                const testControllerArray = [controllers[0]]; // Add Uni

                await Promise.all(
                    testControllerArray.map(async (x) => {
                        await x.saveBeforeExecuteState();
                    })
                );

                const daiPoolBal = await daiContract.balanceOf(daiPool.address);
                const usdcPoolBal = await usdcContract.balanceOf(usdcPool.address);

                const block = await ethers.provider.getBlock();

                const controllerTransferData = testControllerArray.map((x) => {
                    x.block = block;

                    return [ethers.utils.formatBytes32String(x.key), x.getStartCycleData(fakeManager.address)];
                });

                const cycleData = {
                    poolData: [
                        {pool: daiPool.address, amount: daiPoolBal},
                        {pool: usdcPool.address, amount: usdcPoolBal},
                    ],
                    cycleSteps: controllerTransferData,
                    poolsForWithdraw: [daiPool.address, usdcPool.address],
                    complete: true,
                    rewardsIpfsHash: "X",
                };

                await timeMachine.advanceTime(130);

                await expect(manager.connect(deployer).executeRollover(cycleData)).to.be.revertedWith(
                    "MUST_BE_MANAGER"
                );
            });
        });

        describe("Test sweep", () => {
            it("Reverts when non-admin account calls function", async () => {
                await expect(manager.connect(user1).sweep([daiPool.address])).to.be.revertedWith("NOT_ROLLOVER_ROLE");
            });

            it("Reverts when pool is not registered", async () => {
                await expect(manager.connect(deployer).sweep([unregisteredPool.address])).to.be.revertedWith(
                    "INVALID_ADDRESS"
                );
            });

            it("Emits an event with the correct args", async () => {
                const tx = await manager.connect(deployer).sweep([daiPool.address]);
                const receipt = await tx.wait();

                expect(receipt.events[0].event).to.equal("ManagerSwept");
                expect(receipt.events[0].args.addresses[0]).to.equal(daiPool.address);
                expect(receipt.events[0].args.amounts[0]).to.equal(0);
            });

            it("Runs correctly", async () => {
                const daiWhaleSigner = await ethers.getSigner(DAI_WHALE_ADDRESS);
                await daiContract.connect(daiWhaleSigner).transfer(manager.address, 100);

                expect(await daiContract.balanceOf(manager.address)).to.be.gt(0);

                const poolBalanceBefore = await daiContract.balanceOf(daiPool.address);
                await manager.connect(deployer).sweep([daiPool.address]);
                const poolBalanceAfter = await daiContract.balanceOf(daiPool.address);

                expect(poolBalanceAfter).to.equal(poolBalanceBefore + ethers.BigNumber.from(100));
                expect(await daiContract.balanceOf(manager.address)).to.equal(0);
            });
        });
        describe("Hitting require statements in executeRollover, _executeRolloverCommand", async () => {
            let cycleData;
            let daiWhaleSigner;
            let controllerTransferData;
            beforeEach(async () => {
                // Add DAI Funds to pool (100k)
                daiWhaleSigner = await ethers.provider.getSigner(DAI_WHALE_ADDRESS);
                await daiContract.connect(daiWhaleSigner).approve(daiPool.address, MaxUint256);
                const daiDecimals = await daiContract.decimals();
                await daiPool
                    .connect(daiWhaleSigner)
                    .deposit(ethers.utils.parseUnits(totalDai.toString(), daiDecimals.toString()));

                // Add USDC Funds to pool (100k)
                const usdcWhaleSigner = await ethers.provider.getSigner(USDC_WHALE_ADDRESS);
                await usdcContract.connect(usdcWhaleSigner).approve(usdcPool.address, MaxUint256);
                const usdcDecimals = await usdcContract.decimals();
                await usdcPool
                    .connect(usdcWhaleSigner)
                    .deposit(ethers.utils.parseUnits(totalUsdc.toString(), usdcDecimals.toString()));

                const daiPoolBal = await daiContract.balanceOf(daiPool.address);
                const usdcPoolBal = await usdcContract.balanceOf(usdcPool.address);

                const block = await ethers.provider.getBlock();
                controllerTransferData = controllers.map((x) => {
                    x.block = block;
                    x.manager = manager;

                    return [ethers.utils.formatBytes32String(x.key), x.getStartCycleData()];
                });

                cycleData = {
                    poolData: [
                        {pool: daiPool.address, amount: daiPoolBal},
                        {pool: usdcPool.address, amount: usdcPoolBal},
                    ],
                    cycleSteps: controllerTransferData,
                    poolsForWithdraw: [daiPool.address, usdcPool.address],
                    complete: true,
                    rewardsIpfsHash: "X",
                };
                await timeMachine.advanceTime(130);
            });

            it("Rejects on incorrect pool", async () => {
                cycleData.poolData[0].pool = user1.address;
                await expect(manager.connect(deployer).executeRollover(cycleData)).to.be.revertedWith("INVALID_POOL");
            });

            it("Rejects on incorrect withdrawal pool", async () => {
                cycleData.poolsForWithdraw[0] = user1.address;
                await expect(manager.connect(deployer).executeRollover(cycleData)).to.be.revertedWith("INVALID_POOL");
            });

            it("Transfers excess funds back to pool", async () => {
                await daiContract.connect(daiWhaleSigner).transfer(manager.address, 50);
                expect(await daiContract.balanceOf(manager.address)).to.be.gt(0);
                await manager.connect(deployer).executeRollover(cycleData);
                expect(await daiContract.balanceOf(manager.address)).to.equal(0);
            });
        });
    });
};

managerTest(SushiV1Test, " with SushiV1");
managerTest(SushiV2Test, " with SushiV2");
