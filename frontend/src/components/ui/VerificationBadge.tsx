'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

interface VerificationBadgeProps {
  verified: boolean;
  hash: string;
}

export default function VerificationBadge({ verified, hash }: VerificationBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!verified) return null;

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        <CheckBadgeIcon className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full right-0 mb-2 w-64 bg-slate-800 rounded-xl p-3 shadow-xl ring-1 ring-white/10"
          >
            <p className="text-xs text-slate-300 mb-2">Verified on Blockchain</p>
            <p className="text-xs font-mono text-slate-400 break-all">{hash}</p>
            <a
              href={`https://amoy.polygonscan.com/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 mt-2 block"
            >
              View on Explorer →
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}