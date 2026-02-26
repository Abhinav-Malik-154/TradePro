'use client';

import { useState, useEffect } from 'react';
import { useSymbol } from '@/context/SymbolContext';

interface Technicals {
  rsi: number;
  macd: number;
  macd_signal: number;
  volatility_7d: number;
  bb_position: number;
  ma_7: number;
  ma_30: number;
}

interface TopFactor {
  feature: string;
  importance: number;
}

interface MLPredictionData {
  symbol: string;
  current_price: number;
  predicted_price: number;
  predicted_change: number;
  horizon_days: number;
  confidence: number;
  recommendation: string;
  technicals: Technicals;
  top_factors: TopFactor[];
  timestamp: string;
  fallback?: boolean;
}

const ML_API_URL = (process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

export default function MLPrediction() {
  const { selectedSymbol } = useSymbol();
  const [prediction, setPrediction] = useState<MLPredictionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [horizon, setHorizon] = useState(7);

  const ticker = selectedSymbol?.replace('/', '') || 'BTCUSD';

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${ML_API_URL}/agent/predict/${ticker}?horizon=${horizon}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.status === 'success') {
        setPrediction(result.data);
      } else {
        throw new Error(result.message || 'Failed to get prediction');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prediction');
      console.error('ML Prediction fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, [ticker, horizon]);

  const getRecommendationStyle = (rec: string) => {
    const r = String(rec || '').toUpperCase();
    if (r.includes('BUY')) return { bg: 'bg-green-500/20 border-green-500/50', text: 'text-green-400' };
    if (r.includes('SELL')) return { bg: 'bg-red-500/20 border-red-500/50', text: 'text-red-400' };
    return { bg: 'bg-yellow-500/20 border-yellow-500/50', text: 'text-yellow-400' };
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(4);
  };

  const getRSIStatus = (rsi: number) => {
    if (rsi >= 70) return { label: 'Overbought', color: 'text-red-400' };
    if (rsi <= 30) return { label: 'Oversold', color: 'text-green-400' };
    return { label: 'Neutral', color: 'text-gray-400' };
  };

  const style = prediction ? getRecommendationStyle(prediction.recommendation) : { bg: '', text: '' };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">📈</span>
          ML Price Prediction
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
            className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
          >
            <option value={1}>1 Day</option>
            <option value={7}>7 Days</option>
            <option value={14}>14 Days</option>
            <option value={30}>30 Days</option>
          </select>
          <button
            onClick={fetchPrediction}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm text-white transition-colors"
          >
            {loading ? '...' : '↻'}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-gray-400 text-xs mt-1">Ensure ML backend is running on port 8000</p>
        </div>
      )}

      {/* Loading State */}
      {loading && !prediction && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Training model...</span>
        </div>
      )}

      {/* Prediction Results */}
      {prediction && (
        <div className="space-y-4">
          {/* Main Prediction Card */}
          <div className={`rounded-lg p-4 border ${style.bg}`}>
            <div className="grid grid-cols-2 gap-4">
              {/* Left: Prices */}
              <div>
                <p className="text-gray-400 text-xs">Current Price</p>
                <p className="text-white text-xl font-bold">${formatPrice(prediction.current_price)}</p>
                
                <p className="text-gray-400 text-xs mt-2">Predicted ({horizon}d)</p>
                <p className={`text-xl font-bold ${prediction.predicted_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${formatPrice(prediction.predicted_price)}
                </p>
              </div>
              
              {/* Right: Recommendation */}
              <div className="text-right">
                <p className="text-gray-400 text-xs">Recommendation</p>
                <p className={`text-2xl font-bold ${style.text}`}>
                  {String(prediction.recommendation || 'HOLD').replace('_', ' ')}
                </p>
                
                <div className="mt-2">
                  <p className="text-gray-400 text-xs">Expected Change</p>
                  <p className={`text-lg font-semibold ${prediction.predicted_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {prediction.predicted_change >= 0 ? '+' : ''}{prediction.predicted_change.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
            
            {/* Confidence Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Confidence</span>
                <span>{prediction.confidence.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${prediction.confidence > 70 ? 'bg-green-500' : prediction.confidence > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${prediction.confidence}%` }}
                />
              </div>
            </div>
          </div>

          {/* Technical Indicators */}
          {prediction.technicals && (
            <div className="bg-gray-700/50 rounded p-3">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Technical Indicators</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">RSI</span>
                  <span className={getRSIStatus(prediction.technicals.rsi).color}>
                    {prediction.technicals.rsi.toFixed(1)} ({getRSIStatus(prediction.technicals.rsi).label})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">MACD</span>
                  <span className={prediction.technicals.macd > 0 ? 'text-green-400' : 'text-red-400'}>
                    {prediction.technicals.macd.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">MA 7</span>
                  <span className="text-white">${formatPrice(prediction.technicals.ma_7)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">MA 30</span>
                  <span className="text-white">${formatPrice(prediction.technicals.ma_30)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Volatility (7d)</span>
                  <span className="text-white">{prediction.technicals.volatility_7d.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">BB Position</span>
                  <span className="text-white">{(prediction.technicals.bb_position * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Top Factors */}
          {prediction.top_factors && prediction.top_factors.length > 0 && (
            <div className="bg-gray-700/50 rounded p-3">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Key Prediction Factors</h4>
              <div className="space-y-1">
                {prediction.top_factors.slice(0, 3).map((factor, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-gray-300">{factor.feature.replace(/_/g, ' ')}</span>
                        <span className="text-gray-400">{(factor.importance * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1 bg-gray-600 rounded-full mt-1">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${factor.importance * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback Warning */}
          {prediction.fallback && (
            <p className="text-xs text-yellow-400 text-center">
              ⚠️ Using simplified analysis (full model unavailable)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
