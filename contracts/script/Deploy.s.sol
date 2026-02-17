// contracts/script/Deploy.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/TradeVerifier.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        TradeVerifier verifier = new TradeVerifier();
        
        console.log("TradeVerifier deployed to:", address(verifier));
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Chain ID:", block.chainid);
        console.log("Block:", block.number);
        
        vm.stopBroadcast();
        
        // Save deployment info
        string memory json = "deployment.json";
        string memory data = string.concat(
            '{"address":"', vm.toString(address(verifier)),
            '","deployer":"', vm.toString(vm.addr(deployerPrivateKey)),
            '","chainId":"', vm.toString(block.chainid),
            '","block":"', vm.toString(block.number),
            '"}'
        );
        vm.writeJson(data, json);
    }
}
