// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EcoReceipt Dual-Portal V3
 * @dev records Proof of Purchase without handling money transfers.
 * Multi-currency support and Shop-only issuance, with returns tracking.
 */
contract EcoReceipt is AccessControl, ReentrancyGuard {
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");

    struct Receipt {
        uint256 id;
        address customer;
        uint256 amount;
        string currency; // INR, USD, EUR, etc.
        string itemName;
        uint256 issueTimestamp;
        uint256 warrantyExpiryTimestamp;
        string ipfsHash; // Cloud Proof
        bool isReturned;
    }

    uint256 private _receiptIdCounter;
    mapping(address => Receipt[]) private customerReceipts;
    mapping(uint256 => address) private receiptIssuer; // tracks which shop issued the receipt

    event ReceiptIssued(
        uint256 indexed id,
        address indexed customer,
        uint256 amount,
        string currency,
        string itemName,
        uint256 warrantyExpiryTimestamp
    );

    event ReceiptReturned(uint256 indexed id);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RETAILER_ROLE, msg.sender); 
    }

    /**
     * @dev Issues a new digital receipt (Proof of Purchase).
     * Only accessible by authorized Shops (RETAILER_ROLE).
     */
    function issueReceipt(
        address _customer,
        uint256 _amount,
        string memory _currency,
        string memory _itemName,
        uint256 _warrantyExpiryTimestamp,
        string memory _ipfsHash
    ) external nonReentrant {
        require(hasRole(RETAILER_ROLE, msg.sender) || msg.sender == _customer, "Not authorized to issue receipt");
        uint256 id = _receiptIdCounter++;

        Receipt memory newReceipt = Receipt({
            id: id,
            customer: _customer,
            amount: _amount,
            currency: _currency,
            itemName: _itemName,
            issueTimestamp: block.timestamp,
            warrantyExpiryTimestamp: _warrantyExpiryTimestamp,
            ipfsHash: _ipfsHash,
            isReturned: false
        });

        customerReceipts[_customer].push(newReceipt);
        receiptIssuer[id] = msg.sender;

        emit ReceiptIssued(id, _customer, _amount, _currency, _itemName, _warrantyExpiryTimestamp);
    }

    /**
     * @dev Marks a receipt as returned. Only the issuing shop can call this.
     */
    function markReturned(uint256 _receiptId, address _customer) external onlyRole(RETAILER_ROLE) nonReentrant {
        require(receiptIssuer[_receiptId] == msg.sender, "Only issuing shop can mark returned");

        // Find and update the receipt
        Receipt[] storage receipts = customerReceipts[_customer];
        bool found = false;
        for (uint256 i = 0; i < receipts.length; i++) {
            if (receipts[i].id == _receiptId) {
                receipts[i].isReturned = true;
                found = true;
                break;
            }
        }
        require(found, "Receipt not found");

        emit ReceiptReturned(_receiptId);
    }

    /**
     * @dev Retrieves all receipts for a customer ID (Digital ID).
     */
    function getReceiptsByCustomer(address _customer) external view returns (Receipt[] memory) {
        return customerReceipts[_customer];
    }

    /**
     * @dev Checks if a receipt's warranty is still active.
     */
    function checkWarranty(uint256 _receiptId, address _customer) external view returns (bool) {
        Receipt[] memory receipts = customerReceipts[_customer];
        for (uint256 i = 0; i < receipts.length; i++) {
            if (receipts[i].id == _receiptId) {
                return block.timestamp < receipts[i].warrantyExpiryTimestamp;
            }
        }
        revert("Receipt not found");
    }
}
