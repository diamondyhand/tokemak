const {ethers, artifacts} = require("hardhat");
const dotenv = require("dotenv");

const initializeSignature = "initialize";
const proxyAdminArtfact = artifacts.require("ProxyAdmin");

dotenv.config();

let proxyAdmin;

async function main() {
    const [deployer] = await ethers.getSigners();

    //PROD
    // const tokenAddress = "0x2e9d63788249371f1DFC918a52f8d799F4a38C94";
    // const managerAddress = "0xA86e412109f77c45a3BC1c5870b880492Fb86A14";
    // const treasuryAddress = "0x8b4334d4812C530574Bd4F2763FcD22dE94A969B";
    // const PROXY_ADMIN = "0xc89F742452F534EcE603C7B62dF76102AAcF00Df";

    //Goerli
    const PROXY_ADMIN = "0xC851CC8bf0ED0E5B3A7247b750451E9b75dd5f3A";
    const tokenAddress = "0xdcC9439Fe7B2797463507dD8669717786E51a014";
    const managerAddress = "0xe5dB5477F7787862116ff92E7d33A244A4ca35E0";
    const treasuryAddress = "0xf150b381a0eecc51f41014e488b1886e090f9a04";

    const scheduleZeroNotional = "0x605C9B6f969A27982Fe1Be16e3a24F6720A14beD";

    console.log(`Deployer: ${deployer.address}`);
    console.log(`Token Address ${tokenAddress}`);
    console.log(`Manager Address ${managerAddress}`);
    console.log(`Treasury Address ${treasuryAddress}`);

    const stakingFactory = await ethers.getContractFactory("Staking");
    const stakingContract = await stakingFactory.deploy();
    await stakingContract.deployed();

    let tx = await stakingContract.initialize(tokenAddress, managerAddress, treasuryAddress, scheduleZeroNotional);
    await tx.wait();

    proxyAdmin = await ethers.getContractAt(proxyAdminArtfact.abi, PROXY_ADMIN);

    const verifyTokenAddress = await stakingContract.tokeToken();
    const verifyManager = await stakingContract.manager();
    const verifyTreasury = await stakingContract.treasury();

    console.log(`\nStaking Contract ${stakingContract.address}`);
    console.log(`Verify Token Address ${verifyTokenAddress}`);
    console.log(`Verify Manager ${verifyManager}`);
    console.log(`Verify Treasury ${verifyTreasury}`);

    const initializeEncodedParams = stakingContract.interface.encodeFunctionData(initializeSignature, [
        tokenAddress,
        managerAddress,
        treasuryAddress,
        scheduleZeroNotional,
    ]);

    const proxyFactory = await ethers.getContractFactory("TransparentUpgradeableProxy");

    const proxy = await proxyFactory.deploy(stakingContract.address, deployer.address, initializeEncodedParams);
    await proxy.deployed();

    console.log(`Proxy Address: ${proxy.address}`);

    const adminBeforeChange = await proxy.connect(deployer).callStatic.admin();
    console.log(`\nDeployer address" ${deployer.address}`);
    console.log(`Signer before change: ${adminBeforeChange}`);
    tx = await proxy.connect(deployer).changeAdmin(PROXY_ADMIN);
    await tx.wait();

    const adminAfterChange = await proxyAdmin.getProxyAdmin(proxy.address);
    console.log(`Signer after change: ${adminAfterChange}`);

    console.log("Verifying implementation");
    await run("verify:verify", {
        address: stakingContract.address,
        constructorArguments: [],
        contract: "contracts/staking/Staking.sol:Staking",
    });

    console.log("Verifying proxy");
    await run("verify:verify", {
        address: proxy.address,
        constructorArguments: [stakingContract.address, deployer.address, initializeEncodedParams],
        contract: "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
