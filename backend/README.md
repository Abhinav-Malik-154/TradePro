# ⚙️ Backend — Express.js API Server

> [← Back to Main README](../README.md)

The backend is the **central orchestration engine** of TradePro. It handles user authentication, trade execution, blockchain interaction, database persistence, and real-time data broadcasting — all in a single Express.js application.

---

## Architecture Overview

```
                          ┌─────────────────────┐
                          │   Frontend / Client  │
                          └──────┬──────────┬────┘
                                 │          │
                            REST API    Socket.IO
                                 │          │
┌────────────────────────────────▼──────────▼─────────────────────────┐
│                         Express.js Server                           │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │  Auth    │  │  Trade   │  │  Faucet  │  │  WebSocket Service │  │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  (Binance relay)   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────────────────┘  │
│       │              │             │                                 │
│  ┌────▼─────────────────────────────▼──────────────────────────┐    │
│  │              Services Layer                                  │    │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌───────────────┐  │    │
│  │  │  Blockchain     │  │  Database    │  │  WebSocket    │  │    │
│  │  │  Service        │  │  Service     │  │  Service      │  │    │
│  │  │  (ethers.js)    │  │  (Mongoose)  │  │  (Socket.IO)  │  │    │
│  │  └────────┬────────┘  └──────┬───────┘  └───────────────┘  │    │
│  └───────────┼──────────────────┼──────────────────────────────┘    │
└──────────────┼──────────────────┼───────────────────────────────────┘
               │                  │
               ▼                  ▼
        ┌────────────┐    ┌──────────────┐
        │ Blockchain │    │ MongoDB Atlas│
        │ (Anvil)    │    │              │
        └────────────┘    └──────────────┘
```

---

## File Structure

```
backend/
├── src/
│   ├── server.ts                   # Entry point: Express + HTTP + Socket.IO
│   ├── middleware/
│   │   └── authenticate.ts         # JWT Bearer token verification
│   ├── routes/
│   │   ├── auth.routes.ts          # Wallet-based SIWE authentication
│   │   ├── trade.routes.ts         # Trade execution, history, verification
│   │   └── faucet.routes.ts        # Dev faucet (5 ETH)
│   ├── services/
│   │   ├── blockchain.service.ts   # ethers.js v6 contract interaction
│   │   ├── database.service.ts     # Mongoose connection manager
│   │   └── websocket.service.ts    # Binance WS → Socket.IO broadcast
│   ├── models/
│   │   ├── Trade.model.ts          # Trade Mongoose schema
│   │   └── User.model.ts           # User Mongoose schema
│   └── abis/
│       └── TradeVerifier.json      # Contract ABI
├── package.json
└── tsconfig.json
```

---

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/nonce/:address` | ❌ | Generate a random nonce for the wallet, upsert user in DB |
| `POST` | `/login` | ❌ | Verify `personal_sign` signature against nonce → issue JWT (30-day expiry). Nonce cleared after use (anti-replay). |
| `GET` | `/me` | ✅ JWT | Get current user profile |

**Authentication Flow:**
```
1. Frontend:  GET /api/auth/nonce/0x1234...
              → Backend creates/updates User with random nonce
              → Returns { nonce: "abc123" }

2. Frontend:  MetaMask signs: "Sign this message to login: abc123"
              → User approves in MetaMask popup

3. Frontend:  POST /api/auth/login { address, signature }
              → Backend recovers signer via ethers.verifyMessage()
              → If recovered address matches → issue JWT
              → Nonce cleared (prevents replay)
              → Returns { token, user }
```

### Trades (`/api/trades`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/test` | ❌ | Health check |
| `POST` | `/verify` | ✅ JWT | **Core endpoint.** Validates trade → computes keccak256 hash → calls `TradeVerifier.verifyTrade()` on-chain → saves to MongoDB → handles ETH settlement |
| `GET` | `/proof/:tradeHash` | ❌ | Get blockchain proof + DB record for a trade hash |
| `GET` | `/verified/:tradeHash` | ❌ | Boolean: is this trade verified on-chain + in DB? |
| `GET` | `/history/:userId` | ❌ | Paginated trade history (query: `limit`, `offset`, max 100) |
| `GET` | `/wallet/:walletAddress` | ❌ | All trades for a wallet address (paginated) |
| `GET` | `/stats` | ❌ | Combined blockchain + DB stats (total volume, avg price, recent trades) |
| `GET` | `/:tradeId` | ❌ | Single trade by MongoDB ID |

**Trade Validation Rules:**
- Symbols: `BTC/USD`, `ETH/USD`, `SOL/USD`
- Sides: `BUY`, `SELL`
- Price: > 0, max 10,000,000
- Quantity: > 0, max 1,000,000

**Settlement Logic:**
- **BUY**: User sends ETH to treasury via MetaMask (frontend handles the transfer). Backend records the trade.
- **SELL**: Backend calculates ETH proceeds and sends them from treasury to user via `BlockchainService.fundWallet()`.

### Faucet (`/api/faucet`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/request` | Send 5 ETH to the provided address (development only) |

---

## Services

### `BlockchainService`

The bridge between the backend and the smart contract.

| Method | Description |
|---|---|
| `verifyTrade(tradeData)` | Computes a deterministic `keccak256` hash matching the Solidity encoding (`abi.encodePacked`), then calls `contract.verifyTrade(hash, trader)`. Returns `txHash`, `blockNumber`, `gasUsed`. |
| `getTradeProof(tradeHash)` | Reads the on-chain `TradeProof` struct |
| `isTradeVerified(tradeHash)` | Boolean check |
| `fundWallet(address, amountEth)` | Sends ETH from the treasury wallet (uses pending nonce to avoid conflicts) |
| `getStats()` | Reads `totalTrades`, `totalUsers`, `lastHash`, `lastTimestamp` from contract |

**Environment Variables:** `RPC_URL`, `PRIVATE_KEY`, `CONTRACT_ADDRESS`

### `WebSocketService`

Real-time data pipeline from Binance to the frontend.

| Feature | Detail |
|---|---|
| **Binance Streams** | `btcusdt@ticker`, `ethusdt@ticker`, `solusdt@ticker` + `@depth20` for order books |
| **Client subscriptions** | Room-based: `market:BTC/USD`, `user:{userId}` |
| **Broadcast events** | `price-update`, `market-update`, `orderbook-update`, `trade-confirmed`, `recent-trade` |
| **Fallback** | Mock price feed (5s interval) if Binance connection drops |
| **Reconnect** | Auto-reconnects to Binance on close (5s delay) |

### `DatabaseService`

Mongoose connection manager with connection pooling (2–10 connections) and auto-reconnect.

---

## Data Models

### `User`

| Field | Type | Description |
|---|---|---|
| `walletAddress` | `String` | Ethereum address (unique, indexed) |
| `username` | `String` | Optional display name |
| `email` | `String` | Optional email |
| `tradeCount` | `Number` | Total trades executed (default: 0) |
| `totalVolume` | `Number` | Cumulative trade volume (default: 0) |
| `nonce` | `String` | Single-use nonce for SIWE login |
| `lastLogin` | `Date` | Last login timestamp |

### `Trade`

| Field | Type | Description |
|---|---|---|
| `userId` | `String` | User reference (indexed) |
| `walletAddress` | `String` | Trader's wallet (indexed) |
| `symbol` | `String` | Trading pair (e.g., `BTC/USD`) |
| `side` | `String` | `BUY` or `SELL` |
| `price` | `Number` | Trade price |
| `quantity` | `Number` | Trade quantity |
| `tradeHash` | `String` | Deterministic keccak256 hash (unique) |
| `transactionHash` | `String` | On-chain transaction hash |
| `blockNumber` | `Number` | Block where trade was verified |
| `verifiedAt` | `Date` | Timestamp of verification |

---

## Middleware

### `authenticate.ts`

JWT Bearer token verification middleware. Extracts `Authorization: Bearer <token>` from headers, verifies with `JWT_SECRET`, and attaches decoded payload to `req.user`.

---

## Security

| Mechanism | Implementation |
|---|---|
| **Helmet** | Security headers (CSP, HSTS, X-Frame-Options, etc.) |
| **CORS** | Restricted to `FRONTEND_URL` origin |
| **Rate Limiting** | Auth routes: 100 req/min. Trade routes: 200 req/min. |
| **JWT** | 30-day expiry, server-side secret |
| **Nonce anti-replay** | Nonce cleared after successful login |

---

## Local Development

```bash
cd backend
npm install
```

Create `.env`:
```env
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=<deployed_address>
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/tradingPlatformDB
JWT_SECRET=your-super-secret-key
PORT=5000
FRONTEND_URL=http://localhost:3000
```

```bash
npm run dev
```

Server starts on `http://localhost:5000` with hot-reload via `nodemon`.
