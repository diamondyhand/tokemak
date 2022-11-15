import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import {deployMockContract, MockContract} from "ethereum-waffle";
import {artifacts, ethers, upgrades} from "hardhat";
import {EventProxy} from "../typechain";

const ZERO_ADDRESS = ethers.constants.AddressZero;

describe("EventProxy test", () => {
    let deployer: SignerWithAddress;
    let other: SignerWithAddress;
    let sender: SignerWithAddress;
    let destination1: SignerWithAddress;
    let destination2: SignerWithAddress;
    let destination3: SignerWithAddress;
    let event1: string; // Change name, bytes
    let eventProxy: EventProxy;
    let fxPortalSender: SignerWithAddress;

    let mockDestination: MockContract;
    const IEventReceiver = artifacts.require("IEventReceiver");

    const testGatewayName = ethers.utils.formatBytes32String("polygon");

    before(async () => {
        [deployer, other, sender, destination1, destination2, destination3, fxPortalSender] = await ethers.getSigners();

        event1 = ethers.utils.hexZeroPad(ethers.utils.hexlify(ethers.utils.toUtf8Bytes("event")), 32);
    });

    beforeEach(async () => {
        const eventProxyFactory = await ethers.getContractFactory("EventProxy");
        eventProxy = (await upgrades.deployProxy(eventProxyFactory, [fxPortalSender.address])) as EventProxy;

        mockDestination = await deployMockContract(deployer, IEventReceiver.abi);
    });

    describe("Initialization", () => {
        it("Reverts with a zero address", async () => {
            const eventProxyFactory = await ethers.getContractFactory("EventProxy");
            await expect(upgrades.deployProxy(eventProxyFactory, [ZERO_ADDRESS])).to.be.revertedWith("INVALID_ADDRESS");
        });
        it("Succeeds with a valid address", async () => {
            const eventProxyFactory = await ethers.getContractFactory("EventProxy");
            await expect(upgrades.deployProxy(eventProxyFactory, [fxPortalSender.address])).to.not.be.reverted;
        });
    });

    describe("Test Sender Registrations", () => {
        it("Does not let anyone but the owner call", async () => {
            await expect(eventProxy.connect(other).setSenderRegistration(sender.address, true)).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });

        it("Reverts on zero address", async () => {
            await expect(eventProxy.connect(deployer).setSenderRegistration(ZERO_ADDRESS, true)).to.be.revertedWith(
                "INVALID_ADDRESS"
            );
        });

        it("Sets a sender to true properly", async () => {
            await eventProxy.connect(deployer).setSenderRegistration(sender.address, true);
            expect(await eventProxy.registeredSenders(sender.address)).to.equal(true);
        });

        it("Sets a registered sender back to false", async () => {
            await eventProxy.connect(deployer).setSenderRegistration(sender.address, true);
            expect(await eventProxy.registeredSenders(sender.address)).to.equal(true);

            await eventProxy.connect(deployer).setSenderRegistration(sender.address, false);
            expect(await eventProxy.registeredSenders(sender.address)).to.equal(false);
        });

        it("Emits an event with the proper arguments", async () => {
            const tx = await eventProxy.connect(deployer).setSenderRegistration(sender.address, true);
            const receipt = await tx.wait();

            expect(receipt.events?.[0].args?.sender).to.equal(sender.address);
            expect(receipt.events?.[0].args?.allowed).to.equal(true);
        });
    });

    describe("Test Register Destination", () => {
        it("Reverts when someone other than the owner calls", async () => {
            await expect(eventProxy.connect(other).registerDestinations([])).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });

        it("Reverts when sender is zero address", async () => {
            await expect(
                eventProxy.registerDestinations([
                    {
                        sender: ZERO_ADDRESS,
                        eventType: event1,
                        destinations: [destination1.address],
                    },
                ])
            ).to.be.revertedWith("INVALID_SENDER_ADDRESS");
        });

        it("Reverts when eventType is an empty string", async () => {
            await expect(
                eventProxy.connect(deployer).registerDestinations([
                    {
                        sender: sender.address,
                        eventType: ethers.utils.formatBytes32String(""),
                        destinations: [destination1.address],
                    },
                ])
            ).to.be.revertedWith("INVALID_EVENT_TYPE");
        });

        it("Reverts when l2Endpoint is zero address", async () => {
            await expect(
                eventProxy.connect(deployer).registerDestinations([
                    {
                        sender: sender.address,
                        eventType: testGatewayName,
                        destinations: [ZERO_ADDRESS],
                    },
                ])
            ).to.be.revertedWith("INVALID_L2_ENDPOINT_ADDRESS");
        });

        it("Correctly stores destinations", async () => {
            expect(await eventProxy.getRegisteredDestinations(sender.address, event1)).to.be.empty;

            await eventProxy.registerDestinations([
                {
                    sender: sender.address,
                    eventType: event1,
                    destinations: [destination1.address],
                },
            ]);

            const registeredDests = await eventProxy.getRegisteredDestinations(sender.address, event1);

            expect(registeredDests.length).to.equal(1);
            expect(registeredDests[0]).to.equal(destination1.address);
        });

        it("Emits an event with the proper arguments", async () => {
            const receipt = await (
                await eventProxy.registerDestinations([
                    {
                        sender: sender.address,
                        eventType: event1,
                        destinations: [destination1.address],
                    },
                ])
            ).wait();

            const eventArgs = receipt?.events?.[0]?.args?.[0]?.[0];

            expect(eventArgs?.sender).to.equal(sender.address);
            expect(eventArgs?.eventType).to.equal(event1);
            expect(eventArgs?.destinations?.[0]).to.equal(destination1.address);
        });

        it("should delete existing destinations on update", async () => {
            await eventProxy.registerDestinations([
                {
                    sender: sender.address,
                    eventType: event1,
                    destinations: [other.address],
                },
                {
                    sender: sender.address,
                    eventType: event1,
                    destinations: [destination1.address],
                },
            ]);

            await eventProxy.registerDestinations([
                {
                    sender: sender.address,
                    eventType: event1,
                    destinations: [destination1.address],
                },
            ]);

            const registeredDests = await eventProxy.getRegisteredDestinations(sender.address, event1);

            expect(registeredDests.length).to.equal(1);
            expect(registeredDests[0]).to.equal(destination1.address);
        });
    });

    describe("Test Process Messages", () => {
        it("Only processes messages from FxPortal", async () => {
            const eventType = ethers.utils.formatBytes32String("eventType");

            await expect(
                eventProxy.connect(deployer).processMessageFromRoot(1, sender.address, eventType)
            ).to.be.revertedWith("NOT_STATE_SENDER");

            await expect(
                eventProxy.connect(fxPortalSender).processMessageFromRoot(1, sender.address, eventType)
            ).to.not.be.revertedWith("NOT_STATE_SENDER");
        });

        it("Only processes a message once", async () => {
            const eventType = ethers.utils.formatBytes32String("eventType");
            await eventProxy.connect(deployer).setSenderRegistration(sender.address, true);

            await eventProxy.connect(fxPortalSender).processMessageFromRoot(1, sender.address, eventType);

            await expect(
                eventProxy.connect(fxPortalSender).processMessageFromRoot(1, sender.address, eventType)
            ).to.be.revertedWith("EVENT_ALREADY_PROCESSED");
        });

        it("Requires root sender to be registered", async () => {
            const eventType = ethers.utils.formatBytes32String("eventType");
            await eventProxy.connect(deployer).setSenderRegistration(sender.address, true);

            await expect(
                eventProxy.connect(fxPortalSender).processMessageFromRoot(1, fxPortalSender.address, eventType)
            ).to.be.revertedWith("INVALID_ROOT_SENDER");

            await expect(
                eventProxy.connect(fxPortalSender).processMessageFromRoot(1, sender.address, eventType)
            ).to.not.be.revertedWith("INVALID_ROOT_SENDER");
        });

        it("Requires event data", async () => {
            const noData = ethers.utils.formatBytes32String("");
            await eventProxy.connect(deployer).setSenderRegistration(sender.address, true);

            await expect(
                eventProxy.connect(fxPortalSender).processMessageFromRoot(1, sender.address, noData)
            ).to.be.revertedWith("INVALID_EVENT_TYPE");
        });

        it("Emits an event when an event is forwarded", async () => {
            await mockDestination.mock.onEventReceive.returns();

            const eventType = ethers.utils.formatBytes32String("eventType");
            await eventProxy.connect(deployer).setSenderRegistration(sender.address, true);
            await eventProxy.connect(deployer).registerDestinations([
                {
                    sender: sender.address,
                    eventType: eventType,
                    destinations: [mockDestination.address],
                },
            ]);

            await expect(eventProxy.connect(fxPortalSender).processMessageFromRoot(1, sender.address, eventType))
                .to.emit(eventProxy, "EventSent")
                .withArgs(eventType, sender.address, mockDestination.address, eventType);
        });

        it("Parses the event type from the full data body", async () => {
            await mockDestination.mock.onEventReceive.returns();

            const data =
                "0x4465706f736974000000000000000000000000000000000000000000000000000000000000000000000000003d146a937ddada8afa2536367832128f3f967e29000000000000000000000000156de8c7e1ec3bbf4f62a3e30fe248fe6505e56f00000000000000000000000000000000000000000000001cd6fbad57dbd00000";
            const eventType = ethers.utils.formatBytes32String("Deposit");
            await eventProxy.connect(deployer).setSenderRegistration(sender.address, true);
            await eventProxy.connect(deployer).registerDestinations([
                {
                    sender: sender.address,
                    eventType: eventType,
                    destinations: [mockDestination.address],
                },
            ]);

            await expect(eventProxy.connect(fxPortalSender).processMessageFromRoot(1, sender.address, data))
                .to.emit(eventProxy, "EventSent")
                .withArgs(eventType, sender.address, mockDestination.address, data);
        });
    });

    describe("Test Unregister Destination", () => {
        it("Reverts when someone other than owner calls", async () => {
            await expect(
                eventProxy.connect(other).unregisterDestination(sender.address, destination1.address, event1)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Reverts if destination does not exist", async () => {
            await eventProxy.registerDestinations([
                {
                    sender: sender.address,
                    eventType: event1,
                    destinations: [destination1.address],
                },
            ]);

            await expect(eventProxy.unregisterDestination(sender.address, other.address, event1)).to.be.revertedWith(
                "DESTINATION_DOES_NOT_EXIST"
            );
        });

        it("Properly deletes a registered destination", async () => {
            await eventProxy.registerDestinations([
                {
                    sender: sender.address,
                    eventType: event1,
                    destinations: [destination1.address],
                },
            ]);

            expect((await eventProxy.getRegisteredDestinations(sender.address, event1))[0]).to.equal(
                destination1.address
            );

            await eventProxy.unregisterDestination(sender.address, destination1.address, event1);

            expect((await eventProxy.getRegisteredDestinations(sender.address, event1)).length).to.equal(0);
        });

        it("Emits an event with the proper arguments", async () => {
            await eventProxy.registerDestinations([
                {
                    sender: sender.address,
                    eventType: event1,
                    destinations: [destination1.address],
                },
            ]);

            const tx = await eventProxy
                .connect(deployer)
                .unregisterDestination(sender.address, destination1.address, event1);

            const receipt = await tx.wait();

            expect(receipt.events?.[0].args?.sender).to.equal(sender.address);
            expect(receipt.events?.[0].args?.l2Endpoint).to.equal(destination1.address);
            expect(receipt.events?.[0].args?.eventType).to.equal(event1);
        });

        it("should preserve destination order", async () => {
            const payload = {
                sender: sender.address,
                eventType: event1,
                destinations: [destination1.address, destination2.address, destination3.address],
            };

            await eventProxy.registerDestinations([payload]);

            let registeredDests = await eventProxy.getRegisteredDestinations(sender.address, event1);

            expect(registeredDests.length).to.equal(3);

            // remove the middle item
            await eventProxy.unregisterDestination(sender.address, destination2.address, event1);

            registeredDests = await eventProxy.getRegisteredDestinations(sender.address, event1);
            expect(registeredDests.length).to.equal(2);
            expect(registeredDests[0]).to.be.equal(destination1.address);
            expect(registeredDests[1]).to.be.equal(destination3.address);
        });
    });
});
