import hre from "hardhat";

async function main() {
    const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const targetAddress = process.env.TARGET_ADDRESS;

    if (!targetAddress) {
        console.error("❌ Please set TARGET_ADDRESS environment variable.");
        console.error("Example: TARGET_ADDRESS=0x123... npx hardhat run scripts/grantAdmin.js --network localhost");
        process.exit(1);
    }

    console.log(`🔌 Connecting to EcoReceipt at ${CONTRACT_ADDRESS}...`);
    const EcoReceipt = await hre.ethers.getContractAt("EcoReceipt", CONTRACT_ADDRESS);

    // Compute DEFAULT_ADMIN_ROLE using bytes32(0)
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

    console.log(`🔍 Checking if ${targetAddress} already has DEFAULT_ADMIN_ROLE...`);
    const hasRole = await EcoReceipt.hasRole(DEFAULT_ADMIN_ROLE, targetAddress);

    if (hasRole) {
        console.log(`✅ Address ${targetAddress} already has DEFAULT_ADMIN_ROLE.`);
        return;
    }

    console.log(`⏳ Granting DEFAULT_ADMIN_ROLE to ${targetAddress}...`);
    
    try {
        const tx = await EcoReceipt.grantRole(DEFAULT_ADMIN_ROLE, targetAddress);
        console.log(`📤 Transaction sent: ${tx.hash}`);
        
        console.log(`⏳ Waiting for confirmation...`);
        await tx.wait();
        
        console.log(`✅ Success! DEFAULT_ADMIN_ROLE granted to ${targetAddress}`);
    } catch (error) {
        console.error(`❌ Failed to grant role:`, error.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
