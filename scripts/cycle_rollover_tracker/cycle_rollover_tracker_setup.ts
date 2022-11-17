import {ethers, artifacts} from "hardhat";
import {EventProxy} from "../../typechain";

export interface DesinationSetupInput {
    sender: string;
    events: EventType[];
    destinations: string[];
}

export interface CycleRolloverTrackerSetupInput {
    sender: string;
    events: EventType[];
    destinations: string[];
}

export enum EventType {
    CYCLE_ROLLOVER_START = "Cycle Rollover Start",
    CYCLE_ROLLOVER_COMPLETE = "Cycle Complete",
}

export const runDestinationSetup = async (
    input: CycleRolloverTrackerSetupInput,
    eventProxyAddress: string
): Promise<void> => {
    const SENDER_ADDRESS = input.sender;
    const EVENT_PROXY_ADDRESS = eventProxyAddress;

    const eventProxyArtifact = await artifacts.require("EventProxy");
    const proxy = (await ethers.getContractAt(eventProxyArtifact.abi, EVENT_PROXY_ADDRESS)) as unknown as EventProxy;

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
