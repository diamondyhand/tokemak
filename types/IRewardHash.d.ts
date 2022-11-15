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

interface IRewardHashInterface extends ethers.utils.Interface {
  functions: {
    "cycleHashes(uint256)": FunctionFragment;
    "setCycleHashes(uint256,string,string)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "cycleHashes",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "setCycleHashes",
    values: [BigNumberish, string, string]
  ): string;

  decodeFunctionResult(
    functionFragment: "cycleHashes",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setCycleHashes",
    data: BytesLike
  ): Result;

  events: {
    "CycleHashAdded(uint256,string,string)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "CycleHashAdded"): EventFragment;
}

export type CycleHashAddedEvent = TypedEvent<
  [BigNumber, string, string] & {
    cycleIndex: BigNumber;
    latestClaimableHash: string;
    cycleHash: string;
  }
>;

export class IRewardHash extends BaseContract {
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

  interface: IRewardHashInterface;

  functions: {
    cycleHashes(
      index: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string, string] & { latestClaimable: string; cycle: string }>;

    setCycleHashes(
      index: BigNumberish,
      latestClaimableIpfsHash: string,
      cycleIpfsHash: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  cycleHashes(
    index: BigNumberish,
    overrides?: CallOverrides
  ): Promise<[string, string] & { latestClaimable: string; cycle: string }>;

  setCycleHashes(
    index: BigNumberish,
    latestClaimableIpfsHash: string,
    cycleIpfsHash: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    cycleHashes(
      index: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string, string] & { latestClaimable: string; cycle: string }>;

    setCycleHashes(
      index: BigNumberish,
      latestClaimableIpfsHash: string,
      cycleIpfsHash: string,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "CycleHashAdded(uint256,string,string)"(
      cycleIndex?: null,
      latestClaimableHash?: null,
      cycleHash?: null
    ): TypedEventFilter<
      [BigNumber, string, string],
      { cycleIndex: BigNumber; latestClaimableHash: string; cycleHash: string }
    >;

    CycleHashAdded(
      cycleIndex?: null,
      latestClaimableHash?: null,
      cycleHash?: null
    ): TypedEventFilter<
      [BigNumber, string, string],
      { cycleIndex: BigNumber; latestClaimableHash: string; cycleHash: string }
    >;
  };

  estimateGas: {
    cycleHashes(
      index: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    setCycleHashes(
      index: BigNumberish,
      latestClaimableIpfsHash: string,
      cycleIpfsHash: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    cycleHashes(
      index: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    setCycleHashes(
      index: BigNumberish,
      latestClaimableIpfsHash: string,
      cycleIpfsHash: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}