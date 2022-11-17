const {artifacts, ethers} = require("hardhat");
const BN = ethers.BigNumber;
const dotenv = require("dotenv");
dotenv.config();

const MIN_TOKE_PRICE = 2;
const MAX_TOKE_PRICE = 8;
let TOKE_AMOUNT = 3000000;
const LAST_LOOK_DURATION = process.env.DEFI_DEPLOY_LAST_LOOK_DURATION;

const COMMIT = true;

async function main() {
    const Defi = artifacts.require("DefiRound");

    const defiContract = await ethers.getContractAt(Defi.abi, process.env.DEFI_CONFIG_DEFI_CONTRACT);
    const [deployer] = await ethers.getSigners();

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
    console.log(`Last Look Duration: ${LAST_LOOK_DURATION}`);

    if (COMMIT) {
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
            LAST_LOOK_DURATION
        );
    }
}

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
