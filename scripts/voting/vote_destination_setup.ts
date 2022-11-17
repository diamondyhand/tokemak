import {ethers, artifacts} from "hardhat";
import {EventProxy} from "../../typechain";
import {Contract} from "../config";

export interface VoteDesinationSetupInput {
    sender: string;
    events: EventType[];
    destinations: string[];
}

export enum EventType {
    DEPOSIT = "Deposit",
    TRANSFER = "Transfer",
    WITHDRAW = "Withdraw",
    SLASH = "Slash",
    CYCLE_ROLLOVER = "Cycle Complete",
    VOTE = "Vote",
    WITHDRAWAL_REQUEST = "Withdrawal Request",
}

export const runVoteDestinationSetup = async (
    input: VoteDesinationSetupInput,
    eventProxyAddress: string
): Promise<void> => {
    const SENDER_ADDRESS = input.sender;
    const EVENT_PROXY_ADDRESS = eventProxyAddress;

    const eventProxyArtifact = await artifacts.require("EventProxy");
    const proxy = (await ethers.getContractAt(eventProxyArtifact.abi, EVENT_PROXY_ADDRESS)) as unknown as EventProxy;

    //Ensure the pool is registered as a sender
    const isSender = await proxy.registeredSenders(SENDER_ADDRESS);
    if (!isSender) {
        const tx = await proxy.setSenderRegistration(SENDER_ADDRESS, true);
        await tx.wait();
        console.log("Registered as sender");
    } else {
        console.log("Already registered as sender");
    }

    const destinations = input.events.map((x) => {
        return {
            sender: SENDER_ADDRESS,
            eventType: ethers.utils.formatBytes32String(x),
            destinations: input.destinations,
        };
    });

    const regtx = await proxy.registerDestinations(destinations);
    await regtx.wait();

    console.log("Registered destinations");
    console.log(destinations);
};
