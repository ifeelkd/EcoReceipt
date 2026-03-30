import { keccak256, toHex } from 'viem';

export const ECO_RECEIPT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x45Ed81721ad9faeE75e47a2F1052ab99006e62BC") as `0x${string}`;

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
    "inputs": [
      { "indexed": true, "name": "id", "type": "uint256" },
      { "indexed": true, "name": "customer", "type": "address" },
      { "indexed": false, "name": "amount", "type": "uint256" },
      { "indexed": false, "name": "currency", "type": "string" },
      { "indexed": false, "name": "itemName", "type": "string" },
      { "indexed": false, "name": "warrantyExpiryTimestamp", "type": "uint256" }
    ],
    "name": "ReceiptIssued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": true, "name": "id", "type": "uint256" }],
    "name": "ReceiptReturned",
    "type": "event"
  },
  {
    "inputs": [
      { "name": "_receiptId", "type": "uint256" },
      { "name": "_customer", "type": "address" }
    ],
    "name": "checkWarranty",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_customer", "type": "address" }],
    "name": "getReceiptsByCustomer",
    "outputs": [
      {
        "components": [
          { "name": "id", "type": "uint256" },
          { "name": "customer", "type": "address" },
          { "name": "amount", "type": "uint256" },
          { "name": "currency", "type": "string" },
          { "name": "itemName", "type": "string" },
          { "name": "issueTimestamp", "type": "uint256" },
          { "name": "warrantyExpiryTimestamp", "type": "uint256" },
          { "name": "ipfsHash", "type": "string" },
          { "name": "isReturned", "type": "bool" }
        ],
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "_customer", "type": "address" },
      { "name": "_amount", "type": "uint256" },
      { "name": "_currency", "type": "string" },
      { "name": "_itemName", "type": "string" },
      { "name": "_warrantyExpiryTimestamp", "type": "uint256" },
      { "name": "_ipfsHash", "type": "string" }
    ],
    "name": "issueReceipt",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "_receiptId", "type": "uint256" },
      { "name": "_customer", "type": "address" }
    ],
    "name": "markReturned",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "role", "type": "bytes32" },
      { "name": "account", "type": "address" }
    ],
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "role", "type": "bytes32" },
      { "name": "account", "type": "address" }
    ],
    "name": "hasRole",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
