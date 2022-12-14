/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  IEventReceiver,
  IEventReceiverInterface,
} from "../IEventReceiver";

const _abi = [
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

export class IEventReceiver__factory {
  static readonly abi = _abi;
  static createInterface(): IEventReceiverInterface {
    return new utils.Interface(_abi) as IEventReceiverInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IEventReceiver {
    return new Contract(address, _abi, signerOrProvider) as IEventReceiver;
  }
}
