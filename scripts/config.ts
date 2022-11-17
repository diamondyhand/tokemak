export enum Environment {
    MAINNET = "mainnet",
    GOERLI = "goerli",
}

export enum ManagerRoles {
    ADD_LIQUIDITY_ROLE = "ADD_LIQUIDITY_ROLE",
    REMOVE_LIQUIDITY_ROLE = "REMOVE_LIQUIDITY_ROLE",
    MISC_OPERATION_ROLE = "MISC_OPERATION_ROLE",
}

export enum Contract {
    VOTE_TRACKER_CORE = "vote-tracker-core",
    CORE3_VOTE_TRACKER = "core3-vote-tracker",
    CORE3_ON_CHAIN_VOTE = "core3-on-chain-vote",
    VOTE_TRACKER_LD = "vote-tracker-ld",
    BALANCE_TRACKER = "balance-tracker",
    EVENT_PROXY = "event-proxy",
    TOKE_POOL = "toke-pool",
    MANAGER = "manager",
    UNI_POOL = "uni-pool",
    SUSHI_POOL = "sushi-pool",
    FX_ROOT = "fx-root",
    STAKING = "staking",
    TOKE = "toke",
    POOL_IMPLEMENTATION = "pool-implementation",
    PROXY_ADMIN = "proxy-admin",
    ON_CHAIN_VOTE_L1_CORE = "on-chain-vote-l1-core",
    ON_CHAIN_VOTE_L1_LD = "on-chain-vote-l1-ld",
    FX_CHILD = "fx-child",
    PROXY_ADMIN_POLYGON = "proxy-admin-polygon",
    DEV_COORDINATOR_MULTISIG = "dev-coordinator-multisig",
    ADDRESS_REGISTRY = "address-registry",
    THIRDPARTY_CURVE_ADDRESS_PROVIDER = "thirdparty-curve-address-provider",
    REWARDS = "rewards",
    CYCLE_ROLLOVER_TRACKER = "cycle-rollover-tracker",
    TREASURY = "treasury",
    DELEGATE = "delegate",
    WETH = "weth",
}

export type ContractAddressByName = Record<Contract, string>;

export type ContractAddressByEnvironment = Record<Environment, ContractAddressByName>;

export const contractAddressByEnvironment: ContractAddressByEnvironment = {
    [Environment.MAINNET]: {
        [Contract.VOTE_TRACKER_CORE]: "0x63368f34B84C697d9f629F33B5CAdc22cb00510E",
        [Contract.VOTE_TRACKER_LD]: "0x7A9A3395afB32F923a142dBC56467Ae5675Ce5ec",
        [Contract.BALANCE_TRACKER]: "0xBC822318284aD00cDc0aD7610d510C20431e8309",
        [Contract.EVENT_PROXY]: "0x7f4fb56b9C85bAB8b89C8879A660f7eAAa95a3A8",
        [Contract.TOKE_POOL]: "0xa760e26aA76747020171fCF8BdA108dFdE8Eb930",
        [Contract.MANAGER]: "0xA86e412109f77c45a3BC1c5870b880492Fb86A14",
        [Contract.UNI_POOL]: "0x1b429e75369ea5cd84421c1cc182cee5f3192fd3",
        [Contract.SUSHI_POOL]: "0x8858A739eA1dd3D80FE577EF4e0D03E88561FaA3",
        [Contract.FX_ROOT]: "0xfe5e5D361b2ad62c541bAb87C45a0B9B018389a2",
        [Contract.STAKING]: "0x96F98Ed74639689C3A11daf38ef86E59F43417D3",
        [Contract.TOKE]: "0x2e9d63788249371f1DFC918a52f8d799F4a38C94",
        [Contract.POOL_IMPLEMENTATION]: "0xd899ac9283a44533c36BC8373F5c898b0d5fC03E",
        [Contract.PROXY_ADMIN]: "0xc89F742452F534EcE603C7B62dF76102AAcF00Df",
        [Contract.ON_CHAIN_VOTE_L1_CORE]: "0xc6807BB6F498337e0DC388D6507666aF7566E0BB",
        [Contract.ON_CHAIN_VOTE_L1_LD]: "0x43094eD6D6d214e43C31C38dA91231D2296Ca511",
        [Contract.FX_CHILD]: "0x8397259c983751DAf40400790063935a11afa28a",
        [Contract.PROXY_ADMIN_POLYGON]: "0x2650D4e7Cb4402c6B999EED1AA920A939072e28f",
        [Contract.DEV_COORDINATOR_MULTISIG]: "0x90b6C61B102eA260131aB48377E143D6EB3A9d4B",
        [Contract.ADDRESS_REGISTRY]: "0x28cB0DE9c70ba1B5116Df57D0c421770B5f44D45",
        [Contract.THIRDPARTY_CURVE_ADDRESS_PROVIDER]: "0x0000000022D53366457F9d5E68Ec105046FC4383",
        [Contract.REWARDS]: "0x79dD22579112d8a5F7347c5ED7E609e60da713C5",
        [Contract.CYCLE_ROLLOVER_TRACKER]: "0x394a646b7becc8972b531cDEb9055D4057E31f85",
        [Contract.TREASURY]: "0x8b4334d4812C530574Bd4F2763FcD22dE94A969B",
        [Contract.DELEGATE]: "0x3bc59A43d82C1acF3a597652eaDD3a02082D3671",
        [Contract.CORE3_VOTE_TRACKER]: "0xE06229F72124C7936E42C6Fbd645EE688419D5e5",
        [Contract.CORE3_ON_CHAIN_VOTE]: "0xa1A7ECE4d54F1403187f81880346962f667721Dd",
        [Contract.WETH]: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    },
    [Environment.GOERLI]: {
        [Contract.VOTE_TRACKER_CORE]: "0xBbB7279B5716bd9a8FFD010B6f9A79fE7A104720",
        [Contract.VOTE_TRACKER_LD]: "0x19E39678B2369089bCCD43780049D70ad6926BBE",
        [Contract.BALANCE_TRACKER]: "0x3917dE833541d4da3B228C1D1F87681B144f12c1",
        [Contract.EVENT_PROXY]: "0xd8A2E435BE384482816e6f922a4553E03bd71A35",
        [Contract.TOKE_POOL]: "0x156dE8C7e1EC3bBF4f62a3E30fe248Fe6505e56f",
        [Contract.MANAGER]: "0xe5dB5477F7787862116ff92E7d33A244A4ca35E0",
        [Contract.UNI_POOL]: "0xdE526D5A5123f99E7132b5De59024B2aF244299A",
        [Contract.SUSHI_POOL]: "0xC83CEDEA62e9d0B07da3D9e31b12c172dB7Cad41",
        [Contract.FX_ROOT]: "0x3d1d3e34f7fb6d26245e6640e1c50710efff15ba",
        [Contract.STAKING]: "0x925fa127FFADD451E02834434794b2B29a2eA353",
        [Contract.TOKE]: "0xdcC9439Fe7B2797463507dD8669717786E51a014",
        [Contract.POOL_IMPLEMENTATION]: "0x1A41B43B7Ce5207DB7388aA34cDB5d990Bf03b45",
        [Contract.PROXY_ADMIN]: "0x34aF6F5783c6C31680E49cEA7ABbCd4e5BD67117",
        [Contract.ON_CHAIN_VOTE_L1_CORE]: "0x89f472E710Bcf1781b9741240CeF4Ca79DAa810F",
        [Contract.ON_CHAIN_VOTE_L1_LD]: "0xFCe73bEa4Aa7FC8220Bb4C676a4D7Ad499ccb2cF",
        [Contract.FX_CHILD]: "0xCf73231F28B7331BBe3124B907840A94851f9f11",
        [Contract.PROXY_ADMIN_POLYGON]: "0x31535A105a23731a0eF3ff8C19C6389F98bB796c",
        [Contract.DEV_COORDINATOR_MULTISIG]: "0x3d146A937Ddada8AfA2536367832128F3F967E29",
        [Contract.ADDRESS_REGISTRY]: "0x93eC546fdcae65B10f2a409115612b2A21f53919",
        [Contract.THIRDPARTY_CURVE_ADDRESS_PROVIDER]: "0x668611fa31BdD556A03Aa57f934CC47cf076f560",
        [Contract.REWARDS]: "0x6e4F49C6A38b1eDb790Aa1E5cFe1732b9f0BC412",
        [Contract.CYCLE_ROLLOVER_TRACKER]: "0xE37013f2288F8a80DD81341d8F5C70099F245f4b",
        [Contract.TREASURY]: "0xf150b381a0eecc51f41014e488b1886e090f9a04",
        [Contract.DELEGATE]: "",
        [Contract.CORE3_VOTE_TRACKER]: "0xbaF050f8C4752A6AbAFbd5a7199694f7733c5be0",
        [Contract.CORE3_ON_CHAIN_VOTE]: "0xEc504056611db6e81Aec972547B30C0d2c5F90D7",
        [Contract.WETH]: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    },
};

export function getContractAddressByEnvironmentAndName(environment: Environment, name: Contract): string {
    const address = contractAddressByEnvironment?.[environment]?.[name];
    if (!address) {
        throw new Error(`unknown environment/contract for env = ${environment} and contract = ${name}`);
    }

    return address;
}

export enum StakingScheduleType {
    DEFAULT,
    INVESTOR,
}

export const getStakingNotionalAddress = (stakingScheduleType: StakingScheduleType): string => {
    switch (stakingScheduleType) {
        case StakingScheduleType.DEFAULT:
            return "0x1954d90213fdA53D35e76DB8f075a6216b8743A1";
        case StakingScheduleType.INVESTOR:
            return "0x96F98Ed74639689C3A11daf38ef86E59F43417D3"; //Same as prod Staking contract address so balances transfer
        default:
            throw "No notional";
    }
};

export const getChainIdByEnv = (
    env: Environment
): {
    l1: number;
    vote: number;
} => {
    switch (env) {
        case Environment.GOERLI:
            return {l1: 5, vote: 80001};
        case Environment.MAINNET:
            return {l1: 1, vote: 137};
        default:
            throw "Invalid Chain";
    }
};
