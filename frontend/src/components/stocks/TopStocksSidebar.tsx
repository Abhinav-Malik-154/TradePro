'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown } from 'lucide-react';
import AssetLogo from './AssetLogo';
import { SIDEBAR_STOCKS, SIDEBAR_CRYPTO, getDisplaySymbol } from '@/config/assetData';
import { usePrefetchSymbol } from '@/hooks/useMLApi';

interface AssetTick {
  symbol: string;
  price: number;
  change_24h: number;
}

const ML_API_URL = (process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

export default function TopStocksSidebar({ currentSymbol }: { currentSymbol: string }) {
  const [stocks, setStocks] = useState<AssetTick[]>([]);
  const [crypto, setCrypto] = useState<AssetTick[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchList = (symbols: string[]) =>
    Promise.all(
      symbols.map((s) =>
        fetch(`${ML_API_URL}/agent/current-price?symbol=${s}`)
          .then((r) => r.json())
          .then((d) => ({ symbol: s, price: d.price || 0, change_24h: d.change_24h || 0 }))
          .catch(() => ({ symbol: s, price: 0, change_24h: 0 }))
      )
    ).then((data) => data.filter((d) => d.price > 0));

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchList(SIDEBAR_STOCKS), fetchList(SIDEBAR_CRYPTO)]).then(([s, c]) => {
      setStocks(s);
      setCrypto(c);
      setLoading(false);
    });
  }, []);

  const prefetch = usePrefetchSymbol();

  const renderEntry = (item: AssetTick) => (
    <button
      key={item.symbol}
      onClick={() => router.push(`/stocks/${encodeURIComponent(item.symbol)}`)}
      onMouseEnter={() => prefetch(item.symbol)}
      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${
        currentSymbol === item.symbol ? 'bg-gray-700/50' : 'hover:bg-gray-800/50'
      }`}
    >
      <div className="flex items-center gap-2">
        <AssetLogo symbol={item.symbol} size={24} />
        <div className="text-left">
          <p className="text-white font-medium text-xs">{getDisplaySymbol(item.symbol)}</p>
          <p className="text-gray-500 text-[10px]">
            ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {item.change_24h >= 0 ? (
          <TrendingUp className="w-3 h-3 text-green-400" />
        ) : (
          <TrendingDown className="w-3 h-3 text-red-400" />
        )}
        <span
          className={`text-xs font-medium ${
            item.change_24h >= 0 ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {item.change_24h >= 0 ? '+' : ''}
          {item.change_24h.toFixed(2)}%
        </span>
      </div>
    </button>
  );

  const skeleton = (
    <div className="space-y-2 px-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-8 bg-gray-800 rounded animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Stocks section */}
      <div className="space-y-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
          Top Stocks
        </h3>
        {loading ? skeleton : stocks.map(renderEntry)}
      </div>

      {/* Crypto section */}
      <div className="space-y-1 pt-2 border-t border-gray-700/30">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
          🪙 Crypto
        </h3>
        {loading ? skeleton : crypto.map(renderEntry)}
      </div>
    </div>
  );
}
