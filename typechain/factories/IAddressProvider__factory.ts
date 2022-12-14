/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  IAddressProvider,
  IAddressProviderInterface,
} from "../IAddressProvider";

const _abi = [
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
];

export class IAddressProvider__factory {
  static readonly abi = _abi;
  static createInterface(): IAddressProviderInterface {
    return new utils.Interface(_abi) as IAddressProviderInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IAddressProvider {
    return new Contract(address, _abi, signerOrProvider) as IAddressProvider;
  }
}
