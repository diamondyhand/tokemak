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

interface CurveControllerMetaTemplateInterface extends ethers.utils.Interface {
  functions: {
    "ADD_LIQUIDITY_ROLE()": FunctionFragment;
    "MISC_OPERATION_ROLE()": FunctionFragment;
    "N_COINS()": FunctionFragment;
    "REMOVE_LIQUIDITY_ROLE()": FunctionFragment;
    "accessControl()": FunctionFragment;
    "addressRegistry()": FunctionFragment;
    "basePoolAddress()": FunctionFragment;
    "deploy(address,uint256[4],uint256)": FunctionFragment;
    "manager()": FunctionFragment;
    "withdraw(address,uint256,uint256[4])": FunctionFragment;
    "withdrawImbalance(address,uint256[4],uint256)": FunctionFragment;
    "zapAddress()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "ADD_LIQUIDITY_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "MISC_OPERATION_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "N_COINS", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "REMOVE_LIQUIDITY_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "accessControl",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "addressRegistry",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "basePoolAddress",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "deploy",
    values: [
      string,
      [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      BigNumberish
    ]
  ): string;
  encodeFunctionData(functionFragment: "manager", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "withdraw",
    values: [
      string,
      BigNumberish,
      [BigNumberish, BigNumberish, BigNumberish, BigNumberish]
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "withdrawImbalance",
    values: [
      string,
      [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      BigNumberish
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "zapAddress",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "ADD_LIQUIDITY_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "MISC_OPERATION_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "N_COINS", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "REMOVE_LIQUIDITY_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "accessControl",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "addressRegistry",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "basePoolAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "deploy", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "manager", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "withdraw", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "withdrawImbalance",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "zapAddress", data: BytesLike): Result;

  events: {};
}

export class CurveControllerMetaTemplate extends BaseContract {
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

  interface: CurveControllerMetaTemplateInterface;

  functions: {
    ADD_LIQUIDITY_ROLE(overrides?: CallOverrides): Promise<[string]>;

    MISC_OPERATION_ROLE(overrides?: CallOverrides): Promise<[string]>;

    N_COINS(overrides?: CallOverrides): Promise<[BigNumber]>;

    REMOVE_LIQUIDITY_ROLE(overrides?: CallOverrides): Promise<[string]>;

    accessControl(overrides?: CallOverrides): Promise<[string]>;

    addressRegistry(overrides?: CallOverrides): Promise<[string]>;

    basePoolAddress(overrides?: CallOverrides): Promise<[string]>;

    deploy(
      metaPoolAddress: string,
      amounts: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      minMintAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    manager(overrides?: CallOverrides): Promise<[string]>;

    withdraw(
      metaPoolAddress: string,
      amount: BigNumberish,
      minAmounts: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    withdrawImbalance(
      metaPoolAddress: string,
      amounts: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      maxBurnAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    zapAddress(overrides?: CallOverrides): Promise<[string]>;
  };

  ADD_LIQUIDITY_ROLE(overrides?: CallOverrides): Promise<string>;

  MISC_OPERATION_ROLE(overrides?: CallOverrides): Promise<string>;

  N_COINS(overrides?: CallOverrides): Promise<BigNumber>;

  REMOVE_LIQUIDITY_ROLE(overrides?: CallOverrides): Promise<string>;

  accessControl(overrides?: CallOverrides): Promise<string>;

  addressRegistry(overrides?: CallOverrides): Promise<string>;

  basePoolAddress(overrides?: CallOverrides): Promise<string>;

  deploy(
    metaPoolAddress: string,
    amounts: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
    minMintAmount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  manager(overrides?: CallOverrides): Promise<string>;

  withdraw(
    metaPoolAddress: string,
    amount: BigNumberish,
    minAmounts: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  withdrawImbalance(
    metaPoolAddress: string,
    amounts: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
    maxBurnAmount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  zapAddress(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    ADD_LIQUIDITY_ROLE(overrides?: CallOverrides): Promise<string>;

    MISC_OPERATION_ROLE(overrides?: CallOverrides): Promise<string>;

    N_COINS(overrides?: CallOverrides): Promise<BigNumber>;

    REMOVE_LIQUIDITY_ROLE(overrides?: CallOverrides): Promise<string>;

    accessControl(overrides?: CallOverrides): Promise<string>;

    addressRegistry(overrides?: CallOverrides): Promise<string>;

    basePoolAddress(overrides?: CallOverrides): Promise<string>;

    deploy(
      metaPoolAddress: string,
      amounts: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      minMintAmount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    manager(overrides?: CallOverrides): Promise<string>;

    withdraw(
      metaPoolAddress: string,
      amount: BigNumberish,
      minAmounts: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      overrides?: CallOverrides
    ): Promise<void>;

    withdrawImbalance(
      metaPoolAddress: string,
      amounts: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      maxBurnAmount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    zapAddress(overrides?: CallOverrides): Promise<string>;
  };

  filters: {};

  estimateGas: {
    ADD_LIQUIDITY_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    MISC_OPERATION_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    N_COINS(overrides?: CallOverrides): Promise<BigNumber>;

    REMOVE_LIQUIDITY_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    accessControl(overrides?: CallOverrides): Promise<BigNumber>;

    addressRegistry(overrides?: CallOverrides): Promise<BigNumber>;

    basePoolAddress(overrides?: CallOverrides): Promise<BigNumber>;

    deploy(
      metaPoolAddress: string,
      amounts: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      minMintAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    manager(overrides?: CallOverrides): Promise<BigNumber>;

    withdraw(
      metaPoolAddress: string,
      amount: BigNumberish,
      minAmounts: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    withdrawImbalance(
      metaPoolAddress: string,
      amounts: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      maxBurnAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    zapAddress(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    ADD_LIQUIDITY_ROLE(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    MISC_OPERATION_ROLE(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    N_COINS(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    REMOVE_LIQUIDITY_ROLE(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    accessControl(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    addressRegistry(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    basePoolAddress(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    deploy(
      metaPoolAddress: string,
      amounts: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      minMintAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    manager(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    withdraw(
      metaPoolAddress: string,
      amount: BigNumberish,
      minAmounts: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    withdrawImbalance(
      metaPoolAddress: string,
      amounts: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      maxBurnAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    zapAddress(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
