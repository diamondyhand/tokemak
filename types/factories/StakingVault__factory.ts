/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { StakingVault, StakingVaultInterface } from "../StakingVault";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_stakingToken",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
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
    name: "Paused",
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
    name: "Unpaused",
    type: "event",
  },
  {
    inputs: [],
    name: "MAXIMUM_LOCK_PERIOD",
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
    name: "MINIMUM_LOCK_PERIOD",
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
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "claimRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "rewards",
        type: "uint256",
      },
    ],
    name: "compound",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "distributor",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "getClaimableRewards",
    outputs: [
      {
        internalType: "uint256",
        name: "reward",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "period",
        type: "uint256",
      },
    ],
    name: "increaseLock",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "period",
        type: "uint256",
      },
    ],
    name: "lock",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "period",
        type: "uint256",
      },
    ],
    name: "lockFor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "lockInfoList",
    outputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "period",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "startTime",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "updateTime",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "reward",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "reward",
        type: "uint256",
      },
    ],
    name: "notifyRewardAmount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "pause",
        type: "bool",
      },
    ],
    name: "setPause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_distributor",
        type: "address",
      },
    ],
    name: "setRewardDistributor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "stakingToken",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalLockedAmount",
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
    name: "totalRewards",
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
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "unLock",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60806040523480156200001157600080fd5b506040516200317d3803806200317d833981810160405281019062000037919062000216565b620000576200004b6200013360201b60201c565b6200013b60201b60201c565b60008060146101000a81548160ff02191690831515021790555060018081905550600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161415620000eb576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401620000e29062000269565b60405180910390fd5b80600560006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505062000339565b600033905090565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b60008151905062000210816200031f565b92915050565b6000602082840312156200022957600080fd5b60006200023984828501620001ff565b91505092915050565b600062000251602f836200028b565b91506200025e82620002d0565b604082019050919050565b60006020820190508181036000830152620002848162000242565b9050919050565b600082825260208201905092915050565b6000620002a982620002b0565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b7f5374616b696e675661756c743a2061646472657373206d757374206e6f74206260008201527f65207a65726f20616464726573732e0000000000000000000000000000000000602082015250565b6200032a816200029c565b81146200033657600080fd5b50565b612e3480620003496000396000f3fe608060405234801561001057600080fd5b50600436106101375760003560e01c80635e70a6dc116100b85780638da5cb5b1161007c5780638da5cb5b14610306578063a1809b9514610324578063bedb86fb14610340578063bfe109281461035c578063ef5cfb8c1461037a578063f2fde38b1461039657610137565b80635e70a6dc14610288578063715018a6146102a457806372f702f3146102ae5780637faf9057146102cc57806383e25f8a146102ea57610137565b806318fc0f90116100ff57806318fc0f90146101e457806321a4058914610200578063308e401e1461021e5780633c6b16ab1461024e5780635c975abb1461026a57610137565b806302d6aee11461013c57806305a9f2741461015857806309377bc9146101765780630e15561a146101aa5780631338736f146101c8575b600080fd5b61015660048036038101906101519190611e77565b6103b2565b005b610160610666565b60405161016d91906125fa565b60405180910390f35b610190600480360381019061018b9190611d71565b61066c565b6040516101a1959493929190612615565b60405180910390f35b6101b26106a2565b6040516101bf91906125fa565b60405180910390f35b6101e260048036038101906101dd9190611ec9565b6106a8565b005b6101fe60048036038101906101f99190611d9a565b6106b7565b005b610208610908565b60405161021591906125fa565b60405180910390f35b61023860048036038101906102339190611d71565b61090f565b60405161024591906125fa565b60405180910390f35b61026860048036038101906102639190611e77565b610976565b005b610272610b64565b60405161027f9190612322565b60405180910390f35b6102a2600480360381019061029d9190611ec9565b610b7a565b005b6102ac610eea565b005b6102b6610efe565b6040516102c3919061233d565b60405180910390f35b6102d4610f24565b6040516102e191906125fa565b60405180910390f35b61030460048036038101906102ff9190611dd6565b610f2c565b005b61030e610f44565b60405161031b919061227e565b60405180910390f35b61033e60048036038101906103399190611d71565b610f6d565b005b61035a60048036038101906103559190611e25565b610fb9565b005b610364610fe7565b604051610371919061227e565b60405180910390f35b610394600480360381019061038f9190611d71565b61100d565b005b6103b060048036038101906103ab9190611d71565b611193565b005b600260015414156103f8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016103ef906125ba565b60405180910390fd5b6002600181905550610408611217565b6000600660003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600001541161048d576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104849061253a565b60405180910390fd5b6000600660003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020905080600101548160020154426104e5919061277b565b1015610526576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161051d906123ba565b60405180910390fd5b806000015482111561056d576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610564906124da565b60405180910390fd5b61057633611261565b6000816004015490508060026000828254610591919061277b565b9250508190555082600360008282546105aa919061277b565b9250508190555060008260040181905550828260000160008282546105cf919061277b565b92505081905550600082600001541415610602576000826002018190555060008260030181905550600082600101819055505b61065a338285610612919061269a565b600560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166112fd9092919063ffffffff16565b50506001808190555050565b60035481565b60066020528060005260406000206000915090508060000154908060010154908060020154908060030154908060040154905085565b60025481565b6106b3338383611383565b5050565b6106bf611217565b6000600660003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000015411610744576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161073b9061253a565b60405180910390fd5b3373ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16146107b2576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016107a99061249a565b60405180910390fd5b6000600660008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020905080600101548160020154610809919061269a565b42111561084b576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016108429061247a565b60405180910390fd5b61085433611261565b806004015482111561089b576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016108929061255a565b60405180910390fd5b818160000160008282546108af919061269a565b9250508190555081600360008282546108c8919061269a565b9250508190555081600260008282546108e1919061277b565b92505081905550818160040160008282546108fc919061277b565b92505081905550505050565b62278d0081565b6000610919611217565b600660008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060040154610965836116c6565b61096f919061269a565b9050919050565b600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610a06576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016109fd9061257a565b60405180910390fd5b338180600560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663dd62ed3e84306040518363ffffffff1660e01b8152600401610a66929190612299565b60206040518083038186803b158015610a7e57600080fd5b505afa158015610a92573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610ab69190611ea0565b1015610af7576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610aee9061237a565b60405180910390fd5b610b46333085600560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1661175f909392919063ffffffff16565b8260026000828254610b58919061269a565b92505081905550505050565b60008060149054906101000a900460ff16905090565b60026001541415610bc0576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610bb7906125ba565b60405180910390fd5b6002600181905550610bd0611217565b6000600660003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000015411610c55576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610c4c9061253a565b60405180910390fd5b338280600560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663dd62ed3e84306040518363ffffffff1660e01b8152600401610cb5929190612299565b60206040518083038186803b158015610ccd57600080fd5b505afa158015610ce1573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610d059190611ea0565b1015610d46576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610d3d9061237a565b60405180910390fd5b6000600660003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000209050630784ce00816001015485610d9e919061269a565b1115610ddf576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610dd6906123da565b60405180910390fd5b80600101548160020154610df3919061269a565b421115610e35576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610e2c9061247a565b60405180910390fd5b610e3e33611261565b83816001016000828254610e52919061269a565b9250508190555084816000016000828254610e6d919061269a565b925050819055508460036000828254610e86919061269a565b92505081905550610edc333087600560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1661175f909392919063ffffffff16565b505050600180819055505050565b610ef26117e8565b610efc6000611866565b565b600560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b630784ce0081565b610f346117e8565b610f3f838383611383565b505050565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b610f756117e8565b80600460006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b610fc16117e8565b600115158115151415610fdb57610fd661192a565b610fe4565b610fe361198d565b5b50565b600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60026001541415611053576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161104a906125ba565b60405180910390fd5b6002600181905550611063611217565b3373ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16146110d1576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016110c89061249a565b60405180910390fd5b6110da33611261565b6000600660008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000209050600081600401549050600081111561118757600082600401819055506111868382600560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166112fd9092919063ffffffff16565b5b50506001808190555050565b61119b6117e8565b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16141561120b576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611202906123fa565b60405180910390fd5b61121481611866565b50565b61121f610b64565b1561125f576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016112569061243a565b60405180910390fd5b565b6000600660008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020905060006112af836116c6565b905060008111156112f857808260040160008282546112ce919061269a565b9250508190555080600260008282546112e7919061269a565b925050819055504282600301819055505b505050565b61137e8363a9059cbb60e01b848460405160240161131c9291906122f9565b604051602081830303815290604052907bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506119ef565b505050565b600260015414156113c9576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016113c0906125ba565b60405180910390fd5b60026001819055506113d9611217565b828280600560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663dd62ed3e84306040518363ffffffff1660e01b8152600401611439929190612299565b60206040518083038186803b15801561145157600080fd5b505afa158015611465573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906114899190611ea0565b10156114ca576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016114c19061237a565b60405180910390fd5b6000841161150d576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016115049061245a565b60405180910390fd5b6000600660003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000015414611592576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611589906125da565b60405180910390fd5b8262278d00111580156115a95750630784ce008311155b6115e8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016115df906124ba565b60405180910390fd5b6000600660008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002090508481600001819055508381600101819055504281600201819055504281600301819055508460036000828254611661919061269a565b925050819055506116b7863087600560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1661175f909392919063ffffffff16565b50505060018081905550505050565b600080600660008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000209050600081600301544261171c919061277b565b9050611726611ab6565b8260000154826117369190612721565b6117409190612721565b9250670de0b6b3a76400008361175691906126f0565b92505050919050565b6117e2846323b872dd60e01b858585604051602401611780939291906122c2565b604051602081830303815290604052907bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506119ef565b50505050565b6117f0611b01565b73ffffffffffffffffffffffffffffffffffffffff1661180e610f44565b73ffffffffffffffffffffffffffffffffffffffff1614611864576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161185b906124fa565b60405180910390fd5b565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b611932611217565b6001600060146101000a81548160ff0219169083151502179055507f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258611976611b01565b604051611983919061227e565b60405180910390a1565b611995611b09565b60008060146101000a81548160ff0219169083151502179055507f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa6119d8611b01565b6040516119e5919061227e565b60405180910390a1565b6000611a51826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c65648152508573ffffffffffffffffffffffffffffffffffffffff16611b529092919063ffffffff16565b9050600081511115611ab15780806020019051810190611a719190611e4e565b611ab0576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611aa79061259a565b60405180910390fd5b5b505050565b6000630784ce00600060035414611acf57600354611ad2565b60015b670de0b6b3a7640000600254611ae89190612721565b611af291906126f0565b611afc91906126f0565b905090565b600033905090565b611b11610b64565b611b50576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611b479061239a565b60405180910390fd5b565b6060611b618484600085611b6a565b90509392505050565b606082471015611baf576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611ba69061241a565b60405180910390fd5b611bb885611c7e565b611bf7576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611bee9061251a565b60405180910390fd5b6000808673ffffffffffffffffffffffffffffffffffffffff168587604051611c209190612267565b60006040518083038185875af1925050503d8060008114611c5d576040519150601f19603f3d011682016040523d82523d6000602084013e611c62565b606091505b5091509150611c72828286611ca1565b92505050949350505050565b6000808273ffffffffffffffffffffffffffffffffffffffff163b119050919050565b60608315611cb157829050611d01565b600083511115611cc45782518084602001fd5b816040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611cf89190612358565b60405180910390fd5b9392505050565b600081359050611d1781612db9565b92915050565b600081359050611d2c81612dd0565b92915050565b600081519050611d4181612dd0565b92915050565b600081359050611d5681612de7565b92915050565b600081519050611d6b81612de7565b92915050565b600060208284031215611d8357600080fd5b6000611d9184828501611d08565b91505092915050565b60008060408385031215611dad57600080fd5b6000611dbb85828601611d08565b9250506020611dcc85828601611d47565b9150509250929050565b600080600060608486031215611deb57600080fd5b6000611df986828701611d08565b9350506020611e0a86828701611d47565b9250506040611e1b86828701611d47565b9150509250925092565b600060208284031215611e3757600080fd5b6000611e4584828501611d1d565b91505092915050565b600060208284031215611e6057600080fd5b6000611e6e84828501611d32565b91505092915050565b600060208284031215611e8957600080fd5b6000611e9784828501611d47565b91505092915050565b600060208284031215611eb257600080fd5b6000611ec084828501611d5c565b91505092915050565b60008060408385031215611edc57600080fd5b6000611eea85828601611d47565b9250506020611efb85828601611d47565b9150509250929050565b611f0e816127af565b82525050565b611f1d816127c1565b82525050565b6000611f2e82612668565b611f38818561267e565b9350611f4881856020860161281b565b80840191505092915050565b611f5d816127f7565b82525050565b6000611f6e82612673565b611f788185612689565b9350611f8881856020860161281b565b611f91816128ac565b840191505092915050565b6000611fa9602283612689565b9150611fb4826128bd565b604082019050919050565b6000611fcc601483612689565b9150611fd78261290c565b602082019050919050565b6000611fef602f83612689565b9150611ffa82612935565b604082019050919050565b6000612012602483612689565b915061201d82612984565b604082019050919050565b6000612035602683612689565b9150612040826129d3565b604082019050919050565b6000612058602683612689565b915061206382612a22565b604082019050919050565b600061207b601083612689565b915061208682612a71565b602082019050919050565b600061209e601b83612689565b91506120a982612a9a565b602082019050919050565b60006120c1602a83612689565b91506120cc82612ac3565b604082019050919050565b60006120e4601d83612689565b91506120ef82612b12565b602082019050919050565b6000612107601b83612689565b915061211282612b3b565b602082019050919050565b600061212a602283612689565b915061213582612b64565b604082019050919050565b600061214d602083612689565b915061215882612bb3565b602082019050919050565b6000612170601d83612689565b915061217b82612bdc565b602082019050919050565b6000612193602683612689565b915061219e82612c05565b604082019050919050565b60006121b6602a83612689565b91506121c182612c54565b604082019050919050565b60006121d9602e83612689565b91506121e482612ca3565b604082019050919050565b60006121fc602a83612689565b915061220782612cf2565b604082019050919050565b600061221f601f83612689565b915061222a82612d41565b602082019050919050565b6000612242602983612689565b915061224d82612d6a565b604082019050919050565b612261816127ed565b82525050565b60006122738284611f23565b915081905092915050565b60006020820190506122936000830184611f05565b92915050565b60006040820190506122ae6000830185611f05565b6122bb6020830184611f05565b9392505050565b60006060820190506122d76000830186611f05565b6122e46020830185611f05565b6122f16040830184612258565b949350505050565b600060408201905061230e6000830185611f05565b61231b6020830184612258565b9392505050565b60006020820190506123376000830184611f14565b92915050565b60006020820190506123526000830184611f54565b92915050565b600060208201905081810360008301526123728184611f63565b905092915050565b6000602082019050818103600083015261239381611f9c565b9050919050565b600060208201905081810360008301526123b381611fbf565b9050919050565b600060208201905081810360008301526123d381611fe2565b9050919050565b600060208201905081810360008301526123f381612005565b9050919050565b6000602082019050818103600083015261241381612028565b9050919050565b600060208201905081810360008301526124338161204b565b9050919050565b600060208201905081810360008301526124538161206e565b9050919050565b6000602082019050818103600083015261247381612091565b9050919050565b60006020820190508181036000830152612493816120b4565b9050919050565b600060208201905081810360008301526124b3816120d7565b9050919050565b600060208201905081810360008301526124d3816120fa565b9050919050565b600060208201905081810360008301526124f38161211d565b9050919050565b6000602082019050818103600083015261251381612140565b9050919050565b6000602082019050818103600083015261253381612163565b9050919050565b6000602082019050818103600083015261255381612186565b9050919050565b60006020820190508181036000830152612573816121a9565b9050919050565b60006020820190508181036000830152612593816121cc565b9050919050565b600060208201905081810360008301526125b3816121ef565b9050919050565b600060208201905081810360008301526125d381612212565b9050919050565b600060208201905081810360008301526125f381612235565b9050919050565b600060208201905061260f6000830184612258565b92915050565b600060a08201905061262a6000830188612258565b6126376020830187612258565b6126446040830186612258565b6126516060830185612258565b61265e6080830184612258565b9695505050505050565b600081519050919050565b600081519050919050565b600081905092915050565b600082825260208201905092915050565b60006126a5826127ed565b91506126b0836127ed565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff038211156126e5576126e461284e565b5b828201905092915050565b60006126fb826127ed565b9150612706836127ed565b9250826127165761271561287d565b5b828204905092915050565b600061272c826127ed565b9150612737836127ed565b9250817fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff04831182151516156127705761276f61284e565b5b828202905092915050565b6000612786826127ed565b9150612791836127ed565b9250828210156127a4576127a361284e565b5b828203905092915050565b60006127ba826127cd565b9050919050565b60008115159050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b600061280282612809565b9050919050565b6000612814826127cd565b9050919050565b60005b8381101561283957808201518184015260208101905061281e565b83811115612848576000848401525b50505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b6000601f19601f8301169050919050565b7f5374616b696e675661756c743a20596f75206d75737420626520617070726f7660008201527f652e000000000000000000000000000000000000000000000000000000000000602082015250565b7f5061757361626c653a206e6f7420706175736564000000000000000000000000600082015250565b7f5374616b696e675661756c743a20596f752063616e20756e6c6f636b2061667460008201527f6572206c6f636b20706572696f642e0000000000000000000000000000000000602082015250565b7f5374616b696e675661756c743a20696e63726561736520706572696f6420657260008201527f726f722e00000000000000000000000000000000000000000000000000000000602082015250565b7f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160008201527f6464726573730000000000000000000000000000000000000000000000000000602082015250565b7f416464726573733a20696e73756666696369656e742062616c616e636520666f60008201527f722063616c6c0000000000000000000000000000000000000000000000000000602082015250565b7f5061757361626c653a2070617573656400000000000000000000000000000000600082015250565b7f5374616b696e675661756c743a20612e6d6f756e74207a65726f2e0000000000600082015250565b7f5374616b696e675661756c743a204c6f636b277320646561646c696e6520686160008201527f7320657870697265642e00000000000000000000000000000000000000000000602082015250565b7f5374616b696e675661756c743a204e6f74207065726d697373696f6e2e000000600082015250565b7f5374616b696e675661756c743a20706572696f64206572726f722e0000000000600082015250565b7f5374616b696e675661756c743a20756e6c6f636b20616d6f756e74206572726f60008201527f722e000000000000000000000000000000000000000000000000000000000000602082015250565b7f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572600082015250565b7f416464726573733a2063616c6c20746f206e6f6e2d636f6e7472616374000000600082015250565b7f5374616b696e675661756c743a20596f75206d7573742062652063726561746560008201527f206c6f636b2e0000000000000000000000000000000000000000000000000000602082015250565b7f5374616b696e675661756c743a204e6f7420456e6f75676820636f6d706f756e60008201527f6420726577617264732e00000000000000000000000000000000000000000000602082015250565b7f5265776172644469737472696275746f722063616e206f6e6c792063616c6c2060008201527f746869732066756e6374696f6e2e000000000000000000000000000000000000602082015250565b7f5361666545524332303a204552433230206f7065726174696f6e20646964206e60008201527f6f74207375636365656400000000000000000000000000000000000000000000602082015250565b7f5265656e7472616e637947756172643a207265656e7472616e742063616c6c00600082015250565b7f5374616b696e675661756c743a20596f75206861766520616c7265616479206c60008201527f6f636b65642069742e0000000000000000000000000000000000000000000000602082015250565b612dc2816127af565b8114612dcd57600080fd5b50565b612dd9816127c1565b8114612de457600080fd5b50565b612df0816127ed565b8114612dfb57600080fd5b5056fea26469706673582212205931d3e02a6f2923a44efe363e2a8c5fd8a95e86ec2ae367c7b5b775707491fb64736f6c63430008040033";

export class StakingVault__factory extends ContractFactory {
  constructor(
    ...args: [signer: Signer] | ConstructorParameters<typeof ContractFactory>
  ) {
    if (args.length === 1) {
      super(_abi, _bytecode, args[0]);
    } else {
      super(...args);
    }
  }

  deploy(
    _stakingToken: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<StakingVault> {
    return super.deploy(
      _stakingToken,
      overrides || {}
    ) as Promise<StakingVault>;
  }
  getDeployTransaction(
    _stakingToken: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_stakingToken, overrides || {});
  }
  attach(address: string): StakingVault {
    return super.attach(address) as StakingVault;
  }
  connect(signer: Signer): StakingVault__factory {
    return super.connect(signer) as StakingVault__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): StakingVaultInterface {
    return new utils.Interface(_abi) as StakingVaultInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): StakingVault {
    return new Contract(address, _abi, signerOrProvider) as StakingVault;
  }
}
