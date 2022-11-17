// const { expect } = require("chai");
// const { upgrades, ethers, artifacts, waffle } = require("hardhat");
// const { deployMockContract } = waffle;

// const IERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20");
// const MANAGER = artifacts.require("Manager");
// const STAKING = artifacts.require("Staking");
// const ETH_POOL = artifacts.require("EthPool");
// const POOL = artifacts.require("Pool");
// const CYCLE_DURATION = 2; // blocks

// let deployer;
// let user1;
// let managerProxy;
// let stakingProxy;
// let poolProxy;
// let ethPoolProxy;
// let proxyAdmin;
// let user1Addr;
// let treasury;

// describe("Testing OZ ProxyAdmin functionality", () => {
//     let proxyAdminAddr;

//     before(async () => {
//         [deployer, user1, treasury] = await ethers.getSigners();

//         let mockERC20 = await deployMockContract(deployer, IERC20.abi);
//         await mockERC20.mock.allowance.returns(0);
//         await mockERC20.mock.approve.returns(true);

//         const managerFactory = await ethers.getContractFactory("Manager");
//         managerProxy = await upgrades.deployProxy(
//             managerFactory,
//             { unsafeAllow: ["delegatecall"] }
//         );
//         await managerProxy.deployed();

//         const stakingFactory = await ethers.getContractFactory("Staking");
//         stakingProxy = await upgrades.deployProxy(stakingFactory, [
//             mockERC20.address,
//             managerProxy.address,
//             treasury.address,
//         ]);
//         await stakingProxy.deployed();

//         const poolFactory = await ethers.getContractFactory("Pool");
//         poolProxy = await upgrades.deployProxy(poolFactory, [
//             mockERC20.address,
//             managerProxy.address,
//             "tAsset",
//             "TTOKEN",
//         ]);
//         await poolProxy.deployed();

//         const ethPoolFactory = await ethers.getContractFactory("EthPool");
//         ethPoolProxy = await upgrades.deployProxy(ethPoolFactory, [
//             mockERC20.address,
//             managerProxy.address,
//             "tEth",
//             "TETH",
//         ]);
//         await ethPoolProxy.deployed();

//         proxyAdmin = await upgrades.admin.getInstance();
//         proxyAdminAddr = proxyAdmin.address;
//     });

//     it("All contracts should have the same admin", async () => {
//         let managerProxyAdmin = await proxyAdmin.getProxyAdmin(
//             managerProxy.address
//         );
//         let stakingProxyAdmin = await proxyAdmin.getProxyAdmin(
//             stakingProxy.address
//         );
//         let ethPoolProxyAdmin = await proxyAdmin.getProxyAdmin(
//             ethPoolProxy.address
//         );
//         let poolProxyAdmin = await proxyAdmin.getProxyAdmin(poolProxy.address);

//         expect(managerProxyAdmin).to.equal(proxyAdminAddr);
//         expect(stakingProxyAdmin).to.equal(proxyAdminAddr);
//         expect(ethPoolProxyAdmin).to.equal(proxyAdminAddr);
//         expect(poolProxyAdmin).to.equal(proxyAdminAddr);
//     });

//     it("ProxyAdmin should have the correct address as the owner", async () => {
//         expect(await proxyAdmin.owner()).to.equal(await deployer.getAddress());
//     });

//     describe("Changing the owner of ProxyAdmin", () => {
//         before(async () => {
//             user1Addr = await user1.getAddress();
//         });

//         it("ProxyAdmin should not allow user1 to change ownership", async () => {
//             expect((await proxyAdmin.connect(user1)).transferOwnership(user1Addr)).to
//                 .be.reverted;
//         });

//         it("ProxyAdmin should allow deployer to change ownership", async () => {
//             await proxyAdmin.transferOwnership(user1Addr);
//             expect(await proxyAdmin.owner()).to.equal(user1Addr);
//             await proxyAdmin
//                 .connect(user1)
//                 .transferOwnership(await deployer.getAddress());
//         });
//     });

//     describe("Upgrading each proxy", () => {
//         describe("Manager proxy upgrade", () => {
//             let mockManager;

//             before(async () => {
//                 mockManager = await deployMockContract(deployer, MANAGER.abi);
//             });

//             it("Should update the manager implementation", async () => {
//                 await proxyAdmin.upgrade(managerProxy.address, mockManager.address);
//                 expect(
//                     await proxyAdmin.getProxyImplementation(managerProxy.address)
//                 ).to.equal(mockManager.address);
//             });
//         });

//         describe("Staking Proxy upgrade", () => {
//             let mockStaking;

//             before(async () => {
//                 mockStaking = await deployMockContract(deployer, STAKING.abi);
//             });

//             it("Should update the staking implementation", async () => {
//                 await proxyAdmin.upgrade(stakingProxy.address, mockStaking.address);
//                 expect(
//                     await proxyAdmin.getProxyImplementation(stakingProxy.address)
//                 ).to.equal(mockStaking.address);
//             });
//         });

//         describe("EthPool Proxy upgrade", () => {
//             let mockEthPool;

//             before(async () => {
//                 mockEthPool = await deployMockContract(deployer, ETH_POOL.abi);
//             });

//             it("Should update the ethPool implementation", async () => {
//                 await proxyAdmin.upgrade(ethPoolProxy.address, mockEthPool.address);
//                 expect(
//                     await proxyAdmin.getProxyImplementation(ethPoolProxy.address)
//                 ).to.equal(mockEthPool.address);
//             });
//         });

//         describe("Pool Proxy upgrade", () => {
//             let mockPool;

//             before(async () => {
//                 mockPool = await deployMockContract(deployer, POOL.abi);
//             });

//             it("Should update the pool implementation", async () => {
//                 await proxyAdmin.upgrade(poolProxy.address, mockPool.address);
//                 expect(
//                     await proxyAdmin.getProxyImplementation(poolProxy.address)
//                 ).to.equal(mockPool.address);
//             });
//         });
//     });

//     describe("Changing the Admin of one of the proxy contracts", () => {
//         it("Should not allow user1 to change stakingProxys admin", async () => {
//             await expect(
//                 proxyAdmin
//                     .connect(user1)
//                     .changeProxyAdmin(stakingProxy.address, user1Addr)
//             ).to.be.reverted;
//         });

//         it("Should allow deployer to change poolProxys admin", async () => {
//             await proxyAdmin.changeProxyAdmin(poolProxy.address, user1Addr);
//             await expect(proxyAdmin.getProxyAdmin(poolProxy.address)).to.be.reverted;
//         });
//     });
// });
