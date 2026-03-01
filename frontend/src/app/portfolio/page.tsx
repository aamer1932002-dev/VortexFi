'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Portfolio from '@/components/Portfolio';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { PieChart, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';

const portfolioStats = [
  { 
    label: 'Total Balance', 
    value: '$12,847.32', 
    change: '+12.4%', 
    isPositive: true,
    icon: DollarSign 
  },
  { 
    label: 'Total Deposited', 
    value: '$10,500.00', 
    change: '+$2,500', 
    isPositive: true,
    icon: ArrowDownRight 
  },
  { 
    label: 'Total Earnings', 
    value: '$2,347.32', 
    change: '+22.3%', 
    isPositive: true,
    icon: TrendingUp 
  },
  { 
    label: 'Active Positions', 
    value: '7', 
    change: '+2 this week', 
    isPositive: true,
    icon: Wallet 
  },
];

export default function PortfolioPage() {
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6"
                >
                  <PieChart className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-cyan-400 font-medium">Portfolio Tracker</span>
                </motion.div>
                
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  <span className="text-white">Your </span>
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Portfolio
                  </span>
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Track all your cross-chain positions and earnings in one unified dashboard.
                </p>
              </motion.div>

              {/* Portfolio Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                {portfolioStats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative p-5 rounded-xl bg-white/5 border border-white/10 group hover:border-cyan-500/30 transition-colors overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <stat.icon className="w-5 h-5 text-cyan-400" />
                        <div className={`flex items-center gap-1 text-xs font-medium ${stat.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {stat.change}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="text-sm text-gray-500">{stat.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Portfolio Component */}
          <Portfolio />

          <Footer />
        </motion.div>
      </div>
    </main>
  );
}
