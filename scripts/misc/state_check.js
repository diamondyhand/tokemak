const {upgrades, ethers} = require("hardhat");
const {getContractFactory} = ethers;

const LINK = "0x514910771af9ca656af840dff83e8264ecf986ca";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

const DeployerAddress = "0x9e0bcE7ec474B481492610eB9dd5D69EB03718D5";
const TOKEAddress = "0x2e9d63788249371f1DFC918a52f8d799F4a38C94";
const DefiAddress = "0xc803737D3E12CC4034Dde0B2457684322100Ac38";
const ManagerAddress = "0xA86e412109f77c45a3BC1c5870b880492Fb86A14";
const WETHPoolAddress = "0xD3D13a578a53685B4ac36A1Bab31912D2B2A2F36";
const USDCPoolAddress = "0x04bDA0CF6Ad025948Af830E75228ED420b0e860d";
const CoordinatorAddress = "0x90b6C61B102eA260131aB48377E143D6EB3A9d4B";
const TreasuryAddress = "0x8b4334d4812C530574Bd4F2763FcD22dE94A969B";

async function main() {
    const managerContract = await ethers.getContractAt("Manager", ManagerAddress);
    const defiContract = await ethers.getContractAt("DefiRound", DefiAddress);
    const tokeContract = await ethers.getContractAt("Toke", TOKEAddress);

    const defaultAdminId = await managerContract.DEFAULT_ADMIN_ROLE();
    const adminId = await managerContract.ADMIN_ROLE();
    const rolloverId = await managerContract.ROLLOVER_ROLE();
    const midCycleId = await managerContract.MID_CYCLE_ROLE();
    const hasDefaultAdminRole = await managerContract.hasRole(defaultAdminId, DeployerAddress);
    const hasAdminRole = await managerContract.hasRole(adminId, DeployerAddress);
    const hasRolloverRole = await managerContract.hasRole(rolloverId, DeployerAddress);
    const hasCycleRole = await managerContract.hasRole(midCycleId, DeployerAddress);

    const defiOwner = await defiContract.owner();
    const tokeOwner = await tokeContract.owner();

    console.log(`Default Admin Id: ${defaultAdminId}, ${hasDefaultAdminRole}`);
    console.log(`Admin Id: ${adminId}, ${hasAdminRole}`);
    console.log(`Rollover Id: ${rolloverId}, ${hasRolloverRole}`);
    console.log(`Mid Cycle Id: ${midCycleId}, ${hasCycleRole}`);
    console.log(`Defi Owner: ${defiOwner}`);
    console.log(`Toke Owner: ${tokeOwner}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
