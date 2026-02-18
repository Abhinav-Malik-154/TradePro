'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function TradeForm() {
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show loading toast
    toast.loading('Placing order...', { id: 'trade' });
    
    try {
      // Call your backend API
      const response = await fetch('http://localhost:5000/api/trades/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: 'BTC/USD',
          price: parseFloat(price),
          quantity: parseFloat(quantity),
          side,
          userId: 'testuser'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Trade verified on blockchain!', { id: 'trade' });
        // Reset form
        setPrice('');
        setQuantity('');
      } else {
        toast.error('Trade failed: ' + data.error, { id: 'trade' });
      }
    } catch (error) {
      toast.error('Failed to place order', { id: 'trade' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10"
    >
      <h2 className="text-xl font-semibold text-white mb-4">Place Order</h2>

      {/* Buy/Sell Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSide('BUY')}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 ${
            side === 'BUY'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
              : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
          }`}
        >
          BUY
        </button>
        <button
          onClick={() => setSide('SELL')}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 ${
            side === 'SELL'
              ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg'
              : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
          }`}
        >
          SELL
        </button>
      </div>

      {/* Order Type Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setOrderType('limit')}
          className={`px-4 py-2 rounded-lg text-sm transition-all ${
            orderType === 'limit'
              ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Limit
        </button>
        <button
          onClick={() => setOrderType('market')}
          className={`px-4 py-2 rounded-lg text-sm transition-all ${
            orderType === 'market'
              ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Market
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {orderType === 'limit' && (
          <div>
            <label className="block text-sm text-slate-400 mb-2">Price (USD)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              step="0.01"
              required
              className="w-full bg-slate-700/50 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-400 mb-2">Quantity (BTC)</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.00"
            step="0.001"
            required
            className="w-full bg-slate-700/50 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {price && quantity && (
          <div className="bg-slate-700/30 rounded-xl p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Total</span>
              <span className="text-white font-mono">
                ${(parseFloat(price || '0') * parseFloat(quantity || '0')).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <button
          type="submit"
          className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl ${
            side === 'BUY'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
              : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
          }`}
        >
          {side === 'BUY' ? 'Buy BTC' : 'Sell BTC'}
        </button>
      </form>
    </motion.div>
  );
}