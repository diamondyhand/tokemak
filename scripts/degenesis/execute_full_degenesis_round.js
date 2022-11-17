const {ethers, artifacts, network} = require("hardhat");
const dotenv = require("dotenv");
const bip39 = require("bip39");
const hdkey = require("ethereumjs-wallet/dist/hdkey");
const chalk = require("chalk");
const BN = ethers.BigNumber;

const fs = require("fs/promises");
dotenv.config();

const provider = ethers.provider;

const MIN_TOKE_PRICE = 2;
const MAX_TOKE_PRICE = 8;
let TOKE_AMOUNT = 3000000;
const USDValue = (number) => {
    return ethers.utils.parseUnits(number.toString(), 8);
};

// const CYCLE_DURATION = 1;
const WETH_ADDRESS = process.env.DEFI_DEPLOY_WETH;
const USDC_ADDRESS = process.env.DEFI_DEPLOY_USDC;
// const MAX_TOTAL_VALUE = USDValue(48000000);

const USDC_WHALE_ADDRESS = "0x0548F59fEE79f8832C299e01dCA5c76F034F558e";

async function main() {
    //We're going to fork our mainnet environment and
    //set it up for a test scenario
    const [deployer] = await ethers.getSigners();
    const weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    const wethPoolAddress = "0xD3D13a578a53685B4ac36A1Bab31912D2B2A2F36";
    const usdcPoolAddress = "0x04bDA0CF6Ad025948Af830E75228ED420b0e860d";
    // const tokePoolAddress = "0xa760e26aA76747020171fCF8BdA108dFdE8Eb930";
    // const sushiPoolAddress = "0x8858A739eA1dd3D80FE577EF4e0D03E88561FaA3";
    // const uniPoolAddress = "0x1b429e75369ea5cd84421c1cc182cee5f3192fd3";
    const treasuryAddress = "0x8b4334d4812C530574Bd4F2763FcD22dE94A969B";
    const managerAddress = "0xA86e412109f77c45a3BC1c5870b880492Fb86A14";

    const WETH_ORACLE_ADDRESS = process.env.DEFI_DEPLOY_WETH_ORACLE;
    const USDC_ORACLE_ADDRESS = process.env.DEFI_DEPLOY_USDC_ORACLE;

    const MAX_TOTAL_VALUE = USDValue(48000000);
    const USER_LIMIT_WETH = 550;
    const USER_LIMIT_USDC = 100000;

    // await network.provider.request({
    //   method: "hardhat_impersonateAccount",
    //   params: ["0xc89F742452F534EcE603C7B62dF76102AAcF00Df"],
    // });
    // const proxyAdmin = await ethers.getSigner(
    //   "0xc89F742452F534EcE603C7B62dF76102AAcF00Df"
    // );

    const defiFactory = await ethers.getContractFactory("DefiRound");
    const defiContract = await defiFactory.deploy(weth, treasuryAddress, MAX_TOTAL_VALUE);
    await defiContract.deployed();

    console.log(chalk.greenBright(`\r\n=================================================`));
    console.log(chalk.greenBright(`DeFi contract address: ${defiContract.address}`));
    console.log(chalk.greenBright(`=================================================\r\n`));

    const userWethLimit = WETHAmount(USER_LIMIT_WETH);
    const userUsdcLimit = USDCAmount(USER_LIMIT_USDC);

    const s = await defiContract.connect(deployer).addSupportedTokens([
        {
            token: WETH_ADDRESS,
            oracle: WETH_ORACLE_ADDRESS,
            genesis: wethPoolAddress,
            maxLimit: userWethLimit,
        },
        {
            token: USDC_ADDRESS,
            oracle: USDC_ORACLE_ADDRESS,
            genesis: usdcPoolAddress,
            maxLimit: userUsdcLimit,
        },
    ]);
    await s.wait();

    console.log(chalk.greenBright(`Tokens Added`));

    const abiFile = await fs.readFile("./artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json", "utf-8");
    const erc20Artifact = JSON.parse(abiFile.toString());

    const usdc = new ethers.Contract(USDC_ADDRESS, erc20Artifact.abi, provider);

    await doUsdcDeposit(100000, usdc, defiContract, provider);
    await doUsdcDeposit(50000, usdc, defiContract, provider);
    await doUsdcDeposit(7584, usdc, defiContract, provider);
    await doUsdcDeposit(200, usdc, defiContract, provider);
    await doUsdcDeposit(2500.657485, usdc, defiContract, provider);
    await doUsdcDeposit(99999.999999, usdc, defiContract, provider);
    await doUsdcDeposit(10, usdc, defiContract, provider);
    await doUsdcDeposit(10, usdc, defiContract, provider);
    await doUsdcDeposit(9927.5, usdc, defiContract, provider);
    await doUsdcDeposit(100, usdc, defiContract, provider);
    await doUsdcDeposit(50320, usdc, defiContract, provider);
    await doUsdcDeposit(100000, usdc, defiContract, provider);
    await doUsdcDeposit(100000, usdc, defiContract, provider);
    await doUsdcDeposit(100000, usdc, defiContract, provider);
    await doUsdcDeposit(100000, usdc, defiContract, provider);
    await doUsdcDeposit(2500, usdc, defiContract, provider);
    await doUsdcDeposit(100000, usdc, defiContract, provider);
    await doUsdcDeposit(50000, usdc, defiContract, provider);
    await doUsdcDeposit(7584, usdc, defiContract, provider);
    await doUsdcDeposit(200, usdc, defiContract, provider);
    await doUsdcDeposit(2500.657485, usdc, defiContract, provider);
    await doUsdcDeposit(99999.999999, usdc, defiContract, provider);
    await doUsdcDeposit(10, usdc, defiContract, provider);
    await doUsdcDeposit(10, usdc, defiContract, provider);
    await doUsdcDeposit(9927.5, usdc, defiContract, provider);
    await doUsdcDeposit(100, usdc, defiContract, provider);
    await doUsdcDeposit(50320, usdc, defiContract, provider);
    await doUsdcDeposit(100000, usdc, defiContract, provider);
    await doUsdcDeposit(100000, usdc, defiContract, provider);
    await doUsdcDeposit(100000, usdc, defiContract, provider);
    await doUsdcDeposit(100000, usdc, defiContract, provider);
    await doUsdcDeposit(2500, usdc, defiContract, provider);
    await doUsdcDeposit(100000, usdc, defiContract, provider);
    await doUsdcDeposit(50000, usdc, defiContract, provider);
    await doUsdcDeposit(7584, usdc, defiContract, provider);
    await doUsdcDeposit(200, usdc, defiContract, provider);
    await doUsdcDeposit(2500.657485, usdc, defiContract, provider);
    await doUsdcDeposit(99999.999999, usdc, defiContract, provider);
    await doUsdcDeposit(10, usdc, defiContract, provider);
    await doUsdcDeposit(10, usdc, defiContract, provider);
    await doUsdcDeposit(9927.5, usdc, defiContract, provider);
    await doUsdcDeposit(100, usdc, defiContract, provider);
    await doUsdcDeposit(50320, usdc, defiContract, provider);
    await doUsdcDeposit(100000, usdc, defiContract, provider);
    await doUsdcDeposit(100000, usdc, defiContract, provider);
    await doUsdcDeposit(100000, usdc, defiContract, provider);
    await doUsdcDeposit(100000, usdc, defiContract, provider);
    await doUsdcDeposit(2500, usdc, defiContract, provider);

    await doEthDeposit(44, defiContract, true);
    await doEthDeposit(44, defiContract, true);
    await doEthDeposit(44, defiContract, true);
    await doEthDeposit(44, defiContract, true);
    await doEthDeposit(44, defiContract, true);
    await doEthDeposit(44, defiContract, true);
    await doEthDeposit(20, defiContract, true);
    await doEthDeposit(10, defiContract, true);
    await doEthDeposit(40.99999999, defiContract, true);
    await doEthDeposit(5.23478, defiContract, true);
    await doEthDeposit(5, defiContract, true);
    await doEthDeposit(1, defiContract, true);
    await doEthDeposit(0.5, defiContract, true);
    await doEthDeposit(0.5, defiContract, true);
    await doEthDeposit(0.5, defiContract, true);
    await doEthDeposit(0.05, defiContract, true);
    await doEthDeposit(0.001, defiContract, true);
    await doEthDeposit(0.001, defiContract, true);
    await doEthDeposit(9, defiContract, true);
    await doEthDeposit(18, defiContract, true);
    await doEthDeposit(0.001, defiContract, true);
    await doEthDeposit(44, defiContract, true);
    await doEthDeposit(44, defiContract, true);
    await doEthDeposit(44, defiContract, true);
    await doEthDeposit(44, defiContract, true);
    await doEthDeposit(44, defiContract, true);
    await doEthDeposit(44, defiContract, true);
    await doEthDeposit(20, defiContract, true);
    await doEthDeposit(10, defiContract, true);
    await doEthDeposit(40.99999999, defiContract, true);
    await doEthDeposit(5.23478, defiContract, true);
    await doEthDeposit(5, defiContract, true);
    await doEthDeposit(1, defiContract, true);
    await doEthDeposit(0.5, defiContract, true);
    await doEthDeposit(0.5, defiContract, true);
    await doEthDeposit(0.5, defiContract, true);
    await doEthDeposit(0.05, defiContract, true);
    await doEthDeposit(0.001, defiContract, true);
    await doEthDeposit(0.001, defiContract, true);
    await doEthDeposit(9, defiContract, true);
    await doEthDeposit(18, defiContract, true);
    await doEthDeposit(0.001, defiContract, true);
    await doEthDeposit(44, defiContract, true);
    await doEthDeposit(20, defiContract, true);
    await doEthDeposit(10, defiContract, true);
    await doEthDeposit(40.99999999, defiContract, true);
    await doEthDeposit(5.23478, defiContract, true);
    await doEthDeposit(5, defiContract, true);
    await doEthDeposit(1, defiContract, true);
    await doEthDeposit(0.5, defiContract, true);
    await doEthDeposit(0.5, defiContract, true);
    await doEthDeposit(0.5, defiContract, true);
    await doEthDeposit(0.05, defiContract, true);
    await doEthDeposit(0.001, defiContract, true);
    await doEthDeposit(0.001, defiContract, true);
    await doEthDeposit(9, defiContract, true);
    await doEthDeposit(18, defiContract, true);
    await doEthDeposit(0.001, defiContract, true);

    let failures = 0;
    for (let i = 0; i < 50 && failures < 2; i++) {
        console.log(`Eth Loaded ${i}`);
        try {
            await doEthDeposit(500, defiContract, false);
        } catch (err) {
            console.log(`Failures ${failures}`);
            failures++;
        }
    }

    console.log(chalk.greenBright(`Deposits complete`));

    const chainlinkAggregatorV3 = artifacts.require(
        "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol"
    );
    const ethOracle = await ethers.getContractAt(
        chainlinkAggregatorV3.abi,
        process.env.DEFI_DEPLOY_WETH_ORACLE // ETH / USD Price Feed
    );
    const usdcOracle = await ethers.getContractAt(
        chainlinkAggregatorV3.abi,
        process.env.DEFI_DEPLOY_USDC_ORACLE // USDC / USD Price Feed
    );

    const ethRoundData = await ethOracle.latestRoundData();
    const usdcRoundData = await usdcOracle.latestRoundData();

    const totalValueLocked = Number(ethers.utils.formatUnits(await defiContract.totalValue(), 8));

    //const totalValueLocked = 5000000;
    //const totalValueLocked = 6000000;
    //const totalValueLocked = 15000000;
    //const totalValueLocked = 29999999;
    //const totalValueLocked = 30000000;
    //const totalValueLocked = 30000001;
    //const totalValueLocked = 45000000;
    //const totalValueLocked = 59999999;
    //const totalValueLocked = 60000000;
    //const totalValueLocked = 60000001;
    //const totalValueLocked = 64100000;

    const currentEthPrice = Number(ethers.utils.formatUnits(ethRoundData[1], 8));
    const currentUsdcPrice = Number(ethers.utils.formatUnits(usdcRoundData[1], 8));

    console.log(`Total Defi Value: ${totalValueLocked}`);
    console.log(`ETH Price: ${currentEthPrice} `);
    console.log(`USDC Price: ${currentUsdcPrice}`);

    let tokePrice = MIN_TOKE_PRICE;
    let oversubscriptionPct = 1;
    if (totalValueLocked < TOKE_AMOUNT * MIN_TOKE_PRICE) {
        TOKE_AMOUNT = Math.ceil(totalValueLocked / MIN_TOKE_PRICE);
    } else {
        if (totalValueLocked > MIN_TOKE_PRICE * TOKE_AMOUNT && totalValueLocked < MAX_TOKE_PRICE * TOKE_AMOUNT) {
            tokePrice = totalValueLocked / TOKE_AMOUNT;
        }
        if (totalValueLocked >= MAX_TOKE_PRICE * TOKE_AMOUNT) {
            tokePrice = MAX_TOKE_PRICE;
        }
        oversubscriptionPct = round((tokePrice * TOKE_AMOUNT) / totalValueLocked, 8);
    }

    console.log(`TOKE Price: ${tokePrice}`);
    console.log(`Pct Swapped For TOKE: ${oversubscriptionPct}`);
    console.log(`Amount of TOKE to Distribute: ${TOKE_AMOUNT}`);

    const ethRate = calculateTokeRate(currentEthPrice, tokePrice);
    const usdcRate = calculateTokeRate(currentUsdcPrice, tokePrice);
    const overSubRate = decimalToFraction(oversubscriptionPct);

    console.log(`ETH Rate: ${ethRate.numerator} / ${ethRate.demoninator}`);
    console.log(`USDC Rate: ${usdcRate.numerator} / ${usdcRate.demoninator}`);
    console.log(`Swap Rate: ${overSubRate.top} / ${overSubRate.bottom}`);

    await defiContract.connect(deployer).publishRates(
        [
            //Numerator needs to be in asset precision, demoniator needs to be in TOKE precision
            [
                process.env.DEFI_DEPLOY_WETH,
                increaseBNPrecision(ethRate.numerator, 18),
                increaseBNPrecision(ethRate.demoninator, 18),
            ],
            [
                process.env.DEFI_DEPLOY_USDC,
                increaseBNPrecision(usdcRate.numerator, 6),
                increaseBNPrecision(usdcRate.demoninator, 18),
            ],
        ],
        [BN.from(overSubRate.top), BN.from(overSubRate.bottom)],
        1
    );

    console.log(chalk.greenBright(`Last look Initiated`));

    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_mine", []);

    console.log(chalk.greenBright(`Last look Complete`));

    const tx = await defiContract.connect(deployer).transferToTreasury();
    await tx.wait();

    console.log(chalk.greenBright(`Treasury Transfer Complete`));

    const manager = artifacts.require("Manager");
    const managerContract = await ethers.getContractAt(manager.abi, managerAddress);
    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: ["0x90b6C61B102eA260131aB48377E143D6EB3A9d4B"],
    });
    const coordinator = await ethers.getSigner("0x90b6C61B102eA260131aB48377E143D6EB3A9d4B");

    let etherBal = ethers.utils.parseEther(`500`).toHexString();
    if (etherBal.startsWith("0x0")) etherBal = "0x" + etherBal.substring(3);

    await provider.send("hardhat_setBalance", ["0x90b6C61B102eA260131aB48377E143D6EB3A9d4B", etherBal]);

    const xcx = await managerContract.connect(coordinator).setCycleDuration(1);
    await xcx.wait();

    console.log(chalk.greenBright(`Cycles Updated to 1 Block Duration`));

    const xx = await managerContract.connect(coordinator).startCycleRollover();
    await xx.wait();

    const x = await managerContract.connect(coordinator).completeRollover("X");
    await x.wait();

    console.log(chalk.greenBright(`New Cycle`));
}

const genWallet = async () => {
    const mnemonic = await bip39.generateMnemonic();
    const path = "m/44'/60'/0'/0/0";
    const hdwallet = hdkey.default.fromMasterSeed(await bip39.mnemonicToSeed(mnemonic));
    const wallet = hdwallet.derivePath(path).getWallet();
    const public = `0x${wallet.getAddress().toString("hex")}`;
    const prvt = `0x${wallet.getPrivateKey().toString("hex")}`;

    return {public, private: prvt, mnemonic};
};

const WETHAmount = (number) => {
    return ethers.utils.parseUnits(number.toString(), 18);
};
const WETHDeposit = (number) => {
    return [process.env.DEFI_DEPLOY_WETH, WETHAmount(number)];
};
const USDCDeposit = (number) => {
    return [process.env.DEFI_DEPLOY_USDC, USDCAmount(number)];
};
const USDCAmount = (number) => {
    return ethers.utils.parseUnits(number.toString(), 6);
};

const doEthDeposit = async (deposit, defiContract, writeOut) => {
    const wallet = await genWallet();

    let etherBal = ethers.utils.parseEther(`${Math.max(100, deposit * 2)}`).toHexString();
    if (etherBal.startsWith("0x0")) etherBal = "0x" + etherBal.substring(3);

    await provider.send("hardhat_setBalance", [wallet.public, etherBal]);

    const user2 = new ethers.Wallet(wallet.private, provider);
    await defiContract.connect(user2).deposit(WETHDeposit(deposit), [], {value: WETHAmount(deposit)});
    if (writeOut) {
        console.log(chalk.green("\r\n============================================================="));
        console.log(chalk.green(`Mnemonic: ${wallet.mnemonic}`));
        console.log(chalk.green(`Public Address: ${wallet.public}`));
        console.log(chalk.green(`Private: ${wallet.private}`));
        console.log(chalk.green(`ETH: ${deposit}`));
        console.log(chalk.green("=============================================================\r\n"));
    }
};

const doUsdcDeposit = async (deposit, usdc, defiContract) => {
    const usdcWhale = await provider.getSigner(USDC_WHALE_ADDRESS);

    await provider.send("hardhat_impersonateAccount", [USDC_WHALE_ADDRESS]);
    let etherBal = ethers.utils.parseEther(`550.0`).toHexString();
    let usdcLimit = 200000;
    if (etherBal.startsWith("0x0")) etherBal = "0x" + etherBal.substring(3);
    const wallet = await genWallet();

    await provider.send("hardhat_setBalance", [USDC_WHALE_ADDRESS, etherBal]); // ethers.utils.parseEther(`${ethLimit}.0`).toHexString()]);

    await provider.send("hardhat_setBalance", [wallet.public, etherBal]);

    const xxx = await usdc.connect(usdcWhale).transfer(wallet.public, USDCAmount(usdcLimit));
    await provider.send("hardhat_stopImpersonatingAccount", [USDC_WHALE_ADDRESS]);

    const user2 = new ethers.Wallet(wallet.private, provider);
    await usdc.connect(user2).approve(defiContract.address, USDCAmount(deposit));

    await xxx.wait();

    await defiContract.connect(user2).deposit(USDCDeposit(deposit), []);

    console.log(chalk.green("\r\n============================================================="));
    console.log(chalk.green(`Mnemonic: ${wallet.mnemonic}`));
    console.log(chalk.green(`Public Address: ${wallet.public}`));
    console.log(chalk.green(`Private: ${wallet.private}`));
    console.log(chalk.green(`USDC: ${deposit}`));
    console.log(chalk.green("=============================================================\r\n"));
};

const round = (value, decimals) => {
    return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
};

const calculateTokeRate = (numerator, tokePrice) => {
    const toke = decimalToFraction(tokePrice);
    const assetPrice = decimalToFraction(numerator);
    return {
        numerator: BN.from(assetPrice.bottom.toString()).mul(BN.from(toke.top.toString())),
        demoninator: BN.from(assetPrice.top.toString()).mul(BN.from(toke.bottom.toString())),
    };
};

const increaseBNPrecision = (bn, precision) => {
    return bn.mul(BN.from("10").pow(precision));
};

const gcd = (a, b) => {
    return b ? gcd(b, a % b) : a;
};

const decimalToFraction = (_decimal) => {
    if (_decimal == parseInt(_decimal)) {
        return {
            top: parseInt(_decimal),
            bottom: 1,
            display: parseInt(_decimal) + "/" + 1,
        };
    } else {
        var top = _decimal.toString().includes(".") ? _decimal.toString().replace(/\d+[.]/, "") : 0;
        var bottom = Math.pow(10, top.toString().replace("-", "").length);
        if (_decimal >= 1) {
            top = +top + Math.floor(_decimal) * bottom;
        } else if (_decimal <= -1) {
            top = +top + Math.ceil(_decimal) * bottom;
        }

        var x = Math.abs(gcd(top, bottom));
        return {
            top: top / x,
            bottom: bottom / x,
        };
    }
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
