import { useQuery, useQueryClient } from '@tanstack/react-query';

const ML_API_URL = (process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

/* ── generic fetcher ─────────────────────────────────── */

async function mlFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${ML_API_URL}${path}`);
  if (!res.ok) throw new Error(`ML API ${res.status}`);
  return res.json();
}

/* ── key factories (for consistent cache keys) ──────── */

export const mlKeys = {
  prediction: (sym: string) => ['ml', 'predict', sym] as const,
  history: (sym: string, period: string) => ['ml', 'history', sym, period] as const,
  profile: (sym: string) => ['ml', 'profile', sym] as const,
  predictMulti: (sym: string) => ['ml', 'predict-multi', sym] as const,
  news: (sym: string) => ['ml', 'news', sym] as const,
  sentiment: (sym: string) => ['ml', 'sentiment', sym] as const,
  analyze: (sym: string) => ['ml', 'analyze', sym] as const,
  currentPrice: (sym: string) => ['ml', 'price', sym] as const,
};

/* ── shared types ────────────────────────────────────── */

export interface HistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PredictionResult {
  symbol: string;
  current_price: number;
  predicted_price: number;
  predicted_change: number;
  horizon_days: number;
  confidence: number;
  recommendation: string;
  timestamp: string;
  technicals?: {
    rsi: number;
    macd: number;
    macd_signal: number;
    volatility_7d: number;
    bb_position: number;
    ma_7: number;
    ma_30: number;
  };
  top_factors?: { feature: string; importance: number }[];
  [key: string]: any;
}

/* ── hooks ────────────────────────────────────────────── */

/** Prediction for a symbol (staleTime: 60s, keeps cached 10 min) */
export function usePrediction(symbol: string) {
  return useQuery({
    queryKey: mlKeys.prediction(symbol),
    queryFn: async () => {
      const d = await mlFetch<any>(`/agent/predict/${symbol}`);
      if (d.status !== 'success') throw new Error('predict failed');
      return d.data as PredictionResult;
    },
  });
}

/** Historical OHLCV (staleTime elevated — history changes slowly) */
export function useHistory(symbol: string, period = '1y') {
  return useQuery({
    queryKey: mlKeys.history(symbol, period),
    queryFn: async () => {
      const d = await mlFetch<any>(`/agent/history?symbol=${symbol}&period=${period}`);
      if (d.status !== 'success') throw new Error('history failed');
      return (d.data || []) as HistoryPoint[];
    },
    staleTime: 5 * 60 * 1000, // 5 min — OHLCV is slow-moving
  });
}

/** Company profile (very stable — cache for 30 min) */
export function useProfile(symbol: string) {
  return useQuery({
    queryKey: mlKeys.profile(symbol),
    queryFn: async () => {
      const d = await mlFetch<any>(`/agent/profile/${symbol}`);
      if (d.status !== 'success') throw new Error('profile failed');
      return d.data;
    },
    staleTime: 30 * 60 * 1000,
  });
}

/** Multi-horizon predictions (1d, 7d, 30d) */
export function usePredictMulti(symbol: string) {
  return useQuery({
    queryKey: mlKeys.predictMulti(symbol),
    queryFn: async () => {
      const d = await mlFetch<any>(`/agent/predict-multi/${symbol}`);
      if (d.status !== 'success') throw new Error('predict-multi failed');
      return d.data;
    },
  });
}

/** News articles */
export function useNews(symbol: string) {
  return useQuery({
    queryKey: mlKeys.news(symbol),
    queryFn: async () => {
      const d = await mlFetch<any>(`/agent/news?symbol=${symbol}&max_items=5`);
      if (d.status !== 'success') throw new Error('news failed');
      return { articles: d.articles || [], aggregate_sentiment: d.aggregate_sentiment };
    },
    staleTime: 3 * 60 * 1000, // 3 min
  });
}

/** Aggregate sentiment */
export function useSentiment(symbol: string) {
  return useQuery({
    queryKey: mlKeys.sentiment(symbol),
    queryFn: async () => {
      const d = await mlFetch<any>(`/agent/sentiment/${symbol}`);
      if (d.status !== 'success') throw new Error('sentiment failed');
      return d.data;
    },
    staleTime: 3 * 60 * 1000,
  });
}

/** Multi-agent analysis (slowest endpoint — cache aggressively) */
export function useAnalysis(symbol: string) {
  return useQuery({
    queryKey: mlKeys.analyze(symbol),
    queryFn: async () => {
      const d = await mlFetch<any>(`/agent/analyze/${symbol}`);
      if (d.status !== 'success') throw new Error('analyze failed');
      return d.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Current price (lightweight) */
export function useCurrentPrice(symbol: string) {
  return useQuery({
    queryKey: mlKeys.currentPrice(symbol),
    queryFn: () => mlFetch<any>(`/agent/current-price?symbol=${symbol}`),
    staleTime: 30 * 1000, // 30s — prices move fast
  });
}

/* ── prefetch helper (call on hover) ──────────────────── */

export function usePrefetchSymbol() {
  const qc = useQueryClient();

  return (symbol: string) => {
    // Fire-and-forget prefetches for the most critical data
    qc.prefetchQuery({
      queryKey: mlKeys.prediction(symbol),
      queryFn: () =>
        mlFetch<any>(`/agent/predict/${symbol}`).then((d) =>
          d.status === 'success' ? d.data : null
        ),
      staleTime: 60 * 1000,
    });
    qc.prefetchQuery({
      queryKey: mlKeys.history(symbol, '1y'),
      queryFn: () =>
        mlFetch<any>(`/agent/history?symbol=${symbol}&period=1y`).then((d) =>
          d.status === 'success' ? d.data : []
        ),
      staleTime: 5 * 60 * 1000,
    });
  };
}
