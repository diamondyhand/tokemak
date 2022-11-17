// import { artifacts, ethers, run } from "hardhat";
// import { Pool, Pool__factory, TransparentUpgradeableProxy__factory } from "../../typechain";

// export interface NewPoolExistingImplArgs {
//     managerAddress: string;
//     proxyAdmin: string;
//     poolImplementation: string;
//     devCoordinatorMultisig: string;
//     underlyer: string;
//     symbol: string;
//     name: string;
//     skipVerify: boolean;
//     pause: boolean;
//     transferOwnership: boolean;
// }

// export const runNewPoolExistingImplSetup = async (input: NewPoolExistingImplArgs): Promise<void> => {
//     const [deployer] = await ethers.getSigners();

//     console.log(`Deployer: ${deployer.address}`);
//     console.log(`Manager Address ${input.managerAddress}`);
//     console.log(`Pool Implementation ${input.poolImplementation}`);
//     console.log(`Proxy Admin: ${input.proxyAdmin}`);
//     console.log(`Underlyer: ${input.underlyer}`);
//     console.log(`Symbol: ${input.symbol}`);
//     console.log(`Name: ${input.name}`);
//     console.log(`Pause: ${input.pause}`);
//     console.log(`TransferOwnership: ${input.transferOwnership}`);
//     const Initialize = "initialize";

//     const poolInterface = Pool__factory.createInterface();
//     const initializeData = poolInterface.encodeFunctionData(Initialize, [
//         input.underlyer,
//         input.managerAddress,
//         input.name,
//         input.symbol,
//     ]);

//     const proxyFactory = new TransparentUpgradeableProxy__factory(deployer);
//     const proxy = await proxyFactory.deploy(input.poolImplementation, input.proxyAdmin, initializeData);
//     await proxy.deployed();

//     console.log("");
//     console.log(`${input.symbol} Reactor - ${proxy.address}`);
//     console.log("");

//     if (input.pause) {
//         console.log("Pausing Contract...");
//         const poolArtifact = await artifacts.require("Pool");
//         const pool = (await ethers.getContractAt(poolArtifact.abi, proxy.address)) as Pool;
//         const pause = await pool.connect(deployer).pause();
//         await pause.wait();

//         const isPaused = await pool.paused();
//         console.log(`Pool is paused ${isPaused}`);
//         console.log("");
//     } else {
//         console.log("Contract will not be paused");
//         console.log("");
//     }

//     if (input.transferOwnership) {
//         console.log(`Transfer Ownership to dev coorindator multisig(${input.devCoordinatorMultisig})...`);
//         const poolArtifact = await artifacts.require("Pool");
//         const pool = (await ethers.getContractAt(poolArtifact.abi, proxy.address)) as Pool;

//         let owner = await pool.owner();
//         console.log(`Pool owner is ${owner}`);

//         const transferOwnership = await pool.connect(deployer).transferOwnership(input.devCoordinatorMultisig);
//         await transferOwnership.wait();

//         owner = await pool.owner();
//         console.log(`Pool ownership has been transfered to ${owner}`);
//         console.log("");
//     } else {
//         console.log("Contract Ownership will not be transfered to dev coordinator multisig");
//         console.log("");
//     }

//     if (!input.skipVerify) {
//         console.log("Verifying Proxy");
//         let tries = 0;
//         while (tries < 5) {
//             try {
//                 await run("verify:verify", {
//                     address: proxy.address,
//                     constructorArguments: [input.poolImplementation, input.proxyAdmin, initializeData],
//                     contract:
//                         "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
//                 });
//                 break;
//             } catch (e) {
//                 if (tries == 4) {
//                     console.log(e);
//                 } else {
//                     await new Promise((r) => setTimeout(r, tries * 10000));
//                 }
//             }
//             tries++;
//         }
//     }
// };
