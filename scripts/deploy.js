// const hre = require("hardhat");

// async function main() {
//   const EcoReceipt = await hre.ethers.deployContract("EcoReceipt");
//   await EcoReceipt.waitForDeployment();

//   console.log(`EcoReceipt deployed to: ${EcoReceipt.target}`);
// }

// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });

import hre from "hardhat";

async function main() {
  console.log("Deploying EcoReceipt Smart Contract...");

  // Get the contract factory
  const EcoReceipt = await hre.ethers.getContractFactory("EcoReceipt");
  
  // Deploy the contract
  const ecoReceipt = await EcoReceipt.deploy();

  // Wait for it to finish deploying
  await ecoReceipt.waitForDeployment();

  // Print the final address!
  console.log(`✅ EcoReceipt deployed to: ${await ecoReceipt.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});