import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import * as timeMachine from "ganache-time-traveler";
import {ethers} from "hardhat";
import {PreToke} from "../typechain";

const {id} = ethers.utils;

describe("Test PTOKE Token", () => {
    let pToke: PreToke;
    let snapshotId: any;
    let deployer: SignerWithAddress;
    let user1: SignerWithAddress;

    beforeEach(async () => {
        const snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    before(async () => {
        [deployer, user1] = await ethers.getSigners();
        const preTokeFactory = await ethers.getContractFactory("PreToke");
        pToke = await preTokeFactory.connect(deployer).deploy();
    });

    describe("Initialization", async () => {
        it("Has a name", async () => {
            const name = await pToke.connect(user1).name();
            expect(name).to.equal("PreToke");
        });

        it("Has a symbol", async () => {
            const symbol = await pToke.connect(user1).symbol();
            expect(symbol).to.equal("PTOKE");
        });

        it("Has standard precision", async () => {
            const dec = await pToke.connect(user1).decimals();
            expect(dec).to.equal(18);
        });

        it("Mints 10 to User 1", async () => {
            await pToke.connect(deployer).mint(user1.address, 10);
            const user1Bal = await pToke.connect(user1).balanceOf(user1.address);
            const totalSupply = await pToke.connect(user1).totalSupply();
            expect(user1Bal).to.equal("10");
            expect(totalSupply).to.equal("10");
        });

        it("Deployer has ADMIN, MINTER, and PAUSER Roles", async () => {
            const adminRoleId = await pToke.connect(user1).DEFAULT_ADMIN_ROLE(); //AKA formatBytes32String(0)
            const hasAdmin = await pToke.connect(user1).hasRole(adminRoleId, deployer.address);
            const hasMinter = await pToke.connect(user1).hasRole(id("MINTER_ROLE"), deployer.address);
            const hasPauser = await pToke.connect(user1).hasRole(id("PAUSER_ROLE"), deployer.address);
            expect(hasAdmin).to.equal(true);
            expect(hasMinter).to.equal(true);
            expect(hasPauser).to.equal(true);
        });

        it("Nobody else has ADMIN, MINTER, and PAUSER Roles", async () => {
            const adminRoleId = await pToke.connect(user1).DEFAULT_ADMIN_ROLE(); //AKA formatBytes32String(0)
            const hasAdmin = await pToke.connect(user1).hasRole(adminRoleId, user1.address);
            const hasMinter = await pToke.connect(user1).hasRole(id("MINTER_ROLE"), user1.address);
            const hasPauser = await pToke.connect(user1).hasRole(id("PAUSER_ROLE"), user1.address);
            expect(hasAdmin).to.equal(false);
            expect(hasMinter).to.equal(false);
            expect(hasPauser).to.equal(false);
        });
    });
});
