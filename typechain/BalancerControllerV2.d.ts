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

interface BalancerControllerV2Interface extends ethers.utils.Interface {
  functions: {
    "ADD_LIQUIDITY_ROLE()": FunctionFragment;
    "MISC_OPERATION_ROLE()": FunctionFragment;
    "REMOVE_LIQUIDITY_ROLE()": FunctionFragment;
    "accessControl()": FunctionFragment;
    "addressRegistry()": FunctionFragment;
    "deploy(bytes32,address[],uint256[],uint256)": FunctionFragment;
    "manager()": FunctionFragment;
    "vault()": FunctionFragment;
    "withdraw(bytes32,uint256,address[],uint256[])": FunctionFragment;
    "withdrawImbalance(bytes32,uint256,address[],uint256[])": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "ADD_LIQUIDITY_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "MISC_OPERATION_ROLE",
    values?: undefined
  ): string;
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
    functionFragment: "deploy",
    values: [BytesLike, string[], BigNumberish[], BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "manager", values?: undefined): string;
  encodeFunctionData(functionFragment: "vault", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "withdraw",
    values: [BytesLike, BigNumberish, string[], BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "withdrawImbalance",
    values: [BytesLike, BigNumberish, string[], BigNumberish[]]
  ): string;

  decodeFunctionResult(
    functionFragment: "ADD_LIQUIDITY_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "MISC_OPERATION_ROLE",
    data: BytesLike
  ): Result;
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
  decodeFunctionResult(functionFragment: "deploy", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "manager", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "vault", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "withdraw", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "withdrawImbalance",
    data: BytesLike
  ): Result;

  events: {};
}

export class BalancerControllerV2 extends BaseContract {
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

  interface: BalancerControllerV2Interface;

  functions: {
    ADD_LIQUIDITY_ROLE(overrides?: CallOverrides): Promise<[string]>;

    MISC_OPERATION_ROLE(overrides?: CallOverrides): Promise<[string]>;

    REMOVE_LIQUIDITY_ROLE(overrides?: CallOverrides): Promise<[string]>;

    accessControl(overrides?: CallOverrides): Promise<[string]>;

    addressRegistry(overrides?: CallOverrides): Promise<[string]>;

    deploy(
      poolId: BytesLike,
      tokens: string[],
      amounts: BigNumberish[],
      poolAmountOut: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    manager(overrides?: CallOverrides): Promise<[string]>;

    vault(overrides?: CallOverrides): Promise<[string]>;

    withdraw(
      poolId: BytesLike,
      maxBurnAmount: BigNumberish,
      tokens: string[],
      exactAmountsOut: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    withdrawImbalance(
      poolId: BytesLike,
      poolAmountIn: BigNumberish,
      tokens: string[],
      minAmountsOut: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  ADD_LIQUIDITY_ROLE(overrides?: CallOverrides): Promise<string>;

  MISC_OPERATION_ROLE(overrides?: CallOverrides): Promise<string>;

  REMOVE_LIQUIDITY_ROLE(overrides?: CallOverrides): Promise<string>;

  accessControl(overrides?: CallOverrides): Promise<string>;

  addressRegistry(overrides?: CallOverrides): Promise<string>;

  deploy(
    poolId: BytesLike,
    tokens: string[],
    amounts: BigNumberish[],
    poolAmountOut: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  manager(overrides?: CallOverrides): Promise<string>;

  vault(overrides?: CallOverrides): Promise<string>;

  withdraw(
    poolId: BytesLike,
    maxBurnAmount: BigNumberish,
    tokens: string[],
    exactAmountsOut: BigNumberish[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  withdrawImbalance(
    poolId: BytesLike,
    poolAmountIn: BigNumberish,
    tokens: string[],
    minAmountsOut: BigNumberish[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    ADD_LIQUIDITY_ROLE(overrides?: CallOverrides): Promise<string>;

    MISC_OPERATION_ROLE(overrides?: CallOverrides): Promise<string>;

    REMOVE_LIQUIDITY_ROLE(overrides?: CallOverrides): Promise<string>;

    accessControl(overrides?: CallOverrides): Promise<string>;

    addressRegistry(overrides?: CallOverrides): Promise<string>;

    deploy(
      poolId: BytesLike,
      tokens: string[],
      amounts: BigNumberish[],
      poolAmountOut: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    manager(overrides?: CallOverrides): Promise<string>;

    vault(overrides?: CallOverrides): Promise<string>;

    withdraw(
      poolId: BytesLike,
      maxBurnAmount: BigNumberish,
      tokens: string[],
      exactAmountsOut: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<void>;

    withdrawImbalance(
      poolId: BytesLike,
      poolAmountIn: BigNumberish,
      tokens: string[],
      minAmountsOut: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {};

  estimateGas: {
    ADD_LIQUIDITY_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    MISC_OPERATION_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    REMOVE_LIQUIDITY_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    accessControl(overrides?: CallOverrides): Promise<BigNumber>;

    addressRegistry(overrides?: CallOverrides): Promise<BigNumber>;

    deploy(
      poolId: BytesLike,
      tokens: string[],
      amounts: BigNumberish[],
      poolAmountOut: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    manager(overrides?: CallOverrides): Promise<BigNumber>;

    vault(overrides?: CallOverrides): Promise<BigNumber>;

    withdraw(
      poolId: BytesLike,
      maxBurnAmount: BigNumberish,
      tokens: string[],
      exactAmountsOut: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    withdrawImbalance(
      poolId: BytesLike,
      poolAmountIn: BigNumberish,
      tokens: string[],
      minAmountsOut: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    ADD_LIQUIDITY_ROLE(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    MISC_OPERATION_ROLE(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    REMOVE_LIQUIDITY_ROLE(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    accessControl(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    addressRegistry(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    deploy(
      poolId: BytesLike,
      tokens: string[],
      amounts: BigNumberish[],
      poolAmountOut: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    manager(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    vault(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    withdraw(
      poolId: BytesLike,
      maxBurnAmount: BigNumberish,
      tokens: string[],
      exactAmountsOut: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    withdrawImbalance(
      poolId: BytesLike,
      poolAmountIn: BigNumberish,
      tokens: string[],
      minAmountsOut: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
