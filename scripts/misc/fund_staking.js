const {ethers, artifacts, network} = require("hardhat");
const chalk = require("chalk");

const MAX_UINT = ethers.constants.MaxUint256;
const TOKE_WHALE = "0x8b4334d4812c530574bd4f2763fcd22de94a969b";
const TOKE_ADDR = "0x2e9d63788249371f1DFC918a52f8d799F4a38C94";
const STAKING_ADDR = "0x96F98Ed74639689C3A11daf38ef86E59F43417D3";

const stakingArtifact = artifacts.require("Staking");
const erc20Artifact = artifacts.require("ERC20");

// Change below line 14 - 27
const schedule = {
    cliff: 3,
    duration: 3,
    interval: 3,
    setup: true,
    isActive: true,
    hardStart: 3,
    isPublic: false,
};
const fundingArray = [
    ["0x77c95514508e1f1e40fce470c61145d0a78255cf", 10],
    ["0xbc444edd482ef6842f2f15bbfa7693cd81b24f9d", 15],
];

function amountDecimals(decimals, value) {
    return ethers.utils.parseUnits(value.toString(), decimals);
}

async function fund(test) {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer: ${chalk.yellowBright(deployer.address)}`);

    let tokeToken = await ethers.getContractAt(erc20Artifact.abi, TOKE_ADDR);
    let staking = await ethers.getContractAt(stakingArtifact.abi, STAKING_ADDR);
    console.log(`Staking: ${chalk.magentaBright(staking.address)}`);
    console.log(`Toke: ${chalk.magentaBright(tokeToken.address)}`);

    const decimals = await tokeToken.decimals();
    console.log(`Decimals: ${chalk.blueBright(decimals)}`);

    if (test) {
        const paused = await staking.paused();
        if (paused) {
            await staking.unpause();
        }

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [TOKE_WHALE],
        });
        const tokeWhale = await ethers.getSigner(TOKE_WHALE);
        tokeToken.connect(tokeWhale).transfer(deployer.address, amountDecimals(decimals, 1000));
    }

    await staking.connect(deployer).addSchedule(schedule);
    const schedules = await staking.connect(deployer).getSchedules();

    // console.log(schedules);

    let index;
    for (let i = 0; i < schedules.length; i++) {
        if (schedules[i].schedule.interval.toNumber() === schedule.interval) {
            index = i;
            break;
        }
    }
    console.log(`Index is: ${chalk.greenBright(index)}`);

    await tokeToken.connect(deployer).approve(staking.address, MAX_UINT);

    for (let i = 0; i < fundingArray.length; i++) {
        let address = fundingArray[i][0];
        let amount = fundingArray[i][1];
        await staking.connect(deployer).depositFor(address, amountDecimals(decimals, amount), index);

        console.log(`Address should be: ${chalk.yellowBright(address)}`);
        console.log(`Initial amount should be: ${chalk.redBright(amount)}`);
        console.log(`Index should be: ${chalk.magentaBright(index)}`);
        console.log(
            `Staking information for ${chalk.yellowBright(address)}: ${chalk.greenBright(
                await staking.getStakes(address)
            )}`
        );
    }
}

fund(true); // TODO: Change for deploy
