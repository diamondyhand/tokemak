import type {BaseContract} from "ethers";

import {IStateReceiver} from "../../typechain";
import {SecondaryChain} from "./secondaryChain";

export class PolygonChain extends SecondaryChain {
    private STATE_SENDER_CALLER = "0x0000000000000000000000000000000000001001";
    private stateReceiver: IStateReceiver | null = null;
    private stateSender: BaseContract | null = null;

    constructor(portNumber: number, forkingUrl: string, chainId: number, debug = false) {
        super(portNumber, forkingUrl, chainId, debug);
    }

    async setupBridge(stateReceiver: IStateReceiver, stateSender: BaseContract): Promise<void> {
        await this.provider.send("hardhat_impersonateAccount", [this.STATE_SENDER_CALLER]);
        await this.provider.send("hardhat_setBalance", [this.STATE_SENDER_CALLER, "0x100000000000000"]);
        this.stateReceiver = stateReceiver;
        this.stateSender = stateSender;
    }

    async transferEvent(blockNumber: number): Promise<void> {
        if (!this.stateSender || !this.stateReceiver) {
            throw new Error("Please set stateSender and stateReceiver by calling setupBridge() function first");
        }

        const logs = await this.stateSender.queryFilter(this.stateSender.filters.StateSynced(), blockNumber);

        if (logs.length == 0) {
            console.log("No event found");
        }

        for (let i = 0; i < logs.length; i++) {
            const args = logs[i].args || [];

            if (args.length > 0) {
                const stateSenderCaller = await this.provider.getSigner(this.STATE_SENDER_CALLER);
                await this.stateReceiver.connect(stateSenderCaller).onStateReceive(args[0], args[2].toString());
            }
        }
    }
}
