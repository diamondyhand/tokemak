import {BigNumberish} from "@ethersproject/bignumber";
import {ethers} from "hardhat";

import * as sigUtil from "eth-sig-util";
import * as util from "ethereumjs-util";

export type VoteTokenMultiplier = {
    token: string;
    multiplier: BigNumberish;
};

export const getTokenMultiplier = (tokenAddress: string, multiplier: number): VoteTokenMultiplier => {
    return {
        token: tokenAddress,
        multiplier: ethers.utils.parseUnits(multiplier.toString(), 18),
    };
};

export const VoteAmount = (number: number) => {
    return ethers.utils.parseUnits(number.toString(), 18).toString();
};

const signingTypes = {
    EIP712Domain: [
        {name: "name", type: "string"},
        {name: "version", type: "string"},
        {name: "chainId", type: "uint256"},
        {name: "verifyingContract", type: "address"},
    ],
    UserVotePayload: [
        {name: "account", type: "address"},
        {name: "voteSessionKey", type: "bytes32"},
        {name: "nonce", type: "uint256"},
        {name: "chainId", type: "uint256"},
        {name: "totalVotes", type: "uint256"},
        {name: "allocations", type: "UserVoteAllocationItem[]"},
    ],
    UserVoteAllocationItem: [
        {name: "reactorKey", type: "bytes32"},
        {name: "amount", type: "uint256"},
    ],
};

export const personalSignVote = (
    address: string,
    vote: UserVotePayload,
    privateKey: string,
    signedOnChainOverride = -1
): Signature => {
    if (signedOnChainOverride === -1) signedOnChainOverride = vote.chainId;

    const data = getSignatureData(address, signedOnChainOverride, vote);

    const hashedData = sigUtil.TypedDataUtils.sign(data, true);
    const message = util.toBuffer(hashedData);
    const msgHash = util.hashPersonalMessage(message);
    const sig = util.ecsign(msgHash, util.toBuffer(privateKey) as Buffer);

    return {v: sig.v, r: sig.r, s: sig.s, signatureType: SignatureType.EthSign};
};

const getSignatureData = (
    address: string,
    signedOnChainOverride = -1,
    vote: UserVotePayload
): sigUtil.TypedMessage<typeof signingTypes> => ({
    types: signingTypes,
    primaryType: "UserVotePayload",
    domain: {
        name: "Tokemak Voting",
        version: "1",
        chainId: signedOnChainOverride,
        verifyingContract: address.toLowerCase(),
    },
    message: vote,
});

export const signVote = (
    address: string,
    vote: UserVotePayload,
    privateKey: string,
    signedOnChainOverride = -1
): Signature => {
    if (signedOnChainOverride === -1) signedOnChainOverride = vote.chainId;

    const data = getSignatureData(address, signedOnChainOverride, vote);
    const msg = sigUtil.signTypedData_v4(util.toBuffer(privateKey) as Buffer, {
        data,
    });
    const sig = ethers.utils.splitSignature(msg);

    return {v: sig.v, r: sig.r, s: sig.s, signatureType: SignatureType.EIP712};
};

export enum SignatureType {
    EIP712 = 1,
    EthSign = 2,
}

export type Signature = {
    v: number;
    r: Buffer | string;
    s: Buffer | string;
    signatureType: SignatureType;
};

export type UserVotePayload = {
    account: string;
    voteSessionKey: string;
    nonce: BigNumberish;
    chainId: number;
    totalVotes: BigNumberish;
    allocations: UserVoteAllocationItem[];
};

export type UserVoteAllocationItem = {
    reactorKey: string;
    amount: BigNumberish;
};
