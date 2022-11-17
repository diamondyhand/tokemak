//eslint-disable @typescript-eslint/no-non-null-assertion

import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {artifacts, ethers, network} from "hardhat";
import * as timeMachine from "ganache-time-traveler";
import {ERC20, EthPool, Manager, Pool, Staking, TransparentUpgradeableProxy} from "../typechain";
import {expect} from "chai";
import PolygonStateSenderAbi from "../abis/PolygonStateSender.json";
import {ContractReceipt, ContractTransaction} from "@ethersproject/contracts";
import {LogDescription} from "@ethersproject/abi";
import {ProxyAdmin} from "../typechain/ProxyAdmin";
import dotenv from "dotenv";
import {deployMockContract} from "ethereum-waffle";

dotenv.config();

const POLYGON_FX_ROOT = "0xfe5e5D361b2ad62c541bAb87C45a0B9B018389a2";
const POLYGON_STATE_SENDER = "0x28e4F3a7f651294B9564800b2D01f35189A5bFbE";
const POLYGON_FX_CHILD = "0x8397259c983751DAf40400790063935a11afa28a";
const TOKE_WHALE = "0x8b4334d4812c530574bd4f2763fcd22de94a969b";
const WETH_WHALE = "0x2fEb1512183545f48f6b9C5b4EbfCaF49CfCa6F3";

const MANAGER_PROXY = "0xA86e412109f77c45a3BC1c5870b880492Fb86A14";
const TOKE_POOL_PROXY = "0xa760e26aA76747020171fCF8BdA108dFdE8Eb930";
const ETH_POOL_PROXY = "0xD3D13a578a53685B4ac36A1Bab31912D2B2A2F36";
const TOKE_ERC20_ADDR = "0x2e9d63788249371f1DFC918a52f8d799F4a38C94";
const PROXY_ADMIN_ADDR = "0xc89F742452F534EcE603C7B62dF76102AAcF00Df";
const MANAGER_PROXY_ADMIN_ADDR = "0x0882aB38C4Ff4A5A9FE175Bc5147018B8eE7dA64";
const TREASURY_ADDR = "0x8b4334d4812C530574Bd4F2763FcD22dE94A969B";
const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const COORDINATOR_MULTISIG = "0x90b6C61B102eA260131aB48377E143D6EB3A9d4B";

const erc20Artifact = artifacts.require("@openzeppelin/contracts/token/ERC20/ERC20.sol");
const managerArtifact = artifacts.require("contracts/manager/Manager.sol");
const poolArtifact = artifacts.require("Pool");
const ethPoolArtifact = artifacts.require("EthPool");
const proxyAdminArtifact = artifacts.require("ProxyAdmin");

describe("Test L1 Voting", () => {
    let snapshotId: string;
    let tokeErc20: ERC20;
    let tokePool: TransparentUpgradeableProxy & Pool;
    let ethPool: TransparentUpgradeableProxy & EthPool;
    let weth: ERC20;
    let staking: TransparentUpgradeableProxy & Staking;
    let manager: TransparentUpgradeableProxy & Manager;
    let proxyAdmin: ProxyAdmin;
    let managerProxyAdmin: ProxyAdmin;

    let deployer: SignerWithAddress;
    let destination: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;
    let tokeWhale: SignerWithAddress;
    let wethWhale: SignerWithAddress;
    let notionalAddress: SignerWithAddress;

    before(async () => {
        [destination, user1, user2, user3, notionalAddress] = await ethers.getSigners();
        tokeWhale = await getImpersonatedSigner(TOKE_WHALE);
        wethWhale = await getImpersonatedSigner(WETH_WHALE);

        const addressRegistryArtifact = artifacts.require("AddressRegistry");
        const addressRegistry = await deployMockContract(destination, addressRegistryArtifact.abi);
        await addressRegistry.mock.weth.returns(WETH_ADDRESS);

        tokeErc20 = (await ethers.getContractAt(erc20Artifact.abi, TOKE_ERC20_ADDR)) as unknown as ERC20;

        // Redeploying because mainnet contracts not upgraded
        const managerFactory = await ethers.getContractFactory("Manager");
        const stakingFactory = await ethers.getContractFactory("Staking");
        const poolFactory = await ethers.getContractFactory("Pool");
        const ethPoolFactory = await ethers.getContractFactory("EthPool");
        const proxyFactory = await ethers.getContractFactory("TransparentUpgradeableProxy", deployer);

        const managerImplementation = await managerFactory.deploy();
        const stakingImplementation = await stakingFactory.deploy();
        const poolImplementation = await poolFactory.deploy();
        const ethPoolImplementation = await ethPoolFactory.deploy();

        await managerImplementation.deployed();
        await stakingImplementation.deployed();
        await poolImplementation.deployed();
        await ethPoolImplementation.deployed();

        const cycleStartTime = (await ethers.provider.getBlock("latest")).timestamp + 10;
        await managerImplementation.initialize(1, cycleStartTime);
        await stakingImplementation.initialize(TOKE_ERC20_ADDR, MANAGER_PROXY, TREASURY_ADDR, notionalAddress.address);

        manager = (await ethers.getContractAt(
            managerArtifact.abi,
            MANAGER_PROXY
        )) as unknown as TransparentUpgradeableProxy & Manager;

        tokePool = (await ethers.getContractAt(
            poolArtifact.abi,
            TOKE_POOL_PROXY
        )) as unknown as TransparentUpgradeableProxy & Pool;

        ethPool = (await ethers.getContractAt(
            ethPoolArtifact.abi,
            ETH_POOL_PROXY
        )) as unknown as TransparentUpgradeableProxy & EthPool;

        weth = (await ethers.getContractAt(erc20Artifact.abi, WETH_ADDRESS)) as unknown as ERC20;

        proxyAdmin = (await ethers.getContractAt(proxyAdminArtifact.abi, PROXY_ADMIN_ADDR)) as unknown as ProxyAdmin;

        managerProxyAdmin = (await ethers.getContractAt(
            proxyAdminArtifact.abi,
            MANAGER_PROXY_ADMIN_ADDR
        )) as unknown as ProxyAdmin;

        const initializeStaking = stakingFactory.interface.encodeFunctionData("initialize", [
            tokeErc20.address,
            manager.address,
            TREASURY_ADDR,
            notionalAddress.address,
        ]);

        staking = (await proxyFactory.deploy(
            stakingImplementation.address,
            PROXY_ADMIN_ADDR,
            initializeStaking
        )) as TransparentUpgradeableProxy & Staking;
        staking = stakingImplementation.attach(staking.address) as TransparentUpgradeableProxy & Staking;

        const stakingOwner = await staking.owner();
        const stakingOwnerAcct = await getImpersonatedSigner(stakingOwner);
        await fundAccount(stakingOwner);
        await staking.connect(stakingOwnerAcct).transferOwnership(COORDINATOR_MULTISIG);

        deployer = await getImpersonatedSigner(COORDINATOR_MULTISIG);
        await fundAccount(deployer.address);

        const daoSigner = await getImpersonatedSigner("0x8b4334d4812C530574Bd4F2763FcD22dE94A969B");
        await fundAccount(daoSigner.address);

        await managerProxyAdmin.connect(daoSigner).upgrade(manager.address, managerImplementation.address);
        await proxyAdmin.connect(deployer).upgrade(tokePool.address, poolImplementation.address);
        await proxyAdmin.connect(deployer).upgrade(ethPool.address, ethPoolImplementation.address);

        await fundTokeToUsers("1000", [user1, user2]);
        await fundWethToUsers("50", [user1, user2]);

        await manager.connect(deployer).setCycleDuration(120);

        const currentTime = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
        await manager.connect(deployer).setNextCycleStartTime(currentTime + 10);
        await timeMachine.advanceTime(10);
    });

    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    describe("Toke Pool", () => {
        before(async () => {
            await tokePool.connect(deployer).setDestinations(POLYGON_FX_ROOT, destination.address);
            await tokePool.connect(deployer).setEventSend(true);
        });

        it("Sends an event on deposit", async () => {
            await tokeErc20.connect(user1).approve(tokePool.address, "10");
            const tx = await tokePool.connect(user1).deposit("10");
            const receipt = await tx.wait();

            const event = getStateSenderLogFromReceipt(receipt)?.[0];
            expect(event).to.exist;
            expect(event?.args?.contractAddress).to.equal(POLYGON_FX_CHILD);

            const rootWrapper = ethers.utils.defaultAbiCoder.decode(["address", "address", "bytes"], event?.args?.data);

            expect(rootWrapper[0]).to.equal(tokePool.address);
            expect(rootWrapper[1]).to.equal(destination.address);

            const balanceUpdateWrapper = ethers.utils.defaultAbiCoder.decode(
                ["tuple(bytes32,address,address,uint256)"],
                rootWrapper[2]
            );

            expect(balanceUpdateWrapper[0][0]).to.equal(eventToBytes32("Deposit"));
            expect(balanceUpdateWrapper[0][1]).to.equal(user1.address);
            expect(balanceUpdateWrapper[0][2]).to.equal(tokePool.address);
            expect(balanceUpdateWrapper[0][3]).to.equal(10);
        });

        it("Sends an event on withdraw", async () => {
            await tokeErc20.connect(user1).approve(tokePool.address, "10");
            await tokePool.connect(user1).deposit("10");
            await tokePool.connect(user1).requestWithdrawal("5");
            await executeRollover();

            const tx = await tokePool.connect(user1).withdraw("5");
            const receipt = await tx.wait();

            const event = getStateSenderLogFromReceipt(receipt)?.[0];
            expect(event).to.exist;
            expect(event?.args?.contractAddress).to.equal(POLYGON_FX_CHILD);

            const rootWrapper = ethers.utils.defaultAbiCoder.decode(["address", "address", "bytes"], event?.args?.data);

            expect(rootWrapper[0]).to.equal(tokePool.address);
            expect(rootWrapper[1]).to.equal(destination.address);

            const balanceUpdateWrapper = ethers.utils.defaultAbiCoder.decode(
                ["tuple(bytes32,address,address,uint256)"],
                rootWrapper[2]
            );

            expect(balanceUpdateWrapper[0][0]).to.equal(eventToBytes32("Withdraw"));
            expect(balanceUpdateWrapper[0][1]).to.equal(user1.address);
            expect(balanceUpdateWrapper[0][2]).to.equal(tokePool.address);
            expect(balanceUpdateWrapper[0][3]).to.equal(5);
        });

        it("Sends an event on transfer", async () => {
            await tokeErc20.connect(user1).approve(tokePool.address, "10");
            await tokePool.connect(user1).deposit("10");

            const tx = await tokePool.connect(user1).transfer(user2.address, "4");
            const receipt = await tx.wait();

            const event = getStateSenderLogFromReceipt(receipt);
            const event1 = event?.[0];
            const event2 = event?.[1];

            expect(event1).to.exist;
            expect(event2).to.exist;
            expect(event1?.args?.contractAddress).to.equal(POLYGON_FX_CHILD);
            expect(event2?.args?.contractAddress).to.equal(POLYGON_FX_CHILD);

            const event1RootWrapper = ethers.utils.defaultAbiCoder.decode(
                ["address", "address", "bytes"],
                event1?.args?.data
            );

            const event2RootWrapper = ethers.utils.defaultAbiCoder.decode(
                ["address", "address", "bytes"],
                event2?.args?.data
            );

            expect(event1RootWrapper[0]).to.equal(tokePool.address);
            expect(event2RootWrapper[0]).to.equal(tokePool.address);
            expect(event1RootWrapper[1]).to.equal(destination.address);
            expect(event2RootWrapper[1]).to.equal(destination.address);

            const event1BalanceUpdateWrapper = ethers.utils.defaultAbiCoder.decode(
                ["tuple(bytes32,address,address,uint256)"],
                event1RootWrapper[2]
            );

            const event2BalanceUpdateWrapper = ethers.utils.defaultAbiCoder.decode(
                ["tuple(bytes32,address,address,uint256)"],
                event2RootWrapper[2]
            );

            expect(event1BalanceUpdateWrapper[0][0]).to.equal(eventToBytes32("Transfer"));
            expect(event2BalanceUpdateWrapper[0][0]).to.equal(eventToBytes32("Transfer"));
            expect(event1BalanceUpdateWrapper[0][1]).to.equal(user1.address);
            expect(event2BalanceUpdateWrapper[0][1]).to.equal(user2.address);
            expect(event1BalanceUpdateWrapper[0][2]).to.equal(tokePool.address);
            expect(event2BalanceUpdateWrapper[0][2]).to.equal(tokePool.address);
            expect(event1BalanceUpdateWrapper[0][3]).to.equal(6);
            expect(event2BalanceUpdateWrapper[0][3]).to.equal(4);
        });

        it("Sends an event on transferFrom", async () => {
            await tokeErc20.connect(user1).approve(tokePool.address, "10");
            await tokePool.connect(user1).deposit("10");
            await tokePool.connect(user1).approve(user2.address, "4");
            const tx = await tokePool.connect(user2).transferFrom(user1.address, user3.address, "4");
            const receipt = await tx.wait();

            const event = getStateSenderLogFromReceipt(receipt);
            const event1 = event?.[0];
            const event2 = event?.[1];

            expect(event1).to.exist;
            expect(event2).to.exist;
            expect(event1?.args?.contractAddress).to.equal(POLYGON_FX_CHILD);
            expect(event2?.args?.contractAddress).to.equal(POLYGON_FX_CHILD);

            const event1RootWrapper = ethers.utils.defaultAbiCoder.decode(
                ["address", "address", "bytes"],
                event1?.args?.data
            );

            const event2RootWrapper = ethers.utils.defaultAbiCoder.decode(
                ["address", "address", "bytes"],
                event2?.args?.data
            );

            expect(event1RootWrapper[0]).to.equal(tokePool.address);
            expect(event2RootWrapper[0]).to.equal(tokePool.address);
            expect(event1RootWrapper[1]).to.equal(destination.address);
            expect(event2RootWrapper[1]).to.equal(destination.address);

            const event1BalanceUpdateWrapper = ethers.utils.defaultAbiCoder.decode(
                ["tuple(bytes32,address,address,uint256)"],
                event1RootWrapper[2]
            );

            const event2BalanceUpdateWrapper = ethers.utils.defaultAbiCoder.decode(
                ["tuple(bytes32,address,address,uint256)"],
                event2RootWrapper[2]
            );

            expect(event1BalanceUpdateWrapper[0][0]).to.equal(eventToBytes32("Transfer"));
            expect(event2BalanceUpdateWrapper[0][0]).to.equal(eventToBytes32("Transfer"));
            expect(event1BalanceUpdateWrapper[0][1]).to.equal(user1.address);
            expect(event2BalanceUpdateWrapper[0][1]).to.equal(user3.address);
            expect(event1BalanceUpdateWrapper[0][2]).to.equal(tokePool.address);
            expect(event2BalanceUpdateWrapper[0][2]).to.equal(tokePool.address);
            expect(event1BalanceUpdateWrapper[0][3]).to.equal(6);
            expect(event2BalanceUpdateWrapper[0][3]).to.equal(4);
        });

        describe("Eth Pool", () => {
            before(async () => {
                await ethPool.connect(deployer).setDestinations(POLYGON_FX_ROOT, destination.address);
                await ethPool.connect(deployer).setEventSend(true);
            });

            it("Sends an event on deposit", async () => {
                await weth.connect(user1).approve(ethPool.address, "10");
                const tx = await ethPool.connect(user1).deposit("10");
                const receipt = await tx.wait();

                const event = getStateSenderLogFromReceipt(receipt)?.[0];
                expect(event).to.exist;
                expect(event?.args?.contractAddress).to.equal(POLYGON_FX_CHILD);

                const rootWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event?.args?.data
                );

                expect(rootWrapper[0]).to.equal(ethPool.address);
                expect(rootWrapper[1]).to.equal(destination.address);

                const balanceUpdateWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    rootWrapper[2]
                );

                expect(balanceUpdateWrapper[0][0]).to.equal(eventToBytes32("Deposit"));
                expect(balanceUpdateWrapper[0][1]).to.equal(user1.address);
                expect(balanceUpdateWrapper[0][2]).to.equal(ethPool.address);
                expect(balanceUpdateWrapper[0][3]).to.equal(10);
            });

            it("Sends an event on withdraw", async () => {
                await weth.connect(user1).approve(ethPool.address, "10");
                await ethPool.connect(user1).deposit("10");
                await ethPool.connect(user1).requestWithdrawal("5");
                await executeRollover();

                const tx = await ethPool.connect(user1).withdraw("5", false);
                const receipt = await tx.wait();

                const event = getStateSenderLogFromReceipt(receipt)?.[0];
                expect(event).to.exist;
                expect(event?.args?.contractAddress).to.equal(POLYGON_FX_CHILD);

                const rootWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event?.args?.data
                );

                expect(rootWrapper[0]).to.equal(ethPool.address);
                expect(rootWrapper[1]).to.equal(destination.address);

                const balanceUpdateWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    rootWrapper[2]
                );

                expect(balanceUpdateWrapper[0][0]).to.equal(eventToBytes32("Withdraw"));
                expect(balanceUpdateWrapper[0][1]).to.equal(user1.address);
                expect(balanceUpdateWrapper[0][2]).to.equal(ethPool.address);
                expect(balanceUpdateWrapper[0][3]).to.equal(5);
            });

            it("Sends an event on transfer", async () => {
                await weth.connect(user1).approve(ethPool.address, "10");
                await ethPool.connect(user1).deposit("10");

                const tx = await ethPool.connect(user1).transfer(user2.address, "4");
                const receipt = await tx.wait();

                const event = getStateSenderLogFromReceipt(receipt);
                const event1 = event?.[0];
                const event2 = event?.[1];

                expect(event1).to.exist;
                expect(event2).to.exist;
                expect(event1?.args?.contractAddress).to.equal(POLYGON_FX_CHILD);
                expect(event2?.args?.contractAddress).to.equal(POLYGON_FX_CHILD);

                const event1RootWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event1?.args?.data
                );

                const event2RootWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event2?.args?.data
                );

                expect(event1RootWrapper[0]).to.equal(ethPool.address);
                expect(event2RootWrapper[0]).to.equal(ethPool.address);
                expect(event1RootWrapper[1]).to.equal(destination.address);
                expect(event2RootWrapper[1]).to.equal(destination.address);

                const event1BalanceUpdateWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    event1RootWrapper[2]
                );

                const event2BalanceUpdateWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    event2RootWrapper[2]
                );

                expect(event1BalanceUpdateWrapper[0][0]).to.equal(eventToBytes32("Transfer"));
                expect(event2BalanceUpdateWrapper[0][0]).to.equal(eventToBytes32("Transfer"));
                expect(event1BalanceUpdateWrapper[0][1]).to.equal(user1.address);
                expect(event2BalanceUpdateWrapper[0][1]).to.equal(user2.address);
                expect(event1BalanceUpdateWrapper[0][2]).to.equal(ethPool.address);
                expect(event2BalanceUpdateWrapper[0][2]).to.equal(ethPool.address);
                expect(event1BalanceUpdateWrapper[0][3]).to.equal(6);
                expect(event2BalanceUpdateWrapper[0][3]).to.equal(4);
            });

            it("Sends an event on transferFrom", async () => {
                await weth.connect(user1).approve(ethPool.address, "10");
                await ethPool.connect(user1).deposit("10");
                await ethPool.connect(user1).approve(user2.address, "4");
                const tx = await ethPool.connect(user2).transferFrom(user1.address, user3.address, "4");
                const receipt = await tx.wait();

                const event = getStateSenderLogFromReceipt(receipt);
                const event1 = event?.[0];
                const event2 = event?.[1];

                expect(event1).to.exist;
                expect(event2).to.exist;
                expect(event1?.args?.contractAddress).to.equal(POLYGON_FX_CHILD);
                expect(event2?.args?.contractAddress).to.equal(POLYGON_FX_CHILD);

                const event1RootWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event1?.args?.data
                );

                const event2RootWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event2?.args?.data
                );

                expect(event1RootWrapper[0]).to.equal(ethPool.address);
                expect(event2RootWrapper[0]).to.equal(ethPool.address);
                expect(event1RootWrapper[1]).to.equal(destination.address);
                expect(event2RootWrapper[1]).to.equal(destination.address);

                const event1BalanceUpdateWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    event1RootWrapper[2]
                );

                const event2BalanceUpdateWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    event2RootWrapper[2]
                );

                expect(event1BalanceUpdateWrapper[0][0]).to.equal(eventToBytes32("Transfer"));
                expect(event2BalanceUpdateWrapper[0][0]).to.equal(eventToBytes32("Transfer"));
                expect(event1BalanceUpdateWrapper[0][1]).to.equal(user1.address);
                expect(event2BalanceUpdateWrapper[0][1]).to.equal(user3.address);
                expect(event1BalanceUpdateWrapper[0][2]).to.equal(ethPool.address);
                expect(event2BalanceUpdateWrapper[0][2]).to.equal(ethPool.address);
                expect(event1BalanceUpdateWrapper[0][3]).to.equal(6);
                expect(event2BalanceUpdateWrapper[0][3]).to.equal(4);
            });
        });

        describe("Staking", () => {
            before(async () => {
                await staking.connect(deployer).setDestinations(POLYGON_FX_ROOT, destination.address);
                await staking.connect(deployer).setEventSend(true);
            });

            it("Sends an event on deposit", async () => {
                await tokeErc20.connect(user1).approve(staking.address, "10");
                const tx = await staking.connect(user1)["deposit(uint256,uint256)"]("10", "0");
                const receipt = await tx.wait();

                const event = getStateSenderLogFromReceipt(receipt)?.[0];
                expect(event).to.exist;
                expect(event?.args.contractAddress).to.equal(POLYGON_FX_CHILD);

                const rootWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event?.args?.data
                );

                expect(rootWrapper[0]).to.equal(staking.address);
                expect(rootWrapper[1]).to.equal(destination.address);

                const balanceUpdateWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    rootWrapper[2]
                );

                expect(balanceUpdateWrapper[0][0]).to.equal(eventToBytes32("Deposit"));
                expect(balanceUpdateWrapper[0][1]).to.equal(user1.address);
                expect(balanceUpdateWrapper[0][2]).to.equal(notionalAddress.address);
                expect(balanceUpdateWrapper[0][3]).to.equal(10);
            });

            it("Sends an event on Slash", async () => {
                await tokeErc20.connect(user1).approve(staking.address, "10");
                await staking.connect(user1)["deposit(uint256,uint256)"]("10", "0");
                const tx = await staking.connect(deployer).slash([user1.address], ["4"], "0");
                const receipt = await tx.wait();

                const event = getStateSenderLogFromReceipt(receipt)?.[0];
                expect(event).to.exist;
                expect(event?.args.contractAddress).to.equal(POLYGON_FX_CHILD);

                const rootWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event?.args?.data
                );

                expect(rootWrapper[0]).to.equal(staking.address);
                expect(rootWrapper[1]).to.equal(destination.address);

                const balanceUpdateWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    rootWrapper[2]
                );

                expect(balanceUpdateWrapper[0][0]).to.equal(eventToBytes32("Slash"));
                expect(balanceUpdateWrapper[0][1]).to.equal(user1.address);
                expect(balanceUpdateWrapper[0][2]).to.equal(notionalAddress.address);
                expect(balanceUpdateWrapper[0][3]).to.equal(6);
            });

            it("Sends an event on Withdrawal Request", async () => {
                await tokeErc20.connect(user1).approve(staking.address, "10");
                await staking.connect(user1)["deposit(uint256,uint256)"]("10", "0");
                const tx = await staking.connect(user1).requestWithdrawal("3", 0);
                const receipt = await tx.wait();

                const event = getStateSenderLogFromReceipt(receipt)?.[0];
                expect(event).to.exist;
                expect(event?.args.contractAddress).to.equal(POLYGON_FX_CHILD);

                const rootWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event?.args?.data
                );

                expect(rootWrapper[0]).to.equal(staking.address);
                expect(rootWrapper[1]).to.equal(destination.address);

                const balanceUpdateWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    rootWrapper[2]
                );

                expect(balanceUpdateWrapper[0][0]).to.equal(eventToBytes32("Withdrawal Request"));
                expect(balanceUpdateWrapper[0][1]).to.equal(user1.address);
                expect(balanceUpdateWrapper[0][2]).to.equal(notionalAddress.address);
                expect(balanceUpdateWrapper[0][3]).to.equal(7);
            });

            it("Withdrawal requests include unvested portions", async () => {
                const currentBlock = await ethers.provider.getBlock("latest");
                const currentTimestamp = currentBlock.timestamp;
                await staking.connect(deployer).addSchedule(
                    {
                        cliff: 0,
                        duration: 1000,
                        interval: 10,
                        setup: true,
                        isActive: true,
                        hardStart: currentTimestamp,
                        isPublic: false,
                    },
                    staking.address
                );

                await tokeErc20.connect(user1).approve(staking.address, "10");
                await tokeErc20.connect(deployer).approve(staking.address, "30");
                await staking.connect(user1)["deposit(uint256,uint256)"]("10", "0");
                await staking.connect(deployer).depositFor(user1.address, "30", 1);

                await timeMachine.advanceTime(500);
                await timeMachine.advanceBlock();

                const vested = await staking.vested(user1.address, 1);
                const unvested = await staking.unvested(user1.address, 1);
                expect(vested).to.equal(15, "vested");
                expect(unvested).to.equal(15, "unvested");

                const tx = await staking.connect(user1).requestWithdrawal("3", 1);
                const receipt = await tx.wait();

                const event = getStateSenderLogFromReceipt(receipt)?.[0];
                expect(event).to.exist;
                expect(event?.args.contractAddress).to.equal(POLYGON_FX_CHILD);

                const rootWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event?.args?.data
                );

                expect(rootWrapper[0]).to.equal(staking.address);
                expect(rootWrapper[1]).to.equal(destination.address);

                const balanceUpdateWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    rootWrapper[2]
                );

                expect(balanceUpdateWrapper[0][0]).to.equal(eventToBytes32("Withdrawal Request"));
                expect(balanceUpdateWrapper[0][1]).to.equal(user1.address);
                expect(balanceUpdateWrapper[0][2]).to.equal(staking.address);
                expect(balanceUpdateWrapper[0][3]).to.equal(27);
            });

            it("Event to voting includes withdrawal requests in a deposit, request, deposit scenario", async () => {
                await tokeErc20.connect(user1).approve(staking.address, "20");
                await staking.connect(user1)["deposit(uint256,uint256)"]("10", "0");
                await staking.connect(user1).requestWithdrawal("3", 0);
                const tx = await staking.connect(user1)["deposit(uint256,uint256)"]("10", "0");
                const receipt = await tx.wait();

                const event = getStateSenderLogFromReceipt(receipt)?.[0];
                expect(event).to.exist;
                expect(event?.args.contractAddress).to.equal(POLYGON_FX_CHILD);

                const rootWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event?.args?.data
                );

                expect(rootWrapper[0]).to.equal(staking.address);
                expect(rootWrapper[1]).to.equal(destination.address);

                const balanceUpdateWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    rootWrapper[2]
                );

                expect(balanceUpdateWrapper[0][0]).to.equal(eventToBytes32("Deposit"));
                expect(balanceUpdateWrapper[0][1]).to.equal(user1.address);
                expect(balanceUpdateWrapper[0][2]).to.equal(notionalAddress.address);
                expect(balanceUpdateWrapper[0][3]).to.equal(17);
            });

            it("Deposit events are sent with withdrawal request from the correct schedule", async () => {
                const currentBlock = await ethers.provider.getBlock("latest");
                const currentTimestamp = currentBlock.timestamp;

                const scheduleIdx1 = {
                    cliff: 0,
                    duration: 1000,
                    interval: 10,
                    setup: true,
                    isActive: true,
                    hardStart: currentTimestamp,
                    isPublic: true,
                };
                await staking.connect(deployer).addSchedule(scheduleIdx1, notionalAddress.address);
                await tokeErc20.connect(user1).approve(staking.address, 1000);

                //Deposit 10 to Schedule 0
                //Deposit 34 to Schedule 1
                //Submit withdrawal request of 2 to Schedule 0
                //Submit withdrawal request of 7 to Schedule 1 when half-vested (17 available)

                //Ensure Schedule 0 event has vote power 8 at withdrawal request
                //Ensure Shcedule 1 event has vote power 27 at withdrawal request

                //Deposit 1 to Schedule 0, 11 Total Now, 2 Request
                //Deposit 1 to Schedule 1, 35 Total Now, 7 Request

                //Ensure Schedule 0 event has vote power 9 at deposit
                //Ensure Shcedule 1 event has vote power 28 at deposit

                await staking.connect(user1)["deposit(uint256,uint256)"](10, 0);
                await staking.connect(user1)["deposit(uint256,uint256)"](34, 1);

                await timeMachine.advanceTime(500);
                await timeMachine.advanceBlock();

                const schedule0Tx = await staking.connect(user1).requestWithdrawal(2, 0);
                const schedule1Tx = await staking.connect(user1).requestWithdrawal(7, 1);

                const schedule0VoteDetails = await getVoteEventDetails(schedule0Tx, 0);
                const schedule1VoteDetails = await getVoteEventDetails(schedule1Tx, 0);

                expect(schedule0VoteDetails.eventType).to.equal("Withdrawal Request");
                expect(schedule0VoteDetails.account).to.equal(user1.address);
                expect(schedule0VoteDetails.notionalAddress).to.equal(notionalAddress.address);
                expect(schedule0VoteDetails.amount).to.equal(8);

                expect(schedule1VoteDetails.eventType).to.equal("Withdrawal Request");
                expect(schedule1VoteDetails.account).to.equal(user1.address);
                expect(schedule1VoteDetails.notionalAddress).to.equal(notionalAddress.address);
                expect(schedule1VoteDetails.amount).to.equal(27);

                const schedule0DepositTx = await staking.connect(user1)["deposit(uint256,uint256)"](1, 0);
                const schedule1DepositTx = await staking.connect(user1)["deposit(uint256,uint256)"](1, 1);

                const schedule0DepositTxDetails = await getVoteEventDetails(schedule0DepositTx, 0);
                const schedule1DepositTxDetails = await getVoteEventDetails(schedule1DepositTx, 0);

                expect(schedule0DepositTxDetails.eventType).to.equal("Deposit");
                expect(schedule0DepositTxDetails.account).to.equal(user1.address);
                expect(schedule0DepositTxDetails.notionalAddress).to.equal(notionalAddress.address);
                expect(schedule0DepositTxDetails.amount).to.equal(9);

                expect(schedule1DepositTxDetails.eventType).to.equal("Deposit");
                expect(schedule1DepositTxDetails.account).to.equal(user1.address);
                expect(schedule1DepositTxDetails.notionalAddress).to.equal(notionalAddress.address);
                expect(schedule1DepositTxDetails.amount).to.equal(28);
            });

            it("Deposit and Withdraw event sent on queueTransfer()", async () => {
                await tokeErc20.connect(user1).approve(staking.address, 10);
                await staking.connect(user1)["deposit(uint256,uint256)"](10, 0);

                await staking.connect(deployer).setTransferApprover(user1.address);

                await staking.connect(user1).queueTransfer(0, 0, 6, user2.address);

                await executeRollover();

                const tx = await staking.connect(user1).approveQueuedTransfer(user1.address, 0, 0, 6, user2.address);

                const receipt = await tx.wait();

                const events = getStateSenderLogFromReceipt(receipt);
                const event1 = events![0];
                const event2 = events![1];

                expect(event1).to.exist;
                expect(event2).to.exist;
                expect(event1.args.contractAddress).to.equal(POLYGON_FX_CHILD);
                expect(event2.args.contractAddress).to.equal(POLYGON_FX_CHILD);

                const rootWrapperEvent1 = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event1.args.data
                );

                const rootWrapperEvent2 = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event2.args.data
                );

                expect(rootWrapperEvent1[0]).to.equal(staking.address);
                expect(rootWrapperEvent1[1]).to.equal(destination.address);
                expect(rootWrapperEvent2[0]).to.equal(staking.address);
                expect(rootWrapperEvent2[1]).to.equal(destination.address);

                const balanceUpdaterEvent1 = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    rootWrapperEvent1[2]
                );

                const balanceUpdaterEvent2 = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    rootWrapperEvent2[2]
                );

                expect(balanceUpdaterEvent1[0][0]).to.equal(eventToBytes32("Withdraw"));
                expect(balanceUpdaterEvent1[0][1]).to.equal(user1.address);
                expect(balanceUpdaterEvent1[0][2]).to.equal(notionalAddress.address);
                expect(balanceUpdaterEvent1[0][3]).to.equal(4);

                expect(balanceUpdaterEvent2[0][0]).to.equal(eventToBytes32("Deposit"));
                expect(balanceUpdaterEvent2[0][1]).to.equal(user2.address);
                expect(balanceUpdaterEvent2[0][2]).to.equal(notionalAddress.address);
                expect(balanceUpdaterEvent2[0][3]).to.equal(6);
            });

            it("Deposit and withdraw events sent on sweepToScheduleZero()", async () => {
                const scheduleIdx1 = {
                    cliff: 0,
                    duration: 1,
                    interval: 1,
                    setup: true,
                    isActive: true,
                    hardStart: 1,
                    isPublic: true,
                };
                await staking.connect(deployer).addSchedule(scheduleIdx1, notionalAddress.address);
                await tokeErc20.connect(user1).approve(staking.address, 1000);
                await staking.connect(user1)["deposit(uint256,uint256)"](10, 1);
                const tx = await staking.connect(user1).sweepToScheduleZero(1, 7);
                const receipt = await tx.wait();

                const events = getStateSenderLogFromReceipt(receipt);
                const event1 = events![0];
                const event2 = events![1];

                expect(event1).to.exist;
                expect(event2).to.exist;
                expect(event1.args.contractAddress).to.equal(POLYGON_FX_CHILD);
                expect(event2.args.contractAddress).to.equal(POLYGON_FX_CHILD);

                const rootWrapperEvent1 = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event1.args.data
                );

                const rootWrapperEvent2 = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event2.args.data
                );

                expect(rootWrapperEvent1[0]).to.equal(staking.address);
                expect(rootWrapperEvent1[1]).to.equal(destination.address);
                expect(rootWrapperEvent2[0]).to.equal(staking.address);
                expect(rootWrapperEvent2[1]).to.equal(destination.address);

                const balanceUpdaterEvent1 = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    rootWrapperEvent1[2]
                );

                const balanceUpdaterEvent2 = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    rootWrapperEvent2[2]
                );

                expect(balanceUpdaterEvent1[0][0]).to.equal(eventToBytes32("Withdraw"));
                expect(balanceUpdaterEvent1[0][1]).to.equal(user1.address);
                expect(balanceUpdaterEvent1[0][2]).to.equal(notionalAddress.address);
                expect(balanceUpdaterEvent1[0][3]).to.equal(3);

                expect(balanceUpdaterEvent2[0][0]).to.equal(eventToBytes32("Deposit"));
                expect(balanceUpdaterEvent2[0][1]).to.equal(user1.address);
                expect(balanceUpdaterEvent2[0][2]).to.equal(notionalAddress.address);
                expect(balanceUpdaterEvent2[0][3]).to.equal(7);
            });
        });

        describe("Manager", () => {
            before(async () => {
                await manager.connect(deployer).setDestinations(POLYGON_FX_ROOT, destination.address);
                await manager.connect(deployer).setEventSend(true);
            });

            it("Sends an event on complete cycle rollover", async () => {
                const tx = await executeRollover();
                const receipt = await tx.wait();

                const event = getStateSenderLogFromReceipt(receipt)?.[0];
                expect(event).to.exist;
                expect(event?.args.contractAddress).to.equal(POLYGON_FX_CHILD);

                const rootWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event?.args?.data
                );

                expect(rootWrapper[0]).to.equal(manager.address);
                expect(rootWrapper[1]).to.equal(destination.address);

                const cycleRolloverWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,uint256,uint256)"],
                    rootWrapper[2]
                );

                expect(cycleRolloverWrapper[0][0]).to.equal(eventToBytes32("Cycle Complete"));
                expect(cycleRolloverWrapper[0][1]).to.equal(await manager.getCurrentCycleIndex());
            });
        });

        // These tests are meant to test the logic surrounding calculating amounts
        // that are sent to L2
        describe("Additional Staking tests", () => {
            beforeEach(async () => {
                const schedule1 = {
                    cliff: 0,
                    duration: 1,
                    interval: 1,
                    setup: true,
                    isActive: true,
                    hardStart: 1,
                    isPublic: true,
                };

                await staking.connect(deployer).addSchedule(schedule1, notionalAddress.address);
                await tokeErc20.connect(user1).approve(staking.address, 1000);

                await staking.connect(deployer).setDestinations(POLYGON_FX_ROOT, destination.address);
                await staking.connect(deployer).setEventSend(true);
            });

            it("queueTransfer() takes into account withdrawal requests on both schedules", async () => {
                await tokeErc20.connect(user2).approve(staking.address, 20);

                await staking.connect(user1)["deposit(uint256,uint256)"](10, 0);
                await staking.connect(user2)["deposit(uint256,uint256)"](15, 1);

                await staking.connect(user1).requestWithdrawal(1, 0);
                await staking.connect(user2).requestWithdrawal(1, 1);

                await staking.connect(deployer).setTransferApprover(user1.address);

                await staking.connect(user1).queueTransfer(0, 1, 6, user2.address);

                await executeRollover();

                const tx = await staking.connect(user1).approveQueuedTransfer(user1.address, 0, 1, 6, user2.address);

                const receipt = await tx.wait();

                const events = getStateSenderLogFromReceipt(receipt);
                const event1 = events![0];
                const event2 = events![1];

                const rootWrapperEvent1 = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event1.args.data
                );
                const rootWrapperEvent2 = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event2.args.data
                );

                const balanceUpdaterEvent1 = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    rootWrapperEvent1[2]
                );

                const balanceUpdaterEvent2 = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    rootWrapperEvent2[2]
                );

                //Deposit 10, Transfer 6, Requested 1 = 3
                expect(balanceUpdaterEvent1[0][0]).to.equal(eventToBytes32("Withdraw"));
                expect(balanceUpdaterEvent1[0][1]).to.equal(user1.address);
                expect(balanceUpdaterEvent1[0][2]).to.equal(notionalAddress.address);
                expect(balanceUpdaterEvent1[0][3]).to.equal(3);

                //Deposit 15, Receive 6 via Transfer, 1 Requested = 20
                expect(balanceUpdaterEvent2[0][0]).to.equal(eventToBytes32("Deposit"));
                expect(balanceUpdaterEvent2[0][1]).to.equal(user2.address);
                expect(balanceUpdaterEvent2[0][2]).to.equal(notionalAddress.address);
                expect(balanceUpdaterEvent2[0][3]).to.equal(20);
            });

            it("queueTransfer() removes queued transfer amount from vote total", async () => {
                await tokeErc20.connect(user2).approve(staking.address, 20);

                await staking.connect(user1)["deposit(uint256,uint256)"](10, 0);
                await staking.connect(user2)["deposit(uint256,uint256)"](15, 1);

                await staking.connect(user1).requestWithdrawal(1, 0);
                await staking.connect(user2).requestWithdrawal(1, 1);

                await staking.connect(deployer).setTransferApprover(user1.address);

                const tx = await staking.connect(user1).queueTransfer(0, 1, 6, user2.address);

                const receipt = await tx.wait();

                const events = getStateSenderLogFromReceipt(receipt);
                const event = events![0];

                const rootWrapperEvent = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event.args.data
                );

                const balanceUpdaterEvent = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    rootWrapperEvent[2]
                );

                //Deposit 10, Transfer 6, Requested 1 = 3
                expect(balanceUpdaterEvent[0][0]).to.equal(eventToBytes32("Transfer"));
                expect(balanceUpdaterEvent[0][1]).to.equal(user1.address);
                expect(balanceUpdaterEvent[0][2]).to.equal(notionalAddress.address);
                expect(balanceUpdaterEvent[0][3]).to.equal(3);
            });

            it("removeQueuedTransfer() adds queued transfer amount back to vote total", async () => {
                await tokeErc20.connect(user2).approve(staking.address, 20);

                await staking.connect(user1)["deposit(uint256,uint256)"](10, 0);
                await staking.connect(user2)["deposit(uint256,uint256)"](15, 1);

                await staking.connect(user1).requestWithdrawal(1, 0);
                await staking.connect(user2).requestWithdrawal(1, 1);

                await staking.connect(deployer).setTransferApprover(user1.address);

                // Queue and remove transfer
                await staking.connect(user1).queueTransfer(0, 1, 6, user2.address);
                const tx = await staking.connect(user1).removeQueuedTransfer(0);

                const receipt = await tx.wait();

                const events = getStateSenderLogFromReceipt(receipt);
                const event = events![0];

                const rootWrapperEvent = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event.args.data
                );

                const balanceUpdaterEvent = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    rootWrapperEvent[2]
                );

                //Deposit 10, Transfer 0, Requested 1 = 9
                expect(balanceUpdaterEvent[0][0]).to.equal(eventToBytes32("Transfer"));
                expect(balanceUpdaterEvent[0][1]).to.equal(user1.address);
                expect(balanceUpdaterEvent[0][2]).to.equal(notionalAddress.address);
                expect(balanceUpdaterEvent[0][3]).to.equal(9);
            });

            it("rejectQueuedTransfer() adds queued transfer amount back to vote total", async () => {
                await tokeErc20.connect(user2).approve(staking.address, 20);

                await staking.connect(user1)["deposit(uint256,uint256)"](10, 0);
                await staking.connect(user2)["deposit(uint256,uint256)"](15, 1);

                await staking.connect(user1).requestWithdrawal(1, 0);
                await staking.connect(user2).requestWithdrawal(1, 1);

                await staking.connect(deployer).setTransferApprover(user2.address);

                // Queue and remove transfer
                await staking.connect(user1).queueTransfer(0, 1, 6, user2.address);
                const tx = await staking.connect(user2).rejectQueuedTransfer(user1.address, 0);

                const receipt = await tx.wait();

                const events = getStateSenderLogFromReceipt(receipt);
                const event = events![0];

                const rootWrapperEvent = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event.args.data
                );

                const balanceUpdaterEvent = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    rootWrapperEvent[2]
                );

                //Deposit 10, Transfer 0, Requested 1 = 9
                expect(balanceUpdaterEvent[0][0]).to.equal(eventToBytes32("Transfer"));
                expect(balanceUpdaterEvent[0][1]).to.equal(user1.address);
                expect(balanceUpdaterEvent[0][2]).to.equal(notionalAddress.address);
                expect(balanceUpdaterEvent[0][3]).to.equal(9);
            });

            it("queuedTransfer() does not add queued transfer amount to receiver before approval", async () => {
                await tokeErc20.connect(user2).approve(staking.address, 20);

                await staking.connect(user1)["deposit(uint256,uint256)"](10, 0);
                await staking.connect(user2)["deposit(uint256,uint256)"](15, 1);

                await staking.connect(deployer).setTransferApprover(user1.address);

                // Queue transfer
                const tx1 = await staking.connect(user1).queueTransfer(0, 1, 10, user2.address);
                const tx2 = await staking.connect(user2).requestWithdrawal(1, 1);

                const receipt1 = await tx1.wait();
                const receipt2 = await tx2.wait();

                const event1 = getStateSenderLogFromReceipt(receipt1)![0];
                const event2 = getStateSenderLogFromReceipt(receipt2)![0];

                const rootWrapperEvent1 = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event1.args.data
                );
                const rootWrapperEvent2 = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event2.args.data
                );

                const balanceUpdaterEvent1 = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    rootWrapperEvent1[2]
                );
                const balanceUpdaterEvent2 = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    rootWrapperEvent2[2]
                );

                //Deposit 10, Queued transfer 10, Requested 0 = 0
                expect(balanceUpdaterEvent1[0][0]).to.equal(eventToBytes32("Transfer"));
                expect(balanceUpdaterEvent1[0][1]).to.equal(user1.address);
                expect(balanceUpdaterEvent1[0][2]).to.equal(notionalAddress.address);
                expect(balanceUpdaterEvent1[0][3]).to.equal(0);

                //Deposit 15, Transfer 0, Requested 1 = 9
                expect(balanceUpdaterEvent2[0][0]).to.equal(eventToBytes32("Withdrawal Request"));
                expect(balanceUpdaterEvent2[0][1]).to.equal(user2.address);
                expect(balanceUpdaterEvent2[0][2]).to.equal(notionalAddress.address);
                expect(balanceUpdaterEvent2[0][3]).to.equal(14);
            });

            it("Slashing adjusts requested withdrawals", async () => {
                await staking.connect(user1)["deposit(uint256,uint256)"](10, 0);
                await staking.connect(user1).requestWithdrawal(10, 0);

                const tx = await staking.connect(deployer).slash([user1.address], [4], 0);
                const receipt = await tx.wait();
                const event = getStateSenderLogFromReceipt(receipt)?.[0];

                const rootWrapper = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event?.args.data
                );

                const balanceUpdatedEvent = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    rootWrapper[2]
                );

                expect(balanceUpdatedEvent[0][0]).to.equal(eventToBytes32("Slash"));
                expect(balanceUpdatedEvent[0][1]).to.equal(user1.address);
                expect(balanceUpdatedEvent[0][2]).to.equal(notionalAddress.address);
                expect(balanceUpdatedEvent[0][3]).to.equal(0);

                const requestAmount = await staking.withdrawalRequestsByIndex(user1.address, 0);
                expect(requestAmount.amount).to.equal(6);
            });

            it("sweepToZeroSchedule takes into account withdrawal requests on both schedules", async () => {
                await staking.connect(user1)["deposit(uint256,uint256)"](10, 0);
                await staking.connect(user1)["deposit(uint256,uint256)"](25, 1);

                await staking.connect(user1).requestWithdrawal(9, 0);
                await staking.connect(user1).requestWithdrawal(11, 1);

                await executeRollover();

                const tx = await staking.connect(user1).sweepToScheduleZero(1, 6);
                const receipt = await tx.wait();

                const events = getStateSenderLogFromReceipt(receipt);
                const event1 = events![0];
                const event2 = events![1];

                const rootWrapperEvent1 = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event1.args.data
                );
                const rootWrapperEvent2 = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "bytes"],
                    event2.args.data
                );

                const balanceUpdaterEvent1 = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    rootWrapperEvent1[2]
                );

                const balanceUpdaterEvent2 = ethers.utils.defaultAbiCoder.decode(
                    ["tuple(bytes32,address,address,uint256)"],
                    rootWrapperEvent2[2]
                );

                expect(balanceUpdaterEvent1[0][0]).to.equal(eventToBytes32("Withdraw"));
                expect(balanceUpdaterEvent1[0][1]).to.equal(user1.address);
                expect(balanceUpdaterEvent1[0][2]).to.equal(notionalAddress.address);
                expect(balanceUpdaterEvent1[0][3]).to.equal(8);

                expect(balanceUpdaterEvent2[0][0]).to.equal(eventToBytes32("Deposit"));
                expect(balanceUpdaterEvent2[0][1]).to.equal(user1.address);
                expect(balanceUpdaterEvent2[0][2]).to.equal(notionalAddress.address);
                expect(balanceUpdaterEvent2[0][3]).to.equal(7);
            });
        });
    });

    const getImpersonatedSigner = async (address: string): Promise<SignerWithAddress> => {
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [address],
        });

        return ethers.getSigner(address);
    };

    const fundTokeToUsers = async (amount: string, users: SignerWithAddress[]): Promise<void> => {
        const results = users.map((user) => tokeErc20.connect(tokeWhale).transfer(user.address, amount));
        await Promise.all(results);
    };

    const fundWethToUsers = async (amount: string, users: SignerWithAddress[]): Promise<void> => {
        const results = users.map((user) => weth.connect(wethWhale).transfer(user.address, amount));
        await Promise.all(results);
    };

    const executeRollover = async (): Promise<ContractTransaction> => {
        await timeMachine.advanceBlock();
        await timeMachine.advanceBlock();

        const rolloverRole = await manager.ROLLOVER_ROLE();
        const rolloverAccount = await manager.getRoleMember(rolloverRole, 0);
        const signer = await getImpersonatedSigner(rolloverAccount);

        return await manager.connect(signer).completeRollover("hashyhashhash");
    };

    const getStateSenderLogFromReceipt = (receipt: ContractReceipt): LogDescription[] | undefined => {
        const resultArr = [];

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        for (let i = 0; i < receipt!.events!.length; i++) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const currentEvent = receipt!.events![i];

            if (currentEvent.address === POLYGON_STATE_SENDER) {
                const iface = new ethers.utils.Interface(PolygonStateSenderAbi);
                resultArr.push(
                    iface.parseLog({
                        data: currentEvent.data,
                        topics: currentEvent.topics,
                    })
                );
            }
        }
        return resultArr;
    };

    const eventToBytes32 = (eventName: string): string => {
        return ethers.utils.formatBytes32String(eventName);
    };

    const fundAccount = async (address: string) => {
        let etherBal = ethers.utils.parseEther(`500`).toHexString();
        if (etherBal.startsWith("0x0")) etherBal = "0x" + etherBal.substring(3);

        await ethers.provider.send("hardhat_setBalance", [address, etherBal]);
    };

    const getVoteEventDetails = async (tx: ContractTransaction, eventIndex: number) => {
        const receipt = await tx.wait();

        const events = getStateSenderLogFromReceipt(receipt);
        const event = events?.[eventIndex];

        if (!event) {
            throw "Could not find event";
        }

        expect(event.args.contractAddress).to.equal(POLYGON_FX_CHILD);

        const rootWrapperEvent1 = ethers.utils.defaultAbiCoder.decode(["address", "address", "bytes"], event.args.data);

        expect(rootWrapperEvent1[0]).to.equal(staking.address);
        expect(rootWrapperEvent1[1]).to.equal(destination.address);

        const balanceUpdaterEvent1 = ethers.utils.defaultAbiCoder.decode(
            ["tuple(bytes32,address,address,uint256)"],
            rootWrapperEvent1[2]
        );

        return {
            eventType: ethers.utils.parseBytes32String(balanceUpdaterEvent1[0][0]),
            account: balanceUpdaterEvent1[0][1],
            notionalAddress: balanceUpdaterEvent1[0][2],
            amount: balanceUpdaterEvent1[0][3],
        };
    };
});
