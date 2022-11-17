import * as yargs from "yargs";
import {Arguments} from "yargs";
import {EventType, runVoteDestinationSetup} from "../voting/vote_destination_setup";

const voteDestinationSetupManual: yargs.CommandModule = {
    command: "vote-destination-setup-manual",
    describe: "configure polygon event proxy to forward messages to target contracts (fully manual input)",
    builder: (argv) => {
        argv.option("event-proxy", {
            alias: "ep",
            type: "string",
            describe: "address to event proxy",
            demandOption: true,
            requiresArg: true,
        });

        argv.option("sender", {
            type: "string",
            demandOption: true,
            requiresArg: true,
        });

        argv.option("event-types", {
            alias: "et",
            type: "array",
            demandOption: true,
            requiresArg: true,
            choices: Object.values(EventType),
        });

        argv.option("destinations", {
            alias: "dest",
            type: "array",
            describe: "destination contract addresses",
            demandOption: true,
            requiresArg: true,
        });

        return argv;
    },
    handler: voteDestinationSetupManualHandler,
};

export default voteDestinationSetupManual;

export async function voteDestinationSetupManualHandler(args: Arguments): Promise<void> {
    const eventProxy = args.eventProxy as string;
    const sender = args.sender as string;
    const events = args.destinations as EventType[];
    const destinations = args.destiations as string[];

    await runVoteDestinationSetup(
        {
            sender,
            events,
            destinations,
        },
        eventProxy
    );
}
