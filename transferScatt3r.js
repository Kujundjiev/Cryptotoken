const hre = require("hardhat");

async function main() {
  const [sender] = await hre.ethers.getSigners();
  const recipientAddress = "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec"; // Replace with the actual recipient address
  const scatt3rTokenAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // SCATT3R token address
  const scatt3rAmount = hre.ethers.utils.parseUnits("100", 18); // Amount to send

  // Get contract instance
  const scatt3r = await hre.ethers.getContractAt("Scatt3rToken", scatt3rTokenAddress);

  // Check sender's balance
  const senderBalance = await scatt3r.balanceOf(sender.address);
  console.log(`Sender SCATT3R Balance: ${hre.ethers.utils.formatUnits(senderBalance, 18)}`);

  if (senderBalance.lt(scatt3rAmount)) {
    console.error("Insufficient balance to transfer SCATT3R tokens.");
    return;
  }

  // Transfer SCATT3R tokens
  console.log(`Transferring ${hre.ethers.utils.formatUnits(scatt3rAmount, 18)} SCATT3R to ${recipientAddress}...`);
  const tx = await scatt3r.transfer(recipientAddress, scatt3rAmount);
  await tx.wait();
  console.log("Transfer successful!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });