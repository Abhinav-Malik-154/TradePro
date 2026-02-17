// contracts/test/TradeVerifier.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "forge-std/Test.sol";
import "../src/TradeVerifier.sol";

contract TradeVerifierTest is Test {
    TradeVerifier public verifier;
    address public user1 = address(0x123);
    address public user2 = address(0x456);
    address public owner;
    
    bytes32 public trade1 = keccak256("trade-1");
    bytes32 public trade2 = keccak256("trade-2");
    bytes32 public trade3 = keccak256("trade-3");
    
    function setUp() public {
        owner = address(this);
        verifier = new TradeVerifier();
    }
    
    // Test single verification
    function testVerifyTrade() public {
        vm.prank(user1);
        verifier.verifyTrade(trade1);
        
        TradeVerifier.TradeProof memory proof = verifier.getTradeProof(trade1);
        assertTrue(proof.exists);
        assertEq(proof.trader, user1);
        assertEq(verifier.getTradeCount(user1), 1);
    }
    
    // Test batch verification
    function testBatchVerify() public {
        bytes32[] memory trades = new bytes32[](3);
        trades[0] = trade1;
        trades[1] = trade2;
        trades[2] = trade3;
        
        vm.prank(user1);
        verifier.batchVerify(trades);
        
        TradeVerifier.TradeProof memory proof1 = verifier.getTradeProof(trade1);
        TradeVerifier.TradeProof memory proof2 = verifier.getTradeProof(trade2);
        TradeVerifier.TradeProof memory proof3 = verifier.getTradeProof(trade3);
        
        assertTrue(proof1.exists);
        assertTrue(proof2.exists);
        assertTrue(proof3.exists);
        assertEq(verifier.getTradeCount(user1), 3);
    }
    
    // FIXED: Test cannot verify same trade twice
    function test_RevertWhen_TradeAlreadyVerified() public {
        vm.prank(user1);
        verifier.verifyTrade(trade1);
        
        vm.prank(user1);
        vm.expectRevert(TradeVerifier.TradeAlreadyVerified.selector);
        verifier.verifyTrade(trade1);
    }
    
    // Test chain linking
    function testDeterministicOrdering() public {
        vm.startPrank(user1);
        verifier.verifyTrade(trade1);
        verifier.verifyTrade(trade2);
        vm.stopPrank();
        
        TradeVerifier.TradeProof memory proof1 = verifier.getTradeProof(trade1);
        TradeVerifier.TradeProof memory proof2 = verifier.getTradeProof(trade2);
        
        assertEq(proof2.previousHash, trade1);
        assertEq(proof1.previousHash, bytes32(0));
    }
    
    // Test pagination
    function testPagination() public {
        vm.startPrank(user1);
        for(uint i = 0; i < 10; i++) {
            verifier.verifyTrade(keccak256(abi.encodePacked(i)));
        }
        vm.stopPrank();
        
        bytes32[] memory first5 = verifier.getUserTrades(user1, 0, 5);
        assertEq(first5.length, 5);
        
        bytes32[] memory next5 = verifier.getUserTrades(user1, 5, 5);
        assertEq(next5.length, 5);
    }
    
    // Test gas costs
    function testGasCosts() public {
        vm.startPrank(user1);
        
        uint256 gasStart = gasleft();
        verifier.verifyTrade(trade1);
        uint256 singleGas = gasStart - gasleft();
        
        bytes32[] memory trades = new bytes32[](3);
        trades[0] = keccak256("a");
        trades[1] = keccak256("b");
        trades[2] = keccak256("c");
        
        gasStart = gasleft();
        verifier.batchVerify(trades);
        uint256 batchGas = gasStart - gasleft();
        
        console.log("Single verify gas:", singleGas);
        console.log("Batch verify gas (3 trades):", batchGas);
        console.log("Gas per trade in batch:", batchGas / 3);
        
        assertLt(batchGas / 3, singleGas);
        vm.stopPrank();
    }
    
    // Test owner can revoke
    function testRevokeTrade() public {
        vm.prank(user1);
        verifier.verifyTrade(trade1);
        
        TradeVerifier.TradeProof memory proofBefore = verifier.getTradeProof(trade1);
        assertTrue(proofBefore.exists);
        
        verifier.revokeTrade(trade1);
        
        vm.expectRevert("Trade not found");
        verifier.getTradeProof(trade1);
    }
    
    // FIXED: Test non-owner cannot revoke
    function test_RevertWhen_NonOwnerRevokes() public {
    vm.prank(user1);
    verifier.verifyTrade(trade1);
    
    vm.prank(user2);
    // This matches the actual OpenZeppelin v5+ error
    vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user2));
    verifier.revokeTrade(trade1);
    }
    
    // Test multiple users
    function testMultipleUsers() public {
        vm.prank(user1);
        verifier.verifyTrade(trade1);
        
        vm.prank(user2);
        verifier.verifyTrade(trade2);
        
        assertEq(verifier.getTradeCount(user1), 1);
        assertEq(verifier.getTradeCount(user2), 1);
        assertEq(verifier.totalTrades(), 2);
    }
    
    // Test stats function - FIXED
    function testStats() public {
        vm.prank(user1);
        verifier.verifyTrade(trade1);
        
        (
            uint256 totalTrades,
            uint256 totalUsers,
            bytes32 lastHash,
            uint256 lastTimestamp
        ) = verifier.getStats();
        
        assertEq(totalTrades, 1);
        assertEq(lastHash, trade1);
        assertEq(totalUsers, 1);
        assertTrue(lastTimestamp > 0);
    }
}