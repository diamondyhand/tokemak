const {expect} = require("chai");
const {BigNumber} = require("ethers");
const {ethers, artifacts} = require("hardhat");

const joinPoolSignature = "joinPool(uint256,uint256[])";
const exitPoolSignature = "exitPool(uint256,uint256[])";

const contractName = "BalancerController";
const BalancerController = artifacts.require(contractName);
const IBalancerPool = artifacts.require("IBalancerPool");
const IBalancerRegistry = artifacts.require("IBalancerRegistry");

class BalancerTest {
    constructor(daiAddress, usdcAddress, manager, registry) {
        this.controllerArtifact = BalancerController;
        this.contractName = contractName;
        this.key = "balancer";
        this.daiAddress = daiAddress;
        this.usdcAddress = usdcAddress;
        this.manager = manager;
        this.registry = registry;
    }

    async setupAndDeploy() {
        this.controllerInterface = new ethers.utils.Interface(this.controllerArtifact.abi);

        const controllerFactory = await ethers.getContractFactory(this.contractName);

        this.poolInterface = new ethers.utils.Interface(IBalancerPool.abi);
        this.joinPoolFuncSig = this.poolInterface.getSighash(joinPoolSignature);
        this.exitPoolFuncSig = this.poolInterface.getSighash(exitPoolSignature);

        this.controller = await controllerFactory.deploy(
            this.manager.address,
            this.manager.address,
            this.registry.address
        );
        await this.controller.deployed();
    }

    async perCycleSetup(managerAddress) {
        this.managerAddress = managerAddress;

        const registryContract = await ethers.getContractAt(
            IBalancerRegistry.abi,
            "0x7226DaaF09B3972320Db05f5aB81FF38417Dd687"
        );
        const result = await registryContract.connect(managerAddress).getBestPools(this.daiAddress, this.usdcAddress);

        for (let i = 0; i < result.length; i++) {
            const isFinal = await (await ethers.getContractAt(IBalancerPool.abi, result[i]))
                .connect(managerAddress)
                .isFinalized();
            if (isFinal) {
                const andw = await (await ethers.getContractAt(IBalancerPool.abi, result[i]))
                    .connect(managerAddress)
                    .getFinalTokens();

                if (andw.length == 2) {
                    this.numTokensInPool = andw.length;
                    this.daiIx = andw.map((x) => x.toLowerCase()).indexOf(this.daiAddress.toLowerCase());
                    this.usdcIx = andw.map((x) => x.toLowerCase()).indexOf(this.usdcAddress.toLowerCase());
                    this.poolAddress = result[i];
                    break;
                }
            }
        }

        this.daiUsdcERC20 = await ethers.getContractAt(IBalancerPool.abi, this.poolAddress);
        this.totalSupply = await this.daiUsdcERC20.totalSupply();
        this.totalSupplyDecimals = await this.daiUsdcERC20.decimals();
        this.daiPoolBalance = await this.daiUsdcERC20.getBalance(this.daiAddress);
        this.usdcPoolBalance = await this.daiUsdcERC20.getBalance(this.usdcAddress);
    }

    async saveBeforeExecuteState() {
        this.beforeDeployBalance = await this.daiUsdcERC20.balanceOf(this.manager.address);
    }

    async confirmAfterExecuteState() {
        const lpBalAfterCycle1 = await this.daiUsdcERC20.balanceOf(this.manager.address);
        expect(lpBalAfterCycle1).to.be.gt(this.beforeDeployBalance);
    }

    async preWithdrawExecute(block) {
        this.block = block;
        this.beforeWithdrawBalance = await this.daiUsdcERC20.balanceOf(this.manager.address);
        const data = await this.getEndCycleData(this.beforeWithdrawBalance);
        return [ethers.utils.formatBytes32String(this.key), data];
    }

    async confirmPostWithdrawState() {
        const lpBalAfterCycle2 = await this.daiUsdcERC20.balanceOf(this.manager.address);
        expect(lpBalAfterCycle2).to.be.equal(0);
    }

    getStartCycleData() {
        //Limit calculations from https://github.com/balancer-labs/configurable-rights-pool/blob/master/libraries/SmartPoolManager.sol#L427
        const poolAmountOut = parseFloat(
            ethers.utils.formatUnits(this.daiAmountMin.toString(), this.daiDecimals).toString()
        );
        const poolSupply = parseFloat(
            ethers.utils.formatUnits(this.totalSupply.toString(), this.totalSupplyDecimals).toString()
        );
        const ratio = poolAmountOut / (poolSupply * 0.99);
        const daiBal = parseFloat(
            ethers.utils.formatUnits(this.daiPoolBalance.toString(), this.daiDecimals).toString()
        );
        const daiMax = ratio * (daiBal + 1);

        const usdcBal = parseFloat(
            ethers.utils.formatUnits(this.usdcPoolBalance.toString(), this.usdcDecimals).toString()
        );
        const usdcMax = ratio * (usdcBal + 1);

        const maxDaiAllowed = ethers.utils.parseUnits(daiMax.toString(), this.daiDecimals.toString());
        const maxUsdcAllowed = ethers.utils.parseUnits(
            usdcMax.toFixed(this.usdcDecimals),
            this.usdcDecimals.toString()
        );

        const tokens = Array(this.numTokensInPool).fill(BigNumber.from(0));

        tokens[this.daiIx] = maxDaiAllowed.gt(this.daiDesired) ? this.daiDesired : maxDaiAllowed;
        tokens[this.usdcIx] = maxUsdcAllowed.gt(this.usdcDesired) ? this.usdcDesired : maxUsdcAllowed;

        const addLiquidityEncoded = this.poolInterface.encodeFunctionData(joinPoolSignature, [
            this.daiAmountMin,
            tokens,
        ]);

        // remove function selector
        const addLiquidityEncodedParams = "0x" + addLiquidityEncoded.slice(10);
        const cycleData1 = this.controllerInterface.encodeFunctionData("deploy(address,address[],uint256[],bytes)", [
            this.poolAddress,
            [this.daiAddress, this.usdcAddress],
            [this.daiDesired, this.usdcDesired],
            addLiquidityEncodedParams,
        ]);

        return cycleData1;
    }

    async getEndCycleData(lpBalBeforeCycle2) {
        //Limit calculations from https://github.com/balancer-labs/configurable-rights-pool/blob/master/libraries/SmartPoolManager.sol#L478
        const totalSupply = await this.daiUsdcERC20.totalSupply();
        const ratio = lpBalBeforeCycle2.div(totalSupply.add(BigNumber.from(1)));
        const poolDaiBal = await this.daiUsdcERC20.getBalance(this.daiAddress);
        const poolUsdcBal = await this.daiUsdcERC20.getBalance(this.usdcAddress);

        const maxDaiOut = ratio.mul(poolDaiBal.sub(BigNumber.from(1)));
        const maxUsdcOut = ratio.mul(poolUsdcBal.sub(BigNumber.from(1)));

        const tokens = Array(this.numTokensInPool).fill(BigNumber.from(0));

        tokens[this.daiIx] = maxDaiOut.gt(this.daiDesired) ? this.daiDesired : maxDaiOut;
        tokens[this.usdcIx] = maxUsdcOut.gt(this.usdcDesired) ? this.usdcDesired : maxUsdcOut;

        const removeLiquidityEncoded = this.poolInterface.encodeFunctionData(exitPoolSignature, [
            lpBalBeforeCycle2,
            tokens,
        ]);
        // remove function selector
        const removeLiquidityEncodedParams = "0x" + removeLiquidityEncoded.slice(10);
        const cycleData2 = this.controllerInterface.encodeFunctionData("withdraw(address,bytes)", [
            this.daiUsdcERC20.address,
            removeLiquidityEncodedParams,
        ]);

        return cycleData2;
    }
}

module.exports = BalancerTest;
