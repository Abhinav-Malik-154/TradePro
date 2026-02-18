# Mini-Zerodha: Hybrid Trading Platform with Blockchain Verification

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.13-black)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-FF6B6B)](https://book.getfoundry.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🏆 Overview

Mini-Zerodha is a **hybrid trading platform** that combines the speed and usability of centralized exchanges (like Zerodha) with the transparency and verifiability of blockchain technology. Every trade executed on the platform generates a cryptographic proof stored on-chain, allowing users to independently verify their transactions.

This project was built as a full-stack demonstration of blockchain integration in traditional finance applications.

## ✨ Key Features

-   **Hybrid Architecture**: Centralized trading engine speed (<10ms latency) + Decentralized proof of settlement.
-   **On-Chain Verification**: Every trade is hashed and stored on a local Anvil blockchain (with easy deployment to public testnets like Polygon Amoy). Users can view the cryptographic proof for any transaction.
-   **Professional Trading UI**: A responsive, dark-themed interface with glass morphism effects, built with Next.js 15 and Tailwind CSS.
-   **Real-time Components**:
    -   Live price ticker.
    -   Interactive candlestick chart with volume (using `lightweight-charts`).
    -   Dynamic order book displaying bids and asks.
    -   Trade form with Buy/Sell toggles and order type selection.
    -   Recent trades list with unique **"Verified ✓" badges** linking to the blockchain explorer.
-   **Robust Backend API**: Node.js/Express server with TypeScript, providing REST endpoints for trade verification and data retrieval.
-   **Blockchain Service**: A dedicated service to interact with the deployed `TradeVerifier` smart contract using `ethers.js`.
-   **Database Integration**: MongoDB (via Mongoose) to store user trade history and portfolio data off-chain for quick access.

## 🛠️ Tech Stack

### Blockchain Layer
-   **Language**: Solidity 0.8.13
-   **Development Framework**: Foundry (Forge, Cast, Anvil)
-   **Security Libraries**: OpenZeppelin (Ownable, ReentrancyGuard)
-   **Local Network**: Anvil
-   **Target Network**: Polygon Amoy (Testnet)

### Backend Layer
-   **Runtime**: Node.js 22
-   **Language**: TypeScript 5.9
-   **Framework**: Express.js 5
-   **Blockchain Interaction**: ethers.js 6
-   **Database**: MongoDB with Mongoose ODM
-   **Real-time**: WebSocket (Socket.io - ready for integration)

### Frontend Layer
-   **Framework**: Next.js 15 (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **UI Components**: Headless UI, Heroicons
-   **Charts**: Lightweight Charts (TradingView)
-   **Animations**: Framer Motion
-   **State Management**: React Hooks, Context API

## 🚀 Getting Started

### Prerequisites
-   **Node.js** (v22 or later recommended)
-   **npm** or **yarn**
-   **Foundry** (for smart contract development)
-   **Git**

### Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Abhinav-Malik-154/mini-zerodha.git
    cd mini-zerodha
    ```

2.  **Set up the Smart Contracts**
    ```bash
    cd contracts
    forge install # Install dependencies (forge-std, openzeppelin)
    forge build   # Compile the contracts
    forge test    # Run the test suite
    ```

3.  **Set up the Backend**
    ```bash
    cd ../backend
    npm install
    # Create a .env file (see .env.example)
    cp .env.example .env
    # Edit .env with your RPC URL, private key, and MongoDB URI
    npm run dev
    ```

4.  **Set up the Frontend**
    ```bash
    cd ../frontend
    npm install
    npm run dev
    ```

5.  **Start a Local Blockchain (for development)**
    ```bash
    # In a separate terminal
    cd contracts
    anvil
    ```

6.  **Deploy the Contract (to local Anvil)**
    ```bash
    # In another terminal, after anvil is running
    cd contracts
    source ../backend/.env # Load environment variables
    forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
    ```

7.  **Access the Application**
    Open your browser and navigate to `http://localhost:3000`.

## 🧪 Testing the Platform

1.  Ensure all three services are running:
    -   **Terminal 1**: `anvil` (Blockchain)
    -   **Terminal 2**: `cd backend && npm run dev` (Backend API)
    -   **Terminal 3**: `cd frontend && npm run dev` (Frontend UI)
2.  Visit the frontend, connect your wallet (if implemented), and place a trade using the form.
3.  Observe the trade appear in "Recent Trades" with a "Verified ✓" badge.
4.  Click the badge to view the transaction on the blockchain explorer (Amoy Polygonscan for testnet, or a local explorer for Anvil).

## 🗺️ Project Roadmap

-   **✅ Phase 1:** Smart Contract Development & Testing (Foundry)
-   **✅ Phase 2:** Backend API Development (Express, Blockchain Service)
-   **✅ Phase 3:** Database Integration (MongoDB)
-   **✅ Phase 4:** Frontend UI/UX Development (Next.js, Tailwind)
-   **✅ Phase 5:** Core Integration & Local Testing
-   **⬜ Phase 6:** Deployment to Public Testnet (Polygon Amoy)
-   **⬜ Phase 7:** Wallet Connection (Web3Modal)
-   **⬜ Phase 8:** Real-time Data (WebSockets)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Abhinav-Malik-154/mini-zerodha/issues).

## 📜 License

This project is [MIT](https://opensource.org/licenses/MIT) licensed.

## 🙏 Acknowledgements

-   Inspired by the UI/UX of Zerodha Kite.
-   Built with guidance from modern Web3 and Fintech development practices.