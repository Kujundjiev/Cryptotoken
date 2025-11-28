const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  try {
    // Your MetaMask address
    const yourAddress = "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec";
    
    console.log("Starting deployment...");
    console.log("Will transfer tokens to:", yourAddress);
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    
    // Deploy SCATTER
    console.log("\nDeploying SCATTER Token...");
    const ScatterToken = await ethers.getContractFactory("ScatterToken");
    const scatter = await ScatterToken.deploy();
    await scatter.waitForDeployment();
    const scatterAddress = await scatter.getAddress();
    console.log("SCATTER Token deployed to:", scatterAddress);
    

    // Deploy SCATT3R
    console.log("\nDeploying SCATT3R Token...");
    const Scatt3rToken = await ethers.getContractFactory("Scatt3rToken");
    const scatt3r = await Scatt3rToken.deploy();
    await scatt3r.waitForDeployment();
    const scatt3rAddress = await scatt3r.getAddress();
    console.log("SCATT3R Token deployed to:", scatt3rAddress);
    

    // Deploy Staking Contract
    console.log("\nDeploying Staking Contract...");
    const ScatterStaking = await ethers.getContractFactory("ScatterStaking");
    const staking = await ScatterStaking.deploy(scatterAddress, scatt3rAddress);
    await staking.waitForDeployment();
    const stakingAddress = await staking.getAddress();
    console.log("Staking Contract deployed to:", stakingAddress);

    // Set Staking Contract as authorized minter for SCATT3R
    console.log("\nSetting up staking contract as authorized minter...");
    await scatt3r.setStakingContract(stakingAddress);
    console.log("Staking contract authorized as minter");
    
    // Transfer SCATTER tokens to your address
    console.log("\nTransferring SCATTER tokens to your address...");
    await scatter.transfer(yourAddress, ethers.parseUnits("100000", 18));
    
    // Transfer ownership
    console.log("\nTransferring ownership...");
    await scatter.transferOwnership(yourAddress);
    await scatt3r.transferOwnership(yourAddress);
    await staking.transferOwnership(yourAddress);
    
    console.log("\nDeployment and setup complete!");
    console.log("Your address:", yourAddress);
    console.log("SCATTER address:", scatterAddress);
    console.log("SCATT3R address:", scatt3rAddress);
    console.log("Staking Contract address:", stakingAddress);
    
  } catch (error) {
    console.error("\nDeployment failed!");
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 