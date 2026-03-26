import "@nomicfoundation/hardhat-toolbox";

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: "0.8.24", // Make sure this matches your EcoReceipt.sol version
  networks: {
    hardhat: {
      chainId: 1337 // Standard for local testing
    }
  }
};

export default config;