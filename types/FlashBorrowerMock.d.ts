/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  Overrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface FlashBorrowerMockInterface extends ethers.utils.Interface {
  functions: {
    "flashBorrow(address,uint256,uint8)": FunctionFragment;
    "onFlashLoan(address,address,uint256,uint256,bytes)": FunctionFragment;
    "transfer(address,address,address,uint256)": FunctionFragment;
    "withdraw(address,address,uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "flashBorrow",
    values: [string, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "onFlashLoan",
    values: [string, string, BigNumberish, BigNumberish, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "transfer",
    values: [string, string, string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "withdraw",
    values: [string, string, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "flashBorrow",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "onFlashLoan",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "transfer", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "withdraw", data: BytesLike): Result;

  events: {};
}

export class FlashBorrowerMock extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: FlashBorrowerMockInterface;

  functions: {
    flashBorrow(
      token: string,
      amount: BigNumberish,
      key: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    onFlashLoan(
      initiator: string,
      token: string,
      amount: BigNumberish,
      fee: BigNumberish,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<[string]>;

    transfer(
      _user: string,
      _receiver: string,
      _token: string,
      _share: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    withdraw(
      _user: string,
      _token: string,
      _share: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  flashBorrow(
    token: string,
    amount: BigNumberish,
    key: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  onFlashLoan(
    initiator: string,
    token: string,
    amount: BigNumberish,
    fee: BigNumberish,
    data: BytesLike,
    overrides?: CallOverrides
  ): Promise<string>;

  transfer(
    _user: string,
    _receiver: string,
    _token: string,
    _share: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  withdraw(
    _user: string,
    _token: string,
    _share: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    flashBorrow(
      token: string,
      amount: BigNumberish,
      key: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    onFlashLoan(
      initiator: string,
      token: string,
      amount: BigNumberish,
      fee: BigNumberish,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    transfer(
      _user: string,
      _receiver: string,
      _token: string,
      _share: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    withdraw(
      _user: string,
      _token: string,
      _share: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {};

  estimateGas: {
    flashBorrow(
      token: string,
      amount: BigNumberish,
      key: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    onFlashLoan(
      initiator: string,
      token: string,
      amount: BigNumberish,
      fee: BigNumberish,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    transfer(
      _user: string,
      _receiver: string,
      _token: string,
      _share: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    withdraw(
      _user: string,
      _token: string,
      _share: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    flashBorrow(
      token: string,
      amount: BigNumberish,
      key: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    onFlashLoan(
      initiator: string,
      token: string,
      amount: BigNumberish,
      fee: BigNumberish,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    transfer(
      _user: string,
      _receiver: string,
      _token: string,
      _share: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    withdraw(
      _user: string,
      _token: string,
      _share: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
