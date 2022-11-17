import {ethers, artifacts} from "hardhat";
import {constants, Wallet} from "ethers";
import * as multicall from "ethcall";
import chalk from "chalk";
import fs from "fs/promises";

type WithdrawalInfo = {
    minCycle: number;
    amount: number;
};

const ZERO_ADDRESS = constants.AddressZero;
const TOKE_POOL = "0xa760e26aA76747020171fCF8BdA108dFdE8Eb930";

const QUERY_FILTER_CHUNK = 10000;
const CHUNK = 50;
const MULTICALL_CHUNK = 500;

const votePoolArtifact = artifacts.require("TokeVotePool");

async function main(startingBlock = 0): Promise<void> {
    const [signer] = await ethers.getSigners();
    const tokeVotePool = await ethers.getContractAt("TokeVotePool", TOKE_POOL);

    const multicallProvider = new multicall.Provider();
    await multicallProvider.init(ethers.provider);
    const multicallTokeVotePool = new multicall.Contract(TOKE_POOL, votePoolArtifact.abi);

    let startingBlockNumber: number = startingBlock; // Starting block number for deposit address query
    let nextQueryFilterStopBlock: number; // Block that query will stop at
    const currentBlockNumber = await ethers.provider.getBlockNumber(); // Most recent Ethereum block

    // Using TransferOwnership to find starting block
    if (startingBlock === 0) {
        const ownershipTransferEventFilter = tokeVotePool.filters.OwnershipTransferred(ZERO_ADDRESS);
        const ownershipTransferEventArray = await tokeVotePool.queryFilter(ownershipTransferEventFilter);
        startingBlockNumber = ownershipTransferEventArray[0].blockNumber;
    }
    nextQueryFilterStopBlock = startingBlockNumber + QUERY_FILTER_CHUNK;

    const depositEventFilter = tokeVotePool.filters.Transfer();
    const depositAddressSet: Set<string> = new Set(); // All addresses that have deposited into TokePool

    // Create set of all users that have sent or received tToke
    while (startingBlockNumber < currentBlockNumber) {
        console.log(
            `Querying blocks ${chalk.blueBright(startingBlockNumber)} through ${chalk.blueBright(
                nextQueryFilterStopBlock
            )}`
        );
        const depositQueryArray = await tokeVotePool.queryFilter(
            depositEventFilter,
            startingBlockNumber,
            nextQueryFilterStopBlock
        );

        for (let i = 0; i < depositQueryArray.length; i++) {
            const addressTo = depositQueryArray[i].args.to;
            const addressFrom = depositQueryArray[i].args.from;
            depositAddressSet.add(addressTo);
            depositAddressSet.add(addressFrom);
        }

        startingBlockNumber = nextQueryFilterStopBlock;
        nextQueryFilterStopBlock = startingBlockNumber + QUERY_FILTER_CHUNK;

        if (nextQueryFilterStopBlock > currentBlockNumber) {
            nextQueryFilterStopBlock = currentBlockNumber;
        }
    }

    const withdrawalRequestArray: string[] = []; // All current withdrawalRequests
    let index = 0;
    const depositArrLength = depositAddressSet.size;
    let nextStopIndex = depositArrLength > MULTICALL_CHUNK ? MULTICALL_CHUNK : depositArrLength;

    // Create array of users with current withdrawalRequests
    while (index < depositArrLength) {
        console.log(
            `Executing multicall for index ${chalk.greenBright(index)} through ${chalk.greenBright(
                nextStopIndex
            )} out of ${chalk.cyanBright(depositArrLength)}`
        );

        const depositAddressArray = [...depositAddressSet];
        const multicallArray = depositAddressArray.slice(index, nextStopIndex);
        const requests = multicallArray.map((address) => multicallTokeVotePool.requestedWithdrawals(address));
        const responses: WithdrawalInfo[] = await multicallProvider.all(requests);

        for (let i = 0; i < responses.length; i++) {
            if (responses[i].amount > 0) {
                withdrawalRequestArray.push(multicallArray[i]);
            }
        }
        index = nextStopIndex;
        nextStopIndex = index + CHUNK;
    }
    console.log(chalk.yellowBright("Multicall complete"));

    const withdrawalRequestUpdatedEventFilter = tokeVotePool.filters.BalanceEventUpdated();
    const withdrawalRequestUpdatedArray = await tokeVotePool.queryFilter(withdrawalRequestUpdatedEventFilter);

    const withdrawalRequestArrayWithoutUpdatedEvents: string[] = [];
    const balanceUpdatedEventAddresses: string[] = []; // Addresses that have already been updated

    // Create full array of already updated addresses
    for (let i = 0; i < withdrawalRequestUpdatedArray.length; i++) {
        const addressesArray = withdrawalRequestUpdatedArray[i].args.addresses;

        addressesArray.forEach((x) => {
            balanceUpdatedEventAddresses.push(x);
        });
    }

    // Check withdrawal requests against balance updated addresses, push to new array
    for (let i = 0; i < withdrawalRequestArray.length; i++) {
        const addressFromArr = withdrawalRequestArray[i];
        if (balanceUpdatedEventAddresses.indexOf(addressFromArr) === -1) {
            withdrawalRequestArrayWithoutUpdatedEvents.push(addressFromArr);
        }
    }

    index = 0;
    const requestArrayLength = withdrawalRequestArrayWithoutUpdatedEvents.length;
    nextStopIndex = requestArrayLength > CHUNK ? CHUNK : requestArrayLength;

    // Update balance events for users that have not been updated yet
    while (index < requestArrayLength) {
        console.log(
            `Transacting for addresses indexed ${chalk.blueBright(index)} through ${chalk.blueBright(nextStopIndex)}`
        );

        await tokeVotePool
            .connect(signer)
            .triggerBalanceUpdateEvent(withdrawalRequestArrayWithoutUpdatedEvents.slice(index, nextStopIndex));
        index = nextStopIndex;
        nextStopIndex = index + CHUNK;
    }
    console.log("Done");
}

main(12973136);
