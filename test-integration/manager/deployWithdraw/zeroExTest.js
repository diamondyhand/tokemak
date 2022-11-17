const {ethers, artifacts} = require("hardhat");
const {expect} = require("chai");

const depositSignature = "deposit(address[],uint256[])";
const withdrawSignature = "withdraw(address[],uint256[])";

const contractName = "ZeroExController";
const Controller = artifacts.require(contractName);
const walletContractName = "ZeroExTradeWallet";
const WalletContract = artifacts.require(walletContractName);

class ZeroExTest {
    constructor(daiContract, usdcContract, manager, registry) {
        this.controllerArtifact = Controller;
        this.contractName = contractName;
        this.key = "zeroex";
        this.daiAddress = daiContract.address;
        this.usdcAddress = usdcContract.address;
        this.daiContract = daiContract;
        this.usdcContract = usdcContract;
        this.manager = manager;
        this.registry = registry;
    }

    async setupAndDeploy() {
        this.controllerInterface = new ethers.utils.Interface(this.controllerArtifact.abi);

        const controllerFactory = await ethers.getContractFactory(this.contractName);

        this.walletContract = new ethers.utils.Interface(WalletContract.abi);

        this.depositFuncSig = this.walletContract.getSighash(depositSignature);
        this.withdrawFuncSig = this.walletContract.getSighash(withdrawSignature);

        //Deploy Wallet
        const walletFactory = await ethers.getContractFactory(walletContractName);
        [this.deployer, this.user1, this.user2, this.randomAccount] = await ethers.getSigners();
        this.wallet = await walletFactory.deploy(this.randomAccount.address, this.manager.address);
        await this.wallet.deployed();

        await this.wallet.whitelistTokens([this.daiAddress, this.usdcAddress]);

        this.daiUsdcERC20 = this.wallet;

        this.controller = await controllerFactory.deploy(
            this.wallet.address,
            this.manager.address,
            this.manager.address,
            this.registry.address
        );
        await this.controller.deployed();
    }

    async saveBeforeExecuteState() {
        this.beforeDeployBalance = [];
        this.beforeDeployBalance.push(await this.daiContract.balanceOf(this.wallet.address));
        this.beforeDeployBalance.push(await this.usdcContract.balanceOf(this.wallet.address));
    }

    async preWithdrawExecute(block) {
        this.beforeWithdrawBalances = [];
        this.block = block;
        this.beforeWithdrawBalances.push(await this.daiContract.balanceOf(this.wallet.address));
        this.beforeWithdrawBalances.push(await this.usdcContract.balanceOf(this.wallet.address));
        const data = await this.getEndCycleData(this.beforeWithdrawBalances);
        return [ethers.utils.formatBytes32String(this.key), data];
    }

    async confirmAfterExecuteState() {
        const dai = await this.daiContract.balanceOf(this.wallet.address);
        const usdc = await this.usdcContract.balanceOf(this.wallet.address);
        expect(dai).to.be.gt(this.beforeDeployBalance[0]);
        expect(usdc).to.be.gt(this.beforeDeployBalance[1]);
    }

    async confirmPostWithdrawState() {
        const daiBal = await this.daiContract.balanceOf(this.wallet.address);
        const usdcBal = await this.usdcContract.balanceOf(this.wallet.address);
        expect(daiBal).to.be.equal(0);
        expect(usdcBal).to.be.equal(0);
    }

    getStartCycleData() {
        const addLiquidityEncoded = this.walletContract.encodeFunctionData(depositSignature, [
            [this.daiAddress, this.usdcAddress],
            [this.daiDesired, this.usdcDesired],
        ]);
        // remove function selector
        const addLiquidityEncodedParams = "0x" + addLiquidityEncoded.slice(10);
        const cycleData1 = this.controllerInterface.encodeFunctionData("deploy(bytes)", [addLiquidityEncodedParams]);

        return cycleData1;
    }

    getEndCycleData(bals) {
        const removeLiquidityEncoded = this.walletContract.encodeFunctionData(withdrawSignature, [
            [this.daiAddress, this.usdcAddress],
            bals,
        ]);
        // remove function selector
        const removeLiquidityEncodedParams = "0x" + removeLiquidityEncoded.slice(10);
        const cycleData2 = this.controllerInterface.encodeFunctionData("withdraw(bytes)", [
            removeLiquidityEncodedParams,
        ]);

        return cycleData2;
    }
}

module.exports = ZeroExTest;
