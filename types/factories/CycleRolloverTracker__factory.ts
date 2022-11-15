/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  CycleRolloverTracker,
  CycleRolloverTrackerInterface,
} from "../CycleRolloverTracker";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "eventProxy",
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
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "cycleIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "l1Timestamp",
        type: "uint256",
      },
    ],
    name: "CycleRolloverComplete",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "cycleIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "l1Timestamp",
        type: "uint256",
      },
    ],
    name: "CycleRolloverStart",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "proxyAddress",
        type: "address",
      },
    ],
    name: "ProxyAddressSet",
    type: "event",
  },
  {
    inputs: [],
    name: "EVENT_TYPE_CYCLE_COMPLETE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "EVENT_TYPE_CYCLE_START",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "eventProxy",
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
        name: "eventProxyAddress",
        type: "address",
      },
    ],
    name: "init",
    outputs: [],
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
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506040516109ae3803806109ae83398101604081905261002f916101ad565b6100428161004860201b6100cf1760201c565b5061021b565b600054610100900460ff16806100615750610061610123565b8061006f575060005460ff16155b6100aa5760405162461bcd60e51b815260040180806020018281038252602e815260200180610980602e913960400191505060405180910390fd5b600054610100900460ff161580156100d5576000805460ff1961ff0019909116610100171660011790555b6001600160a01b0382166101045760405162461bcd60e51b81526004016100fb906101ef565b60405180910390fd5b61010d8261013e565b801561011f576000805461ff00191690555b5050565b6000610138306101a760201b6103161760201c565b15905090565b6000805462010000600160b01b031916620100006001600160a01b03848116820292909217928390556040517f9a3202088337cf7e4d3f19d98fffddbbc525f8569bb2a61b2a236729993291279361019c93929004909116906101db565b60405180910390a150565b3b151590565b6000602082840312156101be578081fd5b81516001600160a01b03811681146101d4578182fd5b9392505050565b6001600160a01b0391909116815260200190565b602080825260129082015271494e56414c49445f524f4f545f50524f585960701b604082015260600190565b6107568061022a6000396000f3fe608060405234801561001057600080fd5b50600436106100675760003560e01c8063a3851c9511610050578063a3851c951461009f578063c67557a2146100b2578063ecbbd2f9146100c757610067565b806319ab453c1461006c57806387dbbdf714610081575b600080fd5b61007f61007a36600461051d565b6100cf565b005b610089610243565b6040516100969190610615565b60405180910390f35b61007f6100ad36600461053e565b610265565b6100ba6102ce565b6040516100969190610636565b6100ba6102f2565b600054610100900460ff16806100e857506100e8610320565b806100f6575060005460ff16155b61014b576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602e8152602001806106f3602e913960400191505060405180910390fd5b600054610100900460ff161580156101b157600080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00ff909116610100171660011790555b73ffffffffffffffffffffffffffffffffffffffff8216610207576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101fe906106ad565b60405180910390fd5b61021082610331565b801561023f57600080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00ff1690555b5050565b60005462010000900473ffffffffffffffffffffffffffffffffffffffff1681565b60005462010000900473ffffffffffffffffffffffffffffffffffffffff1633146102bc576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101fe9061063f565b6102c8848484846103bd565b50505050565b7f4379636c6520526f6c6c6f76657220537461727400000000000000000000000081565b7f4379636c6520436f6d706c65746500000000000000000000000000000000000081565b803b15155b919050565b600061032b30610316565b15905090565b600080547fffffffffffffffffffff0000000000000000000000000000000000000000ffff166201000073ffffffffffffffffffffffffffffffffffffffff848116820292909217928390556040517f9a3202088337cf7e4d3f19d98fffddbbc525f8569bb2a61b2a23672999329127936103b29392900490911690610615565b60405180910390a150565b7f4379636c6520526f6c6c6f7665722053746172740000000000000000000000008314156103f4576103ef8282610458565b6102c8565b7f4379636c6520436f6d706c657465000000000000000000000000000000000000831415610426576103ef82826104af565b6040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101fe90610676565b6000610466828401846105c0565b905080602001517f7076014d753eea17bf69018945dedf0882ab4c020cb6bf786e7e10a2c9ca88554283604001516040516104a29291906106e4565b60405180910390a2505050565b60006104bd828401846105c0565b905080602001517f685c8976ac5cbedfaf116b4e3a6c3d34f4ae621e57345dda278ab8be27f11e9f4283604001516040516104a29291906106e4565b803573ffffffffffffffffffffffffffffffffffffffff8116811461031b57600080fd5b60006020828403121561052e578081fd5b610537826104f9565b9392505050565b60008060008060608587031215610553578283fd5b61055c856104f9565b935060208501359250604085013567ffffffffffffffff8082111561057f578384fd5b818701915087601f830112610592578384fd5b8135818111156105a0578485fd5b8860208285010111156105b1578485fd5b95989497505060200194505050565b6000606082840312156105d1578081fd5b6040516060810181811067ffffffffffffffff821117156105ee57fe5b80604052508235815260208301356020820152604083013560408201528091505092915050565b73ffffffffffffffffffffffffffffffffffffffff91909116815260200190565b90815260200190565b60208082526010908201527f4556454e545f50524f58595f4f4e4c5900000000000000000000000000000000604082015260600190565b60208082526012908201527f494e56414c49445f4556454e545f545950450000000000000000000000000000604082015260600190565b60208082526012908201527f494e56414c49445f524f4f545f50524f58590000000000000000000000000000604082015260600190565b91825260208201526040019056fe496e697469616c697a61626c653a20636f6e747261637420697320616c726561647920696e697469616c697a6564a26469706673582212201a75b1cab3635415be96dd2a4226ed4246902d71eec3390b29b0621702872c3e64736f6c63430007060033496e697469616c697a61626c653a20636f6e747261637420697320616c726561647920696e697469616c697a6564";

export class CycleRolloverTracker__factory extends ContractFactory {
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
    eventProxy: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<CycleRolloverTracker> {
    return super.deploy(
      eventProxy,
      overrides || {}
    ) as Promise<CycleRolloverTracker>;
  }
  getDeployTransaction(
    eventProxy: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(eventProxy, overrides || {});
  }
  attach(address: string): CycleRolloverTracker {
    return super.attach(address) as CycleRolloverTracker;
  }
  connect(signer: Signer): CycleRolloverTracker__factory {
    return super.connect(signer) as CycleRolloverTracker__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): CycleRolloverTrackerInterface {
    return new utils.Interface(_abi) as CycleRolloverTrackerInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): CycleRolloverTracker {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as CycleRolloverTracker;
  }
}