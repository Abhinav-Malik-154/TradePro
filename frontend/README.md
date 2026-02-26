# 🎨 Frontend — Next.js Application

> [← Back to Main README](../README.md)

The frontend is a feature-rich, real-time trading application built with Next.js 16 (App Router). It provides a professional-grade UI for trading crypto assets, managing portfolios, and viewing AI-powered market analysis — all connected to the user's MetaMask wallet.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js App Router                       │
│                                                                 │
│  Providers:                                                     │
│  ClientWalletProvider → AuthProvider → ReactQueryProvider        │
│       → SymbolProvider → MainLayout → {Page}                    │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │  Dashboard / │ │   Stocks    │ │  Portfolio  │ ...           │
│  │    page.tsx  │ │ /[symbol]   │ │   page.tsx  │               │
│  └──────┬───────┘ └──────┬──────┘ └──────┬──────┘               │
│         │                │               │                      │
│  ┌──────▼────────────────▼───────────────▼──────┐               │
│  │          40+ React Components                 │               │
│  │  Trading: QuickTrade, TradeForm, OrderBook    │               │
│  │  Stocks: StockPageView, CandlestickChart      │               │
│  │  Layout: MainLayout, Sidebar, ConnectButton   │               │
│  │  AI: AIPredictions, AIMarketIntelligence      │               │
│  └──────────────────────────────────────────────┘               │
│                                                                 │
│  ┌────────────────────────────────────────────┐                 │
│  │             Custom Hooks                    │                 │
│  │  useRealTimeData · useMLApi · useWebSocket  │                 │
│  └────────────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
        │              │               │
   Socket.IO      REST API       Wallet RPC
        │              │               │
     Backend      ML Backend       Blockchain
```

---

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | **Dashboard** | Main trading hub: live stats cards, PriceTicker, candlestick chart, OrderBook, QuickTrade cards |
| `/stocks/[symbol]` | **Stock/Crypto Analysis** | Dynamic route. Full analysis page: candlestick chart, company profile, multi-horizon AI predictions, news & sentiment, technical indicators, multi-agent AI recommendations |
| `/trade` | **Trade (Redirect)** | Immediately redirects to `/stocks/AAPL` |
| `/portfolio` | **Portfolio** | Fetches real trades from backend. Calculates holdings with cost basis, P&L, and allocation %. Shows full transaction history with verification badges. |
| `/markets` | **Markets Overview** | Table of 8 crypto assets with real-time prices, search/filter/sort, favorites (localStorage), sparklines, market statistics |
| `/settings` | **Settings** | 10-tab settings panel: Profile, Security, Notifications, Appearance, Privacy, API Keys, Billing, Preferences, Backup, Advanced |
| `/help` | **Help** | FAQ section, quick links (getting started, docs, community), contact support form |

---

## Key Components

### Trading Components

| Component | Description |
|---|---|
| `TradeForm` | Full trade form: symbol tabs (BTC/ETH/SOL), BUY/SELL toggle, MARKET/LIMIT type, quantity/price inputs, estimated total. BUY sends ETH via MetaMask; SELL lets backend send proceeds. Dispatches `portfolio_updated` event on success. |
| `QuickTrade` | Three expandable cards (one per symbol) with BUY/SELL toggles and quantity input. Includes chain ID validation. Same backend trade flow. |
| `OrderBook` | Mock order book with 10 bid/ask levels, spread calculation, auto-updates every 2 seconds |
| `PriceTicker` | Live price display for BTC/ETH/SOL from WebSocket. Animated price change transitions (green/red flash). |

### Stock Analysis Components

| Component | Description |
|---|---|
| `StockPageView` | Master component for `/stocks/[symbol]`. Composes all sub-components below. Uses React Query hooks. |
| `CandlestickStockChart` | OHLCV candlestick chart with period selector (1D, 1W, 1M, 3M, 6M, 1Y) |
| `CompanyProfile` | Company info fetched from ML backend: name, sector, industry, market cap, P/E |
| `AIPredictions` | Multi-horizon predictions (1d, 7d, 30d) from LightGBM with confidence bars |
| `NewsAndSentiment` | Recent news articles with per-article sentiment label (POSITIVE/NEUTRAL/NEGATIVE) |
| `TechnicalIndicators` | RSI, MACD, Bollinger Bands, volatility metrics display |
| `AIMarketIntelligence` | Full multi-agent analysis: each agent's opinion, confidence, key factors, and the final weighted recommendation |
| `TopStocksSidebar` | Curated sidebar with popular stocks and crypto for quick navigation |
| `AssetLogo` | Dynamic logo loader: TradingView CDN for stocks, crypto CDN for crypto assets |

### Wallet & Auth Components

| Component | Description |
|---|---|
| `ConnectButton` | Wallet connection UI: connect/disconnect, show address + ETH balance, dropdown menu with: change account, faucet (5 test ETH), copy address, sign in |
| `VerificationBadge` | Green "Verified ✓" badge on each trade. Tooltip shows blockchain transaction hash with link to Polygonscan. |

---

## Context Providers

The app uses a nested provider hierarchy for global state:

| Provider | File | Purpose |
|---|---|---|
| `ClientWalletProvider` | `context/ClientWalletProvider.tsx` | SSR-safe dynamic import of the wallet provider |
| `WalletProvider` | `context/WalletProvider.tsx` | Raw `window.ethereum` + wagmi integration. Provides: `address`, `balance`, `isConnected`, `connect()`, `disconnect()`, `changeAccount()`, `refreshBalance()`. Auto-reconnect (5 retries). Listens for `accountsChanged` and `chainChanged`. |
| `AuthProvider` | `context/AuthProvider.tsx` | SIWE flow: nonce → `personal_sign` → POST signature → JWT. Provides: `token`, `user`, `login()`, `logout()`. Auto-clears JWT on account switch. localStorage persistence. |
| `SymbolProvider` | `context/SymbolContext.tsx` | Global trading pair selector: BTC/USD, ETH/USD, SOL/USD |
| `ReactQueryProvider` | `context/ReactQueryProvider.tsx` | TanStack React Query: staleTime=60s, gcTime=10min |

---

## Custom Hooks

| Hook | File | Description |
|---|---|---|
| `useRealTimeData` | `hooks/useRealTimeData.ts` | Socket.IO client. Subscribes to BTC/ETH/SOL. Returns `prices`, `orderBooks`, `recentTrades`, `lastTrade`, `isConnected`. |
| `useMLApi` | `hooks/useMLApi.ts` | **10 React Query hooks for the ML backend**: `usePrediction`, `useHistory`, `useProfile`, `usePredictMulti`, `useNews`, `useSentiment`, `useAnalysis`, `useCurrentPrice`, `usePrefetchSymbol`. Smart key factories in `mlKeys`. |
| `useWebSocket` | `hooks/useWebSocket.ts` | Simpler Socket.IO connection hook |
| `useErrorHandler` | `hooks/useErrorHandler.ts` | Toast notifications via `react-hot-toast`: `handleError()`, `showSuccess()`, `showLoading()`, `showInfo()` |

---

## Asset Registry (`config/assetData.ts`)

A master registry of **30 assets** (20 stocks + 10 crypto), each with:
- `name`, `sector`, `industry`, `type` (stock/crypto), logo URL, brand color

Curated lists: `POPULAR_STOCKS`, `POPULAR_CRYPTO`, `SIDEBAR_STOCKS`, `SIDEBAR_CRYPTO`, `TICKER_SYMBOLS`

Helper functions: `getDisplaySymbol()`, `getAsset()`, `getLogoUrl()`, `isCrypto()`

---

## Wallet Configuration (`config/wallet.ts`)

- **Chains**: Polygon Amoy, Polygon Mainnet, Ethereum Mainnet
- **Connectors**: Injected (MetaMask), EIP-6963, Coinbase Wallet
- **WalletConnect**: Uses `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`
- **Storage**: SSR-safe cookie storage via wagmi

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Backend API base URL |
| `NEXT_PUBLIC_ML_API_URL` | `http://localhost:8000` | ML backend base URL |
| `NEXT_PUBLIC_EXPECTED_CHAIN_ID` | `31337` | Expected chain ID (Anvil = 31337, Amoy = 80002) |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | — | WalletConnect cloud project ID |

---

## Local Development

```bash
cd frontend
npm install
npm run dev
```

The dev server starts on `http://localhost:3000` with hot-reload. Ensure the backend (`localhost:5000`) and ML backend (`localhost:8000`) are running for full functionality.

