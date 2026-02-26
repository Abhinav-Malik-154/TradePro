'use client';

import { useState, useEffect } from 'react';
import { useSymbol } from '@/context/SymbolContext';

interface AgentOpinion {
  agent: string;
  signal: string;
  confidence: number;
  reasoning: string;
}

interface PredictionData {
  ticker: string;
  final_recommendation: string;
  confidence: number;
  agent_opinions: AgentOpinion[];
  summary: string;
}

const ML_API_URL = (process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

export default function AIPrediction() {
  const { selectedSymbol } = useSymbol();
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ticker = selectedSymbol?.replace('/', '') || 'BTCUSD';

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${ML_API_URL}/agent/analyze/${ticker}`);
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
      console.error('Prediction fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, [ticker]);

  const getSignalColor = (signal: unknown) => {
    const s = String(signal || '').toLowerCase();
    switch (s) {
      case 'buy':
      case 'strong_buy':
        return 'text-green-400';
      case 'sell':
      case 'strong_sell':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getSignalBg = (signal: unknown) => {
    const s = String(signal || '').toLowerCase();
    switch (s) {
      case 'buy':
      case 'strong_buy':
        return 'bg-green-500/20 border-green-500/50';
      case 'sell':
      case 'strong_sell':
        return 'bg-red-500/20 border-red-500/50';
      default:
        return 'bg-yellow-500/20 border-yellow-500/50';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          AI Analysis
        </h3>
        <button
          onClick={fetchPrediction}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm text-white transition-colors"
        >
          {loading ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-gray-400 text-xs mt-1">Make sure ML backend is running on port 8000</p>
        </div>
      )}

      {loading && !prediction && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Running multi-agent analysis...</span>
        </div>
      )}

      {prediction && (
        <div className="space-y-4">
          {/* Final Recommendation */}
          <div className={`rounded-lg p-4 border ${getSignalBg(prediction.final_recommendation)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Final Recommendation</p>
                <p className={`text-2xl font-bold ${getSignalColor(prediction.final_recommendation)}`}>
                  {String(prediction.final_recommendation || '').toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">Confidence</p>
                <p className="text-xl font-semibold text-white">
                  {((prediction.confidence || 0) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            {prediction.summary && (
              <p className="text-gray-300 text-sm mt-3 border-t border-gray-600 pt-3">
                {prediction.summary}
              </p>
            )}
          </div>

          {/* Agent Opinions */}
          {prediction.agent_opinions && prediction.agent_opinions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Agent Opinions</h4>
              <div className="space-y-2">
                {prediction.agent_opinions.map((opinion, index) => (
                  <div key={index} className="bg-gray-700/50 rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">{opinion.agent}</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${getSignalColor(opinion.signal)}`}>
                          {String(opinion.signal || '').toUpperCase()}
                        </span>
                        <span className="text-gray-400 text-sm">
                          ({((opinion.confidence || 0) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                    {opinion.reasoning && (
                      <p className="text-gray-400 text-sm">{opinion.reasoning}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
