// import {artifacts, ethers} from "hardhat";
// import chalk from "chalk";
// import {BalanceTracker, VoteTracker} from "../../typechain";
// import {createObjectCsvWriter} from "csv-writer";
// import fs from "fs/promises";
// import {TypedEvent} from "../../typechain/common";
// import {BigNumber} from "ethers";

// const artifact = artifacts.require("VoteTracker");
// const abi = artifact.abi;

// const run = async () => {
//   const VOTE_CONTRACT = "0x63368f34B84C697d9f629F33B5CAdc22cb00510E";
//   const BALANCE_CONTRACT = "0xBC822318284aD00cDc0aD7610d510C20431e8309";

//   const voteTrackerArtifact = artifacts.require("VoteTracker");
//   const balanceTrackerArtifact = artifacts.require("BalanceTracker");
//   const VOTE_START_BLOCK = 21177900;
//   const VOTE_END_BLOCK = 21449733;
//   const USER = "0xddA42f12B8B2ccc6717c053A2b772baD24B08CbD";

//   //General approach
//   //1. Find all events where the user voted, save the data
//   //2. Find all events where the users balances were updated, save the tx hash
//   //3. Get the maxVotingPower at the blocks where balances were updated so we can mock it
//   //4. Output the order balances -> voting events so we can replay what happened

//   const voteContract = (await ethers.getContractAt(
//     voteTrackerArtifact.abi,
//     VOTE_CONTRACT
//   )) as unknown as VoteTracker;

//   const balanceTracker = (await ethers.getContractAt(
//     balanceTrackerArtifact.abi,
//     BALANCE_CONTRACT
//   )) as unknown as BalanceTracker;

//   const filter = voteContract.filters.UserVoted();

//   const voteTransactions: TypedEvent<
//     [
//       string,
//       [
//         string,
//         string,
//         BigNumber,
//         BigNumber,
//         BigNumber,
//         ([string, BigNumber] & {reactorKey: string; amount: BigNumber})[]
//       ] & {
//         account: string;
//         voteSessionKey: string;
//         nonce: BigNumber;
//         chainId: BigNumber;
//         totalVotes: BigNumber;
//         allocations: ([string, BigNumber] & {
//           reactorKey: string;
//           amount: BigNumber;
//         })[];
//       }
//     ] & {
//       account: string;
//       votes: [
//         string,
//         string,
//         BigNumber,
//         BigNumber,
//         BigNumber,
//         ([string, BigNumber] & {reactorKey: string; amount: BigNumber})[]
//       ] & {
//         account: string;
//         voteSessionKey: string;
//         nonce: BigNumber;
//         chainId: BigNumber;
//         totalVotes: BigNumber;
//         allocations: ([string, BigNumber] & {
//           reactorKey: string;
//           amount: BigNumber;
//         })[];
//       };
//     }
//   >[] = [];

//   //Pull all events to know the set of users we're working with
//   let startBlock = VOTE_START_BLOCK;
//   const blockJump = 2000;
//   let endBlock = 0;

//   do {
//     let tries = 0;

//     while (tries < 5) {
//       try {
//         endBlock = Math.min(VOTE_END_BLOCK, startBlock + blockJump);
//         const e = await voteContract.queryFilter(filter, startBlock, endBlock);

//         voteTransactions.push(
//           ...e.filter((x) => x.args.account.toLowerCase() == USER.toLowerCase())
//         );
//         startBlock = endBlock + 1;
//         console.log(`Events ${voteTransactions.length}`);

//         break;
//       } catch {
//         tries++;
//         await new Promise((resolve) => setTimeout(resolve, 1000 * tries));
//       }
//     }
//   } while (endBlock < VOTE_END_BLOCK);

//   const balanceUpdateTransactions: string[] = [];
//   const balanceFilter = balanceTracker.filters.BalanceUpdate();

//   //Pull all events to know the set of users we're working with
//   startBlock = VOTE_START_BLOCK;
//   endBlock = 0;

//   do {
//     let tries = 0;

//     while (tries < 5) {
//       try {
//         endBlock = Math.min(VOTE_END_BLOCK, startBlock + blockJump);
//         const e = await balanceTracker.queryFilter(
//           balanceFilter,
//           startBlock,
//           endBlock
//         );

//         balanceUpdateTransactions.push(
//           ...e
//             .filter((x) => x.args.account.toLowerCase() == USER.toLowerCase())
//             .map((x) => x.transactionHash)
//         );
//         startBlock = endBlock + 1;
//         console.log(`Balance Events ${balanceUpdateTransactions.length}`);

//         break;
//       } catch {
//         tries++;
//         await new Promise((resolve) => setTimeout(resolve, 1000 * tries));
//       }
//     }
//   } while (endBlock < VOTE_END_BLOCK);

//   await new Promise((resolve) => setTimeout(resolve, 5000));

//   const votingPowerAtBlock: Record<number, BigNumber> = {};

//   for (let x = 0; x < balanceUpdateTransactions.length; x++) {
//     const txHash = balanceUpdateTransactions[x];
//     const tx = await ethers.provider.getTransaction(txHash);
//     const blockNumber = tx.blockNumber!;
//     const votingPower = await voteContract.getMaxVoteBalance(USER, {
//       blockTag: blockNumber,
//     });
//     votingPowerAtBlock[blockNumber] = votingPower;
//     console.log(
//       `Voting Power At Block:${blockNumber}: ${votingPower.toString()}`
//     );
//     await new Promise((resolve) => setTimeout(resolve, 2000));
//   }

//   voteTransactions.forEach((x) => {
//     console.log("===========================================");
//     console.log(`Vote At Block ${x.blockNumber}`);

//     const v: {
//       account: string;
//       voteSessionKey: string;
//       nonce: string;
//       chainId: string;
//       totalVotes: string;
//       allocations: {reactorKey: string; amount: string}[];
//     } = {} as any;

//     v.account = x.args.votes.account;
//     v.voteSessionKey = x.args.votes.voteSessionKey;
//     v.nonce = x.args.votes.nonce.toString();
//     v.chainId = x.args.votes.chainId.toString();
//     v.totalVotes = x.args.votes.totalVotes.toString();
//     v.allocations = x.args.votes.allocations.map((x) => {
//       return {
//         reactorKey: x.reactorKey,
//         amount: x.amount.toString(),
//       };
//     });

//     console.log(JSON.stringify(v));

//     console.log("===========================================");
//   });
// };

// run();
