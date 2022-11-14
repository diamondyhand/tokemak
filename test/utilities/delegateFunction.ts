import * as sigUtil from "eth-sig-util";
import * as util from "ethereumjs-util";

const signingTypes = {
    EIP712Domain: [
        {name: "name", type: "string"},
        {name: "version", type: "string"},
        {name: "chainId", type: "uint256"},
        {name: "verifyingContract", type: "address"},
    ],
    DelegateMap: [
        {name: "functionId", type: "bytes32"},
        {name: "otherParty", type: "address"},
        {name: "mustRelinquish", type: "bool"},
    ],
    DelegatePayload: [
        {name: "nonce", type: "uint256"},
        {name: "sets", type: "DelegateMap[]"},
    ],
    FunctionsListPayload: [
        {name: "nonce", type: "uint256"},
        {name: "sets", type: "bytes32[]"},
    ],
};

const getSignatureData = (
    address: string,
    chainId: number,
    message: DelegatePayload | FunctionsListPayload,
    primaryType: PrimaryTypes
): sigUtil.TypedMessage<typeof signingTypes> => ({
    types: signingTypes,
    primaryType,
    domain: {
        name: "Tokemak Delegate Function",
        version: "1",
        chainId,
        verifyingContract: address.toLowerCase(),
    },
    message,
});

export const personalSign = (
    address: string,
    message: DelegatePayload | FunctionsListPayload,
    primaryType: PrimaryTypes,
    privateKey: string,
    chainId = 1
): string => {
    const data = getSignatureData(address, chainId, message, primaryType);
    const hashedData = sigUtil.TypedDataUtils.sign(data, true);

    const msg = util.toBuffer(hashedData);
    const msgHash = util.hashPersonalMessage(msg);
    const sig = util.ecsign(msgHash, util.toBuffer(privateKey));
    return sigUtil.concatSig(util.toBuffer(sig.v), sig.r, sig.s);
};

export const EI712Sign = (
    address: string,
    message: DelegatePayload | FunctionsListPayload,
    primaryType: PrimaryTypes,
    privateKey: string,
    chainId = 1
): string => {
    const data = getSignatureData(address, chainId, message, primaryType);
    return sigUtil.signTypedData_v4(util.toBuffer(privateKey) as Buffer, {
        data,
    });
};

export type DelegateMap = {
    functionId: string;
    otherParty: string;
    mustRelinquish: boolean;
};

export type DelegatePayload = {
    sets: DelegateMap[];
    nonce: number;
};

export enum SignatureType {
    EIP712 = 1,
    EthSign = 2,
}

export enum PrimaryTypes {
    DelegatePayload = "DelegatePayload",
    FunctionsListPayload = "FunctionsListPayload",
}

export type DelegateMapView = {
    functionId: string;
    otherParty: string;
    mustRelinquish: boolean;
    pending: boolean;
};

export type FunctionsListPayload = {
    sets: string[];
    nonce: number;
};
