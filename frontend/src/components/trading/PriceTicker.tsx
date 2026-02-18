'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TickerData {
  symbol: string;
  price: number;
  change: number;
}

export default function PriceTicker() {
  const [tickers, setTickers] = useState<TickerData[]>([
    { symbol: 'BTC/USD', price: 51234.56, change: 2.34 },
    { symbol: 'ETH/USD', price: 3123.45, change: -1.23 },
    { symbol: 'SOL/USD', price: 102.34, change: 5.67 },
  ]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 mb-6 ring-1 ring-white/10"
    >
      <div className="flex gap-8 overflow-x-auto pb-2">
        {tickers.map((ticker, idx) => (
          <motion.div
            key={ticker.symbol}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-center gap-3 min-w-[200px]"
          >
            <span className="font-semibold text-white">{ticker.symbol}</span>
            <span className="font-mono text-white">${ticker.price.toLocaleString()}</span>
            <span className={`text-sm px-2 py-1 rounded ${
              ticker.change >= 0 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {ticker.change >= 0 ? '▲' : '▼'} {Math.abs(ticker.change)}%
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}