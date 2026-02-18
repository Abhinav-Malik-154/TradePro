'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import VerificationBadge from '../ui/VerificationBadge';

interface Trade {
  id: string;
  side: 'BUY' | 'SELL';
  symbol: string;
  price: number;
  quantity: number;
  time: string;
  tradeHash: string;
  verified: boolean;
}

export default function RecentTrades() {
  const [trades, setTrades] = useState<Trade[]>([
    {
      id: '1',
      side: 'BUY',
      symbol: 'BTC/USD',
      price: 51234,
      quantity: 0.1,
      time: 'Just now',
      tradeHash: '0x1234...5678',
      verified: true
    },
    {
      id: '2',
      side: 'SELL',
      symbol: 'ETH/USD',
      price: 3123,
      quantity: 0.5,
      time: '2 min ago',
      tradeHash: '0x8765...4321',
      verified: true
    }
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10"
    >
      <h2 className="text-xl font-semibold text-white mb-4">Recent Trades</h2>
      
      <div className="space-y-3">
        {trades.map((trade, idx) => (
          <motion.div
            key={trade.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-center justify-between p-3 bg-slate-700/20 rounded-xl hover:bg-slate-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold ${
                trade.side === 'BUY' ? 'text-green-400' : 'text-red-400'
              }`}>
                {trade.side}
              </span>
              <span className="text-white font-mono">{trade.symbol}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-white font-mono">
                {trade.quantity} @ ${trade.price.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">{trade.time}</span>
              <VerificationBadge verified={trade.verified} hash={trade.tradeHash} />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}