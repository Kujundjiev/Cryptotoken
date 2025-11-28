const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ScatterStaking", function () {
    let scatterToken;
    let scatt3rToken;
    let scatterStaking;
    let owner;
    let user;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();

        // Deploy SCATTER token
        const ScatterToken = await ethers.getContractFactory("contracts/ScatterToken.sol:ScatterToken");
        scatterToken = await ScatterToken.deploy();
        await scatterToken.waitForDeployment();

        // Deploy SCATT3R token
        const Scatt3rToken = await ethers.getContractFactory("Scatt3rToken");
        scatt3rToken = await Scatt3rToken.deploy();
        await scatt3rToken.waitForDeployment();

        // Deploy Staking contract with both token addresses
        const ScatterStaking = await ethers.getContractFactory("ScatterStaking");
        scatterStaking = await ScatterStaking.deploy(
            await scatterToken.getAddress(),
            await scatt3rToken.getAddress()
        );
        await scatterStaking.waitForDeployment();

        // Set up permissions
        await scatt3rToken.setStakingContract(await scatterStaking.getAddress());
        
        // Transfer some SCATTER tokens to user for testing
        await scatterToken.transfer(user.address, ethers.parseEther("1000"));
    });

    it("Should allow locking SCATTER tokens for SCATT3R", async function () {
        const lockAmount = ethers.parseEther("100");
        
        // Approve SCATTER tokens for locking
        await scatterToken.connect(user).approve(await scatterStaking.getAddress(), lockAmount);
        
        // Lock tokens
        await scatterStaking.connect(user).lockTokens(lockAmount);
        
        // Check balances
        expect(await scatterStaking.lockedBalance(user.address)).to.equal(lockAmount);
        expect(await scatt3rToken.balanceOf(user.address)).to.equal(lockAmount);
    });

    it("Should allow farming with SCATT3R tokens", async function () {
        const amount = ethers.parseEther("100");
        
        // First lock SCATTER to get SCATT3R
        await scatterToken.connect(user).approve(await scatterStaking.getAddress(), amount);
        await scatterStaking.connect(user).lockTokens(amount);
        
        // Approve SCATT3R for farming
        await scatt3rToken.connect(user).approve(await scatterStaking.getAddress(), amount);
        
        // Start farming
        await scatterStaking.connect(user).startFarming(amount);
        
        expect(await scatterStaking.farmingBalance(user.address)).to.equal(amount);
    });

    it("Should allow claiming farming rewards", async function () {
        const amount = ethers.parseEther("100");
        
        // Lock and farm
        await scatterToken.connect(user).approve(await scatterStaking.getAddress(), amount);
        await scatterStaking.connect(user).lockTokens(amount);
        await scatt3rToken.connect(user).approve(await scatterStaking.getAddress(), amount);
        await scatterStaking.connect(user).startFarming(amount);
        
        // Advance time for rewards
        await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]); // 30 days
        await ethers.provider.send("evm_mine");
        
        // Get balances before stopping farming
        const scatterBefore = await scatterToken.balanceOf(user.address);
        const scatt3rBefore = await scatt3rToken.balanceOf(user.address);
        
        // Stop farming
        await scatterStaking.connect(user).stopFarming();
        
        // Check balances
        expect(await scatterToken.balanceOf(user.address)).to.be.gt(scatterBefore); // Should have more SCATTER (rewards)
        expect(await scatt3rToken.balanceOf(user.address)).to.equal(scatt3rBefore + amount); // Should have SCATT3R back
        
        // Alternative way to check SCATT3R balance
        const expectedScatt3rBalance = BigInt(scatt3rBefore) + BigInt(amount);
        expect(await scatt3rToken.balanceOf(user.address)).to.equal(expectedScatt3rBalance);
    });
});

describe("Admin Functions", function () {
    let scatterToken;
    let scatt3rToken;
    let scatterStaking;
    let owner;
    let user;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();

        // Deploy SCATTER token
        const ScatterToken = await ethers.getContractFactory("contracts/ScatterToken.sol:ScatterToken");
        scatterToken = await ScatterToken.deploy();
        await scatterToken.waitForDeployment();

        // Deploy SCATT3R token
        const Scatt3rToken = await ethers.getContractFactory("Scatt3rToken");
        scatt3rToken = await Scatt3rToken.deploy();
        await scatt3rToken.waitForDeployment();

        // Deploy Staking contract
        const ScatterStaking = await ethers.getContractFactory("ScatterStaking");
        scatterStaking = await ScatterStaking.deploy(
            await scatterToken.getAddress(),
            await scatt3rToken.getAddress()
        );
        await scatterStaking.waitForDeployment();

        await scatt3rToken.setStakingContract(await scatterStaking.getAddress());
    });

    it("Should allow owner to change farming reward rate", async function () {
        const newRate = 200; // 2% APY
        await scatterStaking.connect(owner).setFarmingRewardRate(newRate);
        expect(await scatterStaking.farmingRewardRate()).to.equal(newRate);
    });

    it("Should not allow non-owner to change farming reward rate", async function () {
        const newRate = 200;
        await expect(
            scatterStaking.connect(user).setFarmingRewardRate(newRate)
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to toggle farming", async function () {
        // Initially enabled
        expect(await scatterStaking.farmingEnabled()).to.be.true;

        // Disable farming
        await scatterStaking.connect(owner).toggleFarming();
        expect(await scatterStaking.farmingEnabled()).to.be.false;

        // Try to farm when disabled
        const amount = ethers.parseEther("100");
        await scatterToken.transfer(user.address, amount);
        await scatterToken.connect(user).approve(await scatterStaking.getAddress(), amount);
        
        await expect(
            scatterStaking.connect(user).startFarming(amount)
        ).to.be.revertedWith("Farming is not enabled");

        // Enable farming again
        await scatterStaking.connect(owner).toggleFarming();
        expect(await scatterStaking.farmingEnabled()).to.be.true;
    });

    it("Should not allow non-owner to toggle farming", async function () {
        await expect(
            scatterStaking.connect(user).toggleFarming()
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to set staking contract for SCATT3R", async function () {
        const newStakingContract = ethers.Wallet.createRandom().address;
        await scatt3rToken.connect(owner).setStakingContract(newStakingContract);
        expect(await scatt3rToken.stakingContract()).to.equal(newStakingContract);
    });

    it("Should not allow non-owner to set staking contract for SCATT3R", async function () {
        const newStakingContract = ethers.Wallet.createRandom().address;
        await expect(
            scatt3rToken.connect(user).setStakingContract(newStakingContract)
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow setting invalid staking contract address", async function () {
        await expect(
            scatt3rToken.connect(owner).setStakingContract(ethers.ZeroAddress)
        ).to.be.revertedWith("Invalid staking contract");
    });

    it("Should verify reward calculations with different rates", async function () {
        const amount = ethers.parseEther("100");
        const newRate = 200; // 2% APY
        
        // Setup farming
        await scatterToken.transfer(user.address, amount);
        await scatterToken.connect(user).approve(await scatterStaking.getAddress(), amount);
        await scatterStaking.connect(user).lockTokens(amount);
        await scatt3rToken.connect(user).approve(await scatterStaking.getAddress(), amount);
        await scatterStaking.connect(user).startFarming(amount);

        // Change rate
        await scatterStaking.connect(owner).setFarmingRewardRate(newRate);
        
        // Advance time
        await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]); // 1 year
        await ethers.provider.send("evm_mine");

        // Check reward calculation
        const reward = await scatterStaking.calculateFarmingReward(user.address);
        const expectedReward = (amount * BigInt(newRate)) / BigInt(100); // 2% of staked amount
        expect(reward).to.be.closeTo(expectedReward, ethers.parseEther("0.1")); // Allow small rounding difference
    });
});