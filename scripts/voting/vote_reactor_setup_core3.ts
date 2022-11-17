import {BigNumberish, ContractFactory, utils} from "ethers";
import {ethers, upgrades, run, artifacts} from "hardhat";
import dotenv from "dotenv";
import {OnChainVoteL1__factory, TransparentUpgradeableProxy__factory} from "../../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {OnChainVoteL1, OnChainVoteL1Interface} from "../../typechain/OnChainVoteL1";
import {Contract, Environment, getChainIdByEnv, getContractAddressByEnvironmentAndName} from "../config";

dotenv.config();

const main = async () => {
    const ENV = Environment.MAINNET;

    const VOTE_TRACKER_CORE3 = getContractAddressByEnvironmentAndName(ENV, Contract.CORE3_VOTE_TRACKER);

    const CHAIN_INFO = getChainIdByEnv(ENV);

    const chainValidation = (await ethers.provider.getNetwork()).chainId;
    if (CHAIN_INFO.vote != chainValidation) throw "Mismatch Chain";

    const [deployer] = await ethers.getSigners();

    const reactors = {
        oneinch: "0x111111111117dc0aa78b770fa6a738034120c302",
        aave: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
        alpha: "0xa1faa113cbe53436df28ff0aee54275c13b40975",
        angle: "0x31429d1856aD1377A8A0079410B297e1a9e214c2",
        ape: "0x4d224452801aced8b2f0aebe155379bb5d594381",
        api3: "0x0b38210ea11411557c13457D4dA7dC6ea731B88a",
        axs: "0xbb0e17ef65f82ab018d8edd776e8dd940327b28b",
        badger: "0x3472a5a71965499acd81997a54bba8d852c6e53d",
        bal: "0xba100000625a3754423978a60c9317c58a424e3d",
        bank: "0x2d94aa3e47d9d5024503ca8491fce9a2fb4da198",
        bico: "0xf17e65822b568b3903685a7c9f496cf7656cc6c2",
        bit: "0x1a4b46696b2bb4794eb3d4c26f1c55f9170fa4c5",
        bnt: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
        btrfly: "0xc0d4ceb216b3ba9c3701b291766fdcba977cec3a",
        cnv: "0x000000007a58f5f58e697e51ab0357bc9e260a04",
        comp: "0xc00e94cb662c3520282e6f5717214004a7f26888",
        crv: "0xd533a949740bb3306d119cc777fa900ba034cd52",
        cvx: "0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b",
        dodo: "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd",
        dydx: "0x92d6c1e31e14520e676a687f0a93788b716beff5",
        ens: "0xc18360217d8f7ab5e7c516566761ea12ce7f9d72",
        ftm: "0x4e15361fd6b4bb609fa63c81a2be19d873717870",
        gala: "0x15d4c048f83bd7e37d49ea4c83a07267ec4203da",
        gfi: "0xdab396ccf3d84cf2d07c4454e10c8a6f5b008d2b",
        gro: "0x3ec8798b81485a254928b70cda1cf0a2bb0b74d7",
        imx: "0xf57e7e7c23978c3caec3c3548e3d615c346e79ff",
        index: "0x0954906da0bf32d5479e25f46056d22f08464cab",
        jpeg: "0xe80c0cd204d654cebe8dd64a4857cab6be8345a3",
        ldo: "0x5a98fcbea516cf06857215779fd812ca3bef1b32",
        link: "0x514910771af9ca656af840dff83e8264ecf986ca",
        lqty: "0x6dea81c8171d0ba574754ef6f8b412f2ed88c54d",
        luna: "0xd2877702675e6cEb975b4A1dFf9fb7BAF4C91ea9",
        matic: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
        mkr: "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
        near: "0x85F17Cf997934a597031b2E18a9aB6ebD4B9f6a4",
        pal: "0xab846fb6c81370327e784ae7cbb6d6a6af6ff4bf",
        perp: "0xbc396689893d065f41bc2c6ecbee5e0085233447",
        premia: "0x6399c842dd2be3de30bf99bc7d1bbf6fa3650e70",
        rai: "0x03ab458634910aad20ef5f1c8ee96f1d6ac54919",
        ren: "0x408e41876cccdc0f92210600ef50372656052a38",
        rook: "0xfa5047c9c78b8877af97bdcb85db743fd7313d4a",
        rune: "0x3155ba85d5f96b2d030a4966af206230e46849cb",
        sdt: "0x73968b9a57c6e53d41345fd57a6e6ae27d6cdb2f",
        silo: "0x6f80310ca7f2c654691d1383149fa1a57d8ab1f8",
        spell: "0x090185f2135308bad17527004364ebcc2d37e5f6",
        stg: "0xaf5191b0de278c7286d6c7cc6ab6bb8a73ba2cd6",
        temple: "0x470ebf5f030ed85fc1ed4c2d36b9dd02e77cf1b7",
        tribe: "0xc7283b66eb1eb5fb86327f08e1b5816b0720212b",
        uni: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
        yfi: "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e",
        ygg: "0x25f8087ead173b73d6e8b84329989a8eea16cf73",
        zrx: "0xe41d2489571d322189246dafa5ebde1f4699f498",
    } as Record<string, string>;

    const reactorKeys = Object.keys(reactors).map((x) => {
        return {
            token: reactors[x],
            key: ethers.utils.formatBytes32String(`${x}-default`),
        };
    });

    const voteTracker = await ethers.getContractAt("VoteTracker", VOTE_TRACKER_CORE3);
    const reactorSetup = await voteTracker.connect(deployer).setReactorKeys(reactorKeys, true, {gasLimit: 4000000});

    await reactorSetup.wait();

    console.log("Setup");
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
