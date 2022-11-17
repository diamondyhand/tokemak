import chalk from "chalk";
import {ChildProcess, fork} from "child_process";
import path from "path";
import axios from "axios";
import {ethers} from "ethers";
import {GlobalWithHardhatContext, HardhatContext} from "hardhat/internal/context";
import {HARDHAT_PARAM_DEFINITIONS} from "hardhat/internal/core/params/hardhat-params";
import {getEnvHardhatArguments} from "hardhat/internal/core/params/env-variables";
import {loadConfigAndTasks} from "hardhat/internal/core/config/config-loading";
import {Environment} from "hardhat/internal/core/runtime-environment";
import {getContractAt, getContractFactory, getSigner, getSigners} from "@nomiclabs/hardhat-ethers/internal/helpers";
import {createProviderProxy} from "@nomiclabs/hardhat-ethers/internal/provider-proxy";
import {EthereumProvider, HardhatConfig, HardhatEthersHelpers, HardhatRuntimeEnvironment} from "hardhat/types";
import {HardhatUpgrades} from "@openzeppelin/hardhat-upgrades";

export class SecondaryChain {
    protected childProcess!: ChildProcess;
    protected rpc!: ethers.providers.JsonRpcProvider;
    protected lastSnapshot: string | null = null;

    ethers!: typeof ethers & HardhatEthersHelpers;
    hre!: HardhatRuntimeEnvironment & {upgrades: HardhatUpgrades};

    constructor(
        protected portNumber: number,
        protected forkingUrl: string,
        protected chainId: number,
        protected debug: boolean = false
    ) {}

    get provider(): ethers.providers.JsonRpcProvider {
        return this.rpc;
    }

    async snapshot(): Promise<void> {
        const result = await this.provider.send("evm_snapshot", []);
        this.lastSnapshot = result.toString();
    }

    async revertSnapshot(): Promise<void> {
        await this.provider.send("evm_revert", [this.lastSnapshot]);
    }

    async start(): Promise<void> {
        await this.startupProcess();

        //https://github.com/nomiclabs/hardhat/blob/38ec7396fb2c747331e53b7ff3f9bb5154bf5390/packages/hardhat-core/src/internal/lib/hardhat-lib.ts#L50
        const globalWithHardhatContext = global as unknown as GlobalWithHardhatContext;

        //Save off the existing copy so we can put it back
        const existingHre = globalWithHardhatContext.__hardhatContext;
        //Clear out global state so a new one can be instantiated
        (globalWithHardhatContext.__hardhatContext as any) = undefined;

        const ctx = HardhatContext.createHardhatContext();
        const hardhatArguments = getEnvHardhatArguments(HARDHAT_PARAM_DEFINITIONS, process.env);
        const config = loadConfigAndTasks(hardhatArguments);

        const env = new Environment(
            config.resolvedConfig as HardhatConfig,
            hardhatArguments,
            existingHre.tasksDSL.getTaskDefinitions(),
            existingHre.extendersManager.getExtenders(),
            ctx.experimentalHardhatNetworkMessageTraceHooks
        ) as unknown as HardhatRuntimeEnvironment;

        ctx.setHardhatRuntimeEnvironment(env);

        //Need to replace the ethers provider since its loaded in current memory and would just
        //be wrapping mainnet again

        //https://github.com/nomiclabs/hardhat/blob/master/packages/hardhat-ethers/src/internal/index.ts
        const rpc = new ethers.providers.JsonRpcProvider(
            `http://localhost:${this.portNumber}`
        ) as unknown as EthereumProvider;
        const providerProxy = createProviderProxy(rpc);
        this.rpc = providerProxy as ethers.providers.JsonRpcProvider;
        this.ethers = {
            ...(ethers as any),
            provider: providerProxy,
            getSigner: (address: string) => getSigner(env, address),
            getSigners: () => getSigners(env),
            // We cast to any here as we hit a limitation of Function#bind and
            // overloads. See: https://github.com/microsoft/TypeScript/issues/28582
            getContractFactory: getContractFactory.bind(null, env) as any,
            getContractAt: getContractAt.bind(null, env),
        };
        env.ethers = this.ethers;

        //This would have been setup with the default wrapped ethers
        //which would still be mainnet
        env.network.provider = this.rpc as unknown as EthereumProvider;

        this.hre = env;

        //Set existing one back
        globalWithHardhatContext.__hardhatContext = existingHre;
    }

    stop(signal: number | NodeJS.Signals | undefined = undefined): boolean {
        return this.childProcess.kill(signal);
    }

    private startupProcess() {
        const cwd = path.join(__dirname, "../..");
        this.log(`Hardhat path: ${cwd}`);

        const hreProc = fork(
            "./node_modules/hardhat/internal/cli/cli.js",
            ["node", "--port", this.portNumber.toString()],
            {
                cwd: cwd,
                env: {
                    ...process.env,
                    HARDHAT_NETWORK: "hardhat",
                    HARDHAT_FORK_URL: this.forkingUrl,
                    HARDHAT_CHAIN_ID: this.chainId.toString(),
                },
                stdio: "pipe",
            }
        );

        let stop: ((value: unknown) => void) | null = null;

        this.childProcess = hreProc;

        return new Promise((resolve, reject) => {
            stop = reject;
            this.checkStarted(`http://localhost:${this.portNumber}`, resolve as any, hreProc);
        });
    }

    private log(msg: string) {
        if (this.debug) console.log(msg);
    }

    private async checkStarted(endpoint: string, finishSetup: (value: unknown) => void, proc: ChildProcess) {
        try {
            await axios({
                method: "post",
                url: `${endpoint}/`,
                data: {jsonrpc: "2.0", method: "net_version", params: [], id: 67},
            });
            this.log(chalk.green("Endpoint up"));

            finishSetup(proc);
        } catch {
            this.log(chalk.yellow(`Waiting for endpoint ${endpoint}`));
            setTimeout(() => {
                this.checkStarted(endpoint, finishSetup, proc);
            }, 1000);
        }
    }
}
