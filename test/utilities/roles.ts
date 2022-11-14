import {ethers} from "hardhat";

export const ADD_LIQUIDITY_ROLE = encodeRole("ADD_LIQUIDITY_ROLE");
export const REMOVE_LIQUIDITY_ROLE = encodeRole("REMOVE_LIQUIDITY_ROLE");
export const MISC_OPERATION_ROLE = encodeRole("MISC_OPERATION_ROLE");

function encodeRole(name: string): string {
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(name));
}
