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

interface IRewardsManagerInterface extends ethers.utils.Interface {
  functions: {
    "getExcludePools()": FunctionFragment;
    "registerExcludePools(address[])": FunctionFragment;
    "unregisterExcludePools(address[])": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "getExcludePools",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "registerExcludePools",
    values: [string[]]
  ): string;
  encodeFunctionData(
    functionFragment: "unregisterExcludePools",
    values: [string[]]
  ): string;

  decodeFunctionResult(
    functionFragment: "getExcludePools",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "registerExcludePools",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "unregisterExcludePools",
    data: BytesLike
  ): Result;

  events: {
    "ExcludePoolsRegistered(address[])": EventFragment;
    "ExcludePoolsUnRegistered(address[])": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "ExcludePoolsRegistered"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ExcludePoolsUnRegistered"): EventFragment;
}

export type ExcludePoolsRegisteredEvent = TypedEvent<
  [string[]] & { pools: string[] }
>;

export type ExcludePoolsUnRegisteredEvent = TypedEvent<
  [string[]] & { pools: string[] }
>;

export class IRewardsManager extends BaseContract {
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

  interface: IRewardsManagerInterface;

  functions: {
    getExcludePools(
      overrides?: CallOverrides
    ): Promise<[string[]] & { pools: string[] }>;

    registerExcludePools(
      pools: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    unregisterExcludePools(
      pools: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  getExcludePools(overrides?: CallOverrides): Promise<string[]>;

  registerExcludePools(
    pools: string[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  unregisterExcludePools(
    pools: string[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    getExcludePools(overrides?: CallOverrides): Promise<string[]>;

    registerExcludePools(
      pools: string[],
      overrides?: CallOverrides
    ): Promise<void>;

    unregisterExcludePools(
      pools: string[],
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "ExcludePoolsRegistered(address[])"(
      pools?: null
    ): TypedEventFilter<[string[]], { pools: string[] }>;

    ExcludePoolsRegistered(
      pools?: null
    ): TypedEventFilter<[string[]], { pools: string[] }>;

    "ExcludePoolsUnRegistered(address[])"(
      pools?: null
    ): TypedEventFilter<[string[]], { pools: string[] }>;

    ExcludePoolsUnRegistered(
      pools?: null
    ): TypedEventFilter<[string[]], { pools: string[] }>;
  };

  estimateGas: {
    getExcludePools(overrides?: CallOverrides): Promise<BigNumber>;

    registerExcludePools(
      pools: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    unregisterExcludePools(
      pools: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    getExcludePools(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    registerExcludePools(
      pools: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    unregisterExcludePools(
      pools: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
