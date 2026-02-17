// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TradeVerifier is Ownable, ReentrancyGuard {
    // Custom errors
    error TradeAlreadyVerified();
    error InvalidTradeHash();
    error NoTradesToVerify();
    
    struct TradeProof {
        bytes32 tradeHash;
        uint256 timestamp;
        address trader;
        uint256 blockNumber;
        bytes32 previousHash;
        bool exists;
    }
    
    // Mappings
    mapping(bytes32 => TradeProof) public proofs;
    mapping(address => bytes32[]) public userTrades;
    mapping(address => uint256) public userTradeCount;
    mapping(address => bool) private _isKnownUser;
    
    // Events
    event TradeVerified(bytes32 indexed tradeHash, address indexed trader, uint256 timestamp);
    event TradeBatchVerified(bytes32[] tradeHashes, address indexed trader);
    event TradeRevoked(bytes32 indexed tradeHash, address indexed admin);
    
    // State
    bytes32 public lastTradeHash;
    uint256 public totalTrades;
    uint256 public totalUniqueUsers;
    
    // 🟢🟢🟢 ADD THIS CONSTRUCTOR 🟢🟢🟢
    constructor() Ownable(msg.sender) ReentrancyGuard() {
        // Initialization if needed
    }
    
    // Verify single trade
    function verifyTrade(bytes32 tradeHash) external nonReentrant {
        if (tradeHash == bytes32(0)) revert InvalidTradeHash();
        if (proofs[tradeHash].exists) revert TradeAlreadyVerified();
        
        if (!_isKnownUser[msg.sender]) {
            _isKnownUser[msg.sender] = true;
            totalUniqueUsers++;
        }
        
        proofs[tradeHash] = TradeProof({
            tradeHash: tradeHash,
            timestamp: block.timestamp,
            trader: msg.sender,
            blockNumber: block.number,
            previousHash: lastTradeHash,
            exists: true
        });
        
        userTrades[msg.sender].push(tradeHash);
        userTradeCount[msg.sender]++;
        lastTradeHash = tradeHash;
        totalTrades++;
        
        emit TradeVerified(tradeHash, msg.sender, block.timestamp);
    }
    
    // Batch verify
    function batchVerify(bytes32[] calldata tradeHashes) external nonReentrant {
        if (tradeHashes.length == 0) revert NoTradesToVerify();
        
        if (!_isKnownUser[msg.sender]) {
            _isKnownUser[msg.sender] = true;
            totalUniqueUsers++;
        }
        
        for(uint i = 0; i < tradeHashes.length; i++) {
            bytes32 tradeHash = tradeHashes[i];
            
            if (!proofs[tradeHash].exists && tradeHash != bytes32(0)) {
                proofs[tradeHash] = TradeProof({
                    tradeHash: tradeHash,
                    timestamp: block.timestamp,
                    trader: msg.sender,
                    blockNumber: block.number,
                    previousHash: lastTradeHash,
                    exists: true
                });
                
                userTrades[msg.sender].push(tradeHash);
                lastTradeHash = tradeHash;
                totalTrades++;
            }
        }
        
        userTradeCount[msg.sender] += tradeHashes.length;
        emit TradeBatchVerified(tradeHashes, msg.sender);
    }
    
    // Get user trades with pagination
    function getUserTrades(address user, uint256 offset, uint256 limit) 
        external view returns (bytes32[] memory) {
        bytes32[] storage allTrades = userTrades[user];
        uint256 total = allTrades.length;
        
        if (offset >= total) return new bytes32[](0);
        
        uint256 resultSize = limit;
        if (offset + limit > total) {
            resultSize = total - offset;
        }
        
        bytes32[] memory result = new bytes32[](resultSize);
        for(uint i = 0; i < resultSize; i++) {
            result[i] = allTrades[offset + i];
        }
        
        return result;
    }
    
    // Admin revoke
    function revokeTrade(bytes32 tradeHash) external onlyOwner {
        require(proofs[tradeHash].exists, "Trade not found");
        proofs[tradeHash].exists = false;
        emit TradeRevoked(tradeHash, msg.sender);
    }
    
    // Get trade count
    function getTradeCount(address user) external view returns (uint256) {
        return userTrades[user].length;
    }
    
    // Get full proof
    function getTradeProof(bytes32 tradeHash) 
        external view returns (TradeProof memory) {
        require(proofs[tradeHash].exists, "Trade not found");
        return proofs[tradeHash];
    }
    
    // Get stats
    function getStats() external view returns (
        uint256 totalVerifiedTrades,
        uint256 totalUsers,
        bytes32 lastHash,
        uint256 lastTimestamp
    ) {
        return (
            totalTrades,
            totalUniqueUsers,
            lastTradeHash,
            block.timestamp
        );
    }
}