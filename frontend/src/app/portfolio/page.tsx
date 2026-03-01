'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Portfolio from '@/components/Portfolio';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { PieChart, TrendingUp, Wallet, ArrowUpRight, DollarSign } from 'lucide-react';
import { useUSDCBalance, useWETHBalance, useLPBalance } from '@/hooks/useContracts';
import { useAccount } from 'wagmi';

export default function PortfolioPage() {
  const { isConnected } = useAccount();
  const { balance: usdcBalance, isLoading: usdcLoading } = useUSDCBalance();
  const { balance: wethBalance, isLoading: wethLoading } = useWETHBalance();
  const { balance: lpBalance, isLoading: lpLoading } = useLPBalance();

  const isLoading = usdcLoading || wethLoading || lpLoading;

  const usdc = parseFloat(usdcBalance) || 0;
  const weth = parseFloat(wethBalance) || 0;
  const lp   = parseFloat(lpBalance)   || 0;

  // Count non-zero token balances as "active positions"
  const activePositions = (usdc > 0 ? 1 : 0) + (weth > 0 ? 1 : 0) + (lp > 0 ? 1 : 0);

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtToken = (n: number, dec = 4) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: dec });

  const portfolioStats = [
    {
      label: 'USDC Balance',
      value: isLoading || !isConnected ? '—' : `${fmt(usdc)}`,
      change: 'Wallet · live',
      icon: DollarSign,
    },
    {
      label: 'WETH Balance',
      value: isLoading || !isConnected ? '—' : `${fmtToken(weth)} WETH`,
      change: 'Wallet · live',
      icon: TrendingUp,
    },
    {
      label: 'LP Token Balance',
      value: isLoading || !isConnected ? '—' : `${fmtToken(lp)} zapLP`,
      change: 'Pool position',
      icon: ArrowUpRight,
    },
    {
      label: 'Active Positions',
      value: isLoading || !isConnected ? '—' : String(activePositions),
      change: 'Non-zero tokens',
      icon: Wallet,
    },
  ];

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
                        <div className="flex items-center gap-1 text-xs font-medium text-green-400">
                          <ArrowUpRight className="w-3 h-3" />
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
