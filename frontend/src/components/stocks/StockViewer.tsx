'use client';

import { useState, useEffect } from 'react';
import StockChart from './StockChart';

interface HistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PredictionResult {
  symbol: string;
  current_price: number;
  predicted_price: number;
  predicted_change: number;
  horizon_days: number;
  confidence: number;
  recommendation: string;
  timestamp: string;
  [key: string]: any;
}

interface StockViewerProps {
  initialSymbol: string;
  initialHistory: HistoryPoint[];
  initialPrediction: PredictionResult | null;
}

const ML_API_URL = (process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

export default function StockViewer({
  initialSymbol,
  initialHistory,
  initialPrediction,
}: StockViewerProps) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [history, setHistory] = useState<HistoryPoint[]>(initialHistory);
  const [prediction, setPrediction] = useState<PredictionResult | null>(initialPrediction);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (sym: string) => {
    setLoading(true);
    setError(null);
    try {
      const [predRes, histRes] = await Promise.all([
        fetch(`${ML_API_URL}/agent/predict/${sym}`).then((r) => r.json()),
        fetch(`${ML_API_URL}/agent/history?symbol=${sym}&period=1y`).then((r) => r.json()),
      ]);

      if (predRes.status === 'success') {
        setPrediction(predRes.data);
      } else {
        throw new Error(predRes.detail || 'prediction failed');
      }
      if (histRes.status === 'success') {
        setHistory(histRes.data || []);
      } else {
        throw new Error(histRes.detail || 'history failed');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSymbol(e.target.value.toUpperCase());
  };

  const handleSearch = () => {
    if (symbol) {
      fetchData(symbol);
    }
  };

  // auto-fetch on mount or when initialSymbol changes
  useEffect(() => {
    fetchData(initialSymbol);
  }, [initialSymbol]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <input
          className="px-3 py-2 rounded bg-gray-700 text-white w-32"
          value={symbol}
          onChange={handleSymbolChange}
          onKeyDown={handleKey}
          placeholder="AAPL"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Go'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {prediction && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">{symbol} Prediction</h2>
            <div className="space-y-2">
              <p>
                Current price: <strong>${prediction.current_price}</strong>
              </p>
              <p>
                Predicted price ({prediction.horizon_days}d):{' '}
                <strong>${prediction.predicted_price}</strong> ({prediction.predicted_change.toFixed(2)}%)
              </p>
              <p>
                Recommendation:{' '}
                <strong className={
                  prediction.recommendation.toLowerCase().includes('buy')
                    ? 'text-green-400'
                    : prediction.recommendation.toLowerCase().includes('sell')
                    ? 'text-red-400'
                    : 'text-yellow-400'
                }>{prediction.recommendation}</strong>
              </p>
              <p>Confidence: {prediction.confidence}%</p>
            </div>
          </div>
          <div>{/* space for future details */}</div>
        </div>
      )}

      <div>
        <StockChart history={history} prediction={prediction || undefined} />
      </div>
    </div>
  );
}
