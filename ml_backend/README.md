# 🤖 ML Backend — AI Trading Engine

> [← Back to Main README](../README.md)

The ML backend is a Python-powered AI engine that provides market predictions, sentiment analysis, and multi-agent recommendations. It's built with FastAPI and uses a **5-agent architecture** where specialized agents independently analyze different facets of the market, then an orchestrator combines their opinions via weighted voting.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Application (Port 8000)               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    API Routes (/agent)                    │   │
│  │  /analyze/{ticker} · /predict · /history · /news · ...   │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                       │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │              Agent Orchestrator                            │   │
│  │         asyncio.gather → Weighted Voting                  │   │
│  │                                                           │   │
│  │  ┌───────────┐ ┌────────────┐ ┌──────────────┐          │   │
│  │  │ Technical │ │ Fundamental│ │  Sentiment   │          │   │
│  │  │ Agent     │ │ Agent      │ │  Agent       │          │   │
│  │  │ w=1.0     │ │ w=1.5      │ │  w=1.2       │          │   │
│  │  └───────────┘ └────────────┘ └──────────────┘          │   │
│  │  ┌───────────┐ ┌────────────┐                            │   │
│  │  │   Macro   │ │    Risk    │                            │   │
│  │  │   Agent   │ │   Agent    │                            │   │
│  │  │   w=0.8   │ │   w=1.3    │                            │   │
│  │  └───────────┘ └────────────┘                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────┐  ┌────────────────────────────────┐   │
│  │   Price Predictor    │  │   Sentiment Analyzer           │   │
│  │   LightGBM · 30+    │  │   Keyword-based · RSS feeds    │   │
│  │   features · multi-  │  │   Yahoo Finance · Seeking Alpha│   │
│  │   horizon            │  │                                │   │
│  └──────────────────────┘  └────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │                            │
      yfinance                     RSS Feeds
          │                            │
    Market Data                    News Data
```

---

## File Structure

```
ml_backend/
├── main.py                         # FastAPI app entry + CORS + uvicorn
├── api/
│   └── routes.py                   # All API endpoints (prefix: /agent)
├── agents/
│   ├── base_agent.py               # Abstract base class + AgentOpinion model
│   ├── technical_agent.py          # RSI, MACD, moving average analysis
│   ├── fundamental_agent.py        # P/E ratio, earnings growth, insider trades
│   ├── sentiment_agent.py          # FinBERT, Reddit, news composite score
│   ├── macro_agent.py              # Interest rates, inflation, market regime
│   └── risk_agent.py               # Volatility, max drawdown, VaR, position sizing
├── orchestrator/
│   └── agent_orchestrator.py       # Parallel execution + weighted voting
├── predictor/
│   ├── price_predictor.py          # LightGBM regression + feature engineering
│   └── sentiment.py                # Keyword sentiment + RSS news fetcher
├── utils/
│   └── context_builder.py          # Assembles all data for agent consumption
├── static/
│   └── index.html                  # Standalone AI Trading Desk UI
└── requirements.txt
```

---

## API Endpoints

All endpoints are prefixed with `/agent` and include `Cache-Control` headers.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analyze/{ticker}` | **Multi-agent analysis.** Builds context → runs all 5 agents in parallel → weighted voting → returns individual opinions + final recommendation + debate summary |
| `POST` | `/predict` | ML price prediction. Body: `{ symbol, horizon }`. Returns predicted price, direction, confidence, recommendation |
| `GET` | `/predict/{symbol}` | Same as above, GET variant with default horizon |
| `GET` | `/predict-multi/{symbol}` | **Multi-horizon predictions** — trains separate LightGBM models for 1-day, 7-day, and 30-day horizons |
| `GET` | `/current-price` | Current price from yfinance |
| `GET` | `/history` | Historical OHLCV data with configurable period |
| `GET` | `/news` | Recent news articles + per-article sentiment analysis |
| `GET` | `/sentiment/{symbol}` | Aggregate sentiment score and counts |
| `GET` | `/profile/{symbol}` | Company profile (name, sector, industry, market cap, P/E, etc.) via yfinance |
| `GET` | `/health` | Health check with feature availability flags |

---

## The 5-Agent System

Each agent is a subclass of `BaseTradingAgent` and produces an `AgentOpinion`:

```python
class AgentOpinion(BaseModel):
    agent_name: str
    ticker: str
    direction: str           # "bullish" / "bearish" / "neutral"
    confidence: float        # 0–100
    reasoning: str
    key_factors: list[str]
    suggested_action: str    # "BUY" / "SELL" / "HOLD"
    suggested_position_size: float
    weight: float            # Agent's influence in voting
```

### Agent Details

| Agent | Weight | Input Data | Logic |
|---|---|---|---|
| **Technical** | 1.0 | RSI, MACD, MA crossovers | Score-based: +1/−1 per indicator signal. Confidence scales with score magnitude. |
| **Fundamental** | 1.5 | P/E ratio, earnings growth, insider trades | Score-based direction determination from valuation metrics. Highest weight = most influence. |
| **Sentiment** | 1.2 | FinBERT (50%), Reddit (30%), news (20%) | Composite weighted score. Bullish/bearish thresholds at ±0.2. |
| **Macro** | 0.8 | Interest rates, inflation, market regime, VIX | Lowest weight. Provides macro context overlay. |
| **Risk** | 1.3 | Volatility, max drawdown, Value-at-Risk | Does NOT predict direction. Determines max position size (2–10% of portfolio). High weight because risk management is critical. |

### Orchestration

1. `analyze_ticker()` runs all 5 agents **in parallel** via `asyncio.gather` (each with a 5-second timeout).
2. `_synthesize()` performs **weighted voting**: `score = weight × (confidence / 100)`.
3. Scores are summed per direction (bullish/bearish/neutral). Highest total wins.
4. Final position size = mean of all agents' suggestions.
5. `_generate_summary()` produces an emoji-formatted debate summary.

---

## Price Predictor (LightGBM)

### Feature Engineering — 30+ Features

| Category | Features |
|---|---|
| **Returns** | 1d return, log return |
| **Moving Averages** | MA-7, MA-14, MA-30, MA-50 |
| **MA Ratios** | price/MA-7, price/MA-30, MA-7/MA-30, MA-14/MA-50 |
| **Lag Features** | price lag-1, lag-3, lag-7, lag-14 |
| **Technical Indicators** | RSI-14, MACD, MACD signal, MACD histogram |
| **Bollinger Bands** | Upper, middle, lower bands, bandwidth |
| **Volatility** | 7-day volatility, 30-day volatility, ATR-14 |
| **Volume** | Volume ratio (vs 20-day mean) |

### Model Configuration

| Parameter | 1-Day | 7-Day | 30-Day |
|---|---|---|---|
| Estimators | 100 | 150 | 200 |
| Learning rate | 0.05 | 0.05 | 0.05 |
| Max depth | 6 | 6 | 6 |
| Train/Test split | 80/20 | 80/20 | 80/20 |

### Recommendation Thresholds

| Predicted Return | Recommendation |
|---|---|
| > +3% | `STRONG_BUY` |
| +1% to +3% | `BUY` |
| −1% to +1% | `HOLD` |
| −3% to −1% | `SELL` |
| < −3% | `STRONG_SELL` |

### Fallback Strategy

When LightGBM fails (insufficient data, etc.), the predictor falls back to a **momentum-based prediction** using recent price trends and technical indicator signals.

---

## Sentiment Analyzer

| Feature | Detail |
|---|---|
| **Method** | Keyword-based scoring (30 positive words, 30 negative words) |
| **Score range** | −1.0 to +1.0 |
| **Labels** | POSITIVE (> 0.1), NEGATIVE (< −0.1), NEUTRAL |
| **News sources** | Yahoo Finance RSS, Seeking Alpha RSS (configurable via env vars) |
| **Aggregation** | Average score across all articles + count per sentiment label |
| **Fallback** | Mock news data if RSS feeds are unreachable |

---

## Context Builder

The `build_context(ticker)` function assembles all data needed by the agents:

1. Calls `predictor.predict()` for technical indicators and features
2. Calls `sentiment_analyzer.get_aggregate_sentiment()` for sentiment scores
3. Adds fundamental data (P/E, earnings growth, insider activity)
4. Adds macro data (interest rates, inflation, market regime, VIX)
5. Computes risk metrics from volatility data
6. Falls back to `_get_mock_context()` on any error

---

## Standalone UI

The `static/index.html` file is a self-contained HTML/CSS/JS page — the "AI Trading Desk". It provides a search box for stock/crypto symbols and displays:
- Final verdict card (color-coded bullish/bearish/neutral)
- Agent cards grid with confidence progress bars and key factors
- Debate summary

Access it at `http://localhost:8000/static/index.html`.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `HOST` | `0.0.0.0` | API server host |
| `PORT` | `8000` | API server port |
| `FRONTEND_URL` | `http://localhost:3000` | CORS origin |
| `YAHOO_RSS_URL` | Yahoo Finance default | Custom Yahoo RSS feed URL |
| `SEEKING_ALPHA_RSS_URL` | Seeking Alpha default | Custom Seeking Alpha RSS URL |

---

## Local Development

```bash
cd ml_backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

- Server starts on `http://localhost:8000`
- Auto-reload enabled for development
- Auto-generated API docs at `http://localhost:8000/docs`
- Standalone AI UI at `http://localhost:8000/static/index.html`
