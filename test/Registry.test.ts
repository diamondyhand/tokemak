import {ethers, upgrades} from "hardhat";
import {expect} from "chai";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import * as timeMachine from "ganache-time-traveler";
import {AccessControl, AddressRegistry, TransparentUpgradeableProxy} from "../typechain";
import {ContractReceipt} from "ethers";

const ZERO_ADDRESS = ethers.constants.AddressZero;

describe("Test Address Registry", () => {
    let snapshotId: any;
    let deployer: SignerWithAddress;
    let owner: SignerWithAddress;
    let registeredAddress: SignerWithAddress;
    let nonRegisteredAddress: SignerWithAddress;
    let controller1: SignerWithAddress;
    let controller2: SignerWithAddress;
    let nonRegisteredController: SignerWithAddress;
    let pool: SignerWithAddress;
    let token: SignerWithAddress;
    let registry: AddressRegistry & AccessControl & TransparentUpgradeableProxy;
    let registryImplementation: AddressRegistry;
    let defaultRole: string;
    let registeredRole: string;

    before(async () => {
        [
            deployer,
            owner,
            registeredAddress,
            nonRegisteredAddress,
            controller1,
            controller2,
            nonRegisteredController,
            pool,
            token,
        ] = await ethers.getSigners();

        defaultRole = "0x0000000000000000000000000000000000000000000000000000000000000000";
        registeredRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REGISTERED_ROLE"));

        const RegistryFactory = await ethers.getContractFactory("AddressRegistry");
        registry = (await upgrades.deployProxy(RegistryFactory, [], {
            constructorArgs: ["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"],
            unsafeAllow: ["state-variable-assignment", "state-variable-immutable", "constructor"],
        })) as AddressRegistry & AccessControl & TransparentUpgradeableProxy;
    });

    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    describe("Test initialize", () => {
        it("Sets roles correctly", async () => {
            expect(await registry.connect(deployer).hasRole(defaultRole, deployer.address)).to.equal(true);
            expect(await registry.connect(deployer).hasRole(registeredRole, deployer.address)).to.equal(true);
        });
    });

    describe("Test adding registered address", () => {
        it("Reverts on zero address", async () => {
            await expect(registry.connect(deployer).addRegistrar(ZERO_ADDRESS)).to.be.revertedWith("INVALID_ADDRESS");
        });

        it("Correctly adds registered address", async () => {
            await registry.connect(deployer).addRegistrar(registeredAddress.address);
            expect(await registry.hasRole(registeredRole, registeredAddress.address)).to.equal(true);
        });

        it("Emits an event with correct args", async () => {
            const tx = await registry.connect(deployer).addRegistrar(registeredAddress.address);
            const receipt = await tx.wait();

            const eventName = "RegisteredAddressAdded";
            const event = getEventInfo(receipt, eventName);

            expect(event.name).to.equal(eventName);
            expect(event.args[0]).to.equal(registeredAddress.address);
        });
    });

    describe("Test remove registered address", () => {
        beforeEach(async () => {
            await registry.connect(deployer).addRegistrar(registeredAddress.address);
        });

        it("Reverts on zero address", async () => {
            await expect(registry.connect(deployer).removeRegistrar(ZERO_ADDRESS)).to.be.revertedWith(
                "INVALID_ADDRESS"
            );
        });

        it("Correctly removes a registered address", async () => {
            expect(await registry.hasRole(registeredRole, registeredAddress.address)).to.equal(true);
            await registry.connect(deployer).removeRegistrar(registeredAddress.address);
            expect(await registry.hasRole(registeredRole, registeredAddress.address));
        });

        it("Emits an event with the correct args", async () => {
            const tx = await registry.connect(deployer).removeRegistrar(registeredAddress.address);
            const receipt = await tx.wait();

            const eventName = "RegisteredAddressRemoved";
            const event = getEventInfo(receipt, eventName);

            expect(event.name).to.equal(eventName);
            expect(event.args[0]).to.equal(registeredAddress.address);
        });
    });

    describe("Test adding to registry", () => {
        it("Reverts on no addresses", async () => {
            await expect(registry.connect(deployer).addToRegistry([], 1)).to.be.revertedWith("NO_ADDRESSES");
        });

        it("Reverts on incorrect address", async () => {
            await expect(registry.connect(nonRegisteredAddress).addToRegistry([token.address], 0)).to.be.revertedWith(
                "NOT_REGISTERED"
            );
        });

        it("Reverts on zero address", async () => {
            await expect(registry.connect(deployer).addToRegistry([ZERO_ADDRESS], 0)).to.be.revertedWith(
                "INVALID_ADDRESS"
            );
        });

        it("Reverts on address that already exists", async () => {
            await registry.connect(deployer).addToRegistry([controller1.address], 0);
            await expect(registry.connect(deployer).addToRegistry([controller1.address], 0)).to.be.revertedWith(
                "ADD_FAIL"
            );
        });

        it("Correctly adds an address to the registry", async () => {
            await registry.connect(deployer).addToRegistry([token.address], 0);
            const returnedAddresses = await registry.getAddressForType(0);
            expect(returnedAddresses[0]).to.equal(token.address);
        });

        it("Correctly adds multiple addresses to the same address registry", async () => {
            await registry.connect(deployer).addToRegistry([controller1.address, controller2.address], 1);
            const returnedAddresses = await registry.getAddressForType(1);

            expect(returnedAddresses[0]).to.equal(controller1.address);
            expect(returnedAddresses[1]).to.equal(controller2.address);
        });

        it("Emits an event with the proper args", async () => {
            const tx = await registry.connect(deployer).addToRegistry([pool.address], 2);
            const receipt = await tx.wait();

            const eventName = "AddedToRegistry";
            const event = getEventInfo(receipt, eventName);

            expect(event.name).to.equal(eventName);
            expect(event.args[0][0]).to.equal(pool.address);
        });
    });

    describe("Test removing from registry", () => {
        beforeEach(async () => {
            await registry.connect(deployer).addToRegistry([controller1.address, controller2.address], 1);
            await registry.connect(deployer).addToRegistry([token.address], 0);
        });

        it("Reverts on no addresses", async () => {
            await expect(registry.connect(deployer).removeFromRegistry([], 1)).to.be.revertedWith("NO_ADDRESSES");
        });

        it("Reverts on incorrect address", async () => {
            await expect(
                registry.connect(nonRegisteredAddress).removeFromRegistry([token.address], 0)
            ).to.be.revertedWith("NOT_REGISTERED");
        });

        it("Reverts on too many addresses", async () => {
            await expect(
                registry
                    .connect(deployer)
                    .removeFromRegistry([controller1.address, controller2.address, nonRegisteredController.address], 1)
            ).to.be.revertedWith("TOO_MANY_ADDRESSES");
        });

        it("Reverts on nonexistent address", async () => {
            await expect(
                registry.connect(deployer).removeFromRegistry([nonRegisteredController.address], 1)
            ).to.be.revertedWith("REMOVE_FAIL");
        });

        it("Correctly removes a single address", async () => {
            const addressReturnedBefore = await registry.getAddressForType(0);
            expect(addressReturnedBefore[0]).to.equal(token.address);

            await registry.connect(deployer).removeFromRegistry([token.address], 0);

            const addressReturnedAfter = await registry.getAddressForType(0);
            expect(addressReturnedAfter[0]).to.equal(undefined);
        });

        it("Correctly removes multiple addresses", async () => {
            const addressReturnedBefore = await registry.getAddressForType(1);
            expect(addressReturnedBefore[0]).to.equal(controller1.address);
            expect(addressReturnedBefore[1]).to.equal(controller2.address);

            await registry.connect(deployer).removeFromRegistry([controller1.address, controller2.address], 1);

            const addressReturnedAfter = await registry.getAddressForType(1);
            expect(addressReturnedAfter[0]).to.equal(undefined);
        });
    });

    describe("Test check address function", () => {
        beforeEach(async () => {
            await registry.connect(deployer).addToRegistry([controller1.address], 1);
        });

        it("Returns true when address exists", async () => {
            const returnedBoolean = await registry.checkAddress(controller1.address, 1);
            expect(returnedBoolean).to.equal(true);
        });

        it("Returns false when address doesn't exist", async () => {
            const returnedBoolean = await registry.checkAddress(pool.address, 0);
            expect(returnedBoolean).to.equal(false);
        });
    });
});

const getEventInfo = (receipt: ContractReceipt, name: string): EventInfo => {
    let eventInfo: EventInfo;
    if (receipt.events!.length > 1) {
        for (let i = 0; i < receipt.events!.length; i++) {
            if (receipt.events![i].event === name) {
                eventInfo = {
                    name: receipt.events![i].event,
                    args: receipt.events![i].args,
                } as EventInfo;
            }
        }
    } else {
        eventInfo = {
            name: receipt.events![0].event,
            args: receipt.events![0].args,
        } as EventInfo;
    }

    return eventInfo!;
};

type EventInfo = {
    name: string;
    args: string[];
};
