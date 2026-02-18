'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Order {
  price: number;
  amount: number;
  total: number;
}

export default function OrderBook() {
  const [bids] = useState<Order[]>([
    { price: 51234, amount: 0.12, total: 6148.08 },
    { price: 51233, amount: 0.34, total: 17419.22 },
    { price: 51232, amount: 0.23, total: 11783.36 },
    { price: 51231, amount: 0.45, total: 23053.95 },
    { price: 51230, amount: 0.67, total: 34324.10 },
  ]);

  const [asks] = useState<Order[]>([
    { price: 51235, amount: 0.23, total: 11784.05 },
    { price: 51236, amount: 0.45, total: 23056.20 },
    { price: 51237, amount: 0.34, total: 17420.58 },
    { price: 51238, amount: 0.56, total: 28693.28 },
    { price: 51239, amount: 0.78, total: 39966.42 },
  ]);

  const spread = asks[0].price - bids[0].price;
  const spreadPercentage = (spread / bids[0].price) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10"
    >
      <h2 className="text-xl font-semibold text-white mb-4">Order Book</h2>
      
      {/* Asks (Sell orders) */}
      <div className="mb-4">
        <div className="text-xs text-slate-400 grid grid-cols-3 mb-2 px-2">
          <span>Price (USD)</span>
          <span className="text-right">Amount (BTC)</span>
          <span className="text-right">Total (USD)</span>
        </div>
        {asks.map((ask, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="grid grid-cols-3 text-sm py-1 px-2 hover:bg-red-500/10 rounded group"
          >
            <span className="text-red-400 font-mono">${ask.price.toLocaleString()}</span>
            <span className="text-right text-slate-300">{ask.amount.toFixed(3)}</span>
            <span className="text-right text-slate-400">${ask.total.toLocaleString()}</span>
          </motion.div>
        ))}
      </div>

      {/* Spread */}
      <div className="border-y border-white/10 py-3 my-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Spread</span>
          <span className="text-white font-mono">${spread.toFixed(2)} ({spreadPercentage.toFixed(2)}%)</span>
        </div>
      </div>

      {/* Bids (Buy orders) */}
      <div>
        {bids.map((bid, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="grid grid-cols-3 text-sm py-1 px-2 hover:bg-green-500/10 rounded group"
          >
            <span className="text-green-400 font-mono">${bid.price.toLocaleString()}</span>
            <span className="text-right text-slate-300">{bid.amount.toFixed(3)}</span>
            <span className="text-right text-slate-400">${bid.total.toLocaleString()}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}