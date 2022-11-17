import {BigNumberish} from "ethers";
import {ethers, upgrades, run} from "hardhat";
import dotenv from "dotenv";
import {
    BalanceTracker__factory,
    EventProxy,
    TransparentUpgradeableProxy__factory,
    VoteTracker__factory,
} from "../../../typechain";

dotenv.config();

const main = async () => {
    //Testnet
    // const FX_PORTAL_CHILD_ADDRESS = "0xCf73231F28B7331BBe3124B907840A94851f9f11"; //Mumbai
    // const TTOKE_ADDRESS = "0xa20Ec9554CD4C2d4594ECb7fa0138aBD4Ec8bbb4"; //Goerli
    // const PROXY_ADMIN = "0x31535A105a23731a0eF3ff8C19C6389F98bB796c";

    //Mainnet
    const FX_PORTAL_CHILD_ADDRESS = "0x8397259c983751DAf40400790063935a11afa28a"; //Polygon
    const TTOKE_ADDRESS = "0xa760e26aA76747020171fCF8BdA108dFdE8Eb930"; //Mainnet
    const PROXY_ADMIN = "0x2650D4e7Cb4402c6B999EED1AA920A939072e28f"; //Polygon
    const EVENT_PROXY = "0x7f4fb56b9C85bAB8b89C8879A660f7eAAa95a3A8";
    const BALANCE_TRACKER = "0xBC822318284aD00cDc0aD7610d510C20431e8309";
    const CHAIN_ID = 1;

    const VERIFY = true;

    const initialVoteSession: string = ethers.utils.formatBytes32String("1");

    const [deployer] = await ethers.getSigners();

    console.log(`Event Proxy: ${EVENT_PROXY}`);
    console.log(`Balance Tracker: ${BALANCE_TRACKER}`);

    const voteMultipliers = [getTokenMultiplier(TTOKE_ADDRESS, 1)];

    // const voteTrackerFactory = await ethers.getContractFactory("VoteTracker");
    // const voteTrackerImplementation = await voteTrackerFactory.deploy();
    // await voteTrackerImplementation.deployed();
    // const voteTrackerInit = await voteTrackerImplementation
    //   .connect(deployer)
    //   .initialize(
    //     EVENT_PROXY,
    //     initialVoteSession,
    //     BALANCE_TRACKER,
    //     CHAIN_ID,
    //     voteMultipliers
    //   );
    // await voteTrackerInit.wait(5);

    const voteTrackerImpl = "0xbe217C0466e3CCC5a15e4d01da20A0dfe4c7A1eE";
    // console.log(`Vote Tracker Impl: ${voteTrackerImpl}`);

    // //Setup Proxy
    const voteTrackerInterface = VoteTracker__factory.createInterface();
    const voteTrackerInitializedata = voteTrackerInterface.encodeFunctionData("initialize", [
        EVENT_PROXY,
        initialVoteSession,
        BALANCE_TRACKER,
        CHAIN_ID,
        voteMultipliers,
    ]);
    // const proxyFactory = new TransparentUpgradeableProxy__factory(deployer);
    // const voteTracker = await proxyFactory.deploy(
    //   voteTrackerImpl,
    //   PROXY_ADMIN,
    //   voteTrackerInitializedata
    // );
    // await voteTracker.deployed();

    const voteTrackerAddress = "0x7A9A3395afB32F923a142dBC56467Ae5675Ce5ec";
    // console.log(`Vote Tracker: ${voteTrackerAddress}`);

    // await new Promise((r) => setTimeout(r, 45000));

    if (VERIFY) {
        await run("verify:verify", {
            address: voteTrackerImpl,
            constructorArguments: [],
            contract: "contracts/vote/VoteTracker.sol:VoteTracker",
        });
    }

    if (VERIFY) {
        await run("verify:verify", {
            address: voteTrackerAddress,
            constructorArguments: [voteTrackerImpl, PROXY_ADMIN, voteTrackerInitializedata],
            contract: "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
        });
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
