# EcoReceipt v2 - Decentralized Receipt Vault

EcoReceipt v2 is a mobile-first, decentralized application that records "Proof of Purchase" (Cloud Proofs) without handling direct money transfers. It supports multiple global currencies and ensures only authorized shops can issue receipts.

## 🚀 Consumer-Ready Features
- **App-Shell UX**: Optimized for mobile with persistent bottom navigation and zero clunky footers.
- **Multi-Currency Support**: Issue receipts in INR, USD, EUR, GBP, AED, and JPY.
- **Digital ID**: Privacy-preserving identification for your receipt vault.
- **Cloud Proofs**: Decentralized storage for lifetime record access.

## 🛠️ Developer Setup (Ethereum Sepolia)

### 1. Get Sepolia Test ETH
- Visit a faucet like [Alchemy Sepolia Faucet](https://sepoliafaucet.com/) or [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia).
- Enter your **Digital ID** (Wallet Address) to receive free Test ETH.

### 2. Configure MetaMask
- Open MetaMask > Network Selection.
- Ensure "Show test networks" is ON.
- Switch to **Sepolia Test Network**.

### 3. Understanding the Flow
- **Product Price**: Paid in real-world Cash/UPI/Card at the physical store.
- **Gas Fee**: A minimal network processing fee paid in **free Test ETH** to secure your digital receipt on the blockchain.

## 📦 Technical Stack
- **Frontend**: Next.js 15, Tailwind CSS v4, Framer Motion.
- **Web3**: Wagmi v2, Viem, ConnectKit.
- **Contract**: Solidity ^0.8.24 (Sepolia Chain ID: 11155111).
- **Storage**: Pinata IPFS (Server Actions).

---
*EcoReceipt v2 - Sustainable Commerce, Secured by Blockchain.*
