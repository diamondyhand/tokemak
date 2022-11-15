/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { Toke, TokeInterface } from "../Toke";

const _abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
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
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
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
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
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
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
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
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
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
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
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
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
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
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
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
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
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
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
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
        name: "sender",
        type: "address",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
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
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60806040523480156200001157600080fd5b506040805180820182526007815266546f6b656d616b60c81b602080830191825283518085019094526004845263544f4b4560e01b9084015281519192916200005d9160039162000318565b5080516200007390600490602084019062000318565b50506005805461ff001960ff199091166012171690555060006200009f6001600160e01b036200011d16565b6005805462010000600160b01b031916620100006001600160a01b03841690810291909117909155604051919250906000907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908290a35062000117336a52b7d2dcc80cd2e40000006001600160e01b036200012216565b620003ba565b335b90565b6001600160a01b0382166200017e576040805162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015290519081900360640190fd5b62000195600083836001600160e01b036200023a16565b620001b181600254620002a860201b620009831790919060201c565b6002556001600160a01b03821660009081526020818152604090912054620001e491839062000983620002a8821b17901c565b6001600160a01b0383166000818152602081815260408083209490945583518581529351929391927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9281900390910190a35050565b62000252838383620002a360201b620009e41760201c565b620002656001600160e01b036200030a16565b15620002a35760405162461bcd60e51b815260040180806020018281038252602a815260200180620013b3602a913960400191505060405180910390fd5b505050565b60008282018381101562000303576040805162461bcd60e51b815260206004820152601b60248201527f536166654d6174683a206164646974696f6e206f766572666c6f770000000000604482015290519081900360640190fd5b9392505050565b600554610100900460ff1690565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106200035b57805160ff19168380011785556200038b565b828001600101855582156200038b579182015b828111156200038b5782518255916020019190600101906200036e565b50620003999291506200039d565b5090565b6200011f91905b80821115620003995760008155600101620003a4565b610fe980620003ca6000396000f3fe608060405234801561001057600080fd5b506004361061011b5760003560e01c806370a08231116100b257806395d89b4111610081578063a9059cbb11610066578063a9059cbb14610317578063dd62ed3e14610343578063f2fde38b146103715761011b565b806395d89b41146102e3578063a457c2d7146102eb5761011b565b806370a0823114610289578063715018a6146102af5780638456cb59146102b75780638da5cb5b146102bf5761011b565b8063313ce567116100ee578063313ce5671461022d578063395093511461024b5780633f4ba83a146102775780635c975abb146102815761011b565b806306fdde0314610120578063095ea7b31461019d57806318160ddd146101dd57806323b872dd146101f7575b600080fd5b610128610397565b6040805160208082528351818301528351919283929083019185019080838360005b8381101561016257818101518382015260200161014a565b50505050905090810190601f16801561018f5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6101c9600480360360408110156101b357600080fd5b506001600160a01b03813516906020013561042d565b604080519115158252519081900360200190f35b6101e561044a565b60408051918252519081900360200190f35b6101c96004803603606081101561020d57600080fd5b506001600160a01b03813581169160208101359091169060400135610450565b6102356104dd565b6040805160ff9092168252519081900360200190f35b6101c96004803603604081101561026157600080fd5b506001600160a01b0381351690602001356104e6565b61027f61053a565b005b6101c96105b8565b6101e56004803603602081101561029f57600080fd5b50356001600160a01b03166105c6565b61027f6105e1565b61027f6106b4565b6102c7610730565b604080516001600160a01b039092168252519081900360200190f35b610128610745565b6101c96004803603604081101561030157600080fd5b506001600160a01b0381351690602001356107a6565b6101c96004803603604081101561032d57600080fd5b506001600160a01b038135169060200135610814565b6101e56004803603604081101561035957600080fd5b506001600160a01b0381358116916020013516610828565b61027f6004803603602081101561038757600080fd5b50356001600160a01b0316610853565b60038054604080516020601f60026000196101006001881615020190951694909404938401819004810282018101909252828152606093909290918301828280156104235780601f106103f857610100808354040283529160200191610423565b820191906000526020600020905b81548152906001019060200180831161040657829003601f168201915b5050505050905090565b600061044161043a6109e9565b84846109ed565b50600192915050565b60025490565b600061045d848484610ad9565b6104d3846104696109e9565b6104ce85604051806060016040528060288152602001610ef4602891396001600160a01b038a166000908152600160205260408120906104a76109e9565b6001600160a01b03168152602081019190915260400160002054919063ffffffff610c4016565b6109ed565b5060019392505050565b60055460ff1690565b60006104416104f36109e9565b846104ce85600160006105046109e9565b6001600160a01b03908116825260208083019390935260409182016000908120918c16815292529020549063ffffffff61098316565b6105426109e9565b6001600160a01b0316610553610730565b6001600160a01b0316146105ae576040805162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b6105b6610cd7565b565b600554610100900460ff1690565b6001600160a01b031660009081526020819052604090205490565b6105e96109e9565b6001600160a01b03166105fa610730565b6001600160a01b031614610655576040805162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b6005546040516000916201000090046001600160a01b0316907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908390a36005805475ffffffffffffffffffffffffffffffffffffffff000019169055565b6106bc6109e9565b6001600160a01b03166106cd610730565b6001600160a01b031614610728576040805162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b6105b6610d81565b6005546201000090046001600160a01b031690565b60048054604080516020601f60026000196101006001881615020190951694909404938401819004810282018101909252828152606093909290918301828280156104235780601f106103f857610100808354040283529160200191610423565b60006104416107b36109e9565b846104ce85604051806060016040528060258152602001610f6560259139600160006107dd6109e9565b6001600160a01b03908116825260208083019390935260409182016000908120918d1681529252902054919063ffffffff610c4016565b60006104416108216109e9565b8484610ad9565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b61085b6109e9565b6001600160a01b031661086c610730565b6001600160a01b0316146108c7576040805162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b6001600160a01b03811661090c5760405162461bcd60e51b8152600401808060200182810382526026815260200180610e866026913960400191505060405180910390fd5b6005546040516001600160a01b038084169262010000900416907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a3600580546001600160a01b03909216620100000275ffffffffffffffffffffffffffffffffffffffff000019909216919091179055565b6000828201838110156109dd576040805162461bcd60e51b815260206004820152601b60248201527f536166654d6174683a206164646974696f6e206f766572666c6f770000000000604482015290519081900360640190fd5b9392505050565b505050565b3390565b6001600160a01b038316610a325760405162461bcd60e51b8152600401808060200182810382526024815260200180610f416024913960400191505060405180910390fd5b6001600160a01b038216610a775760405162461bcd60e51b8152600401808060200182810382526022815260200180610eac6022913960400191505060405180910390fd5b6001600160a01b03808416600081815260016020908152604080832094871680845294825291829020859055815185815291517f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9259281900390910190a3505050565b6001600160a01b038316610b1e5760405162461bcd60e51b8152600401808060200182810382526025815260200180610f1c6025913960400191505060405180910390fd5b6001600160a01b038216610b635760405162461bcd60e51b8152600401808060200182810382526023815260200180610e636023913960400191505060405180910390fd5b610b6e838383610e13565b610bb181604051806060016040528060268152602001610ece602691396001600160a01b038616600090815260208190526040902054919063ffffffff610c4016565b6001600160a01b038085166000908152602081905260408082209390935590841681522054610be6908263ffffffff61098316565b6001600160a01b038084166000818152602081815260409182902094909455805185815290519193928716927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef92918290030190a3505050565b60008184841115610ccf5760405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b83811015610c94578181015183820152602001610c7c565b50505050905090810190601f168015610cc15780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b505050900390565b610cdf6105b8565b610d30576040805162461bcd60e51b815260206004820152601460248201527f5061757361626c653a206e6f7420706175736564000000000000000000000000604482015290519081900360640190fd5b6005805461ff00191690557f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa610d646109e9565b604080516001600160a01b039092168252519081900360200190a1565b610d896105b8565b15610ddb576040805162461bcd60e51b815260206004820152601060248201527f5061757361626c653a2070617573656400000000000000000000000000000000604482015290519081900360640190fd5b6005805461ff0019166101001790557f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258610d646109e9565b610e1e8383836109e4565b610e266105b8565b156109e45760405162461bcd60e51b815260040180806020018281038252602a815260200180610f8a602a913960400191505060405180910390fdfe45524332303a207472616e7366657220746f20746865207a65726f20616464726573734f776e61626c653a206e6577206f776e657220697320746865207a65726f206164647265737345524332303a20617070726f766520746f20746865207a65726f206164647265737345524332303a207472616e7366657220616d6f756e7420657863656564732062616c616e636545524332303a207472616e7366657220616d6f756e74206578636565647320616c6c6f77616e636545524332303a207472616e736665722066726f6d20746865207a65726f206164647265737345524332303a20617070726f76652066726f6d20746865207a65726f206164647265737345524332303a2064656372656173656420616c6c6f77616e63652062656c6f77207a65726f45524332305061757361626c653a20746f6b656e207472616e73666572207768696c6520706175736564a26469706673582212208828208746a8e633ac3c7569a400c4eadcf86cb43dfeaa952b3296a6734a1d0a64736f6c634300060b003345524332305061757361626c653a20746f6b656e207472616e73666572207768696c6520706175736564";

export class Toke__factory extends ContractFactory {
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
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<Toke> {
    return super.deploy(overrides || {}) as Promise<Toke>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): Toke {
    return super.attach(address) as Toke;
  }
  connect(signer: Signer): Toke__factory {
    return super.connect(signer) as Toke__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): TokeInterface {
    return new utils.Interface(_abi) as TokeInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): Toke {
    return new Contract(address, _abi, signerOrProvider) as Toke;
  }
}