import {BigNumberish, ContractFactory, utils} from "ethers";
import {ethers, upgrades, run, artifacts} from "hardhat";
import dotenv from "dotenv";
import {OnChainVoteL1__factory, TransparentUpgradeableProxy__factory} from "../../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {OnChainVoteL1, OnChainVoteL1Interface} from "../../typechain/OnChainVoteL1";
import {Contract, Environment, getChainIdByEnv, getContractAddressByEnvironmentAndName} from "../config";

dotenv.config();

const main = async () => {
    const ENV = Environment.MAINNET;
    const VERIFY = true;

    //Testnet
    const FX_ROOT = getContractAddressByEnvironmentAndName(ENV, Contract.FX_ROOT);
    const EVENT_PROXY = getContractAddressByEnvironmentAndName(ENV, Contract.EVENT_PROXY);
    const PROXY_ADMIN = getContractAddressByEnvironmentAndName(ENV, Contract.PROXY_ADMIN);
    const CHAIN_INFO = getChainIdByEnv(ENV);

    const chainValidation = (await ethers.provider.getNetwork()).chainId;
    if (CHAIN_INFO.l1 != chainValidation) throw "Mismatch Chain";

    const contractTitle = "On Chain Vote L1";
    const contractArtfiactPath = "contracts/vote/OnChainVoteL1.sol:OnChainVoteL1";
    const contractName = "OnChainVoteL1";

    const [deployer] = await ethers.getSigners();
    const contract = await deployWrap<OnChainVoteL1Interface, undefined>(undefined).deployUpgradeableContract(
        deployer,
        contractName,
        contractTitle,
        contractArtfiactPath,
        VERIFY,
        PROXY_ADMIN,
        OnChainVoteL1__factory.createInterface
    );

    const typedContract = (await ethers.getContractAt(
        artifacts.require("OnChainVoteL1").abi,
        contract.address
    )) as unknown as OnChainVoteL1;

    const setDestination = await typedContract.connect(deployer).setDestinations(FX_ROOT, EVENT_PROXY);
    await setDestination.wait();

    const eventSend = await typedContract.connect(deployer).setEventSend(true);
    await eventSend.wait();
};

//TODO: This function setup doesn't need to be this complicated
//      But want to figure out how to pass in the initialize params in a type-safe manner
const deployWrap = <TContractInterface extends utils.Interface, initiParams>(initializeParams: initiParams) => {
    const deployUpgradeableContract = async (
        deployer: SignerWithAddress,
        contractName: string,
        contractTitle: string,
        contractArtifactPath: string,
        verify: boolean,
        proxyAdmin: string,
        interfaceCreate: () => TContractInterface & {
            encodeFunctionData(functionFragment: "initialize", values?: initiParams): string;
        }
    ) => {
        const onchainVoteFactory = await ethers.getContractFactory(contractName);

        const implementation = await onchainVoteFactory.deploy();
        await implementation.deployed();
        const implementationInit = await implementation.connect(deployer).initialize();

        await implementationInit.wait();

        const implementationAdress = implementation.address;
        console.log(`${contractTitle} Implementation: ${implementationAdress}`);

        await new Promise((r) => setTimeout(r, 90000));

        if (verify) {
            try {
                await run("verify:verify", {
                    address: implementationAdress,
                    constructorArguments: [],
                    contract: contractArtifactPath,
                });
            } catch (e) {
                console.log("Verification Failed. Continue.");
                console.log(e);
            }
        }

        const contractInterface = interfaceCreate();
        const initializeData = contractInterface.encodeFunctionData("initialize", initializeParams);

        const proxyFactory = new TransparentUpgradeableProxy__factory(deployer);
        const contract = await proxyFactory.deploy(implementationAdress, proxyAdmin, initializeData);
        await contract.deployed();

        const contractAddress = contract.address;
        console.log(`${contractTitle} address: ${contractAddress}`);

        if (verify) {
            console.log("Verifying...");

            await new Promise((r) => setTimeout(r, 90000));

            try {
                await run("verify:verify", {
                    address: contractAddress,
                    constructorArguments: [implementationAdress, proxyAdmin, initializeData],
                    contract:
                        "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
                });
                console.log("Verified");
            } catch (e) {
                console.log("Verification Failed. Continue.");
                console.log(e);
            }
        }

        return contract;
    };

    return {deployUpgradeableContract};
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
