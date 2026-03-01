'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'bridge' | 'claim';
  status: 'pending' | 'bridging' | 'completed' | 'failed';
  sourceChain: string;
  destChain: string;
  token: string;
  amount: string;
  vault?: string;
  txHash: string;
  timestamp: string; // ISO string for localStorage serialization
  lpReceived?: string;
  walletAddress?: string;
}

export function saveTransaction(tx: Omit<Transaction, 'id' | 'timestamp'>) {
  try {
    const stored = localStorage.getItem('vortexfi_transactions');
    const existing: Transaction[] = stored ? JSON.parse(stored) : [];
    const newTx: Transaction = { ...tx, id: Date.now().toString(), timestamp: new Date().toISOString() };
    localStorage.setItem('vortexfi_transactions', JSON.stringify([newTx, ...existing].slice(0, 50)));
  } catch {}
}

const statusColors = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  bridging: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusIcons = {
  pending: '⏳',
  bridging: '🌉',
  completed: '✅',
  failed: '❌',
};

const typeIcons = {
  deposit: '📥',
  withdraw: '📤',
  bridge: '🔗',
  claim: '🎁',
};

export default function TransactionHistory() {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  // Load transactions from localStorage on mount and when address changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem('vortexfi_transactions');
      if (stored) {
        const all: Transaction[] = JSON.parse(stored);
        // If wallet connected, show only that wallet's txs; otherwise show all
        const filtered = address
          ? all.filter((tx) => !tx.walletAddress || tx.walletAddress.toLowerCase() === address.toLowerCase())
          : all;
        setTransactions(filtered);
      } else {
        setTransactions([]);
      }
    } catch {
      setTransactions([]);
    }
  }, [address]);

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return tx.status === 'pending' || tx.status === 'bridging';
    return tx.status === 'completed';
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Transaction{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              History
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Track all your cross-chain zaps in real-time
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {(['all', 'pending', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                filter === tab
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'pending' && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-500/30 rounded-full text-xs">
                  {transactions.filter((t) => t.status === 'pending' || t.status === 'bridging').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredTransactions.slice(0, isExpanded ? undefined : 5).map((tx, index) => (
              <motion.div
                key={tx.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-6 hover:border-purple-500/30 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Type & Status */}
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{typeIcons[tx.type]}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold capitalize">{tx.type}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs border ${statusColors[tx.status]}`}
                        >
                          {statusIcons[tx.status]} {tx.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {tx.sourceChain} → {tx.destChain}
                      </div>
                    </div>
                  </div>

                  {/* Center: Amount & Vault */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-xl font-bold">
                        {tx.amount} {tx.token}
                      </div>
                      {tx.vault && (
                        <div className="text-sm text-purple-400">{tx.vault} Vault</div>
                      )}
                    </div>
                    {tx.lpReceived && (
                      <>
                        <div className="text-gray-500">→</div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-400">
                            {tx.lpReceived} LP
                          </div>
                          <div className="text-sm text-gray-400">Received</div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right: Time & Link */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-400">{formatTime(tx.timestamp)}</div>
                      <a
                        href={`https://amoy.polygonscan.com/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        View on Explorer ↗
                      </a>
                    </div>

                    {/* Progress indicator for bridging */}
                    {tx.status === 'bridging' && (
                      <div className="relative w-12 h-12">
                        <svg className="w-12 h-12 transform -rotate-90">
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-white/10"
                          />
                          <motion.circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeLinecap="round"
                            className="text-purple-500"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 0.7 }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                            style={{
                              strokeDasharray: '126',
                            }}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs">
                          70%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Show More Button */}
        {filteredTransactions.length > 5 && (
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {isExpanded ? 'Show Less' : `Show ${filteredTransactions.length - 5} More`}
          </motion.button>
        )}

        {/* Empty State */}
        {filteredTransactions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold mb-2">No transactions yet</h3>
            <p className="text-gray-400">
              Your cross-chain zaps will appear here
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
