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
const MASTERCHEF_V2 = "0xEF0881eC094552b2e128Cf945EF17a6752B4Ec5d";

class SushiV2Test extends SushiBase {
    constructor(daiAddress, usdcAddress, manager, registry, poolId, deposit, depositAll, treasury) {
        super(
            SushiswapController,
            ISushiswapV2Factory,
            ISushiswapV2ERC20,
            ISushiswapV2Router02,
            SUSHISWAP_FACTORY_ADDRESS,
            SUSHISWAP_ROUTER_ADDRESS,
            "SushiswapControllerV2",
            "sushiswapv2",
            daiAddress,
            usdcAddress,
            manager,
            registry,
            MASTERCHEF_V2,
            poolId,
            deposit,
            depositAll,
            treasury
        );
    }
}

module.exports = SushiV2Test;
