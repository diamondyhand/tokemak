const {expect} = require("chai");
const {ethers, artifacts} = require("hardhat");

class SushiBase {
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
        registry,
        masterChefAddress,
        poolId,
        toDeposit,
        toDepositAll,
        treasury
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
        this.masterChefAddress = masterChefAddress;
        this.poolId = poolId;
        this.toDeposit = toDeposit;
        this.toDepositAll = toDepositAll;
        this.treasury = treasury;
    }

    async setupAndDeploy() {
        //Uniswap setup
        this.controllerInterface = new ethers.utils.Interface(this.controllerArtifact.abi);
        this.factory = await ethers.getContractAt(this.factoryArtifact.abi, this.factoryAddress);
        const uniPairAddress = await this.factory.getPair(this.daiAddress, this.usdcAddress);
        this.daiUsdcERC20 = await ethers.getContractAt(this.erc20Artifact.abi, uniPairAddress);

        // Deploy Uniswap Controller
        const sc = artifacts.require("SushiswapControllerV2");
        this.routerInterface = new ethers.utils.Interface(sc.abi);

        const controllerFactory = await ethers.getContractFactory(this.contractName);
        this.controller = await controllerFactory.deploy(
            this.routerAddress,
            this.factoryAddress,
            this.masterChefAddress,
            this.manager.address,
            this.manager.address,
            this.registry.address,
            this.treasury
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
        return this.controllerInterface.encodeFunctionData(
            "deploy(address, address, uint256, uint256, uint256, uint256, address, uint256, uint256, bool, bool)",
            [
                this.daiAddress,
                this.usdcAddress,
                this.daiDesired,
                this.usdcDesired,
                this.daiAmountMin,
                this.usdcAmountMin,
                manager,
                this.block.timestamp + 500,
                this.poolId,
                this.toDeposit,
                this.toDepositAll,
            ]
        );
    }

    getEndCycleData(lpBalBeforeCycle2) {
        return this.controllerInterface.encodeFunctionData(
            "withdraw(address, address, uint256, uint256, uint256, address, uint256, uint256, bool)",
            [
                this.daiAddress,
                this.usdcAddress,
                lpBalBeforeCycle2,
                this.daiAmountMin,
                this.usdcAmountMin,
                this.manager.address,
                this.block.timestamp + 500,
                this.poolId,
                this.toDeposit,
            ]
        );
    }
}

module.exports = SushiBase;
