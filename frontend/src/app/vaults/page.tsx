'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { VaultGrid } from '@/components/sections/VaultGrid';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { Wallet, TrendingUp, Shield, Sparkles } from 'lucide-react';

const vaultStats = [
  { label: 'Total Vaults', value: '24+', icon: Wallet },
  { label: 'Total TVL', value: '$847M', icon: TrendingUp },
  { label: 'Avg APY', value: '12.4%', icon: Sparkles },
  { label: 'Audited', value: '100%', icon: Shield },
];

export default function VaultsPage() {
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6"
                >
                  <Wallet className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-purple-400 font-medium">Cross-Chain Vaults</span>
                </motion.div>
                
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  <span className="text-white">Explore </span>
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                    Vaults
                  </span>
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Deposit from any chain, earn yields everywhere. One-click access to the best DeFi opportunities across all networks.
                </p>
              </motion.div>

              {/* Vault Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                {vaultStats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative p-4 rounded-xl bg-white/5 border border-white/10 text-center group hover:border-purple-500/30 transition-colors"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
                    <stat.icon className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Vault Grid */}
          <VaultGrid />

          <Footer />
        </motion.div>
      </div>
    </main>
  );
}
