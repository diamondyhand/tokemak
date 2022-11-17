const {expect} = require("chai");
const timeMachine = require("ganache-time-traveler");
const {ethers} = require("hardhat");

describe("Test TOKE Token", () => {
    let toke;
    let snapshotId;
    let deployer;
    let user1;

    beforeEach(async () => {
        let snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot["result"];
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    before(async () => {
        [deployer, user1] = await ethers.getSigners();
        const tokeFactory = await ethers.getContractFactory("Toke");
        toke = await tokeFactory.deploy();
    });

    describe("Initialization", () => {
        it("Has a name", async () => {
            const name = await toke.connect(user1).name();
            expect(name).to.equal("Tokemak");
        });

        it("Has a symbol", async () => {
            const symbol = await toke.connect(user1).symbol();
            expect(symbol).to.equal("TOKE");
        });

        it("Has standard precision", async () => {
            const dec = await toke.connect(user1).decimals();
            expect(dec).to.equal(18);
        });

        it("Mints 100M", async () => {
            const supply = await toke.connect(user1).totalSupply();
            expect(supply).to.equal("100000000000000000000000000");
        });

        it("Mints initial amount to deployer", async () => {
            const bal = await toke.connect(user1).balanceOf(deployer.address);
            expect(bal).to.equal("100000000000000000000000000");
        });
    });

    describe("Pausing", () => {
        it("Prevents transfers when paused", async () => {
            await toke.connect(deployer).transfer(user1.address, 100);
            await toke.connect(deployer).pause();
            await expect(toke.connect(deployer).transfer(user1.address, 100)).to.be.revertedWith(
                "ERC20Pausable: token transfer while paused"
            );
            await toke.connect(deployer).unpause();
            await expect(toke.connect(deployer).transfer(user1.address, 100)).to.not.be.reverted;
        });
    });
});
