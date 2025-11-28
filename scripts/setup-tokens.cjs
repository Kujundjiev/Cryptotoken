const hre = require("hardhat");
const { ethers } = require("hardhat");

// Define the Staking Contract ABI manually
const STAKING_ABI = [
  "function stakeTokens(uint256 amount) external",
  "function unstakeTokens(uint256 amount) external",
  "function getStakedBalance(address account) external view returns (uint256)",
  "function stake(uint256 _amount) external",
  "function unstake(uint256 _amount) external",
  "function getReward() external",
  "function exit() external"
];

async function main() {
  try {
    // Contract addresses
    const SCATTER_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const SCATT3R_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const STAKING_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    const WALLET_ADDRESS = "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec";

    const [signer] = await ethers.getSigners();
    console.log("Using signer address:", signer.address);

    // Get contract instances
    const scatter = await ethers.getContractAt("ScatterToken", SCATTER_ADDRESS);
    const scatt3r = await ethers.getContractAt("Scatt3rToken", SCATT3R_ADDRESS);
    
    // Create staking contract instance with explicit ABI
    const staking = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);

    console.log("Checking initial balances...");
    
    // Check initial balances
    const scatterBalance = await scatter.balanceOf(WALLET_ADDRESS);
    const scatt3rBalance = await scatt3r.balanceOf(WALLET_ADDRESS);
    
    console.log("\nInitial Balances for wallet:", WALLET_ADDRESS);
    console.log("SCATTER Balance:", ethers.formatUnits(scatterBalance, 18));
    console.log("SCATT3R Balance:", ethers.formatUnits(scatt3rBalance, 18));

    // Approve staking contract to spend SCATTER
    console.log("\nApproving SCATTER for staking...");
    const stakeAmount = ethers.parseUnits("1000", 18);
    const approveTx = await scatter.connect(signer).approve(STAKING_ADDRESS, stakeAmount);
    await approveTx.wait();
    console.log("Approval complete");

    // Try to get staked balance first
    try {
        const stakedBalance = await staking.getStakedBalance(WALLET_ADDRESS);
        console.log("\nCurrent staked balance:", ethers.formatUnits(stakedBalance, 18));
    } catch (error) {
        console.log("Could not get staked balance. This is not critical.");
    }

    // Stake SCATTER to earn SCATT3R
    console.log("\nStaking SCATTER tokens...");
    let stakeTx;
    try {
        // Try stakeTokens first
        stakeTx = await staking.stakeTokens(stakeAmount);
    } catch (error) {
        console.log("stakeTokens failed, trying stake...");
        // If stakeTokens fails, try stake
        stakeTx = await staking.stake(stakeAmount);
    }
    await stakeTx.wait();
    console.log("Staking complete");

    // Get final balances
    const finalScatterBalance = await scatter.balanceOf(WALLET_ADDRESS);
    const finalScatt3rBalance = await scatt3r.balanceOf(WALLET_ADDRESS);
    
    console.log("\nFinal Balances for wallet:", WALLET_ADDRESS);
    console.log("SCATTER Balance:", ethers.formatUnits(finalScatterBalance, 18));
    console.log("SCATT3R Balance:", ethers.formatUnits(finalScatt3rBalance, 18));

    // Try to get final staked balance
    try {
        const finalStakedBalance = await staking.getStakedBalance(WALLET_ADDRESS);
        console.log("Final staked balance:", ethers.formatUnits(finalStakedBalance, 18));
    } catch (error) {
        console.log("Could not get final staked balance. This is not critical.");
    }

  } catch (error) {
    console.error("\nError occurred:");
    console.error("Error:", error.message);
    if (error.data) {
      console.error("Additional error data:", error.data);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 