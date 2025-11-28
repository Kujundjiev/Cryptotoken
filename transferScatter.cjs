const hre = require("hardhat");
const { ethers } = require("hardhat");

// SCATTER Token contract address and ABI
const scatterTokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Replace with your SCATTER token address

// SCATT3R Token contract address and ABI
const scatt3rTokenAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'; // SCATT3R token address

// Admin and recipient addresses
const adminAddress = '0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec'; // Replace with your admin address
const recipientAddress = '0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec'; // Recipient address
const scatterAmount = ethers.parseUnits("10000", 18); // Amount to send for SCATTER
const scatt3rAmount = ethers.parseUnits("10000", 18); // Amount to send for SCATT3R

async function main() {
  const [sender] = await ethers.getSigners();
  const recipientAddress = "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec"; // Recipient address
  const scatterTokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // SCATTER token address
  const scatterAmount = ethers.parseUnits("10000", 18); // Amount to send

  try {
    // Get contract instance
    const scatter = await ethers.getContractAt("ScatterToken", scatterTokenAddress);

    // Check sender's balance
    const senderBalance = await scatter.balanceOf(sender.address);
    console.log(`Sender SCATTER Balance: ${ethers.formatUnits(senderBalance, 18)}`);

    if (senderBalance < scatterAmount) {
      console.error("Insufficient balance to transfer SCATTER tokens.");
      return;
    }

    // Transfer SCATTER tokens
    console.log(`Transferring ${ethers.formatUnits(scatterAmount, 18)} SCATTER to ${recipientAddress}...`);
    const tx = await scatter.transfer(recipientAddress, scatterAmount);
    await tx.wait();
    console.log("Transfer successful!");

    // Get final balance
    const finalBalance = await scatter.balanceOf(recipientAddress);
    console.log(`Recipient's final SCATTER balance: ${ethers.formatUnits(finalBalance, 18)}`);

  } catch (error) {
    console.error("Error during transfer:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });