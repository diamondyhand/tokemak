import {ethers, run} from "hardhat";
import {TestnetToken__factory} from "../../typechain";

export interface NewTestnetTokenArgs {
    name: string;
    symbol: string;
    decimals: number;
    skipVerify: boolean;
}

export const runNewTestnetTokenSetup = async (input: NewTestnetTokenArgs): Promise<void> => {
    const [deployer] = await ethers.getSigners();

    console.log(`Deployer: ${deployer.address}`);
    console.log(`Symbol: ${input.symbol}`);
    console.log(`Name: ${input.name}`);
    console.log(`Decimals: ${input.decimals}`);
    console.log(`Skip Verify: ${input.skipVerify}`);

    const testnetTokenFactory = new TestnetToken__factory(deployer);
    const testnetToken = await testnetTokenFactory.deploy(input.name, input.symbol, input.decimals);
    await testnetToken.deployed();

    console.log("");
    console.log(`${input.symbol} Testnet Token - ${testnetToken.address}`);
    console.log("");

    if (!input.skipVerify) {
        console.log("Verifying");
        let tries = 0;
        while (tries < 5) {
            try {
                await run("verify:verify", {
                    address: testnetToken.address,
                    constructorArguments: [input.name, input.symbol, input.decimals],
                    contract: "contracts/testnet/TestnetToken.sol:TestnetToken",
                });
                break;
            } catch (e) {
                if (tries == 4) {
                    console.log(e);
                } else {
                    await new Promise((r) => setTimeout(r, tries * 10000));
                }
            }
            tries++;
        }
    }
};
