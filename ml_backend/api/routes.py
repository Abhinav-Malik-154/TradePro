# from fastapi import APIRouter, HTTPException
# # from ..orchestrator.agent_orchestrator import AgentOrchestrator
# from orchestrator.agent_orchestrator import AgentOrchestrator
# from ..agents.sentiment_agent import SentimentAnalystAgent
# from ..agents.fundamental_agent import FundamentalAnalystAgent
# from ..agents.technical_agent import TechnicalAnalystAgent
# from ..agents.macro_agent import MacroEconomistAgent
# from ..agents.risk_agent import RiskManagerAgent
# from ..utils.context_builder import build_context

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from orchestrator.agent_orchestrator import AgentOrchestrator


from agents.sentiment_agent import SentimentAnalystAgent
from agents.fundamental_agent import FundamentalAnalystAgent
from agents.technical_agent import TechnicalAnalystAgent
from agents.macro_agent import MacroEconomistAgent
from agents.risk_agent import RiskManagerAgent
from utils.context_builder import build_context

# Import ML prediction modules
try:
    from predictor.price_predictor import predictor
    from predictor.sentiment import sentiment_analyzer
except ImportError:
    predictor = None
    sentiment_analyzer = None

router = APIRouter(prefix="/agent", tags=["ai-agents"])

# Initialize all agents
agents = [
    SentimentAnalystAgent("Sentiment Analyst", weight=1.2),
    FundamentalAnalystAgent("Fundamental Analyst", weight=1.5),
    TechnicalAnalystAgent("Technical Analyst", weight=1.0),
    MacroEconomistAgent("Macro Economist", weight=0.8),
    RiskManagerAgent("Risk Manager", weight=1.3)
]

orchestrator = AgentOrchestrator(agents)


# Request/Response models
class PredictRequest(BaseModel):
    symbol: str
    horizon: Optional[int] = 7


@router.get("/analyze/{ticker}")
async def analyze_ticker(ticker: str):
    """
    Run multi-agent analysis on a ticker
    Returns opinions from all agents + final recommendation
    """
    try:
        # Build context with all data
        context = await build_context(ticker.upper())
        
        # Run agent analysis
        result = await orchestrator.analyze_ticker(ticker.upper(), context)
        
        return JSONResponse(
            content={"status": "success", "data": result},
            headers={"Cache-Control": "public, max-age=60, stale-while-revalidate=120"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict")
async def predict_price(request: PredictRequest):
    """
    Generate ML-based price prediction for a symbol
    Returns predicted price, change %, confidence, and recommendation
    """
    if predictor is None:
        raise HTTPException(status_code=500, detail="Predictor not available")
    
    try:
        result = predictor.predict(request.symbol, request.horizon)
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predict/{symbol}")
async def predict_price_get(symbol: str, horizon: int = 7):
    """
    Generate ML-based price prediction (GET method)
    """
    if predictor is None:
        raise HTTPException(status_code=500, detail="Predictor not available")
    
    try:
        result = predictor.predict(symbol, horizon)
        return JSONResponse(
            content={"status": "success", "data": result},
            headers={"Cache-Control": "public, max-age=60, stale-while-revalidate=120"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/current-price")
async def get_current_price(symbol: str):
    """
    Get current price for a symbol
    """
    if predictor is None:
        raise HTTPException(status_code=500, detail="Predictor not available")
    
    try:
        result = predictor.get_current_price(symbol)
        return JSONResponse(
            content=result,
            headers={"Cache-Control": "public, max-age=30, stale-while-revalidate=60"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_history(symbol: str, period: str = "1y"):
    """
    Get historical price data for charting
    """
    if predictor is None:
        raise HTTPException(status_code=500, detail="Predictor not available")
    
    try:
        result = predictor.get_history(symbol, period)
        return JSONResponse(
            content={"status": "success", "symbol": symbol, "data": result},
            headers={"Cache-Control": "public, max-age=300, stale-while-revalidate=600"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/news")
async def get_news(symbol: str, max_items: int = 10):
    """
    Get news with sentiment analysis for a symbol
    """
    if sentiment_analyzer is None:
        raise HTTPException(status_code=500, detail="Sentiment analyzer not available")
    
    try:
        articles = sentiment_analyzer.fetch_news(symbol, max_items)
        aggregate = sentiment_analyzer.get_aggregate_sentiment(symbol)
        return JSONResponse(
            content={
                "status": "success",
                "symbol": symbol,
                "aggregate_sentiment": aggregate,
                "articles": articles,
            },
            headers={"Cache-Control": "public, max-age=180, stale-while-revalidate=300"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sentiment/{symbol}")
async def get_sentiment(symbol: str):
    """
    Get aggregate sentiment for a symbol
    """
    if sentiment_analyzer is None:
        raise HTTPException(status_code=500, detail="Sentiment analyzer not available")
    
    try:
        result = sentiment_analyzer.get_aggregate_sentiment(symbol)
        return JSONResponse(
            content={"status": "success", "data": result},
            headers={"Cache-Control": "public, max-age=180, stale-while-revalidate=300"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "agents": len(agents),
        "predictor_available": predictor is not None,
        "sentiment_available": sentiment_analyzer is not None
    }


@router.get("/profile/{symbol}")
async def get_company_profile(symbol: str):
    """
    Get company profile info using yfinance
    """
    try:
        import yfinance as yf
        ticker = yf.Ticker(symbol.upper())
        info = ticker.info or {}
        return JSONResponse(
            content={
                "status": "success",
                "data": {
                    "symbol": symbol.upper(),
                    "name": info.get("longName") or info.get("shortName") or symbol.upper(),
                    "sector": info.get("sector", "N/A"),
                    "industry": info.get("industry", "N/A"),
                    "employees": info.get("fullTimeEmployees", 0),
                    "description": info.get("longBusinessSummary", ""),
                    "website": info.get("website", ""),
                    "market_cap": info.get("marketCap", 0),
                    "pe_ratio": info.get("trailingPE", 0),
                    "dividend_yield": info.get("dividendYield", 0),
                    "beta": info.get("beta", 0),
                    "avg_volume": info.get("averageVolume", 0),
                    "next_earnings": info.get("earningsTimestamp", ""),
                },
            },
            headers={"Cache-Control": "public, max-age=1800, stale-while-revalidate=3600"},
        )
    except Exception as e:
        return {
            "status": "success",
            "data": {
                "symbol": symbol.upper(),
                "name": symbol.upper(),
                "sector": "N/A",
                "industry": "N/A",
                "employees": 0,
                "description": "",
                "error": str(e),
            }
        }


@router.get("/predict-multi/{symbol}")
async def predict_multi_horizon(symbol: str):
    """
    Generate predictions for multiple time horizons (1d, 7d, 30d)
    Each horizon uses a SEPARATE LightGBM model trained for that specific target.
    """
    if predictor is None:
        raise HTTPException(status_code=500, detail="Predictor not available")

    try:
        results = predictor.predict_multi_horizon(symbol.upper(), horizons=[1, 7, 30])
        return JSONResponse(
            content={"status": "success", "data": results},
            headers={"Cache-Control": "public, max-age=60, stale-while-revalidate=120"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))