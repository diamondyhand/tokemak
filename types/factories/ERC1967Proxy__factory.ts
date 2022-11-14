/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  Signer,
  utils,
  BytesLike,
  Contract,
  ContractFactory,
  PayableOverrides,
} from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { ERC1967Proxy, ERC1967ProxyInterface } from "../ERC1967Proxy";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_logic",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
    ],
    stateMutability: "payable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "previousAdmin",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newAdmin",
        type: "address",
      },
    ],
    name: "AdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "beacon",
        type: "address",
      },
    ],
    name: "BeaconUpgraded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "Upgraded",
    type: "event",
  },
  {
    stateMutability: "payable",
    type: "fallback",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];

const _bytecode =
  "0x608060405260405162000c4d38038062000c4d8339818101604052810190620000299190620003f1565b6200003d828260006200004560201b60201c565b5050620007bb565b62000056836200008860201b60201c565b600082511180620000645750805b156200008357620000818383620000df60201b620000371760201c565b505b505050565b62000099816200011560201b60201c565b8073ffffffffffffffffffffffffffffffffffffffff167fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b60405160405180910390a250565b60606200010d838360405180606001604052806027815260200162000c2660279139620001eb60201b60201c565b905092915050565b6200012b81620002cf60201b620000641760201c565b6200016d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040162000164906200054e565b60405180910390fd5b80620001a77f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc60001b620002f260201b620000871760201c565b60000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b6060620001fe84620002cf60201b60201c565b62000240576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401620002379062000570565b60405180910390fd5b6000808573ffffffffffffffffffffffffffffffffffffffff16856040516200026a919062000511565b600060405180830381855af49150503d8060008114620002a7576040519150601f19603f3d011682016040523d82523d6000602084013e620002ac565b606091505b5091509150620002c4828286620002fc60201b60201c565b925050509392505050565b6000808273ffffffffffffffffffffffffffffffffffffffff163b119050919050565b6000819050919050565b606083156200030e5782905062000361565b600083511115620003225782518084602001fd5b816040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016200035891906200052a565b60405180910390fd5b9392505050565b60006200037f6200037984620005bb565b62000592565b9050828152602081018484840111156200039857600080fd5b620003a584828562000657565b509392505050565b600081519050620003be81620007a1565b92915050565b600082601f830112620003d657600080fd5b8151620003e884826020860162000368565b91505092915050565b600080604083850312156200040557600080fd5b60006200041585828601620003ad565b925050602083015167ffffffffffffffff8111156200043357600080fd5b6200044185828601620003c4565b9150509250929050565b60006200045882620005f1565b62000464818562000607565b93506200047681856020860162000657565b80840191505092915050565b60006200048f82620005fc565b6200049b818562000612565b9350620004ad81856020860162000657565b620004b881620006f2565b840191505092915050565b6000620004d2602d8362000612565b9150620004df8262000703565b604082019050919050565b6000620004f960268362000612565b9150620005068262000752565b604082019050919050565b60006200051f82846200044b565b915081905092915050565b6000602082019050818103600083015262000546818462000482565b905092915050565b600060208201905081810360008301526200056981620004c3565b9050919050565b600060208201905081810360008301526200058b81620004ea565b9050919050565b60006200059e620005b1565b9050620005ac82826200068d565b919050565b6000604051905090565b600067ffffffffffffffff821115620005d957620005d8620006c3565b5b620005e482620006f2565b9050602081019050919050565b600081519050919050565b600081519050919050565b600081905092915050565b600082825260208201905092915050565b6000620006308262000637565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60005b83811015620006775780820151818401526020810190506200065a565b8381111562000687576000848401525b50505050565b6200069882620006f2565b810181811067ffffffffffffffff82111715620006ba57620006b9620006c3565b5b80604052505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6000601f19601f8301169050919050565b7f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60008201527f6f74206120636f6e747261637400000000000000000000000000000000000000602082015250565b7f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f60008201527f6e74726163740000000000000000000000000000000000000000000000000000602082015250565b620007ac8162000623565b8114620007b857600080fd5b50565b61045b80620007cb6000396000f3fe6080604052366100135761001161001d565b005b61001b61001d565b005b610025610091565b610035610030610093565b6100a2565b565b606061005c83836040518060600160405280602781526020016103ff602791396100c8565b905092915050565b6000808273ffffffffffffffffffffffffffffffffffffffff163b119050919050565b6000819050919050565b565b600061009d610195565b905090565b3660008037600080366000845af43d6000803e80600081146100c3573d6000f35b3d6000fd5b60606100d384610064565b610112576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161010990610319565b60405180910390fd5b6000808573ffffffffffffffffffffffffffffffffffffffff168560405161013a91906102e0565b600060405180830381855af49150503d8060008114610175576040519150601f19603f3d011682016040523d82523d6000602084013e61017a565b606091505b509150915061018a8282866101ec565b925050509392505050565b60006101c37f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc60001b610087565b60000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b606083156101fc5782905061024c565b60008351111561020f5782518084602001fd5b816040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161024391906102f7565b60405180910390fd5b9392505050565b600061025e82610339565b610268818561034f565b935061027881856020860161036b565b80840191505092915050565b600061028f82610344565b610299818561035a565b93506102a981856020860161036b565b6102b28161039e565b840191505092915050565b60006102ca60268361035a565b91506102d5826103af565b604082019050919050565b60006102ec8284610253565b915081905092915050565b600060208201905081810360008301526103118184610284565b905092915050565b60006020820190508181036000830152610332816102bd565b9050919050565b600081519050919050565b600081519050919050565b600081905092915050565b600082825260208201905092915050565b60005b8381101561038957808201518184015260208101905061036e565b83811115610398576000848401525b50505050565b6000601f19601f8301169050919050565b7f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f60008201527f6e7472616374000000000000000000000000000000000000000000000000000060208201525056fe416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a26469706673582212208c0885ff3dcb2d3387642a51c2b43c3676bf70cfb956265aa1b5991f94bccbda64736f6c63430008040033416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564";

export class ERC1967Proxy__factory extends ContractFactory {
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
    _logic: string,
    _data: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ERC1967Proxy> {
    return super.deploy(
      _logic,
      _data,
      overrides || {}
    ) as Promise<ERC1967Proxy>;
  }
  getDeployTransaction(
    _logic: string,
    _data: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_logic, _data, overrides || {});
  }
  attach(address: string): ERC1967Proxy {
    return super.attach(address) as ERC1967Proxy;
  }
  connect(signer: Signer): ERC1967Proxy__factory {
    return super.connect(signer) as ERC1967Proxy__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ERC1967ProxyInterface {
    return new utils.Interface(_abi) as ERC1967ProxyInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ERC1967Proxy {
    return new Contract(address, _abi, signerOrProvider) as ERC1967Proxy;
  }
}