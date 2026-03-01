'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { BookOpen, Layers, Zap, Shield, Globe, ArrowRight, Code, CheckCircle } from 'lucide-react';

const techFeatures = [
  {
    icon: Layers,
    title: 'AggLayer Technology',
    description: 'Polygon\'s unified liquidity layer that connects all chains into one seamless network.',
  },
  {
    icon: Zap,
    title: 'Instant Finality',
    description: 'Cross-chain transactions complete in seconds with cryptographic proof verification.',
  },
  {
    icon: Shield,
    title: 'Security First',
    description: 'Inherit the security of Ethereum through ZK proofs and multi-layer validation.',
  },
  {
    icon: Globe,
    title: 'Universal Access',
    description: 'Access any DeFi protocol on any chain with a single transaction.',
  },
];

const faqItems = [
  {
    question: 'What is VortexFi?',
    answer: 'VortexFi is a cross-chain DeFi adapter built on Polygon AggLayer. It allows you to deposit assets from any chain and earn yields across multiple networks without manual bridging.',
  },
  {
    question: 'How does bridgeAndCall work?',
    answer: 'bridgeAndCall is AggLayer\'s core primitive that combines bridging and contract execution in one atomic transaction. Your assets are bridged and immediately deposited into yield strategies.',
  },
  {
    question: 'Is VortexFi secure?',
    answer: 'Yes! VortexFi leverages AggLayer\'s ZK-proof security model. All cross-chain transactions are cryptographically verified, and our smart contracts are audited by leading security firms.',
  },
  {
    question: 'What chains are supported?',
    answer: 'Currently, we support Polygon PoS, Polygon zkEVM, and other AggLayer-connected chains. More chains are being added as they integrate with AggLayer.',
  },
  {
    question: 'Are there any fees?',
    answer: 'VortexFi charges a small protocol fee (0.1%) on yields earned. There are no deposit or withdrawal fees. You only pay standard gas fees for transactions.',
  },
];

export default function HowItWorksPage() {
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6"
                >
                  <BookOpen className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-orange-400 font-medium">Documentation</span>
                </motion.div>
                
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  <span className="text-white">How </span>
                  <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
                    It Works
                  </span>
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Learn about the technology powering chainless DeFi and how VortexFi simplifies cross-chain yield farming.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Tech Features */}
          <section className="px-4 py-12">
            <div className="max-w-7xl mx-auto">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl font-bold text-center mb-12"
              >
                <span className="text-white">Powered by </span>
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  AggLayer
                </span>
              </motion.h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {techFeatures.map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-all"
                  >
                    <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-orange-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works Component */}
          <HowItWorks />

          {/* Architecture Diagram */}
          <section className="px-4 py-16">
            <div className="max-w-5xl mx-auto">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl font-bold text-center mb-12"
              >
                <span className="text-white">System </span>
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Architecture
                </span>
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative p-8 rounded-2xl bg-white/5 border border-white/10"
              >
                {/* Flow Diagram */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* User */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center p-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-2">
                      <span className="text-2xl">👤</span>
                    </div>
                    <span className="text-white font-medium">User</span>
                    <span className="text-gray-500 text-xs">Any Chain</span>
                  </motion.div>

                  <ArrowRight className="w-8 h-8 text-gray-600 hidden md:block" />

                  {/* ZapSender */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center p-4"
                  >
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-2">
                      <Code className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-white font-medium">ZapSender</span>
                    <span className="text-gray-500 text-xs">Source Chain</span>
                  </motion.div>

                  <ArrowRight className="w-8 h-8 text-gray-600 hidden md:block" />

                  {/* AggLayer */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center p-4"
                  >
                    <div className="w-20 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center mb-2">
                      <Layers className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-white font-medium">AggLayer</span>
                    <span className="text-gray-500 text-xs">Bridge + Call</span>
                  </motion.div>

                  <ArrowRight className="w-8 h-8 text-gray-600 hidden md:block" />

                  {/* ZapReceiver */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col items-center p-4"
                  >
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-2">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-white font-medium">ZapReceiver</span>
                    <span className="text-gray-500 text-xs">Dest Chain</span>
                  </motion.div>

                  <ArrowRight className="w-8 h-8 text-gray-600 hidden md:block" />

                  {/* Yield */}
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col items-center p-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mb-2">
                      <span className="text-2xl">💰</span>
                    </div>
                    <span className="text-white font-medium">Yield</span>
                    <span className="text-gray-500 text-xs">DeFi Protocols</span>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="px-4 py-16">
            <div className="max-w-3xl mx-auto">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl font-bold text-center mb-12"
              >
                <span className="text-white">Frequently Asked </span>
                <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Questions
                </span>
              </motion.h2>

              <div className="space-y-4">
                {faqItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-colors"
                  >
                    <h3 className="text-lg font-bold text-white mb-2">{item.question}</h3>
                    <p className="text-gray-400">{item.answer}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <Footer />
        </motion.div>
      </div>
    </main>
  );
}
