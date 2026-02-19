'use client';

import { motion } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function PriceTickerSkeleton() {
  return (
    <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-4 ring-1 ring-white/10">
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={100} height={20} baseColor="#1e293b" highlightColor="#334155" />
        <Skeleton width={80} height={20} baseColor="#1e293b" highlightColor="#334155" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-700/20 rounded-lg p-3">
            <Skeleton width={60} height={16} baseColor="#1e293b" highlightColor="#334155" />
            <Skeleton width={80} height={24} baseColor="#1e293b" highlightColor="#334155" className="mt-2" />
            <Skeleton width={100} height={14} baseColor="#1e293b" highlightColor="#334155" className="mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}