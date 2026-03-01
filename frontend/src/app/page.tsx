'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Hero } from '@/components/sections/Hero';
import { Stats } from '@/components/sections/Stats';
import { Footer } from '@/components/layout/Footer';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import Link from 'next/link';
import { ArrowRight, Wallet, PieChart, BookOpen, History, Zap, Shield, Coins, BarChart2, GitBranch } from 'lucide-react';

const features = [
  {
    icon: Wallet,
    title: 'Vaults',
    description: 'Explore high-yield vaults across multiple chains with one-click deposits',
    href: '/vaults',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: PieChart,
    title: 'Portfolio',
    description: 'Track your cross-chain positions and earnings in real-time',
    href: '/portfolio',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    icon: History,
    title: 'History',
    description: 'View all your cross-chain transactions and bridge activities',
    href: '/history',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: BookOpen,
    title: 'How It Works',
    description: 'Learn about AggLayer technology and our chainless approach',
    href: '/how-it-works',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    icon: BarChart2,
    title: 'Analytics',
    description: 'Live protocol stats, TVL charts, volume history and vault APY comparison',
    href: '/analytics',
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    icon: GitBranch,
    title: 'Bridge',
    description: 'Track cross-chain message flows and your bridge transaction history',
    href: '/bridge',
    gradient: 'from-blue-500 to-cyan-500',
  },
];

const benefits = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Cross-chain transactions in seconds, not minutes',
  },
  {
    icon: Shield,
    title: 'Secure by Design',
    description: 'Battle-tested smart contracts with multi-sig protection',
  },
  {
    icon: Coins,
    title: 'Best Yields',
    description: 'Aggregated yields from top protocols across all chains',
  },
];

export default function Home() {
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
        >
          <Hero />
          <Stats />

          {/* Feature Cards Section */}
          <section className="py-20 px-4">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                    Explore VortexFi
                  </span>
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Everything you need for chainless DeFi, all in one place
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link href={feature.href}>
                      <motion.div
                        whileHover={{ scale: 1.02, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative h-full p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden"
                      >
                        {/* Gradient background on hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                        
                        {/* Icon */}
                        <div className={`relative w-14 h-14 mb-4 rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5`}>
                          <div className="w-full h-full rounded-xl bg-gray-900 flex items-center justify-center">
                            <feature.icon className="w-7 h-7 text-white" />
                          </div>
                        </div>

                        {/* Content */}
                        <h3 className="relative text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 group-hover:bg-clip-text transition-all">
                          {feature.title}
                        </h3>
                        <p className="relative text-gray-400 text-sm mb-4">
                          {feature.description}
                        </p>

                        {/* Arrow */}
                        <div className="relative flex items-center gap-2 text-sm font-medium text-gray-500 group-hover:text-white transition-colors">
                          <span>Explore</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>

                        {/* Shine effect */}
                        <motion.div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100"
                          initial={{ x: '-100%' }}
                          whileHover={{ x: '100%' }}
                          transition={{ duration: 0.6 }}
                          style={{
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                          }}
                        />
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="py-20 px-4 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent" />
            <div className="max-w-7xl mx-auto relative">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  <span className="text-white">Why Choose </span>
                  <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    VortexFi?
                  </span>
                </h2>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="relative p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 text-center"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center"
                    >
                      <benefit.icon className="w-8 h-8 text-purple-400" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                    <p className="text-gray-400">{benefit.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative p-12 rounded-3xl overflow-hidden"
              >
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20" />
                <div className="absolute inset-0 backdrop-blur-xl" />
                <motion.div
                  className="absolute inset-0 opacity-30"
                  animate={{
                    background: [
                      'radial-gradient(circle at 0% 0%, #8b5cf6 0%, transparent 50%)',
                      'radial-gradient(circle at 100% 100%, #06b6d4 0%, transparent 50%)',
                      'radial-gradient(circle at 0% 0%, #8b5cf6 0%, transparent 50%)',
                    ],
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                />

                {/* Content */}
                <div className="relative text-center">
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Ready to Go Chainless?
                  </h2>
                  <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                    Start earning cross-chain yields with just one click. No bridges, no complexity.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/vaults">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-bold text-white shadow-lg shadow-purple-500/25"
                      >
                        Launch App
                      </motion.button>
                    </Link>
                    <Link href="/how-it-works">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-white border border-white/20 transition-colors"
                      >
                        Learn More
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          <Footer />
        </motion.div>
      </div>
    </main>
  );
}
