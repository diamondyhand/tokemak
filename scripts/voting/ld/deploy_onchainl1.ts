import {BigNumberish, ContractFactory, utils} from "ethers";
import {ethers, upgrades, run, artifacts} from "hardhat";
import dotenv from "dotenv";
import {OnChainVoteL1__factory, TransparentUpgradeableProxy__factory} from "../../../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {OnChainVoteL1, OnChainVoteL1Interface} from "../../../typechain/OnChainVoteL1";

dotenv.config();

const main = async () => {
    // // Testnet
    // const STATE_SENDER = "0x3d1d3e34f7fb6d26245e6640e1c50710efff15ba"; //Goerli
    // const EVENT_PROXY_ADDRESS = "0xd8a2e435be384482816e6f922a4553e03bd71a35"; //Mumbai
    // const PROXY_ADMIN = "0x34aF6F5783c6C31680E49cEA7ABbCd4e5BD67117";

    //Mainnet
    const FX_ROOT = "0xfe5e5D361b2ad62c541bAb87C45a0B9B018389a2"; //Mainnet
    const EVENT_PROXY_ADDRESS = "0x7f4fb56b9C85bAB8b89C8879A660f7eAAa95a3A8"; //Polygon
    const PROXY_ADMIN = "0xc89F742452F534EcE603C7B62dF76102AAcF00Df"; //Mainnet

    const verify = true;
    const contractTitle = "On Chain Vote L1";
    const contractArtfiactPath = "contracts/vote/OnChainVoteL1.sol:OnChainVoteL1";
    const contractName = "OnChainVoteL1";

    const [deployer] = await ethers.getSigners();
    const contract = await deployWrap<OnChainVoteL1Interface, undefined>(undefined).deployUpgradeableContract(
        deployer,
        contractName,
        contractTitle,
        contractArtfiactPath,
        verify,
        PROXY_ADMIN,
        OnChainVoteL1__factory.createInterface
    );

    const typedContract = (await ethers.getContractAt(
        artifacts.require("OnChainVoteL1").abi,
        contract.address
    )) as unknown as OnChainVoteL1;

    const setDestination = await typedContract.connect(deployer).setDestinations(FX_ROOT, EVENT_PROXY_ADDRESS);
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
        await implementationInit.wait(5);

        const implementationAdress = implementation.address;
        console.log(`${contractTitle} Implementation: ${implementationAdress}`);

        if (verify) {
            await run("verify:verify", {
                address: implementationAdress,
                constructorArguments: [],
                contract: contractArtifactPath,
            });
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

            await new Promise((r) => setTimeout(r, 45000));

            try {
                await run("verify:verify", {
                    address: contractAddress,
                    constructorArguments: [implementationAdress, proxyAdmin, initializeData],
                    contract:
                        "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
                });
                console.log("Verified");
            } catch (e) {
                console.log(e);
                console.log("Verifying failed");
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
