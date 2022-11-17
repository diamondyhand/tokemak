import {BigNumberish} from "ethers";
import {ethers, upgrades, run} from "hardhat";
import dotenv from "dotenv";
import {
    BalanceTracker__factory,
    EventProxy,
    TransparentUpgradeableProxy__factory,
    VoteTracker__factory,
} from "../../typechain";

dotenv.config();

const main = async () => {
    //Testnet
    const FX_PORTAL_CHILD_ADDRESS = "0xCf73231F28B7331BBe3124B907840A94851f9f11"; //Mumbai
    const TTOKE_ADDRESS = "0x156dE8C7e1EC3bBF4f62a3E30fe248Fe6505e56f"; //Goerli
    const PROXY_ADMIN = "0x31535A105a23731a0eF3ff8C19C6389F98bB796c";

    //Mainnet
    // const FX_PORTAL_CHILD_ADDRESS = "0x8397259c983751DAf40400790063935a11afa28a"; //Polygon
    // const TTOKE_ADDRESS = "0xa760e26aA76747020171fCF8BdA108dFdE8Eb930"; //Mainnet
    // const PROXY_ADMIN = "0x2650D4e7Cb4402c6B999EED1AA920A939072e28f"; //Polygon

    const VERIFY = true;

    const initialVoteSession: string = ethers.utils.formatBytes32String("1");

    const [deployer] = await ethers.getSigners();

    // const eventProxyFactory = await ethers.getContractFactory("EventProxy");
    // const eventProxy = (await upgrades.deployProxy(eventProxyFactory, [
    //   FX_PORTAL_CHILD_ADDRESS,
    // ])) as EventProxy;
    // await eventProxy.deployed();

    // if (VERIFY) {
    //   await run("verify:verify", {
    //     address: eventProxy.address,
    //     constructorArguments: [FX_PORTAL_CHILD_ADDRESS],
    //     contract: "contracts/event-proxy/EventProxy.sol:EventProxy",
    //   });
    // }

    const eventProxyAddress = "0xd8A2E435BE384482816e6f922a4553E03bd71A35"; //Goerli
    //const eventProxyAddress = "0x7f4fb56b9C85bAB8b89C8879A660f7eAAa95a3A8"; //Mainnet

    console.log(`Event Proxy: ${eventProxyAddress}`);

    const balanceTrackerFactory = await ethers.getContractFactory("BalanceTracker");

    //Deploy BalanceTracker implementation
    // const balanceTrackerImplementation = await balanceTrackerFactory.deploy();
    // await balanceTrackerImplementation.deployed();
    // const balTrackerInit = await balanceTrackerImplementation
    //   .connect(deployer)
    //   .initialize(eventProxyAddress);
    // await balTrackerInit.wait(5);

    // const balanceTrackerImplAddress = balanceTrackerImplementation.address;
    // console.log(`Balance Tracker Implementation: ${balanceTrackerImplAddress}`);

    // if (VERIFY) {
    //   await run("verify:verify", {
    //     address: balanceTrackerImplAddress,
    //     constructorArguments: [],
    //     contract: "contracts/balance-tracker/BalanceTracker.sol:BalanceTracker",
    //   });
    // }

    //Deploy BalanceTracker Proxy
    // const balanceTrackerInterface = BalanceTracker__factory.createInterface();
    // const balanceTrackerInitializeData =
    //   balanceTrackerInterface.encodeFunctionData("initialize", [
    //     eventProxyAddress,
    //   ]);
    const proxyFactory = new TransparentUpgradeableProxy__factory(deployer);
    // const balanceTracker = await proxyFactory.deploy(
    //   balanceTrackerImplAddress,
    //   PROXY_ADMIN,
    //   balanceTrackerInitializeData
    // );
    // await balanceTracker.deployed();

    //const balanceTrackerAddress = "0xBC822318284aD00cDc0aD7610d510C20431e8309"; //V2 Mainnet
    const balanceTrackerAddress = "0x3917dE833541d4da3B228C1D1F87681B144f12c1"; //V2 Goerli

    console.log(`Balance Tracker: ${balanceTrackerAddress}`);

    // await new Promise((r) => setTimeout(r, 45000));

    // if (VERIFY) {
    //   await run("verify:verify", {
    //     address: balanceTrackerAddress,
    //     constructorArguments: [
    //       balanceTrackerImplAddress,
    //       PROXY_ADMIN,
    //       balanceTrackerInitializeData,
    //     ],
    //     contract:
    //       "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
    //   });
    // }

    const voteMultipliers = [getTokenMultiplier(TTOKE_ADDRESS, 1)];

    const voteTrackerFactory = await ethers.getContractFactory("VoteTracker");
    const voteTrackerImplementation = await voteTrackerFactory.deploy();
    await voteTrackerImplementation.deployed();
    const voteTrackerInit = await voteTrackerImplementation.connect(deployer).initialize(
        eventProxyAddress,
        initialVoteSession,
        balanceTrackerAddress,
        5, //Goerli
        //1, //Mainnet
        voteMultipliers
    );
    await voteTrackerInit.wait(5);

    const voteTrackerImplAddress = "0xfC753eaB7Ff0e5290F6c04d6477cE042154865f7";
    //const voteTrackerImplAddress = voteTrackerImplementation.address;

    console.log(`Vote Tracker Impl: ${voteTrackerImplAddress}`);

    // await new Promise((r) => setTimeout(r, 45000));

    // if (VERIFY) {
    //   await run("verify:verify", {
    //     address: voteTrackerImplAddress,
    //     constructorArguments: [],
    //     contract: "contracts/vote/VoteTracker.sol:VoteTracker",
    //   });
    // }

    const voteTrackerInterface = VoteTracker__factory.createInterface();
    const voteTrackerInitializedata = voteTrackerInterface.encodeFunctionData("initialize", [
        eventProxyAddress,
        initialVoteSession,
        balanceTrackerAddress,
        5, //Goerli
        //1, //Mainnet
        voteMultipliers,
    ]);
    const voteTracker = await proxyFactory.deploy(voteTrackerImplAddress, PROXY_ADMIN, voteTrackerInitializedata);
    await voteTracker.deployed();

    const voteTrackerAddress = voteTracker.address;
    console.log(`Vote Tracker: ${voteTrackerAddress}`);

    await new Promise((r) => setTimeout(r, 45000));

    if (VERIFY) {
        await run("verify:verify", {
            address: "0x63368f34B84C697d9f629F33B5CAdc22cb00510E",
            constructorArguments: [voteTrackerImplAddress, PROXY_ADMIN, voteTrackerInitializedata],
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
