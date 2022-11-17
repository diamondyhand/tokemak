//eslint-disable @typescript-eslint/no-non-null-assertion

import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {artifacts, ethers, network} from "hardhat";
import * as timeMachine from "ganache-time-traveler";
import {ERC20, Staking, TransparentUpgradeableProxy} from "../typechain";
import dotenv from "dotenv";
import {expect} from "chai";
import {BigNumber} from "ethers";

dotenv.config();

const TOKE_WHALE = "0x8b4334d4812c530574bd4f2763fcd22de94a969b";

const MANAGER_PROXY = "0xA86e412109f77c45a3BC1c5870b880492Fb86A14";
const TOKE_ERC20_ADDR = "0x2e9d63788249371f1DFC918a52f8d799F4a38C94";
const PROXY_ADMIN_ADDR = "0xc89F742452F534EcE603C7B62dF76102AAcF00Df";
const TREASURY_ADDR = "0x8b4334d4812C530574Bd4F2763FcD22dE94A969B";
const COORDINATOR_MULTISIG = "0x90b6C61B102eA260131aB48377E143D6EB3A9d4B";

const erc20Artifact = artifacts.require("@openzeppelin/contracts/token/ERC20/ERC20.sol");

describe("Slashing", () => {
    let snapshotId: string;
    let tokeErc20: ERC20;
    let staking: TransparentUpgradeableProxy & Staking;

    let deployer: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let tokeWhale: SignerWithAddress;
    let notionalAddress: SignerWithAddress;

    before(async () => {
        [user1, user2, notionalAddress] = await ethers.getSigners();
        tokeWhale = await getImpersonatedSigner(TOKE_WHALE);

        tokeErc20 = (await ethers.getContractAt(erc20Artifact.abi, TOKE_ERC20_ADDR)) as unknown as ERC20;

        // Redeploying because mainnet contracts not upgraded
        const stakingFactory = await ethers.getContractFactory("Staking");
        const proxyFactory = await ethers.getContractFactory("TransparentUpgradeableProxy", deployer);

        const stakingImplementation = await stakingFactory.deploy();

        await stakingImplementation.deployed();

        await stakingImplementation.initialize(TOKE_ERC20_ADDR, MANAGER_PROXY, TREASURY_ADDR, notionalAddress.address);

        const initializeStaking = stakingFactory.interface.encodeFunctionData("initialize", [
            tokeErc20.address,
            MANAGER_PROXY,
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

        await staking.connect(stakingOwnerAcct).transferOwnership(COORDINATOR_MULTISIG);

        deployer = await getImpersonatedSigner(COORDINATOR_MULTISIG);
        await fundAccount(deployer.address);

        await fundTokeToUsers("1000", [user1, user2]);
    });

    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    describe("Slashing", () => {
        it("Transfers appropriate amount to treasury", async () => {
            const cliff = 1000;
            const duration = 1000;
            const interval = 100;
            const setup = true;
            const isActive = true;
            const hardStart = 0;
            const amountUser1 = 100;
            const amountUser2 = 150;

            await staking.connect(deployer).addSchedule(
                {
                    cliff,
                    duration,
                    interval,
                    setup,
                    isActive,
                    hardStart,
                    isPublic: true,
                },
                notionalAddress.address
            );

            await tokeErc20.connect(user1).approve(staking.address, amountUser1);
            await tokeErc20.connect(user2).approve(staking.address, amountUser2);

            await staking.connect(user1)["deposit(uint256,uint256)"](amountUser1, 1);
            await staking.connect(user2)["deposit(uint256,uint256)"](amountUser2, 1);

            const treasuryBalanceBefore = await tokeErc20.balanceOf(TREASURY_ADDR);

            await staking.connect(deployer).slash([user1.address, user2.address], [50, 75], 1);

            const treasuryBalanceAfter = await tokeErc20.balanceOf(TREASURY_ADDR);

            expect(treasuryBalanceAfter.sub(treasuryBalanceBefore)).to.be.equal(BigNumber.from(125));
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

    const fundAccount = async (address: string) => {
        let etherBal = ethers.utils.parseEther(`500`).toHexString();
        if (etherBal.startsWith("0x0")) etherBal = "0x" + etherBal.substring(3);

        await ethers.provider.send("hardhat_setBalance", [address, etherBal]);
    };
});
