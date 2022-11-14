const SushiBase = require("./sushiBase");

const {artifacts} = require("hardhat");

const SushiswapController = artifacts.require("SushiswapControllerV2");
const ISushiswapV2Factory = artifacts.require(
    "@sushiswap/core/contracts/uniswapv2/interfaces/IUniswapV2Factory.sol:IUniswapV2Factory"
);
const ISushiswapV2ERC20 = artifacts.require(
    "@sushiswap/core/contracts/uniswapv2/interfaces/IUniswapV2ERC20.sol:IUniswapV2ERC20"
);
const ISushiswapV2Router02 = artifacts.require(
    "@sushiswap/core/contracts/uniswapv2/interfaces/IUniswapV2Router02.sol:IUniswapV2Router02"
);

const SUSHISWAP_FACTORY_ADDRESS = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";
const SUSHISWAP_ROUTER_ADDRESS = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
const MASTERCHEF_V1 = "0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd";

class SushiV1Test extends SushiBase {
    constructor(daiAddress, usdcAddress, manager, registry, poolId, deposit, depositAll, treasury) {
        super(
            SushiswapController,
            ISushiswapV2Factory,
            ISushiswapV2ERC20,
            ISushiswapV2Router02,
            SUSHISWAP_FACTORY_ADDRESS,
            SUSHISWAP_ROUTER_ADDRESS,
            "SushiswapControllerV1",
            "sushiswapv1",
            daiAddress,
            usdcAddress,
            manager,
            registry,
            MASTERCHEF_V1,
            poolId,
            deposit,
            depositAll,
            treasury
        );
    }
}

module.exports = SushiV1Test;
