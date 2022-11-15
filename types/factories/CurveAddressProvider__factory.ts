/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  CurveAddressProvider,
  CurveAddressProviderInterface,
} from "../CurveAddressProvider";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_admin",
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
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "new_address",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "version",
        type: "uint256",
      },
    ],
    name: "AddressModified",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "admin",
        type: "address",
      },
    ],
    name: "CommitNewAdmin",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "addr",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "description",
        type: "string",
      },
    ],
    name: "NewAddressIdentifier",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "admin",
        type: "address",
      },
    ],
    name: "NewAdmin",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_address",
        type: "address",
      },
      {
        internalType: "string",
        name: "_description",
        type: "string",
      },
    ],
    name: "add_new_id",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "admin",
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
    name: "apply_transfer_ownership",
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
        name: "_new_admin",
        type: "address",
      },
    ],
    name: "commit_transfer_ownership",
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
    name: "deadline_add",
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
    name: "future_admin",
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
        internalType: "uint256",
        name: "_id",
        type: "uint256",
      },
    ],
    name: "get_address",
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
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "get_id_info",
    outputs: [
      {
        internalType: "address",
        name: "addr",
        type: "address",
      },
      {
        internalType: "bool",
        name: "is_active",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "version",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "last_modified",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "description",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "get_registry",
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
    name: "max_id",
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
    name: "revert_transfer_ownership",
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
        internalType: "uint256",
        name: "_id",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_address",
        type: "address",
      },
    ],
    name: "set_address",
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
        internalType: "uint256",
        name: "_time",
        type: "uint256",
      },
    ],
    name: "set_deadline_add",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_registry",
        type: "address",
      },
    ],
    name: "set_registry",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "transfer_ownership_deadline",
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
        internalType: "uint256",
        name: "_id",
        type: "uint256",
      },
    ],
    name: "unset_address",
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
];

const _bytecode =
  "0x6080604052600160065534801561001557600080fd5b50604051610bdd380380610bdd8339818101604052602081101561003857600080fd5b5051600180546001600160a01b0319166001600160a01b03831617815560045560408051808201909152600d81526c4d61696e20526567697374727960981b6020808301918252600080526005905290516100b4917f05b8ccbb9d4d8fb16ea74ce3c29a41f1b461fbdaff4714a0d9a8eb05499746bf916100bb565b5050610156565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106100fc57805160ff1916838001178555610129565b82800160010185558215610129579182015b8281111561012957825182559160200191906001019061010e565b50610135929150610139565b5090565b61015391905b80821115610135576000815560010161013f565b90565b610a78806101656000396000f3fe608060405234801561001057600080fd5b50600436106101005760003560e01c80636a84cad011610097578063a262904b11610066578063a262904b14610397578063e0a0b5861461039f578063f1e300bb146103a7578063f851a440146103cd57610100565b80636a84cad0146102765780636b441a40146102a257806386fbf193146102c857806392668ecb146102d057610100565b8063258ce953116100d3578063258ce95314610201578063493f4f74146102205780635eec0daa1461023d5780636a1c05ae1461026e57610100565b80630c6d784f146101055780630fed77041461011f578063168f95791461012757806317f7182a146101dd575b600080fd5b61010d6103d5565b60408051918252519081900360200190f35b61010d6103e0565b61010d6004803603604081101561013d57600080fd5b6001600160a01b03823516919081019060408101602082013564010000000081111561016857600080fd5b82018360208201111561017a57600080fd5b8035906020019184600183028401116401000000008311171561019c57600080fd5b91908080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152509295506103e6945050505050565b6101e5610560565b604080516001600160a01b039092168252519081900360200190f35b61021e6004803603602081101561021757600080fd5b503561056f565b005b6101e56004803603602081101561023657600080fd5b503561058b565b61025a6004803603602081101561025357600080fd5b50356105a6565b604080519115158252519081900360200190f35b61025a610686565b61025a6004803603604081101561028c57600080fd5b50803590602001356001600160a01b0316610713565b61025a600480360360208110156102b857600080fd5b50356001600160a01b03166107f4565b61025a610877565b6102ed600480360360208110156102e657600080fd5b503561089c565b60405180866001600160a01b03166001600160a01b031681526020018515151515815260200184815260200183815260200180602001828103825283818151815260200191508051906020019080838360005b83811015610358578181015183820152602001610340565b50505050905090810190601f1680156103855780820380516001836020036101000a031916815260200191505b50965050505050505060405180910390f35b6101e5610964565b61010d610973565b61021e600480360360208110156103bd57600080fd5b50356001600160a01b0316610979565b6101e561099b565b600454600019015b90565b60065481565b6001546000906001600160a01b0316331461040057600080fd5b6004546040805160a0810182526001600160a01b038087168252600160208084018281528486018381524260608701908152608087018b815260008a815260058652989098208751815494511515600160a01b0260ff60a01b19919098166001600160a01b031990951694909417939093169590951782555192810192909255915160028201559251805192939261049e92600385019201906109aa565b505060048054600101905550604080516001600160a01b03861681526020808201838152865193830193909352855184937f5b0f9b31dc08c19adcc0181c1b97ad54a84487faf0a4fdcb88c8681724298af99389938993919291606084019185019080838360005b8381101561051e578181015183820152602001610506565b50505050905090810190601f16801561054b5780820380516001836020036101000a031916815260200191505b50935050505060405180910390a25092915050565b6003546001600160a01b031681565b6001546001600160a01b0316331461058657600080fd5b600655565b6000908152600560205260409020546001600160a01b031690565b6001546000906001600160a01b031633146105c057600080fd5b600082815260056020526040902054600160a01b900460ff166105e257600080fd5b600082815260056020526040902080547fffffffffffffffffffffff000000000000000000000000000000000000000000168155426002909101558161063357600080546001600160a01b03191690555b600082815260056020908152604080832060010154815193845291830191909152805184927fe7a6334c4f573efdf292d404d59adacec345f4f7c76495a034008edda0acef4792908290030190a2919050565b6001546000906001600160a01b031633146106a057600080fd5b6002546106ac57600080fd5b6002544210156106bb57600080fd5b600354600180546001600160a01b0319166001600160a01b0390921691821790556000600281905560405182917f71614071b88dee5e0b2ae578a9dd7b2ebbe9ae832ba419dc0242cd065a290b6c91a2600191505090565b6001546000906001600160a01b0316331461072d57600080fd5b826004541161073b57600080fd5b6000838152600560205260409020600180820180548354600160a01b6001600160a01b03199091166001600160a01b0388161760ff60a01b19161784559091019081905542600290920191909155836107aa57600080546001600160a01b0319166001600160a01b0385161790555b604080516001600160a01b038516815260208101839052815186927fe7a6334c4f573efdf292d404d59adacec345f4f7c76495a034008edda0acef47928290030190a25092915050565b6001546000906001600160a01b0316331461080e57600080fd5b6002541561081b57600080fd5b60065442016002819055600380546001600160a01b0319166001600160a01b03851690811790915560405182907f181aa3aa17d4cbf99265dd4443eba009433d3cde79d60164fde1d1a192beb93590600090a350600192915050565b6001546000906001600160a01b0316331461089157600080fd5b506000600255600190565b600560209081526000918252604091829020805460018083015460028085015460038601805489516101009682161596909602600019011692909204601f81018890048802850188019098528784526001600160a01b03851697600160a01b90950460ff16969295909490939283018282801561095a5780601f1061092f5761010080835404028352916020019161095a565b820191906000526020600020905b81548152906001019060200180831161093d57829003601f168201915b5050505050905085565b6000546001600160a01b031690565b60025481565b600080546001600160a01b0319166001600160a01b0392909216919091179055565b6001546001600160a01b031681565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106109eb57805160ff1916838001178555610a18565b82800160010185558215610a18579182015b82811115610a185782518255916020019190600101906109fd565b50610a24929150610a28565b5090565b6103dd91905b80821115610a245760008155600101610a2e56fea2646970667358221220edf768374c450b8962010e090e37d13e97a8b3600410ae43d2ed4a7d15da4da064736f6c634300060b0033";

export class CurveAddressProvider__factory extends ContractFactory {
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
    _admin: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<CurveAddressProvider> {
    return super.deploy(
      _admin,
      overrides || {}
    ) as Promise<CurveAddressProvider>;
  }
  getDeployTransaction(
    _admin: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_admin, overrides || {});
  }
  attach(address: string): CurveAddressProvider {
    return super.attach(address) as CurveAddressProvider;
  }
  connect(signer: Signer): CurveAddressProvider__factory {
    return super.connect(signer) as CurveAddressProvider__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): CurveAddressProviderInterface {
    return new utils.Interface(_abi) as CurveAddressProviderInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): CurveAddressProvider {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as CurveAddressProvider;
  }
}