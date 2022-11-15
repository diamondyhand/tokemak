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

interface IDelegateFunctionInterface extends ethers.utils.Interface {
  functions: {
    "acceptDelegation(tuple[])": FunctionFragment;
    "cancelPendingDelegation(bytes32[])": FunctionFragment;
    "cancelPendingDelegationWithEIP1271(address,(bytes32[],uint256),bytes,uint8)": FunctionFragment;
    "contractWalletNonces(address)": FunctionFragment;
    "delegate(tuple[])": FunctionFragment;
    "delegateWithEIP1271(address,(tuple[],uint256),bytes,uint8)": FunctionFragment;
    "getDelegation(address,bytes32)": FunctionFragment;
    "getDelegations(address)": FunctionFragment;
    "pause()": FunctionFragment;
    "rejectDelegation(tuple[])": FunctionFragment;
    "relinquishDelegation(tuple[])": FunctionFragment;
    "removeDelegation(bytes32[])": FunctionFragment;
    "removeDelegationWithEIP1271(address,(bytes32[],uint256),bytes,uint8)": FunctionFragment;
    "setAllowedFunctions(tuple[])": FunctionFragment;
    "unpause()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "acceptDelegation",
    values: [{ originalParty: string; functionId: BytesLike }[]]
  ): string;
  encodeFunctionData(
    functionFragment: "cancelPendingDelegation",
    values: [BytesLike[]]
  ): string;
  encodeFunctionData(
    functionFragment: "cancelPendingDelegationWithEIP1271",
    values: [
      string,
      { sets: BytesLike[]; nonce: BigNumberish },
      BytesLike,
      BigNumberish
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "contractWalletNonces",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "delegate",
    values: [
      { functionId: BytesLike; otherParty: string; mustRelinquish: boolean }[]
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "delegateWithEIP1271",
    values: [
      string,
      {
        sets: {
          functionId: BytesLike;
          otherParty: string;
          mustRelinquish: boolean;
        }[];
        nonce: BigNumberish;
      },
      BytesLike,
      BigNumberish
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "getDelegation",
    values: [string, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getDelegations",
    values: [string]
  ): string;
  encodeFunctionData(functionFragment: "pause", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "rejectDelegation",
    values: [{ originalParty: string; functionId: BytesLike }[]]
  ): string;
  encodeFunctionData(
    functionFragment: "relinquishDelegation",
    values: [{ originalParty: string; functionId: BytesLike }[]]
  ): string;
  encodeFunctionData(
    functionFragment: "removeDelegation",
    values: [BytesLike[]]
  ): string;
  encodeFunctionData(
    functionFragment: "removeDelegationWithEIP1271",
    values: [
      string,
      { sets: BytesLike[]; nonce: BigNumberish },
      BytesLike,
      BigNumberish
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "setAllowedFunctions",
    values: [{ id: BytesLike }[]]
  ): string;
  encodeFunctionData(functionFragment: "unpause", values?: undefined): string;

  decodeFunctionResult(
    functionFragment: "acceptDelegation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "cancelPendingDelegation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "cancelPendingDelegationWithEIP1271",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "contractWalletNonces",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "delegate", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "delegateWithEIP1271",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getDelegation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getDelegations",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "pause", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "rejectDelegation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "relinquishDelegation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "removeDelegation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "removeDelegationWithEIP1271",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setAllowedFunctions",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "unpause", data: BytesLike): Result;

  events: {
    "AllowedFunctionsSet(tuple[])": EventFragment;
    "DelegationAccepted(address,address,bytes32,bool)": EventFragment;
    "DelegationRejected(address,address,bytes32,bool)": EventFragment;
    "DelegationRelinquished(address,address,bytes32,bool)": EventFragment;
    "DelegationRemoved(address,address,bytes32,bool)": EventFragment;
    "PendingDelegationAdded(address,address,bytes32,bool)": EventFragment;
    "PendingDelegationRemoved(address,address,bytes32,bool)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "AllowedFunctionsSet"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "DelegationAccepted"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "DelegationRejected"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "DelegationRelinquished"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "DelegationRemoved"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "PendingDelegationAdded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "PendingDelegationRemoved"): EventFragment;
}

export type AllowedFunctionsSetEvent = TypedEvent<
  [([string] & { id: string })[]] & { functions: ([string] & { id: string })[] }
>;

export type DelegationAcceptedEvent = TypedEvent<
  [string, string, string, boolean] & {
    from: string;
    to: string;
    functionId: string;
    mustRelinquish: boolean;
  }
>;

export type DelegationRejectedEvent = TypedEvent<
  [string, string, string, boolean] & {
    from: string;
    to: string;
    functionId: string;
    mustRelinquish: boolean;
  }
>;

export type DelegationRelinquishedEvent = TypedEvent<
  [string, string, string, boolean] & {
    from: string;
    to: string;
    functionId: string;
    mustRelinquish: boolean;
  }
>;

export type DelegationRemovedEvent = TypedEvent<
  [string, string, string, boolean] & {
    from: string;
    to: string;
    functionId: string;
    mustRelinquish: boolean;
  }
>;

export type PendingDelegationAddedEvent = TypedEvent<
  [string, string, string, boolean] & {
    from: string;
    to: string;
    functionId: string;
    mustRelinquish: boolean;
  }
>;

export type PendingDelegationRemovedEvent = TypedEvent<
  [string, string, string, boolean] & {
    from: string;
    to: string;
    functionId: string;
    mustRelinquish: boolean;
  }
>;

export class IDelegateFunction extends BaseContract {
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

  interface: IDelegateFunctionInterface;

  functions: {
    acceptDelegation(
      incoming: { originalParty: string; functionId: BytesLike }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    cancelPendingDelegation(
      functionIds: BytesLike[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    cancelPendingDelegationWithEIP1271(
      contractAddress: string,
      functionsListPayload: { sets: BytesLike[]; nonce: BigNumberish },
      signature: BytesLike,
      signatureType: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    contractWalletNonces(
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    delegate(
      sets: {
        functionId: BytesLike;
        otherParty: string;
        mustRelinquish: boolean;
      }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    delegateWithEIP1271(
      contractAddress: string,
      delegatePayload: {
        sets: {
          functionId: BytesLike;
          otherParty: string;
          mustRelinquish: boolean;
        }[];
        nonce: BigNumberish;
      },
      signature: BytesLike,
      signatureType: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getDelegation(
      from: string,
      functionId: BytesLike,
      overrides?: CallOverrides
    ): Promise<
      [
        [string, string, boolean, boolean] & {
          functionId: string;
          otherParty: string;
          mustRelinquish: boolean;
          pending: boolean;
        }
      ] & {
        map: [string, string, boolean, boolean] & {
          functionId: string;
          otherParty: string;
          mustRelinquish: boolean;
          pending: boolean;
        };
      }
    >;

    getDelegations(
      from: string,
      overrides?: CallOverrides
    ): Promise<
      [
        ([string, string, boolean, boolean] & {
          functionId: string;
          otherParty: string;
          mustRelinquish: boolean;
          pending: boolean;
        })[]
      ] & {
        maps: ([string, string, boolean, boolean] & {
          functionId: string;
          otherParty: string;
          mustRelinquish: boolean;
          pending: boolean;
        })[];
      }
    >;

    pause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    rejectDelegation(
      rejections: { originalParty: string; functionId: BytesLike }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    relinquishDelegation(
      relinquish: { originalParty: string; functionId: BytesLike }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    removeDelegation(
      functionIds: BytesLike[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    removeDelegationWithEIP1271(
      contractAddress: string,
      functionsListPayload: { sets: BytesLike[]; nonce: BigNumberish },
      signature: BytesLike,
      signatureType: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setAllowedFunctions(
      functions: { id: BytesLike }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    unpause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  acceptDelegation(
    incoming: { originalParty: string; functionId: BytesLike }[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  cancelPendingDelegation(
    functionIds: BytesLike[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  cancelPendingDelegationWithEIP1271(
    contractAddress: string,
    functionsListPayload: { sets: BytesLike[]; nonce: BigNumberish },
    signature: BytesLike,
    signatureType: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  contractWalletNonces(
    account: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  delegate(
    sets: {
      functionId: BytesLike;
      otherParty: string;
      mustRelinquish: boolean;
    }[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  delegateWithEIP1271(
    contractAddress: string,
    delegatePayload: {
      sets: {
        functionId: BytesLike;
        otherParty: string;
        mustRelinquish: boolean;
      }[];
      nonce: BigNumberish;
    },
    signature: BytesLike,
    signatureType: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getDelegation(
    from: string,
    functionId: BytesLike,
    overrides?: CallOverrides
  ): Promise<
    [string, string, boolean, boolean] & {
      functionId: string;
      otherParty: string;
      mustRelinquish: boolean;
      pending: boolean;
    }
  >;

  getDelegations(
    from: string,
    overrides?: CallOverrides
  ): Promise<
    ([string, string, boolean, boolean] & {
      functionId: string;
      otherParty: string;
      mustRelinquish: boolean;
      pending: boolean;
    })[]
  >;

  pause(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  rejectDelegation(
    rejections: { originalParty: string; functionId: BytesLike }[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  relinquishDelegation(
    relinquish: { originalParty: string; functionId: BytesLike }[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  removeDelegation(
    functionIds: BytesLike[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  removeDelegationWithEIP1271(
    contractAddress: string,
    functionsListPayload: { sets: BytesLike[]; nonce: BigNumberish },
    signature: BytesLike,
    signatureType: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setAllowedFunctions(
    functions: { id: BytesLike }[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  unpause(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    acceptDelegation(
      incoming: { originalParty: string; functionId: BytesLike }[],
      overrides?: CallOverrides
    ): Promise<void>;

    cancelPendingDelegation(
      functionIds: BytesLike[],
      overrides?: CallOverrides
    ): Promise<void>;

    cancelPendingDelegationWithEIP1271(
      contractAddress: string,
      functionsListPayload: { sets: BytesLike[]; nonce: BigNumberish },
      signature: BytesLike,
      signatureType: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    contractWalletNonces(
      account: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    delegate(
      sets: {
        functionId: BytesLike;
        otherParty: string;
        mustRelinquish: boolean;
      }[],
      overrides?: CallOverrides
    ): Promise<void>;

    delegateWithEIP1271(
      contractAddress: string,
      delegatePayload: {
        sets: {
          functionId: BytesLike;
          otherParty: string;
          mustRelinquish: boolean;
        }[];
        nonce: BigNumberish;
      },
      signature: BytesLike,
      signatureType: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    getDelegation(
      from: string,
      functionId: BytesLike,
      overrides?: CallOverrides
    ): Promise<
      [string, string, boolean, boolean] & {
        functionId: string;
        otherParty: string;
        mustRelinquish: boolean;
        pending: boolean;
      }
    >;

    getDelegations(
      from: string,
      overrides?: CallOverrides
    ): Promise<
      ([string, string, boolean, boolean] & {
        functionId: string;
        otherParty: string;
        mustRelinquish: boolean;
        pending: boolean;
      })[]
    >;

    pause(overrides?: CallOverrides): Promise<void>;

    rejectDelegation(
      rejections: { originalParty: string; functionId: BytesLike }[],
      overrides?: CallOverrides
    ): Promise<void>;

    relinquishDelegation(
      relinquish: { originalParty: string; functionId: BytesLike }[],
      overrides?: CallOverrides
    ): Promise<void>;

    removeDelegation(
      functionIds: BytesLike[],
      overrides?: CallOverrides
    ): Promise<void>;

    removeDelegationWithEIP1271(
      contractAddress: string,
      functionsListPayload: { sets: BytesLike[]; nonce: BigNumberish },
      signature: BytesLike,
      signatureType: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    setAllowedFunctions(
      functions: { id: BytesLike }[],
      overrides?: CallOverrides
    ): Promise<void>;

    unpause(overrides?: CallOverrides): Promise<void>;
  };

  filters: {
    "AllowedFunctionsSet(tuple[])"(
      functions?: null
    ): TypedEventFilter<
      [([string] & { id: string })[]],
      { functions: ([string] & { id: string })[] }
    >;

    AllowedFunctionsSet(
      functions?: null
    ): TypedEventFilter<
      [([string] & { id: string })[]],
      { functions: ([string] & { id: string })[] }
    >;

    "DelegationAccepted(address,address,bytes32,bool)"(
      from?: null,
      to?: null,
      functionId?: null,
      mustRelinquish?: null
    ): TypedEventFilter<
      [string, string, string, boolean],
      { from: string; to: string; functionId: string; mustRelinquish: boolean }
    >;

    DelegationAccepted(
      from?: null,
      to?: null,
      functionId?: null,
      mustRelinquish?: null
    ): TypedEventFilter<
      [string, string, string, boolean],
      { from: string; to: string; functionId: string; mustRelinquish: boolean }
    >;

    "DelegationRejected(address,address,bytes32,bool)"(
      from?: null,
      to?: null,
      functionId?: null,
      mustRelinquish?: null
    ): TypedEventFilter<
      [string, string, string, boolean],
      { from: string; to: string; functionId: string; mustRelinquish: boolean }
    >;

    DelegationRejected(
      from?: null,
      to?: null,
      functionId?: null,
      mustRelinquish?: null
    ): TypedEventFilter<
      [string, string, string, boolean],
      { from: string; to: string; functionId: string; mustRelinquish: boolean }
    >;

    "DelegationRelinquished(address,address,bytes32,bool)"(
      from?: null,
      to?: null,
      functionId?: null,
      mustRelinquish?: null
    ): TypedEventFilter<
      [string, string, string, boolean],
      { from: string; to: string; functionId: string; mustRelinquish: boolean }
    >;

    DelegationRelinquished(
      from?: null,
      to?: null,
      functionId?: null,
      mustRelinquish?: null
    ): TypedEventFilter<
      [string, string, string, boolean],
      { from: string; to: string; functionId: string; mustRelinquish: boolean }
    >;

    "DelegationRemoved(address,address,bytes32,bool)"(
      from?: null,
      to?: null,
      functionId?: null,
      mustRelinquish?: null
    ): TypedEventFilter<
      [string, string, string, boolean],
      { from: string; to: string; functionId: string; mustRelinquish: boolean }
    >;

    DelegationRemoved(
      from?: null,
      to?: null,
      functionId?: null,
      mustRelinquish?: null
    ): TypedEventFilter<
      [string, string, string, boolean],
      { from: string; to: string; functionId: string; mustRelinquish: boolean }
    >;

    "PendingDelegationAdded(address,address,bytes32,bool)"(
      from?: null,
      to?: null,
      functionId?: null,
      mustRelinquish?: null
    ): TypedEventFilter<
      [string, string, string, boolean],
      { from: string; to: string; functionId: string; mustRelinquish: boolean }
    >;

    PendingDelegationAdded(
      from?: null,
      to?: null,
      functionId?: null,
      mustRelinquish?: null
    ): TypedEventFilter<
      [string, string, string, boolean],
      { from: string; to: string; functionId: string; mustRelinquish: boolean }
    >;

    "PendingDelegationRemoved(address,address,bytes32,bool)"(
      from?: null,
      to?: null,
      functionId?: null,
      mustRelinquish?: null
    ): TypedEventFilter<
      [string, string, string, boolean],
      { from: string; to: string; functionId: string; mustRelinquish: boolean }
    >;

    PendingDelegationRemoved(
      from?: null,
      to?: null,
      functionId?: null,
      mustRelinquish?: null
    ): TypedEventFilter<
      [string, string, string, boolean],
      { from: string; to: string; functionId: string; mustRelinquish: boolean }
    >;
  };

  estimateGas: {
    acceptDelegation(
      incoming: { originalParty: string; functionId: BytesLike }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    cancelPendingDelegation(
      functionIds: BytesLike[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    cancelPendingDelegationWithEIP1271(
      contractAddress: string,
      functionsListPayload: { sets: BytesLike[]; nonce: BigNumberish },
      signature: BytesLike,
      signatureType: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    contractWalletNonces(
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    delegate(
      sets: {
        functionId: BytesLike;
        otherParty: string;
        mustRelinquish: boolean;
      }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    delegateWithEIP1271(
      contractAddress: string,
      delegatePayload: {
        sets: {
          functionId: BytesLike;
          otherParty: string;
          mustRelinquish: boolean;
        }[];
        nonce: BigNumberish;
      },
      signature: BytesLike,
      signatureType: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getDelegation(
      from: string,
      functionId: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getDelegations(from: string, overrides?: CallOverrides): Promise<BigNumber>;

    pause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    rejectDelegation(
      rejections: { originalParty: string; functionId: BytesLike }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    relinquishDelegation(
      relinquish: { originalParty: string; functionId: BytesLike }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    removeDelegation(
      functionIds: BytesLike[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    removeDelegationWithEIP1271(
      contractAddress: string,
      functionsListPayload: { sets: BytesLike[]; nonce: BigNumberish },
      signature: BytesLike,
      signatureType: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setAllowedFunctions(
      functions: { id: BytesLike }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    unpause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    acceptDelegation(
      incoming: { originalParty: string; functionId: BytesLike }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    cancelPendingDelegation(
      functionIds: BytesLike[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    cancelPendingDelegationWithEIP1271(
      contractAddress: string,
      functionsListPayload: { sets: BytesLike[]; nonce: BigNumberish },
      signature: BytesLike,
      signatureType: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    contractWalletNonces(
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    delegate(
      sets: {
        functionId: BytesLike;
        otherParty: string;
        mustRelinquish: boolean;
      }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    delegateWithEIP1271(
      contractAddress: string,
      delegatePayload: {
        sets: {
          functionId: BytesLike;
          otherParty: string;
          mustRelinquish: boolean;
        }[];
        nonce: BigNumberish;
      },
      signature: BytesLike,
      signatureType: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getDelegation(
      from: string,
      functionId: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getDelegations(
      from: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    pause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    rejectDelegation(
      rejections: { originalParty: string; functionId: BytesLike }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    relinquishDelegation(
      relinquish: { originalParty: string; functionId: BytesLike }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    removeDelegation(
      functionIds: BytesLike[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    removeDelegationWithEIP1271(
      contractAddress: string,
      functionsListPayload: { sets: BytesLike[]; nonce: BigNumberish },
      signature: BytesLike,
      signatureType: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setAllowedFunctions(
      functions: { id: BytesLike }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    unpause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}