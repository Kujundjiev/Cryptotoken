const { ethers } = require("hardhat");

async function main() {
    try {
        console.log("Starting interaction script...");

        // Get contracts with proper await for deployment
        const ScatterToken = await ethers.getContractFactory("ScatterToken");
        const Scatt3rToken = await ethers.getContractFactory("Scatt3rToken");
        const ScatterStaking = await ethers.getContractFactory("ScatterStaking");

        console.log("Getting deployed contracts...");
        
        const scatterToken = await ScatterToken.deploy();
        await scatterToken.waitForDeployment();
        console.log("ScatterToken deployed to:", await scatterToken.getAddress());

        const scatt3rToken = await Scatt3rToken.deploy();
        await scatt3rToken.waitForDeployment();
        console.log("Scatt3rToken deployed to:", await scatt3rToken.getAddress());

        const staking = await ScatterStaking.deploy(
            await scatterToken.getAddress(),
            await scatt3rToken.getAddress()
        );
        await staking.waitForDeployment();
        console.log("ScatterStaking deployed to:", await staking.getAddress());

        // Set up permissions
        await scatt3rToken.setStakingContract(await staking.getAddress());
        console.log("Staking contract set up completed");

        // Get signers
        const [owner, user1] = await ethers.getSigners();
        console.log("\nOwner address:", await owner.getAddress());
        console.log("User1 address:", await user1.getAddress());

        // Check initial balances
        const ownerBalance = await scatterToken.balanceOf(owner.getAddress());
        console.log("\nInitial SCATTER balance of owner:", ethers.formatEther(ownerBalance));

        // Transfer SCATTER to user1
        const transferAmount = ethers.parseEther("1000");
        const tx1 = await scatterToken.transfer(user1.getAddress(), transferAmount);
        await tx1.wait();
        console.log("\nTransferred 1000 SCATTER to user1");

        // User1 locks SCATTER to get SCATT3R
        const lockAmount = ethers.parseEther("100");
        const tx2 = await scatterToken.connect(user1).approve(await staking.getAddress(), lockAmount);
        await tx2.wait();
        const tx3 = await staking.connect(user1).lockTokens(lockAmount);
        await tx3.wait();
        console.log("\nUser1 locked 100 SCATTER tokens");

        // Check SCATT3R balance
        const scatt3rBalance = await scatt3rToken.balanceOf(user1.getAddress());
        console.log("User1 SCATT3R balance:", ethers.formatEther(scatt3rBalance));

        // Start farming
        const tx4 = await scatt3rToken.connect(user1).approve(await staking.getAddress(), lockAmount);
        await tx4.wait();
        const tx5 = await staking.connect(user1).startFarming(lockAmount);
        await tx5.wait();
        console.log("\nUser1 started farming with 100 SCATT3R tokens");

        // Check farming balance
        const farmingBalance = await staking.farmingBalance(user1.getAddress());
        console.log("User1 farming balance:", ethers.formatEther(farmingBalance));

        // Check rewards after some time
        console.log("\nSimulating time passage for rewards...");
        await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]); // 30 days
        await ethers.provider.send("evm_mine");

        const pendingRewards = await staking.calculateFarmingReward(user1.getAddress());
        console.log("Pending rewards after 30 days:", ethers.formatEther(pendingRewards));

    } catch (error) {
        console.error("\nError occurred:");
        console.error(error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 