import {ethers, artifacts, network} from "hardhat";
import dotenv from "dotenv";
import * as bip39 from "bip39";
import hdkey from "ethereumjs-wallet/dist/hdkey";
import chalk from "chalk";
import fs from "fs/promises";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {DefiRound, ERC20, Manager, TestnetToken, TestOracle} from "../../typechain";
import {BigNumber, Signer} from "ethers";

const BN = ethers.BigNumber;

dotenv.config();

const provider = ethers.provider;

const MIN_TOKE_PRICE = 2;
const MAX_TOKE_PRICE = 8;
let TOKE_AMOUNT = 3000000;
const USDValue = (number: number) => {
    return ethers.utils.parseUnits(number.toString(), 8);
};

const WETH_ADDRESS = "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6";
const USDC_ADDRESS = "0xCD5ce2Db0C92686820ec5Ce1c6294628dFeF38Cc";

async function main() {
    //We're going to fork our mainnet environment and
    //set it up for a test scenario
    const [deployer] = await ethers.getSigners();
    const weth = "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6";

    const wethPoolAddress = "0x63936d0aE6e714fb13525EFBe95a46dBef857C9F";
    const usdcPoolAddress = "0xb7c6314b5ecb699B05Be0fC2e1cDC6429E2CF066";

    const treasuryAddress = "0xf150b381a0eecc51f41014e488b1886e090f9a04";
    const managerAddress = "0xe5dB5477F7787862116ff92E7d33A244A4ca35E0";

    const WETH_ORACLE_ADDRESS = "0xd1C66661937AF59237dd6c3556996e6fd95A2FAd";
    const USDC_ORACLE_ADDRESS = "0xdEf7F35d62E0bcF3ADA982acB79629e7E5997c35";

    const MAX_TOTAL_VALUE = USDValue(48000000);
    const USER_LIMIT_WETH = 5500;
    const USER_LIMIT_USDC = 1000000;

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

    const testTokenArtifact = artifacts.require("TestnetToken");
    const defi = artifacts.require("DefiRound");

    const usdc = (await ethers.getContractAt(testTokenArtifact.abi, USDC_ADDRESS)) as unknown as TestnetToken;

    // const defiContract = (await ethers.getContractAt(
    //   defi.abi,
    //   "0x3F350938420F78A2C8dF47c72f97a10Fd1cB55DB"
    // )) as unknown as DefiRound;

    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(1000000, usdc, defiContract, deployer);
    await doUsdcDeposit(950, usdc, defiContract, deployer);
    await doUsdcDeposit(1, usdc, defiContract, deployer);
    await doUsdcDeposit(1, usdc, defiContract, deployer);
    await doUsdcDeposit(1, usdc, defiContract, deployer);
    await doUsdcDeposit(1.7, usdc, defiContract, deployer);
    await doUsdcDeposit(846373, usdc, defiContract, deployer);
    await doUsdcDeposit(83457.33, usdc, defiContract, deployer);
    await doUsdcDeposit(1111.44, usdc, defiContract, deployer);
    await doUsdcDeposit(503845.01, usdc, defiContract, deployer);
    await doUsdcDeposit(40285.41, usdc, defiContract, deployer);
    await doUsdcDeposit(485711.41, usdc, defiContract, deployer);
    await doUsdcDeposit(100210.6, usdc, defiContract, deployer);
    await doUsdcDeposit(100210.6, usdc, defiContract, deployer);

    await doEthDeposit(0.12312, defiContract, true, deployer);
    await doEthDeposit(0.01212, defiContract, true, deployer);
    await doEthDeposit(0.093735, defiContract, true, deployer);
    await doEthDeposit(0.05483, defiContract, true, deployer);
    await doEthDeposit(0.05483, defiContract, true, deployer);

    console.log(chalk.greenBright(`Deposits complete`));

    const chainlinkAggregatorV3 = artifacts.require(
        "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol"
    );
    const ethOracle = (await ethers.getContractAt(
        chainlinkAggregatorV3.abi,
        WETH_ORACLE_ADDRESS
    )) as unknown as TestOracle;
    const usdcOracle = (await ethers.getContractAt(
        chainlinkAggregatorV3.abi,
        USDC_ORACLE_ADDRESS
    )) as unknown as TestOracle;

    const ethRoundData = await ethOracle.latestRoundData();
    const usdcRoundData = await usdcOracle.latestRoundData();

    const totalValueLocked = Number(ethers.utils.formatUnits(await defiContract.totalValue(), 8));

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
            {
                token: WETH_ADDRESS,
                numerator: increaseBNPrecision(ethRate.numerator, 18),
                denominator: increaseBNPrecision(ethRate.demoninator, 18),
            },
            {
                token: USDC_ADDRESS,
                numerator: increaseBNPrecision(usdcRate.numerator, 6),
                denominator: increaseBNPrecision(usdcRate.demoninator, 18),
            },
        ],
        {
            overNumerator: BN.from(overSubRate.top),
            overDenominator: BN.from(overSubRate.bottom),
        },
        2
    );

    console.log(chalk.greenBright(`Last look Initiated`));

    console.log("Waiting 90s for blocks to pass");
    await new Promise((r) => setTimeout(r, 90000));

    console.log(chalk.greenBright(`Last look Complete`));

    const tx = await defiContract.connect(deployer).transferToTreasury();
    await tx.wait();

    console.log(chalk.greenBright(`Treasury Transfer Complete`));

    const manager = artifacts.require("Manager");
    const managerContract = (await ethers.getContractAt(manager.abi, managerAddress)) as unknown as Manager;

    const x = await managerContract.connect(deployer).completeRollover("X");
    await x.wait();

    console.log(chalk.greenBright(`New Cycle`));
}

const genWallet = async () => {
    const mnemonic = await bip39.generateMnemonic();
    const path = "m/44'/60'/0'/0/0";
    const hdwallet = hdkey.fromMasterSeed(await bip39.mnemonicToSeed(mnemonic));
    const wallet = hdwallet.derivePath(path).getWallet();
    const p = `0x${wallet.getAddress().toString("hex")}`;
    const prvt = `0x${wallet.getPrivateKey().toString("hex")}`;

    return {public: p, private: prvt, mnemonic};
};

const WETHAmount = (number: number) => {
    return ethers.utils.parseUnits(number.toString(), 18);
};
const WETHDeposit = (number: number) => {
    return {token: WETH_ADDRESS, amount: WETHAmount(number)};
};
const USDCDeposit = (number: number) => {
    return {token: USDC_ADDRESS, amount: USDCAmount(number)};
};
const USDCAmount = (number: number) => {
    return ethers.utils.parseUnits(number.toString(), 6);
};

const doEthDeposit = async (
    deposit: number,
    defiContract: DefiRound,
    writeOut: boolean,
    deployer: SignerWithAddress
) => {
    const wallet = await genWallet();

    const send = await deployer.sendTransaction({
        to: wallet.public,
        value: ethers.utils.parseEther((deposit + 0.05).toString()),
    });
    await send.wait();

    const user = new ethers.Wallet(wallet.private, provider);
    const sub = await defiContract.connect(user).deposit(WETHDeposit(deposit), [], {value: WETHAmount(deposit)});
    await sub.wait();

    if (writeOut) {
        console.log(chalk.green("\r\n============================================================="));
        console.log(chalk.green(`Mnemonic: ${wallet.mnemonic}`));
        console.log(chalk.green(`Public Address: ${wallet.public}`));
        console.log(chalk.green(`Private: ${wallet.private}`));
        console.log(chalk.green(`ETH: ${deposit}`));
        console.log(chalk.green("=============================================================\r\n"));
    }
};

const doUsdcDeposit = async (
    deposit: number,
    usdc: TestnetToken,
    defiContract: DefiRound,
    deployer: SignerWithAddress
) => {
    const wallet = await genWallet();

    const send = await deployer.sendTransaction({
        to: wallet.public,
        value: ethers.utils.parseEther(".01"),
    });
    await send.wait();

    const mintTo = await usdc
        .connect(deployer)
        .mint(wallet.public, ethers.utils.parseUnits((deposit * 1.1).toFixed(6).toString(), "6"));
    await mintTo.wait();

    const user = new ethers.Wallet(wallet.private, provider);

    const ap = await usdc.connect(user).approve(defiContract.address, USDCAmount(deposit));
    await ap.wait();

    const sub = await defiContract.connect(user).deposit(USDCDeposit(deposit), []);
    await sub.wait();

    console.log(chalk.green("\r\n============================================================="));
    console.log(chalk.green(`Mnemonic: ${wallet.mnemonic}`));
    console.log(chalk.green(`Public Address: ${wallet.public}`));
    console.log(chalk.green(`Private: ${wallet.private}`));
    console.log(chalk.green(`USDC: ${deposit}`));
    console.log(chalk.green("=============================================================\r\n"));
};

const round = (value: number, decimals: number) => {
    return Number(Math.round((value + "e" + decimals) as unknown as number) + "e-" + decimals);
};

const calculateTokeRate = (numerator: number, tokePrice: number) => {
    const toke = decimalToFraction(tokePrice);
    const assetPrice = decimalToFraction(numerator);
    return {
        numerator: BN.from(assetPrice.bottom.toString()).mul(BN.from(toke.top.toString())),
        demoninator: BN.from(assetPrice.top.toString()).mul(BN.from(toke.bottom.toString())),
    };
};

const increaseBNPrecision = (bn: BigNumber, precision: number) => {
    return bn.mul(BN.from("10").pow(precision));
};

const gcd = (a: number, b: number): number => {
    return b ? gcd(b, a % b) : a;
};

const decimalToFraction = (_decimal: string | number) => {
    if (_decimal == parseInt(_decimal as string)) {
        return {
            top: parseInt(_decimal as string),
            bottom: 1,
            display: parseInt(_decimal as string) + "/" + 1,
        };
    } else {
        let top = (_decimal.toString().includes(".") ? _decimal.toString().replace(/\d+[.]/, "") : 0) as number;
        const bottom = Math.pow(10, top.toString().replace("-", "").length);
        if (_decimal >= 1) {
            top = +top + Math.floor(_decimal as number) * bottom;
        } else if (_decimal <= -1) {
            top = +top + Math.ceil(_decimal as number) * bottom;
        }

        const x = Math.abs(gcd(top, bottom));
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
