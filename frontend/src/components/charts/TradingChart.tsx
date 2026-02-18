'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// @ts-ignore - Ignore TypeScript errors for lightweight-charts
import { createChart } from 'lightweight-charts';

interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export default function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [timeframe, setTimeframe] = useState<'1H' | '24H' | '1W' | '1M'>('24H');
  const [chartData, setChartData] = useState<ChartData[]>([]);

  // Generate sample data
  useEffect(() => {
    const generateSampleData = (): ChartData[] => {
      const data: ChartData[] = [];
      let basePrice = 50000;
      const now = new Date();
      
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        const volatility = 0.02;
        const change = (Math.random() - 0.5) * volatility * basePrice;
        const open = basePrice;
        const close = basePrice + change;
        const high = Math.max(open, close) + Math.random() * volatility * basePrice * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * basePrice * 0.5;
        
        data.push({
          time: date.toISOString().split('T')[0],
          open,
          high,
          low,
          close,
        });
        
        basePrice = close;
      }
      
      return data;
    };

    setChartData(generateSampleData());
  }, []);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0 || chartRef.current) return;

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    try {
      // Create chart
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: 'transparent' },
          textColor: '#94A3B8',
          fontFamily: 'Inter, sans-serif',
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
        grid: {
          vertLines: { color: '#1E293B' },
          horzLines: { color: '#1E293B' },
        },
        timeScale: {
          borderColor: '#1E293B',
          timeVisible: true,
          secondsVisible: false,
        },
      });

      chartRef.current = chart;

      // Add candlestick series
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#10B981',
        downColor: '#EF4444',
        borderDownColor: '#EF4444',
        borderUpColor: '#10B981',
        wickDownColor: '#EF4444',
        wickUpColor: '#10B981',
      });

      // Format data
      const candlestickData = chartData.map(item => ({
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }));

      candlestickSeries.setData(candlestickData);

      // Add volume series
      const volumeSeries = chart.addHistogramSeries({
        color: '#3B82F6',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
      });

      // Configure volume scale
      chart.priceScale('').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      // Generate volume data
      const volumeData = chartData.map((d, i) => ({
        time: d.time,
        value: Math.random() * 1000000 + 500000,
        color: d.close >= d.open ? '#10B98180' : '#EF444480',
      }));

      volumeSeries.setData(volumeData);

      // Fit content
      chart.timeScale().fitContent();

      window.addEventListener('resize', handleResize);

    } catch (error) {
      console.error('Error creating chart:', error);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [chartData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white">BTC/USD Chart</h2>
          <p className="text-sm text-emerald-400">▲ 2.34%</p>
        </div>
        
        {/* Timeframe selector */}
        <div className="flex gap-2">
          {(['1H', '24H', '1W', '1M'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                timeframe === tf
                  ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div ref={chartContainerRef} className="w-full h-[400px]" />

      {/* Chart stats */}
      {chartData.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
          <div className="flex gap-4">
            <span>O: <span className="text-white">${chartData[chartData.length - 1]?.open.toLocaleString()}</span></span>
            <span>H: <span className="text-white">${chartData[chartData.length - 1]?.high.toLocaleString()}</span></span>
            <span>L: <span className="text-white">${chartData[chartData.length - 1]?.low.toLocaleString()}</span></span>
            <span>C: <span className="text-white">${chartData[chartData.length - 1]?.close.toLocaleString()}</span></span>
          </div>
        </div>
      )}
    </motion.div>
  );
}