import { keccak256, toHex } from 'viem';

export const ECO_RECEIPT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const RETAILER_ROLE = keccak256(toHex("RETAILER_ROLE"));

export const ECO_RECEIPT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "indexed": true,
    "internalType": "uint256",
    "name": "id",
    "type": "uint256"
  },
  {
    "anonymous": false,
    "indexed": true,
    "internalType": "address",
    "name": "customer",
    "type": "address"
  },
  {
    "anonymous": false,
    "indexed": false,
    "internalType": "uint256",
    "name": "amount",
    "type": "uint256"
  },
  {
    "anonymous": false,
    "indexed": false,
    "internalType": "string",
    "name": "itemName",
    "type": "string"
  },
  {
    "anonymous": false,
    "indexed": false,
    "internalType": "uint256",
    "name": "warrantyExpiry",
    "type": "uint256"
  },
  {
    "name": "ReceiptIssued",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_receiptId", "type": "uint256" },
      { "internalType": "address", "name": "_customer", "type": "address" }
    ],
    "name": "checkWarranty",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_customer", "type": "address" }],
    "name": "getReceiptsByCustomer",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "address", "name": "customer", "type": "address" },
          { "internalType": "uint256", "name": "amount", "type": "uint256" },
          { "internalType": "string", "name": "category", "type": "string" },
          { "internalType": "string", "name": "itemName", "type": "string" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "warrantyExpiry", "type": "uint256" },
          { "internalType": "string", "name": "ipfsHash", "type": "string" }
        ],
        "internalType": "struct EcoReceipt.Receipt[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_customer", "type": "address" },
      { "internalType": "uint256", "name": "_amount", "type": "uint256" },
      { "internalType": "string", "name": "_category", "type": "string" },
      { "internalType": "string", "name": "_itemName", "type": "string" },
      { "internalType": "uint256", "name": "_warrantyDays", "type": "uint256" },
      { "internalType": "string", "name": "_ipfsHash", "type": "string" }
    ],
    "name": "issueReceipt",
    "outputs": [],
    "stateMutability": "nonpayable",
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "role", "type": "bytes32" },
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "role", "type": "bytes32" },
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "hasRole",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
