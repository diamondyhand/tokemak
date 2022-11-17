import {ethers, run, artifacts} from "hardhat";
import dotenv from "dotenv";
import {ProxyAdmin} from "../../typechain";

dotenv.config();

const proxyAdminArtifact = artifacts.require("ProxyAdmin");

function getTokens() {
    const isTestNet = process.env.HARDHAT_NETWORK === "mumbai";
    return {
        TOKE_REACTOR: isTestNet
            ? "0x156dE8C7e1EC3bBF4f62a3E30fe248Fe6505e56f"
            : "0xa760e26aA76747020171fCF8BdA108dFdE8Eb930",
        UNI_LP_REACTOR: isTestNet
            ? "0xdE526D5A5123f99E7132b5De59024B2aF244299A"
            : "0x1b429e75369ea5cd84421c1cc182cee5f3192fd3",
        SUSHI_LP_REACTOR: isTestNet
            ? "0xC83CEDEA62e9d0B07da3D9e31b12c172dB7Cad41"
            : "0x8858A739eA1dd3D80FE577EF4e0D03E88561FaA3",
        PROXY_ADMIN_ADDRESS: isTestNet
            ? "0x31535A105a23731a0eF3ff8C19C6389F98bB796c"
            : "0x2650D4e7Cb4402c6B999EED1AA920A939072e28f",
        BALANCE_TRACKER: isTestNet
            ? "0x3917dE833541d4da3B228C1D1F87681B144f12c1"
            : "0xBC822318284aD00cDc0aD7610d510C20431e8309",
        STACKING: isTestNet
            ? "0xD2b8798bE815a3Cee345dbDCCf263b96FAb0FD15"
            : "0x96F98Ed74639689C3A11daf38ef86E59F43417D3",
    };
}

async function main() {
    const {TOKE_REACTOR, UNI_LP_REACTOR, SUSHI_LP_REACTOR, PROXY_ADMIN_ADDRESS, BALANCE_TRACKER, STACKING} =
        getTokens();
    const tokensToSupport = [TOKE_REACTOR, UNI_LP_REACTOR, SUSHI_LP_REACTOR, STACKING];

    const [deployer] = await ethers.getSigners();

    const proxyAdmin = (await ethers.getContractAt(
        proxyAdminArtifact.abi,
        PROXY_ADMIN_ADDRESS,
        deployer
    )) as unknown as ProxyAdmin;

    const balanceTrackerFactory = await ethers.getContractFactory("BalanceTracker");
    const balanceTrackerImplementation = await balanceTrackerFactory.deploy();
    await balanceTrackerImplementation.deployed();

    const balanceTrackerImplAddress = balanceTrackerImplementation.address;

    console.log(`Balance Tracker Impl: ${balanceTrackerImplAddress}`);

    await new Promise((r) => setTimeout(r, 45000));

    await run("verify:verify", {
        address: balanceTrackerImplAddress,
        constructorArguments: [],
        contract: "contracts/balance-tracker/BalanceTracker.sol:BalanceTracker",
    });

    const data = balanceTrackerFactory.interface.encodeFunctionData("addSupportedTokens(address[])", tokensToSupport);

    const tx = await proxyAdmin.connect(deployer).upgradeAndCall(BALANCE_TRACKER, balanceTrackerImplAddress, data);
    await tx.wait();
}

main();
