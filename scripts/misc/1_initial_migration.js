const {ethers, artifacts} = require("hardhat");
const {MaxUint256} = ethers.constants;

async function main() {
    console.log("\r\n");

    const cycleDuration = 100; //blocks;
    const rewardsSignerAccount = "0x023ffdc1530468eb8c8eebc3e38380b5bc19cc5d";
    const uniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const sushiswapRouterAddress = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
    const initialPools = [
        {
            address: "0x6b175474e89094c44da98b954eedeac495271d0f",
            name: "MakerDAO",
            symbol: "DAI",
        },
        {
            address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            name: "USD Coin",
            symbol: "USDC",
        },
    ];

    //Manager deploy
    const managerArtifact = await ethers.getContractFactory("Manager");
    const managerContract = await managerArtifact.deploy(cycleDuration);
    console.log(`Manager deployed to address with cycle duration of ${cycleDuration} blocks`);

    //TOKE deploy
    const tokeArtifact = await ethers.getContractFactory("Toke");
    const tokeContract = await tokeArtifact.deploy();
    const tokenName = await tokeContract.name();
    const tokenSymbol = await tokeContract.symbol();
    const tokenDecimals = await tokeContract.decimals();
    console.log(`${tokenName} token contract deployed as ${tokenSymbol} - ${tokenDecimals}`);

    //Rewards deploy
    const rewardsArtifact = await ethers.getContractFactory("Rewards");
    const rewardsContract = await rewardsArtifact.deploy(tokeContract.address, rewardsSignerAccount);
    const deployedRewardsTokeAddress = await rewardsContract.tokeToken();
    const deployedRewardsSignerAddress = await rewardsContract.rewardsSigner();
    console.log(
        `Rewards contract depoloyed with TOKE address ${deployedRewardsTokeAddress} and signer ${deployedRewardsSignerAddress}`
    );

    //Staking deploy
    const stakingArtifact = await ethers.getContractFactory("Staking");
    const stakingContract = await stakingArtifact.deploy(tokeContract.address);
    const deployedStakingTokeAddress = await stakingContract.tokeToken();
    console.log(`Staking contract deployed with TOKE address ${deployedStakingTokeAddress}`);

    //Whitelist deploy
    const whitelistArtifact = await ethers.getContractFactory("WhitelistRegistry");
    const whitelistContract = await whitelistArtifact.deploy();
    console.log(`Whitelist contract deployed`);

    const deployedControllers = [];
    //Balancer controller deploy
    const balancerJoinPoolSignature = "joinPool(uint256,uint256[])";
    const balancerExitPoolSignature = "exitPool(uint256,uint256[])";
    const IBalancerPool = artifacts.require("IBalancerPool");
    const balancerPoolInterface = new ethers.utils.Interface(IBalancerPool.abi);
    const balancerJoinPoolFuncSig = balancerPoolInterface.getSighash(balancerJoinPoolSignature);
    const balancerExitPoolFuncSig = balancerPoolInterface.getSighash(balancerExitPoolSignature);

    const balancerArtifact = await ethers.getContractFactory("BalancerController");
    const balancerContract = await balancerArtifact.deploy(balancerJoinPoolFuncSig, balancerExitPoolFuncSig);
    deployedControllers.push([balancerContract, "balancer"]);
    console.log(`Balancer controller deployed`);

    //Uniswap controller deploy
    const uniswapAddLiquiditySignature =
        "addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)";
    const uniswapRemoveLiquiditySignature = "removeLiquidity(address,address,uint256,uint256,uint256,address,uint256)";
    const IUniswapV2Router02 = artifacts.require(
        "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol:IUniswapV2Router02"
    );
    const uniswapRouterInterface = new ethers.utils.Interface(IUniswapV2Router02.abi);
    const uniswapAddLiquidityFuncSig = uniswapRouterInterface.getSighash(uniswapAddLiquiditySignature);
    const uniswapRemoveLiquidityFuncSig = uniswapRouterInterface.getSighash(uniswapRemoveLiquiditySignature);

    const uniswapArtifact = await ethers.getContractFactory("UniswapController");
    const uniswapContract = await uniswapArtifact.deploy(
        uniswapRouterAddress,
        uniswapAddLiquidityFuncSig,
        uniswapRemoveLiquidityFuncSig
    );
    deployedControllers.push([uniswapContract, "uniswapv2"]);
    console.log(`Uniswap controller deployed`);

    //Sushiswap controller deploy
    const sushiswapAddLiquiditySignature =
        "addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)";
    const sushiswapRemoveLiquiditySignature =
        "removeLiquidity(address,address,uint256,uint256,uint256,address,uint256)";
    const ISushiswapV2Router02 = artifacts.require(
        "@sushiswap/core/contracts/uniswapv2/interfaces/IUniswapV2Router02.sol:IUniswapV2Router02"
    );
    const sushiswapRouterInterface = new ethers.utils.Interface(ISushiswapV2Router02.abi);
    const sushiswapAddLiquidityFuncSig = sushiswapRouterInterface.getSighash(sushiswapAddLiquiditySignature);
    const sushiswapRemoveLiquidityFuncSig = sushiswapRouterInterface.getSighash(sushiswapRemoveLiquiditySignature);

    const sushiswapArtifact = await ethers.getContractFactory("SushiswapController");
    const sushiswapContract = await sushiswapArtifact.deploy(
        sushiswapRouterAddress,
        sushiswapAddLiquidityFuncSig,
        sushiswapRemoveLiquidityFuncSig
    );
    deployedControllers.push([sushiswapContract, "sushiswapv2"]);
    console.log(`Sushiswap controller deployed`);

    //Register Controllers
    for (let i = 0; i < deployedControllers.length; i++) {
        const id = ethers.utils.formatBytes32String(deployedControllers[i][1]);
        await managerContract.registerController(id, deployedControllers[i][0].address);
        console.log(`Registered controller ${deployedControllers[i][1]} - ${id} with manager`);
    }

    //Deploy and Register Pools
    const deployedPools = [];
    const poolArtifact = await ethers.getContractFactory("Pool");
    const deployPool = async (managerAddress, underlyingTokenAddress, underlyingTokenName, underlyingTokenSymbol) => {
        const poolContract = await poolArtifact.deploy(
            underlyingTokenAddress,
            managerAddress,
            `Toke/${underlyingTokenName}`,
            `t/${underlyingTokenSymbol}`
        );
        const poolTokenName = await poolContract.name();
        const poolTokenSymbol = await poolContract.symbol();
        const poolTokenDecimals = await poolContract.decimals();
        await poolContract.approveManager(managerAddress, MaxUint256);
        console.log(
            `Pool contract deployed ${underlyingTokenName} - ${poolTokenName} - ${poolTokenSymbol} - ${poolTokenDecimals}`
        );
        deployedPools.push(poolContract);
        return [poolContract, poolTokenSymbol];
    };
    for (let i = 0; i < initialPools.length; i++) {
        const poolContract = await deployPool(
            managerContract.address,
            initialPools[i].address,
            initialPools[i].name,
            initialPools[i].symbol
        );
        await managerContract.registerPool(poolContract[0].address);
        console.log(`Pool ${poolContract[1]} registered with manager`);
    }

    console.log("\r\n\r\n");
    console.log("========================================");
    console.log("Final Addresses");
    console.log("========================================");

    console.log(`Manager - ${managerContract.address}`);
    console.log(`TOKE - ${tokeContract.address}`);
    console.log(`Rewards - ${rewardsContract.address}`);
    console.log(`Staking - ${stakingContract.address}`);
    console.log(`Whitelist - ${whitelistContract.address}`);
    console.log(`Balancer Controller - ${balancerContract.address}`);
    console.log(`Uniswap Controller - ${uniswapContract.address}`);
    console.log(`Sushiswap Controller - ${sushiswapContract.address}`);

    for (let i = 0; i < deployedPools.length; i++) {
        const poolTokenSymbol = await deployedPools[i].symbol();
        console.log(`Pool ${poolTokenSymbol} - ${deployedPools[i].address}`);
    }

    console.log("\r\n\r\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
