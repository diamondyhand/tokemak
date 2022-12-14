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
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface IFraxUnifiedFarmInterface extends ethers.utils.Interface {
  functions: {
    "lockedLiquidityOf(address)": FunctionFragment;
    "lockedStakesOf(address)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "lockedLiquidityOf",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "lockedStakesOf",
    values: [string]
  ): string;

  decodeFunctionResult(
    functionFragment: "lockedLiquidityOf",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "lockedStakesOf",
    data: BytesLike
  ): Result;

  events: {};
}

export class IFraxUnifiedFarm extends BaseContract {
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

  interface: IFraxUnifiedFarmInterface;

  functions: {
    lockedLiquidityOf(
      account: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    lockedStakesOf(
      account: string,
      overrides?: CallOverrides
    ): Promise<
      [
        ([string, BigNumber, BigNumber, BigNumber, BigNumber] & {
          kek_id: string;
          start_timestamp: BigNumber;
          liquidity: BigNumber;
          ending_timestamp: BigNumber;
          lock_multiplier: BigNumber;
        })[]
      ]
    >;
  };

  lockedLiquidityOf(
    account: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  lockedStakesOf(
    account: string,
    overrides?: CallOverrides
  ): Promise<
    ([string, BigNumber, BigNumber, BigNumber, BigNumber] & {
      kek_id: string;
      start_timestamp: BigNumber;
      liquidity: BigNumber;
      ending_timestamp: BigNumber;
      lock_multiplier: BigNumber;
    })[]
  >;

  callStatic: {
    lockedLiquidityOf(
      account: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    lockedStakesOf(
      account: string,
      overrides?: CallOverrides
    ): Promise<
      ([string, BigNumber, BigNumber, BigNumber, BigNumber] & {
        kek_id: string;
        start_timestamp: BigNumber;
        liquidity: BigNumber;
        ending_timestamp: BigNumber;
        lock_multiplier: BigNumber;
      })[]
    >;
  };

  filters: {};

  estimateGas: {
    lockedLiquidityOf(
      account: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    lockedStakesOf(
      account: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    lockedLiquidityOf(
      account: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    lockedStakesOf(
      account: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
