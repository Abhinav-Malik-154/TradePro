# 📜 Smart Contracts — TradeVerifier

> [← Back to Main README](../README.md)

This directory contains the Solidity smart contracts powering TradePro's on-chain verification layer, managed with the [Foundry](https://getfoundry.sh/) framework.

---

## Overview

The `TradeVerifier.sol` contract is the **on-chain anchor of trust** for the entire platform. It does NOT store trade data — it stores only `bytes32` cryptographic hashes that prove a trade was executed. This design minimizes gas costs while maximizing auditability.

### Design Philosophy

| Principle | Implementation |
|---|---|
| **Minimal storage** | Only `bytes32` hashes stored, not full trade data |
| **Hash chain** | Each proof stores `previousHash`, creating a tamper-evident linked list |
| **Batch efficiency** | Merkle root commits allow O(1) storage for N trades |
| **Access control** | Only the backend (contract owner) can write proofs |
| **Public verification** | Anyone can verify a trade hash or Merkle inclusion proof |
| **Emergency controls** | Pausable circuit breaker + trade revocation |

---

## Contract: `TradeVerifier.sol`

**Inherits:** `Ownable`, `ReentrancyGuard`, `Pausable` (OpenZeppelin v5)

### Data Structures

```solidity
struct TradeProof {
    bytes32 tradeHash;
    uint256 timestamp;
    address trader;
    uint256 blockNumber;
    bytes32 previousHash;   // ← links to the last verified trade
    bool exists;
}

struct MerkleRoot {
    bytes32 root;
    uint256 timestamp;
    uint256 blockNumber;
    address submitter;
    uint256 tradeCount;
    string batchId;
    bool exists;
}
```

### Functions

#### Trade Verification

| Function | Access | Gas | Description |
|---|---|---|---|
| `verifyTrade(bytes32 hash, address trader)` | `onlyOwner` | ~60k | Store a single trade proof with hash-chain linking |
| `batchVerify(bytes32[] hashes, address trader)` | `onlyOwner` | ~45k/trade | Verify multiple trades in one transaction (skips duplicates) |
| `revokeTrade(bytes32 hash)` | `onlyOwner` | ~30k | Invalidate a fraudulent or erroneous trade |

#### Merkle Batch Proofs

| Function | Access | Description |
|---|---|---|
| `submitMerkleRoot(bytes32 root, uint256 count, string batchId)` | `onlyOwner` | Commit a Merkle root representing N trades in O(1) gas |
| `verifyMerkleProof(bytes32 root, bytes32[] proof, bytes32 leaf)` | `public` | Verify that a trade hash is included in a committed Merkle batch |
| `verifyMerkleMultiProof(bytes32 root, bytes32[] proof, bool[] flags, bytes32[] leaves)` | `public` | Verify multiple leaves against the same Merkle root |

#### Read Functions

| Function | Returns | Description |
|---|---|---|
| `getTradeProof(bytes32 hash)` | `TradeProof` | Full proof details (timestamp, trader, block#, previousHash) |
| `getUserTrades(address user, uint256 offset, uint256 limit)` | `bytes32[]` | Paginated list of a user's verified trade hashes |
| `getTradeCount(address user)` | `uint256` | Number of trades for an address |
| `getStats()` | `(uint256, uint256, bytes32, uint256)` | Total trades, unique users, last hash, last timestamp |
| `getMerkleRoots()` | `bytes32[]` | All committed Merkle roots |
| `getMerkleRoot(bytes32 root)` | `MerkleRoot` | Details of a specific Merkle batch |

#### Admin

| Function | Description |
|---|---|
| `pause()` | Halt all write operations (circuit breaker) |
| `unpause()` | Resume normal operations |

### Events

```solidity
event TradeVerified(bytes32 indexed tradeHash, address indexed trader, uint256 timestamp);
event TradeBatchVerified(address indexed trader, uint256 count, uint256 timestamp);
event TradeRevoked(bytes32 indexed tradeHash);
event MerkleRootSubmitted(bytes32 indexed root, uint256 tradeCount, string batchId);
event MerkleLeafVerified(bytes32 indexed root, bytes32 indexed leaf);
```

### Custom Errors

```solidity
error TradeAlreadyVerified();
error InvalidTradeHash();
error NoTradesToVerify();
error InvalidMerkleRoot();
error MerkleRootAlreadySubmitted();
error InvalidMerkleProof();
```

---

## Security

| Pattern | Library | Purpose |
|---|---|---|
| `Ownable` | OpenZeppelin | Restricts write access to contract deployer (backend) |
| `ReentrancyGuard` | OpenZeppelin | Prevents reentrancy attacks on state-modifying functions |
| `Pausable` | OpenZeppelin | Emergency circuit breaker |
| `MerkleProof` | OpenZeppelin | Cryptographic Merkle inclusion verification |

---

## Test Suite

The test file (`test/Tradeverifier.t.sol`) contains **18 tests** including fuzz tests:

| Test Category | Tests |
|---|---|
| **Core verification** | `testVerifyTrade`, `testBatchVerify`, `testDeterministicOrdering` |
| **Access control** | `test_RevertWhen_TradeAlreadyVerified`, `test_RevertWhen_NonOwnerRevokes` |
| **Revocation** | `testRevokeTrade` |
| **Pagination** | `testPagination` |
| **Gas benchmarks** | `testGasCosts` |
| **Multi-user** | `testMultipleUsers`, `testStats` |
| **Merkle proofs** | `testSubmitMerkleRoot`, `testVerifyMerkleProof`, `test_RevertWhen_InvalidMerkleProof`, `test_RevertWhen_MerkleProofUnknownRoot`, `test_RevertWhen_DuplicateMerkleRoot`, `test_RevertWhen_ZeroMerkleRoot`, `testGetMerkleRoots` |
| **Fuzz testing** | `testFuzz_AnyHashVerifies`, `test_ZeroHashAlwaysReverts` |
| **Pause/Unpause** | `testPausePreventsVerification`, `testUnpauseRestoresVerification` |

### Run Tests
```bash
forge test -vvv
```

---

## Deployment

### Compiler Configuration (`foundry.toml`)
```toml
via_ir = true
optimizer_runs = 200
```

### Deploy to Local Anvil
```bash
anvil  # Terminal 1

# Terminal 2
forge script script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

### Deploy to Polygon Amoy Testnet
```bash
forge script script/Deploy.s.sol \
  --rpc-url $POLYGON_AMOY_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

### Interact (Demo Script)
The `Interact.s.sol` script demonstrates end-to-end usage: verifying a single trade, submitting a 3-leaf Merkle batch, and reading platform stats.
```bash
forge script script/Interact.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --private-key $PRIVATE_KEY \
  --broadcast
```
