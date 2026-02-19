'use client';

import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function OrderBookSkeleton() {
  return (
    <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10">
      <Skeleton width={120} height={24} baseColor="#1e293b" highlightColor="#334155" className="mb-4" />
      
      {/* Asks skeleton */}
      <div className="mb-4">
        <div className="grid grid-cols-3 mb-2 px-2">
          <Skeleton width={60} height={12} baseColor="#1e293b" highlightColor="#334155" />
          <Skeleton width={60} height={12} baseColor="#1e293b" highlightColor="#334155" className="ml-auto" />
          <Skeleton width={60} height={12} baseColor="#1e293b" highlightColor="#334155" className="ml-auto" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="grid grid-cols-3 py-1 px-2">
            <Skeleton width={70} height={16} baseColor="#1e293b" highlightColor="#334155" />
            <Skeleton width={50} height={16} baseColor="#1e293b" highlightColor="#334155" className="ml-auto" />
            <Skeleton width={60} height={16} baseColor="#1e293b" highlightColor="#334155" className="ml-auto" />
          </div>
        ))}
      </div>
      
      {/* Spread skeleton */}
      <div className="border-y border-white/10 py-3 my-3">
        <div className="flex justify-between">
          <Skeleton width={50} height={16} baseColor="#1e293b" highlightColor="#334155" />
          <Skeleton width={80} height={16} baseColor="#1e293b" highlightColor="#334155" />
        </div>
      </div>
      
      {/* Bids skeleton */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="grid grid-cols-3 py-1 px-2">
          <Skeleton width={70} height={16} baseColor="#1e293b" highlightColor="#334155" />
          <Skeleton width={50} height={16} baseColor="#1e293b" highlightColor="#334155" className="ml-auto" />
          <Skeleton width={60} height={16} baseColor="#1e293b" highlightColor="#334155" className="ml-auto" />
        </div>
      ))}
    </div>
  );
}