import {expect, Assertion} from "chai";
import * as timeMachine from "ganache-time-traveler";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {artifacts, ethers, network, upgrades} from "hardhat";
import {CoreEvent, ERC20, Manager} from "../typechain";
import type {BaseContract} from "ethers";

Assertion.addMethod("withManuallyValidatedArgs", function (x, validate) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const derivedPromise = (this as any).promise.then(() => {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const g = this;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const values = (g as any).logs.map((l: any) => {
            return x.interface.parseLog(l).args;
        });
        for (let i = 0; i < values.length; i++) {
            validate(values[i]);
        }
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).then = derivedPromise.then.bind(derivedPromise);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).catch = derivedPromise.catch.bind(derivedPromise);
    return this;
});
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    export namespace Chai {
        interface EmitAssertion {
            withManuallyValidatedArgs<T extends BaseContract & {filters: unknown}>(
                contract: T,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                checker: (ar: any[]) => void
            ): Promise<void>;
        }
    }
}

describe("Test CoreEvent", () => {
    let deployer: SignerWithAddress;
    let treasury: SignerWithAddress;
    let core: CoreEvent;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let snapshotId: any;
    let aave: ERC20;
    let link: ERC20;
    let sushi: ERC20;
    let manager: Manager;
    let rebalancer: SignerWithAddress;

    const AAVE_ADDRESS = "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9";
    const LINK_ADDRESS = "0x514910771af9ca656af840dff83e8264ecf986ca";
    const SUSHI_ADDRESS = "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2";

    const AAVE_WHALE = "0x26a78D5b6d7a7acEEDD1e6eE3229b372A624d8b7";
    const LINK_WHALE = "0x0D4f1ff895D12c34994D6B65FaBBeEFDc1a9fb39";
    const SUSHI_WHALE = "0x80845058350B8c3Df5c3015d8a717D64B3bF9267";

    const AAVE_LIMIT = 10000;
    const LINK_LIMIT = 20000;
    const SUSHI_LIMIT = 30000;

    const CYCLE_DURATION = 1;

    const erc20Artifact = artifacts.require("@openzeppelin/contracts/token/ERC20/ERC20.sol");

    const sendEthToWhale = async (ether: number, address: string) => {
        await deployer.sendTransaction({
            value: ethers.utils.parseEther(ether.toString()),
            to: address,
        });
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [address],
        });
    };

    const deployPool = async <T extends BaseContract>(underlyerAddress: string, name: string, symbol: string) => {
        const poolFactory = await ethers.getContractFactory("Pool");
        const pool = await upgrades.deployProxy(
            poolFactory,
            [underlyerAddress, manager.address, name, symbol, rebalancer.address],
            {unsafeAllow: ["constructor"]}
        );
        await pool.deployed();

        return pool as T;
    };

    const TokenAmount = (number: number) => {
        return ethers.utils.parseUnits(number.toString(), 18);
    };
    const AAVETransfer = (number: number) => {
        return {token: AAVE_ADDRESS, amount: TokenAmount(number)};
    };
    const LINKTransfer = (number: number) => {
        return {token: LINK_ADDRESS, amount: TokenAmount(number)};
    };
    const SUSHITransfer = (number: number) => {
        return {token: SUSHI_ADDRESS, amount: TokenAmount(number)};
    };

    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    before(async () => {
        [deployer, treasury, rebalancer] = await ethers.getSigners();

        await treasury.sendTransaction({
            to: deployer.address,
            value: ethers.utils.parseEther("100.0"),
        });

        aave = (await ethers.getContractAt(erc20Artifact.abi, AAVE_ADDRESS)) as ERC20;
        link = (await ethers.getContractAt(erc20Artifact.abi, LINK_ADDRESS)) as ERC20;
        sushi = (await ethers.getContractAt(erc20Artifact.abi, SUSHI_ADDRESS)) as ERC20;

        const coreFactory = await ethers.getContractFactory("CoreEvent");
        core = await coreFactory.deploy(treasury.address, [
            {
                token: aave.address,
                maxUserLimit: TokenAmount(AAVE_LIMIT),
                systemFinalized: false,
            },
        ]);
        await core.deployed();

        await core.connect(deployer).addSupportedTokens([
            {
                token: link.address,
                maxUserLimit: TokenAmount(LINK_LIMIT),
                systemFinalized: false,
            },
            {
                token: sushi.address,
                maxUserLimit: TokenAmount(SUSHI_LIMIT),
                systemFinalized: false,
            },
        ]);

        await sendEthToWhale(10, AAVE_WHALE);
        await sendEthToWhale(10, LINK_WHALE);
        await sendEthToWhale(10, SUSHI_WHALE);

        const cycleStartTime = (await ethers.provider.getBlock("latest")).timestamp + 10;

        // Deploy Manager
        const managerFactory = await ethers.getContractFactory("Manager");
        manager = (await upgrades.deployProxy(managerFactory, [CYCLE_DURATION, cycleStartTime], {
            unsafeAllow: ["delegatecall", "constructor", "state-variable-assignment", "state-variable-immutable"],
        })) as Manager;
        await manager.deployed();
    });

    describe("Full Runs", () => {
        it("Forces funds to be withdrawn and sends to farm based on rates", async () => {
            const duration = 10;

            const aaveWhale = await ethers.provider.getSigner(AAVE_WHALE);
            const linkWhale = await ethers.provider.getSigner(LINK_WHALE);
            const sushiWhale = await ethers.provider.getSigner(SUSHI_WHALE);

            //Approvals
            await aave.connect(aaveWhale).approve(core.address, TokenAmount(10));
            await link.connect(linkWhale).approve(core.address, TokenAmount(20));
            await sushi.connect(sushiWhale).approve(core.address, TokenAmount(30));

            //Setup
            //Supported tokens added up top
            // await core.connect(deployer).setTreasury(treasury.address);
            await core.connect(deployer).setDuration(duration); //This means the contract is now open for deposits

            //Deposit
            await core.connect(aaveWhale).deposit([AAVETransfer(10)], []);
            await core.connect(linkWhale).deposit([LINKTransfer(20)], []);
            await core.connect(sushiWhale).deposit([SUSHITransfer(30)], []);

            await timeMachine.advanceBlock();

            //Whales come back and withdraw some
            await core.connect(aaveWhale).withdraw([AAVETransfer(1)]);
            await core.connect(linkWhale).withdraw([LINKTransfer(2)]);
            await core.connect(sushiWhale).withdraw([SUSHITransfer(3)]);

            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();

            //We'll assume that AAVE and LINK are the winners and SUSHI will have to withdraw
            //AAVE was under $10 so they get no farming
            const aaveRate = {
                token: AAVE_ADDRESS,
                tokeNumerator: 2,
                tokeDenominator: 1,
                overNumerator: 1,
                overDenominator: 1,
                pool: ethers.constants.AddressZero,
            };

            //LINK was over $10 so to farming they go
            const linkPool = await deployPool(LINK_ADDRESS, "TokemakLink", "tLINK");
            const linkRate = {
                token: LINK_ADDRESS,
                tokeNumerator: 2,
                tokeDenominator: 1,
                overNumerator: 50,
                overDenominator: 100,
                pool: linkPool.address,
            };

            //Set the rates
            await core.connect(deployer).setRates([aaveRate, linkRate]);

            await core.connect(deployer).transferToTreasury([AAVE_ADDRESS, LINK_ADDRESS]);
            await core.connect(deployer).setNoSwap([SUSHI_ADDRESS]);

            //Rates have been set now we can finalize()

            //We'll try to both move the AAVE to the farm and to refund it
            //but we should be able to do neither since it was under $10 and the
            //entire amount went to TOKE
            await expect(
                core.connect(aaveWhale).finalize([{token: AAVE_ADDRESS, sendToFarming: true}])
            ).to.be.revertedWith("NOTHING_TO_MOVE");
            await expect(
                core.connect(aaveWhale).finalize([{token: AAVE_ADDRESS, sendToFarming: false}])
            ).to.be.revertedWith("NOTHING_TO_MOVE");

            //LINK can move
            await expect(core.connect(linkWhale).finalize([{token: LINK_ADDRESS, sendToFarming: true}]))
                .to.emit(core, "AssetsFinalized")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .withManuallyValidatedArgs<CoreEvent>(core, (args: any[]) => {
                    expect(args[0]).to.equal(LINK_WHALE);
                    expect(args[1][0].token.toString().toLowerCase()).to.equal(LINK_ADDRESS);
                    expect(args[1][0].transferredToFarm).to.equal(TokenAmount(9));
                    //Deposited 20, withdrew 2. 50% set to go to farming = 9
                });

            //SUSHI tries to go to farm but gets rejected
            await expect(
                core.connect(sushiWhale).finalize([{token: SUSHI_ADDRESS, sendToFarming: true}])
            ).to.be.revertedWith("NO_FARMING");

            //SUSHI gets full refund
            await expect(core.connect(sushiWhale).finalize([{token: SUSHI_ADDRESS, sendToFarming: false}]))
                .to.emit(core, "AssetsFinalized")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .withManuallyValidatedArgs<CoreEvent>(core, (args: any[]) => {
                    expect(args[0]).to.equal(SUSHI_WHALE);
                    expect(args[1][0].token.toString().toLowerCase()).to.equal(SUSHI_ADDRESS);
                    expect(args[1][0].refunded).to.equal(TokenAmount(27));
                });
        });

        it("An early transfer to treasury still allows appropriate withdraw by users", async () => {
            const duration = 10;

            const aaveWhale = await ethers.provider.getSigner(AAVE_WHALE);
            const linkWhale = await ethers.provider.getSigner(LINK_WHALE);
            const sushiWhale = await ethers.provider.getSigner(SUSHI_WHALE);

            //Approvals
            await aave.connect(aaveWhale).approve(core.address, TokenAmount(10));
            await link.connect(linkWhale).approve(core.address, TokenAmount(20));
            await sushi.connect(sushiWhale).approve(core.address, TokenAmount(30));

            //Setup
            //Supported tokens added up top
            // await core.connect(deployer).setTreasury(treasury.address);
            await core.connect(deployer).setDuration(duration); //This means the contract is now open for deposits

            //Deposit
            await core.connect(aaveWhale).deposit([AAVETransfer(10)], []);
            await core.connect(linkWhale).deposit([LINKTransfer(20)], []);
            await core.connect(sushiWhale).deposit([SUSHITransfer(30)], []);

            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();
            await timeMachine.advanceBlock();

            //We'll assume that AAVE and LINK are the winners and SUSHI will have to withdraw
            //AAVE was under $10 so they get no farming
            const aavePool = await deployPool(AAVE_ADDRESS, "TokemakAave", "tAAVE");
            const aaveRate = {
                token: AAVE_ADDRESS,
                tokeNumerator: 2,
                tokeDenominator: 1,
                overNumerator: 90, //90% goes to TOKE
                overDenominator: 100,
                pool: aavePool.address,
            };

            //LINK was over $10 so to farming they go
            const linkPool = await deployPool(LINK_ADDRESS, "TokemakLink", "tLINK");
            const linkRate = {
                token: LINK_ADDRESS,
                tokeNumerator: 2,
                tokeDenominator: 1,
                overNumerator: 30, //30% goes to TOKE
                overDenominator: 100,
                pool: linkPool.address,
            };

            //Set the rates
            await core.connect(deployer).setRates([aaveRate, linkRate]);

            await core.connect(deployer).transferToTreasury([AAVE_ADDRESS, LINK_ADDRESS]);
            await core.connect(deployer).setNoSwap([SUSHI_ADDRESS]);

            //Rates have been set now we can finalize()

            //Get final balances
            const aaveBalance = await aave.connect(deployer).balanceOf(core.address);
            const linkBalance = await link.connect(deployer).balanceOf(core.address);

            const aaveBreakup = await core.connect(deployer).getRateAdjustedAmounts(aaveBalance, AAVE_ADDRESS);
            const linkBreakup = await core.connect(deployer).getRateAdjustedAmounts(linkBalance, LINK_ADDRESS);

            //AAVE can move
            await expect(core.connect(aaveWhale).finalize([{token: AAVE_ADDRESS, sendToFarming: false}]))
                .to.emit(core, "AssetsFinalized")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .withManuallyValidatedArgs<CoreEvent>(core, (args: any[]) => {
                    expect(args[0]).to.equal(AAVE_WHALE);
                    expect(args[1][0].token.toString().toLowerCase()).to.equal(AAVE_ADDRESS);
                    expect(args[1][0].refunded).to.equal(TokenAmount(1));
                    //Deposited 10, 10% set to go to farming = 1
                });

            //LINK can move
            await expect(core.connect(linkWhale).finalize([{token: LINK_ADDRESS, sendToFarming: true}]))
                .to.emit(core, "AssetsFinalized")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .withManuallyValidatedArgs<CoreEvent>(core, (args: any[]) => {
                    expect(args[0]).to.equal(LINK_WHALE);
                    expect(args[1][0].token.toString().toLowerCase()).to.equal(LINK_ADDRESS);
                    expect(args[1][0].transferredToFarm).to.equal(TokenAmount(14));
                    //Deposited 20, 70% set to go to farming = 14
                });

            //SUSHI gets full refund
            await expect(core.connect(sushiWhale).finalize([{token: SUSHI_ADDRESS, sendToFarming: false}]))
                .to.emit(core, "AssetsFinalized")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .withManuallyValidatedArgs<CoreEvent>(core, (args: any[]) => {
                    expect(args[0]).to.equal(SUSHI_WHALE);
                    expect(args[1][0].token.toString().toLowerCase()).to.equal(SUSHI_ADDRESS);
                    expect(args[1][0].refunded).to.equal(TokenAmount(30));
                });

            const treasuryAaveBalance = await aave.connect(deployer).balanceOf(treasury.address);
            const treasuryLinkBalance = await link.connect(deployer).balanceOf(treasury.address);
            const treasurySushiBalance = await sushi.connect(deployer).balanceOf(treasury.address);

            expect(treasuryAaveBalance).to.be.equal(TokenAmount(9));
            expect(treasuryLinkBalance).to.be.equal(TokenAmount(6));
            expect(treasurySushiBalance).to.be.equal(TokenAmount(0));
        });
    });
});
