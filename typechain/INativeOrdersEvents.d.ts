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
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface INativeOrdersEventsInterface extends ethers.utils.Interface {
  functions: {};

  events: {
    "LimitOrderFilled(bytes32,address,address,address,address,address,uint128,uint128,uint128,uint256,bytes32)": EventFragment;
    "OrderCancelled(bytes32,address)": EventFragment;
    "OrderSignerRegistered(address,address,bool)": EventFragment;
    "PairCancelledLimitOrders(address,address,address,uint256)": EventFragment;
    "PairCancelledRfqOrders(address,address,address,uint256)": EventFragment;
    "RfqOrderFilled(bytes32,address,address,address,address,uint128,uint128,bytes32)": EventFragment;
    "RfqOrderOriginsAllowed(address,address[],bool)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "LimitOrderFilled"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OrderCancelled"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OrderSignerRegistered"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "PairCancelledLimitOrders"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "PairCancelledRfqOrders"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RfqOrderFilled"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RfqOrderOriginsAllowed"): EventFragment;
}

export type LimitOrderFilledEvent = TypedEvent<
  [
    string,
    string,
    string,
    string,
    string,
    string,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    string
  ] & {
    orderHash: string;
    maker: string;
    taker: string;
    feeRecipient: string;
    makerToken: string;
    takerToken: string;
    takerTokenFilledAmount: BigNumber;
    makerTokenFilledAmount: BigNumber;
    takerTokenFeeFilledAmount: BigNumber;
    protocolFeePaid: BigNumber;
    pool: string;
  }
>;

export type OrderCancelledEvent = TypedEvent<
  [string, string] & { orderHash: string; maker: string }
>;

export type OrderSignerRegisteredEvent = TypedEvent<
  [string, string, boolean] & {
    maker: string;
    signer: string;
    allowed: boolean;
  }
>;

export type PairCancelledLimitOrdersEvent = TypedEvent<
  [string, string, string, BigNumber] & {
    maker: string;
    makerToken: string;
    takerToken: string;
    minValidSalt: BigNumber;
  }
>;

export type PairCancelledRfqOrdersEvent = TypedEvent<
  [string, string, string, BigNumber] & {
    maker: string;
    makerToken: string;
    takerToken: string;
    minValidSalt: BigNumber;
  }
>;

export type RfqOrderFilledEvent = TypedEvent<
  [string, string, string, string, string, BigNumber, BigNumber, string] & {
    orderHash: string;
    maker: string;
    taker: string;
    makerToken: string;
    takerToken: string;
    takerTokenFilledAmount: BigNumber;
    makerTokenFilledAmount: BigNumber;
    pool: string;
  }
>;

export type RfqOrderOriginsAllowedEvent = TypedEvent<
  [string, string[], boolean] & {
    origin: string;
    addrs: string[];
    allowed: boolean;
  }
>;

export class INativeOrdersEvents extends BaseContract {
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

  interface: INativeOrdersEventsInterface;

  functions: {};

  callStatic: {};

  filters: {
    "LimitOrderFilled(bytes32,address,address,address,address,address,uint128,uint128,uint128,uint256,bytes32)"(
      orderHash?: null,
      maker?: null,
      taker?: null,
      feeRecipient?: null,
      makerToken?: null,
      takerToken?: null,
      takerTokenFilledAmount?: null,
      makerTokenFilledAmount?: null,
      takerTokenFeeFilledAmount?: null,
      protocolFeePaid?: null,
      pool?: null
    ): TypedEventFilter<
      [
        string,
        string,
        string,
        string,
        string,
        string,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        string
      ],
      {
        orderHash: string;
        maker: string;
        taker: string;
        feeRecipient: string;
        makerToken: string;
        takerToken: string;
        takerTokenFilledAmount: BigNumber;
        makerTokenFilledAmount: BigNumber;
        takerTokenFeeFilledAmount: BigNumber;
        protocolFeePaid: BigNumber;
        pool: string;
      }
    >;

    LimitOrderFilled(
      orderHash?: null,
      maker?: null,
      taker?: null,
      feeRecipient?: null,
      makerToken?: null,
      takerToken?: null,
      takerTokenFilledAmount?: null,
      makerTokenFilledAmount?: null,
      takerTokenFeeFilledAmount?: null,
      protocolFeePaid?: null,
      pool?: null
    ): TypedEventFilter<
      [
        string,
        string,
        string,
        string,
        string,
        string,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        string
      ],
      {
        orderHash: string;
        maker: string;
        taker: string;
        feeRecipient: string;
        makerToken: string;
        takerToken: string;
        takerTokenFilledAmount: BigNumber;
        makerTokenFilledAmount: BigNumber;
        takerTokenFeeFilledAmount: BigNumber;
        protocolFeePaid: BigNumber;
        pool: string;
      }
    >;

    "OrderCancelled(bytes32,address)"(
      orderHash?: null,
      maker?: null
    ): TypedEventFilter<[string, string], { orderHash: string; maker: string }>;

    OrderCancelled(
      orderHash?: null,
      maker?: null
    ): TypedEventFilter<[string, string], { orderHash: string; maker: string }>;

    "OrderSignerRegistered(address,address,bool)"(
      maker?: null,
      signer?: null,
      allowed?: null
    ): TypedEventFilter<
      [string, string, boolean],
      { maker: string; signer: string; allowed: boolean }
    >;

    OrderSignerRegistered(
      maker?: null,
      signer?: null,
      allowed?: null
    ): TypedEventFilter<
      [string, string, boolean],
      { maker: string; signer: string; allowed: boolean }
    >;

    "PairCancelledLimitOrders(address,address,address,uint256)"(
      maker?: null,
      makerToken?: null,
      takerToken?: null,
      minValidSalt?: null
    ): TypedEventFilter<
      [string, string, string, BigNumber],
      {
        maker: string;
        makerToken: string;
        takerToken: string;
        minValidSalt: BigNumber;
      }
    >;

    PairCancelledLimitOrders(
      maker?: null,
      makerToken?: null,
      takerToken?: null,
      minValidSalt?: null
    ): TypedEventFilter<
      [string, string, string, BigNumber],
      {
        maker: string;
        makerToken: string;
        takerToken: string;
        minValidSalt: BigNumber;
      }
    >;

    "PairCancelledRfqOrders(address,address,address,uint256)"(
      maker?: null,
      makerToken?: null,
      takerToken?: null,
      minValidSalt?: null
    ): TypedEventFilter<
      [string, string, string, BigNumber],
      {
        maker: string;
        makerToken: string;
        takerToken: string;
        minValidSalt: BigNumber;
      }
    >;

    PairCancelledRfqOrders(
      maker?: null,
      makerToken?: null,
      takerToken?: null,
      minValidSalt?: null
    ): TypedEventFilter<
      [string, string, string, BigNumber],
      {
        maker: string;
        makerToken: string;
        takerToken: string;
        minValidSalt: BigNumber;
      }
    >;

    "RfqOrderFilled(bytes32,address,address,address,address,uint128,uint128,bytes32)"(
      orderHash?: null,
      maker?: null,
      taker?: null,
      makerToken?: null,
      takerToken?: null,
      takerTokenFilledAmount?: null,
      makerTokenFilledAmount?: null,
      pool?: null
    ): TypedEventFilter<
      [string, string, string, string, string, BigNumber, BigNumber, string],
      {
        orderHash: string;
        maker: string;
        taker: string;
        makerToken: string;
        takerToken: string;
        takerTokenFilledAmount: BigNumber;
        makerTokenFilledAmount: BigNumber;
        pool: string;
      }
    >;

    RfqOrderFilled(
      orderHash?: null,
      maker?: null,
      taker?: null,
      makerToken?: null,
      takerToken?: null,
      takerTokenFilledAmount?: null,
      makerTokenFilledAmount?: null,
      pool?: null
    ): TypedEventFilter<
      [string, string, string, string, string, BigNumber, BigNumber, string],
      {
        orderHash: string;
        maker: string;
        taker: string;
        makerToken: string;
        takerToken: string;
        takerTokenFilledAmount: BigNumber;
        makerTokenFilledAmount: BigNumber;
        pool: string;
      }
    >;

    "RfqOrderOriginsAllowed(address,address[],bool)"(
      origin?: null,
      addrs?: null,
      allowed?: null
    ): TypedEventFilter<
      [string, string[], boolean],
      { origin: string; addrs: string[]; allowed: boolean }
    >;

    RfqOrderOriginsAllowed(
      origin?: null,
      addrs?: null,
      allowed?: null
    ): TypedEventFilter<
      [string, string[], boolean],
      { origin: string; addrs: string[]; allowed: boolean }
    >;
  };

  estimateGas: {};

  populateTransaction: {};
}