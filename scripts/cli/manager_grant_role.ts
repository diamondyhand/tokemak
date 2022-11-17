import * as yargs from "yargs";
import {Arguments} from "yargs";
import {getContractAddressByEnvironmentAndName, Environment, Contract, ManagerRoles} from "../config";
import {runManagerGrantRole} from "../manager/manager-grant-role";

const managerGrantRoleCommand: yargs.CommandModule = {
    command: "manager-grant-role",
    describe: "grant given role to given account",
    builder: (argv) => {
        argv.option("environment", {
            alias: "env",
            type: "string",
            describe: "target environment",
            demandOption: true,
            requiresArg: true,
            choices: Object.values(Environment),
        });

        argv.option("role", {
            alias: "role",
            type: "string",
            describe: "Role to be given",
            demandOption: true,
            requiresArg: true,
            choices: Object.values(ManagerRoles),
        });

        argv.option("address", {
            alias: "address",
            type: "string",
            describe: "Address to be given role",
            demandOption: true,
            requiresArg: true,
        });

        argv.option("safeAddress", {
            alias: "safeAddress",
            type: "string",
            describe: "gnosis safe address",
            requiresArg: false,
        });
        return argv;
    },
    handler: runGrantRole,
};

export default managerGrantRoleCommand;

export async function runGrantRole(args: Arguments): Promise<void> {
    const targetEnv = args.environment as Environment;

    const managerAddress = getContractAddressByEnvironmentAndName(targetEnv, Contract.MANAGER);

    if (!managerAddress) {
        throw new Error(`unknown target env ${targetEnv}`);
    }

    await runManagerGrantRole({
        targetEnv,
        managerAddress,
        safeAddress: args.safeAddress as string,
        role: args.role as ManagerRoles,
        address: args.address as string,
    });
}
