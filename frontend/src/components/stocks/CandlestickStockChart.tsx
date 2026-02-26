'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  ColorType,
  IChartApi,
  CandlestickData,
  HistogramData,
  UTCTimestamp,
} from 'lightweight-charts';

interface HistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PredictionData {
  predicted_price: number;
  horizon_days: number;
  current_price: number;
}

type Period = '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'All';

const ML_API_URL = (process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

const PERIOD_MAP: Record<Period, string> = {
  '1M': '1mo',
  '3M': '3mo',
  '6M': '6mo',
  YTD: 'ytd',
  '1Y': '1y',
  '5Y': '5y',
  All: 'max',
};

interface CandlestickStockChartProps {
  symbol: string;
  history: HistoryPoint[];
  prediction?: PredictionData | null;
  onPeriodChange?: (history: HistoryPoint[]) => void;
}

export default function CandlestickStockChart({
  symbol,
  history,
  prediction,
  onPeriodChange,
}: CandlestickStockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [activePeriod, setActivePeriod] = useState<Period>('1Y');
  const [loadingPeriod, setLoadingPeriod] = useState(false);

  const handlePeriodChange = useCallback(
    async (period: Period) => {
      setActivePeriod(period);
      setLoadingPeriod(true);
      try {
        const res = await fetch(
          `${ML_API_URL}/agent/history?symbol=${symbol}&period=${PERIOD_MAP[period]}`
        );
        const json = await res.json();
        if (json.status === 'success' && json.data) {
          onPeriodChange?.(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch period data:', err);
      } finally {
        setLoadingPeriod(false);
      }
    },
    [symbol, onPeriodChange]
  );

  useEffect(() => {
    if (!chartContainerRef.current || history.length === 0) return;

    // Clean up
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748B',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 11,
      },
      width: container.clientWidth,
      height: 420,
      grid: {
        vertLines: { color: '#1E293B50' },
        horzLines: { color: '#1E293B50' },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: '#475569',
          width: 1,
          style: 2,
          labelBackgroundColor: '#334155',
        },
        horzLine: {
          color: '#475569',
          width: 1,
          style: 2,
          labelBackgroundColor: '#334155',
        },
      },
      timeScale: {
        borderColor: '#1E293B',
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      rightPriceScale: {
        borderColor: '#1E293B',
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
    });

    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#EF4444',
      borderUpColor: '#10B981',
      borderDownColor: '#EF4444',
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });

    const candleData: CandlestickData[] = history.map((h) => ({
      time: h.date.split('T')[0] as unknown as UTCTimestamp,
      open: h.open,
      high: h.high,
      low: h.low,
      close: h.close,
    }));
    candleSeries.setData(candleData);

    // Volume series
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    const volumeData: HistogramData[] = history.map((h) => ({
      time: h.date.split('T')[0] as unknown as UTCTimestamp,
      value: h.volume,
      color: h.close >= h.open ? '#10B98140' : '#EF444440',
    }));
    volumeSeries.setData(volumeData);

    // Prediction line
    if (prediction && history.length > 0) {
      const last = history[history.length - 1];
      const futureDate = new Date(last.date);
      futureDate.setDate(futureDate.getDate() + prediction.horizon_days);

      const predSeries = chart.addLineSeries({
        color: '#F59E0B',
        lineWidth: 2,
        lineStyle: 2,
        crosshairMarkerVisible: true,
        title: 'AI Prediction',
      });
      predSeries.setData([
        { time: last.date.split('T')[0] as unknown as UTCTimestamp, value: last.close },
        {
          time: futureDate.toISOString().split('T')[0] as unknown as UTCTimestamp,
          value: prediction.predicted_price,
        },
      ]);
    }

    // Price line for current price
    if (history.length > 0) {
      const lastPrice = history[history.length - 1].close;
      candleSeries.createPriceLine({
        price: lastPrice,
        color: '#3B82F6',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: '',
      });
    }

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (container && chartRef.current) {
        chartRef.current.applyOptions({ width: container.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [history, prediction]);

  const periods: Period[] = ['1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'];

  return (
    <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden">
      {/* Chart area */}
      <div className="relative">
        {loadingPeriod && (
          <div className="absolute inset-0 bg-gray-900/50 z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
          </div>
        )}
        <div ref={chartContainerRef} className="w-full" />
      </div>

      {/* Timeframe selectors */}
      <div className="flex items-center gap-1 px-4 py-2 border-t border-gray-700/50">
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => handlePeriodChange(p)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activePeriod === p
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
