'use client';

import { motion } from 'framer-motion';
import PriceTicker from '@/components/trading/PriceTicker';
import OrderBook from '@/components/trading/OrderBook';
import TradeForm from '@/components/trading/TradeForm';
import RecentTrades from '@/components/trading/RecentTrades';
import TradingChart from '@/components/charts/TradingChart';

export default function Home() {
  return (
    <div className="space-y-6">
      {/* Price Ticker */}
      <PriceTicker />

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {[
          { label: 'Total Volume', value: '$1.2M', change: '+12.5%' },
          { label: 'Active Trades', value: '1,234', change: '+5.2%' },
          { label: 'Users', value: '892', change: '+18.1%' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10"
          >
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
            <p className="text-sm text-emerald-400 mt-1">{stat.change}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Trading Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <TradingChart />
        </div>

        {/* Order Book - Takes 1 column */}
        <OrderBook />
      </div>

      {/* Trade Form and Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TradeForm />
        <RecentTrades />
      </div>
    </div>
  );
}