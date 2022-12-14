/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IVoteTracker, IVoteTrackerInterface } from "../IVoteTracker";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "contractAddress",
        type: "address",
      },
    ],
    name: "BalanceTrackerAddressSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "isDelegator",
        type: "bool",
      },
    ],
    name: "DelegatorUpdate",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "voteEveryBlockLimit",
        type: "uint256",
      },
    ],
    name: "ProxyRateLimitSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address[]",
        name: "accounts",
        type: "address[]",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "allowed",
        type: "bool",
      },
    ],
    name: "ProxySubmitterSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32[]",
        name: "allValidKeys",
        type: "bytes32[]",
      },
    ],
    name: "ReactorKeysSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "chainId",
        type: "uint256",
      },
    ],
    name: "SigningChainIdSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "UserAggregationUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        components: [
          {
            components: [
              {
                internalType: "uint256",
                name: "totalUsedVotes",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "totalAvailableVotes",
                type: "uint256",
              },
            ],
            internalType: "struct IVoteTracker.UserVoteDetails",
            name: "details",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "bytes32",
                name: "reactorKey",
                type: "bytes32",
              },
              {
                internalType: "uint256",
                name: "amount",
                type: "uint256",
              },
            ],
            internalType: "struct UserVoteAllocationItem[]",
            name: "votes",
            type: "tuple[]",
          },
        ],
        indexed: false,
        internalType: "struct IVoteTracker.UserVotes",
        name: "votes",
        type: "tuple",
      },
    ],
    name: "UserVoted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "token",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "multiplier",
            type: "uint256",
          },
        ],
        indexed: false,
        internalType: "struct IVoteTracker.VoteTokenMultipler[]",
        name: "multipliers",
        type: "tuple[]",
      },
    ],
    name: "VoteMultipliersSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32",
        name: "newKey",
        type: "bytes32",
      },
      {
        components: [
          {
            components: [
              {
                internalType: "bytes32",
                name: "voteSessionKey",
                type: "bytes32",
              },
              {
                internalType: "uint256",
                name: "totalVotes",
                type: "uint256",
              },
            ],
            internalType: "struct IVoteTracker.SystemVoteDetails",
            name: "details",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "address",
                name: "token",
                type: "address",
              },
              {
                internalType: "bytes32",
                name: "reactorKey",
                type: "bytes32",
              },
              {
                internalType: "uint256",
                name: "totalVotes",
                type: "uint256",
              },
            ],
            internalType: "struct IVoteTracker.SystemAllocation[]",
            name: "votes",
            type: "tuple[]",
          },
        ],
        indexed: false,
        internalType: "struct IVoteTracker.SystemVotes",
        name: "votesAtRollover",
        type: "tuple",
      },
    ],
    name: "VoteSessionRollover",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        components: [
          {
            components: [
              {
                internalType: "uint256",
                name: "totalUsedVotes",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "totalAvailableVotes",
                type: "uint256",
              },
            ],
            internalType: "struct IVoteTracker.UserVoteDetails",
            name: "details",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "bytes32",
                name: "reactorKey",
                type: "bytes32",
              },
              {
                internalType: "uint256",
                name: "amount",
                type: "uint256",
              },
            ],
            internalType: "struct UserVoteAllocationItem[]",
            name: "votes",
            type: "tuple[]",
          },
        ],
        indexed: false,
        internalType: "struct IVoteTracker.UserVotes",
        name: "postApplicationVotes",
        type: "tuple",
      },
    ],
    name: "WithdrawalRequestApplied",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "getMaxVoteBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getReactorKeys",
    outputs: [
      {
        internalType: "bytes32[]",
        name: "reactorKeys",
        type: "bytes32[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSettings",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "balanceTrackerAddress",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "voteEveryBlockLimit",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "lastProcessedEventId",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "voteSessionKey",
            type: "bytes32",
          },
        ],
        internalType: "struct IVoteTracker.VoteTrackSettings",
        name: "settings",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSystemVotes",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "bytes32",
                name: "voteSessionKey",
                type: "bytes32",
              },
              {
                internalType: "uint256",
                name: "totalVotes",
                type: "uint256",
              },
            ],
            internalType: "struct IVoteTracker.SystemVoteDetails",
            name: "details",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "address",
                name: "token",
                type: "address",
              },
              {
                internalType: "bytes32",
                name: "reactorKey",
                type: "bytes32",
              },
              {
                internalType: "uint256",
                name: "totalVotes",
                type: "uint256",
              },
            ],
            internalType: "struct IVoteTracker.SystemAllocation[]",
            name: "votes",
            type: "tuple[]",
          },
        ],
        internalType: "struct IVoteTracker.SystemVotes",
        name: "systemVotes",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "getUserVotes",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "uint256",
                name: "totalUsedVotes",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "totalAvailableVotes",
                type: "uint256",
              },
            ],
            internalType: "struct IVoteTracker.UserVoteDetails",
            name: "details",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "bytes32",
                name: "reactorKey",
                type: "bytes32",
              },
              {
                internalType: "uint256",
                name: "amount",
                type: "uint256",
              },
            ],
            internalType: "struct UserVoteAllocationItem[]",
            name: "votes",
            type: "tuple[]",
          },
        ],
        internalType: "struct IVoteTracker.UserVotes",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "token",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        internalType: "struct TokenBalance[]",
        name: "balances",
        type: "tuple[]",
      },
    ],
    name: "getVotingPower",
    outputs: [
      {
        internalType: "uint256",
        name: "votes",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getVotingTokens",
    outputs: [
      {
        internalType: "address[]",
        name: "tokens",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "lastUserProxyVoteBlock",
    outputs: [
      {
        internalType: "uint256",
        name: "blockNumber",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "eventType",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "onEventReceive",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "proxySubmitters",
    outputs: [
      {
        internalType: "bool",
        name: "allowed",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "contractAddress",
        type: "address",
      },
    ],
    name: "setBalanceTrackerAddress",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "voteEveryBlockLimit",
        type: "uint256",
      },
    ],
    name: "setProxyRateLimit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "submitters",
        type: "address[]",
      },
      {
        internalType: "bool",
        name: "allowed",
        type: "bool",
      },
    ],
    name: "setProxySubmitters",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "token",
            type: "address",
          },
          {
            internalType: "bytes32",
            name: "key",
            type: "bytes32",
          },
        ],
        internalType: "struct IVoteTracker.VotingLocation[]",
        name: "reactorKeys",
        type: "tuple[]",
      },
      {
        internalType: "bool",
        name: "allowed",
        type: "bool",
      },
    ],
    name: "setReactorKeys",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "token",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "multiplier",
            type: "uint256",
          },
        ],
        internalType: "struct IVoteTracker.VoteTokenMultipler[]",
        name: "multipliers",
        type: "tuple[]",
      },
    ],
    name: "setVoteMultiplers",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "accounts",
        type: "address[]",
      },
    ],
    name: "updateUserVoteTotals",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "userNonces",
    outputs: [
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "account",
            type: "address",
          },
          {
            internalType: "bytes32",
            name: "voteSessionKey",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "nonce",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "chainId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalVotes",
            type: "uint256",
          },
          {
            components: [
              {
                internalType: "bytes32",
                name: "reactorKey",
                type: "bytes32",
              },
              {
                internalType: "uint256",
                name: "amount",
                type: "uint256",
              },
            ],
            internalType: "struct UserVoteAllocationItem[]",
            name: "allocations",
            type: "tuple[]",
          },
        ],
        internalType: "struct UserVotePayload",
        name: "userVotePayload",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "enum SignatureType",
            name: "signatureType",
            type: "uint8",
          },
          {
            internalType: "uint8",
            name: "v",
            type: "uint8",
          },
          {
            internalType: "bytes32",
            name: "r",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "s",
            type: "bytes32",
          },
        ],
        internalType: "struct IVoteTracker.Signature",
        name: "signature",
        type: "tuple",
      },
    ],
    name: "vote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "account",
            type: "address",
          },
          {
            internalType: "bytes32",
            name: "voteSessionKey",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "nonce",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "chainId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalVotes",
            type: "uint256",
          },
          {
            components: [
              {
                internalType: "bytes32",
                name: "reactorKey",
                type: "bytes32",
              },
              {
                internalType: "uint256",
                name: "amount",
                type: "uint256",
              },
            ],
            internalType: "struct UserVoteAllocationItem[]",
            name: "allocations",
            type: "tuple[]",
          },
        ],
        internalType: "struct UserVotePayload",
        name: "userVotePayload",
        type: "tuple",
      },
    ],
    name: "voteDirect",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class IVoteTracker__factory {
  static readonly abi = _abi;
  static createInterface(): IVoteTrackerInterface {
    return new utils.Interface(_abi) as IVoteTrackerInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IVoteTracker {
    return new Contract(address, _abi, signerOrProvider) as IVoteTracker;
  }
}
