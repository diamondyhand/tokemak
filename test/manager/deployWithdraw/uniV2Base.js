const {expect} = require("chai");
const {ethers} = require("hardhat");

const addLiquiditySignature = "addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)";
const removeLiquiditySignature = "removeLiquidity(address,address,uint256,uint256,uint256,address,uint256)";

class UniV2Base {
    constructor(
        con,
        fac,
        erc20,
        rout,
        factoryAddress,
        routerAddress,
        contractName,
        key,
        daiAddress,
        usdcAddress,
        manager,
        registry
    ) {
        this.controllerArtifact = con;
        this.factoryArtifact = fac;
        this.erc20Artifact = erc20;
        this.routerArtifact = rout;
        this.routerAddress = routerAddress;
        this.factoryAddress = factoryAddress;
        this.contractName = contractName;
        this.key = key;
        this.daiAddress = daiAddress;
        this.usdcAddress = usdcAddress;
        this.manager = manager;
        this.registry = registry;
    }

    async setupAndDeploy() {
        //Uniswap setup
        this.controllerInterface = new ethers.utils.Interface(this.controllerArtifact.abi);
        this.factory = await ethers.getContractAt(this.factoryArtifact.abi, this.factoryAddress);
        const uniPairAddress = await this.factory.getPair(this.daiAddress, this.usdcAddress);
        this.daiUsdcERC20 = await ethers.getContractAt(this.erc20Artifact.abi, uniPairAddress);

        // Deploy Uniswap Controller
        this.routerInterface = new ethers.utils.Interface(this.routerArtifact.abi);
        this.addLiquidityFuncSig = this.routerInterface.getSighash(addLiquiditySignature);
        this.removeLiquidityFuncSig = this.routerInterface.getSighash(removeLiquiditySignature);
        const controllerFactory = await ethers.getContractFactory(this.contractName);
        this.controller = await controllerFactory.deploy(
            this.routerAddress,
            this.factoryAddress,
            this.manager.address,
            this.manager.address,
            this.registry.address
        );
        await this.controller.deployed();
    }

    async saveBeforeExecuteState() {
        this.beforeDeployBalance = await this.daiUsdcERC20.balanceOf(this.manager.address);
    }

    async confirmAfterExecuteState() {
        const lpBalAfterCycle1 = await this.daiUsdcERC20.balanceOf(this.manager.address);
        expect(lpBalAfterCycle1.gt(this.beforeDeployBalance)).to.be.equal(true);
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

    getStartCycleData(manager = this.manager.address) {
        const addLiquidityEncoded = this.routerInterface.encodeFunctionData(addLiquiditySignature, [
            this.daiAddress,
            this.usdcAddress,
            this.daiDesired,
            this.usdcDesired,
            this.daiAmountMin,
            this.usdcAmountMin,
            manager,
            this.block.timestamp + 500,
        ]);
        // remove function selector
        const addLiquidityEncodedParams = "0x" + addLiquidityEncoded.slice(10);
        const cycleData1 = this.controllerInterface.encodeFunctionData("deploy(bytes)", [addLiquidityEncodedParams]);

        return cycleData1;
    }

    getEndCycleData(lpBalBeforeCycle2) {
        const removeLiquidityEncoded = this.routerInterface.encodeFunctionData(removeLiquiditySignature, [
            this.daiAddress,
            this.usdcAddress,
            lpBalBeforeCycle2,
            this.daiAmountMin,
            this.usdcAmountMin,
            this.manager.address,
            this.block.timestamp + 500,
        ]);
        // remove function selector
        const removeLiquidityEncodedParams = "0x" + removeLiquidityEncoded.slice(10);
        const cycleData2 = this.controllerInterface.encodeFunctionData("withdraw(bytes)", [
            removeLiquidityEncodedParams,
        ]);

        return cycleData2;
    }
}

module.exports = UniV2Base;
