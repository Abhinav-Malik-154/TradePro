// contracts/script/Interact.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/TradeVerifier.sol";
// import {Script} from "forge-std/Script.sol";
// import {TradeVerifier} from "../src/TradeVerifier.sol";

contract InteractScript is Script {
    function run() external {
        address contractAddress = vm.envAddress("CONTRACT_ADDRESS");
        TradeVerifier verifier = TradeVerifier(contractAddress);
        
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Create structured trade data
        string memory symbol = "BTCUSD";
        uint256 price = 50000;
        uint256 quantity = 1e17; // 0.1 ETH in wei (or 0.1 BTC in satoshis)
        
        // Better way: encode all data properly
        bytes32 tradeHash = keccak256(
            abi.encode(
                bytes("trade"),           // prefix as bytes
                block.timestamp,           // timestamp
                user,                      // trader address
                keccak256(bytes(symbol)), // symbol hash
                price,                     // price
                quantity                   // quantity (in smallest unit)
            )
        );
        
        console.log("Verifying trade...");
        console.log("Symbol:", symbol);
        console.log("Price:", price);
        console.log("Quantity:", quantity);
        console.log("Trade Hash:", vm.toString(tradeHash));
        
        // Verify trade on-chain
        verifier.verifyTrade(tradeHash);
        console.log("Trade verified on blockchain!");
        
        // Get proof
        TradeVerifier.TradeProof memory proof = verifier.getTradeProof(tradeHash);
        console.log("Trade timestamp:", proof.timestamp);
        console.log("Trade block:", proof.blockNumber);
        console.log("Previous hash:", vm.toString(proof.previousHash));
        console.log("Trader:", proof.trader);
        
        // Get stats
        (uint256 totalTrades, uint256 totalUsers, bytes32 lastHash, ) = verifier.getStats();
        console.log("Total trades:", totalTrades);
        console.log("Total users:", totalUsers);
        console.log("Last trade hash:", vm.toString(lastHash));
        
        vm.stopBroadcast();
    }
}