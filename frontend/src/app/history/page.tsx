'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import TransactionHistory from '@/components/TransactionHistory';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { History, ArrowRightLeft, CheckCircle, Clock, XCircle } from 'lucide-react';

const historyStats = [
  { label: 'Total Transactions', value: '156', icon: ArrowRightLeft },
  { label: 'Successful', value: '152', icon: CheckCircle, color: 'text-green-400' },
  { label: 'Pending', value: '3', icon: Clock, color: 'text-yellow-400' },
  { label: 'Failed', value: '1', icon: XCircle, color: 'text-red-400' },
];

export default function HistoryPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background Effects */}
      <ParticleBackground />
      <div className="fixed inset-0 bg-hero-glow pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10">
        <Header />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="pt-32 pb-20"
        >
          {/* Page Header */}
          <section className="px-4 mb-12">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6"
                >
                  <History className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">Transaction History</span>
                </motion.div>
                
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  <span className="text-white">Transaction </span>
                  <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    History
                  </span>
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  View all your cross-chain transactions, bridge operations, and vault interactions in one place.
                </p>
              </motion.div>

              {/* History Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                {historyStats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative p-4 rounded-xl bg-white/5 border border-white/10 text-center group hover:border-green-500/30 transition-colors"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
                    <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color || 'text-green-400'}`} />
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Transaction History Component */}
          <TransactionHistory />

          <Footer />
        </motion.div>
      </div>
    </main>
  );
}
