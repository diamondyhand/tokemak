/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  BaseController,
  BaseControllerInterface,
} from "../BaseController";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_manager",
        type: "address",
      },
      {
        internalType: "address",
        name: "_accessControl",
        type: "address",
      },
      {
        internalType: "address",
        name: "_addressRegistry",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "ADD_LIQUIDITY_ROLE",
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
    name: "MISC_OPERATION_ROLE",
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
    name: "REMOVE_LIQUIDITY_ROLE",
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
    name: "accessControl",
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
    name: "addressRegistry",
    outputs: [
      {
        internalType: "contract IAddressRegistry",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "manager",
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
];

const _bytecode =
  "0x6101406040527fad02fbc13153ebd0c0ef004ff61ba31d9ce93d7998e6fc3a4a4a667ac0ae2a1660e0527f99a732c1592dacad61c17aa1d8c4a304ed8aa6966133090e2df7f7c3ec3c66f7610100527fb31eaee23a579dabb2a4effb45a79031addeff3990e6fc9284cc2ad257c588a16101205234801561007f57600080fd5b506040516103fd3803806103fd833981810160405260608110156100a257600080fd5b50805160208201516040909201519091906001600160a01b038316610100576040805162461bcd60e51b815260206004820152600f60248201526e494e56414c49445f4144445245535360881b604482015290519081900360640190fd5b6001600160a01b03821661014d576040805162461bcd60e51b815260206004820152600f60248201526e494e56414c49445f4144445245535360881b604482015290519081900360640190fd5b6001600160a01b03811661019a576040805162461bcd60e51b815260206004820152600f60248201526e494e56414c49445f4144445245535360881b604482015290519081900360640190fd5b6001600160601b0319606093841b811660805291831b821660a05290911b1660c05260805160601c60a05160601c60c05160601c60e05161010051610120516101f061020d6000398061015052508061017452508060e452508061019852508061010852508061012c52506101f06000f3fe608060405234801561001057600080fd5b50600436106100725760003560e01c806361bea27f1161005057806361bea27f146100ca5780637e841d54146100d2578063f3ad65f4146100da57610072565b80630f967dd61461007757806313007d5514610091578063481c6a75146100c2575b600080fd5b61007f6100e2565b60408051918252519081900360200190f35b610099610106565b6040805173ffffffffffffffffffffffffffffffffffffffff9092168252519081900360200190f35b61009961012a565b61007f61014e565b61007f610172565b610099610196565b7f000000000000000000000000000000000000000000000000000000000000000081565b7f000000000000000000000000000000000000000000000000000000000000000081565b7f000000000000000000000000000000000000000000000000000000000000000081565b7f000000000000000000000000000000000000000000000000000000000000000081565b7f000000000000000000000000000000000000000000000000000000000000000081565b7f00000000000000000000000000000000000000000000000000000000000000008156fea2646970667358221220c61401a346d1fc017ee634987e3f04a4855d94d1f2031cfe3e2f65ea678c7f2d64736f6c634300060c0033";

export class BaseController__factory extends ContractFactory {
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
    _manager: string,
    _accessControl: string,
    _addressRegistry: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<BaseController> {
    return super.deploy(
      _manager,
      _accessControl,
      _addressRegistry,
      overrides || {}
    ) as Promise<BaseController>;
  }
  getDeployTransaction(
    _manager: string,
    _accessControl: string,
    _addressRegistry: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _manager,
      _accessControl,
      _addressRegistry,
      overrides || {}
    );
  }
  attach(address: string): BaseController {
    return super.attach(address) as BaseController;
  }
  connect(signer: Signer): BaseController__factory {
    return super.connect(signer) as BaseController__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): BaseControllerInterface {
    return new utils.Interface(_abi) as BaseControllerInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): BaseController {
    return new Contract(address, _abi, signerOrProvider) as BaseController;
  }
}