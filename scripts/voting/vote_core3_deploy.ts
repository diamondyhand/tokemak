import {BigNumberish} from "ethers";
import {ethers, run} from "hardhat";
import dotenv from "dotenv";
import {TransparentUpgradeableProxy__factory, VoteTracker__factory} from "../../typechain";
import {Contract, Environment, getChainIdByEnv, getContractAddressByEnvironmentAndName} from "../config";

dotenv.config();

const main = async () => {
    const ENV = Environment.MAINNET;
    const VERIFY = true;

    const TOKE_ADDRESS = getContractAddressByEnvironmentAndName(ENV, Contract.TOKE);
    const PROXY_ADMIN = getContractAddressByEnvironmentAndName(ENV, Contract.PROXY_ADMIN_POLYGON);
    const EVENT_PROXY = getContractAddressByEnvironmentAndName(ENV, Contract.EVENT_PROXY);
    const BALANCE_TRACKER = getContractAddressByEnvironmentAndName(ENV, Contract.BALANCE_TRACKER);
    const CHAIN_INFO = getChainIdByEnv(ENV);

    const chainValidation = (await ethers.provider.getNetwork()).chainId;
    if (CHAIN_INFO.vote != chainValidation) throw "Mismatch Chain";

    const initialVoteSession: string = ethers.utils.formatBytes32String("1");

    const [deployer] = await ethers.getSigners();

    const voteMultipliers = [getTokenMultiplier(TOKE_ADDRESS, 1)];

    const voteTrackerFactory = await ethers.getContractFactory("VoteTracker");
    const voteTrackerImplementation = await voteTrackerFactory.deploy();
    await voteTrackerImplementation.deployed();
    const voteTrackerInit = await voteTrackerImplementation
        .connect(deployer)
        .initialize(EVENT_PROXY, initialVoteSession, BALANCE_TRACKER, CHAIN_INFO.l1, voteMultipliers);
    await voteTrackerInit.wait(1);

    const voteTrackerImplAddress = voteTrackerImplementation.address;

    console.log(`Vote Tracker Impl: ${voteTrackerImplAddress}`);

    await new Promise((r) => setTimeout(r, 90000));

    if (VERIFY) {
        try {
            await run("verify:verify", {
                address: voteTrackerImplAddress,
                constructorArguments: [],
                contract: "contracts/vote/VoteTracker.sol:VoteTracker",
            });
        } catch (e) {
            console.log("Veritification Failed. Continue");
            console.log(e);
        }
    }

    const voteTrackerInterface = VoteTracker__factory.createInterface();
    const voteTrackerInitializeData = voteTrackerInterface.encodeFunctionData("initialize", [
        EVENT_PROXY,
        initialVoteSession,
        BALANCE_TRACKER,
        CHAIN_INFO.l1,
        voteMultipliers,
    ]);

    const proxyFactory = new TransparentUpgradeableProxy__factory(deployer);
    const voteTracker = await proxyFactory.deploy(voteTrackerImplAddress, PROXY_ADMIN, voteTrackerInitializeData);
    await voteTracker.deployed();

    const voteTrackerAddress = voteTracker.address;
    console.log(`Vote Tracker: ${voteTrackerAddress}`);

    await new Promise((r) => setTimeout(r, 90000));

    if (VERIFY) {
        try {
            await run("verify:verify", {
                address: voteTrackerAddress,
                constructorArguments: [voteTrackerImplAddress, PROXY_ADMIN, voteTrackerInitializeData],
                contract: "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
            });
        } catch (e) {
            console.log("Veritification Failed. Continue");
            console.log(e);
        }
    }
};

const getTokenMultiplier = (tokenAddress: string, multiplier: number): VoteTokenMultiplier => {
    return {
        token: tokenAddress,
        multiplier: ethers.utils.parseUnits(multiplier.toString(), 18),
    };
};

type VoteTokenMultiplier = {
    token: string;
    multiplier: BigNumberish;
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
