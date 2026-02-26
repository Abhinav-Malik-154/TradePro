'use client';

import { useEffect, useState } from 'react';
import AssetLogo from './AssetLogo';
import { TICKER_SYMBOLS, getDisplaySymbol } from '@/config/assetData';

interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

const ML_API_URL = (process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

const DEFAULT_INDICES: MarketIndex[] = [
  { symbol: 'SPX', name: 'S&P 500', value: 6946.5, change: 59.10, changePercent: 0.86 },
  { symbol: 'NDX', name: 'Nasdaq 100', value: 25323.8, change: 361.30, changePercent: 1.45 },
  { symbol: 'DJI', name: 'Dow 30', value: 49437.6, change: 285.50, changePercent: 0.58 },
];

export default function MarketTicker({ currentSymbol }: { currentSymbol?: string }) {
  const [indices] = useState<MarketIndex[]>(DEFAULT_INDICES);
  const [assets, setAssets] = useState<MarketIndex[]>([]);

  useEffect(() => {
    Promise.all(
      TICKER_SYMBOLS.map((t) =>
        fetch(`${ML_API_URL}/agent/current-price?symbol=${t}`)
          .then((r) => r.json())
          .then((d) => ({
            symbol: t,
            name: getDisplaySymbol(t),
            value: d.price || 0,
            change: ((d.change_24h || 0) / 100) * (d.price || 0),
            changePercent: d.change_24h || 0,
          }))
          .catch(() => ({ symbol: t, name: getDisplaySymbol(t), value: 0, change: 0, changePercent: 0 }))
      )
    ).then((s) => setAssets(s.filter((x) => x.value > 0)));
  }, []);

  const allItems = [...indices, ...assets];

  return (
    <div className="bg-gray-900/80 border-b border-gray-700/50 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap py-1.5 gap-6 px-4">
        {[...allItems, ...allItems].map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm shrink-0">
            <AssetLogo symbol={item.symbol} size={18} />
            <span className="text-gray-300 font-medium">{item.name}</span>
            <span className="text-white font-semibold">
              {item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={item.change >= 0 ? 'text-green-400' : 'text-red-400'}>
              {item.change >= 0 ? '+' : ''}
              {item.change.toFixed(2)} ({item.changePercent >= 0 ? '+' : ''}
              {item.changePercent.toFixed(2)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
