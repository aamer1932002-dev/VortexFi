'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Wallet, ArrowRight, Layers, CheckCircle2, Zap, X, Check, Clock, DollarSign, Sparkles, ChevronRight } from 'lucide-react';
import { useState, useRef } from 'react';

const steps = [
  {
    number: '01',
    title: 'Connect Wallet',
    description: 'Connect your wallet on any supported chain. We support Ethereum, Polygon, Arbitrum, and more.',
    icon: Wallet,
    color: 'from-purple-500 to-violet-500',
    delay: 0,
  },
  {
    number: '02',
    title: 'Choose Vault',
    description: 'Select a yield vault that matches your risk appetite. Compare APYs across all chains instantly.',
    icon: Layers,
    color: 'from-blue-500 to-cyan-500',
    delay: 0.1,
  },
  {
    number: '03',
    title: 'One-Click Zap',
    description: 'Click deposit. AggLayer handles bridging + depositing in a single atomic transaction.',
    icon: Zap,
    color: 'from-pink-500 to-rose-500',
    delay: 0.2,
  },
  {
    number: '04',
    title: 'Earn Yield',
    description: 'Your funds are now earning yield on the destination chain. Track everything from one dashboard.',
    icon: CheckCircle2,
    color: 'from-green-500 to-emerald-500',
    delay: 0.3,
  },
];

const oldWaySteps = [
  { text: 'Bridge to Ethereum', time: '5 min', cost: '$20' },
  { text: 'Wait for confirmation', time: '10 min', cost: '$0' },
  { text: 'Bridge to Destination', time: '10 min', cost: '$15' },
  { text: 'Swap tokens', time: '2 min', cost: '$5' },
  { text: 'Deposit into Protocol', time: '2 min', cost: '$5' },
];

export function HowItWorks() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const lineProgress = useTransform(scrollYProgress, [0.2, 0.8], [0, 1]);

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden" ref={containerRef}>
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[128px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-medium text-gray-300">Simple & Fast</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">VortexFi</span> Works
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Traditional cross-chain yield farming takes 5 transactions across 30 minutes.
            <span className="text-white font-medium"> VortexFi does it in one click.</span>
          </p>
        </motion.div>

        {/* Comparison Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24"
        >
          {/* Old Way */}
          <div className="relative group">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-red-500/50 to-orange-500/50 rounded-2xl blur-sm opacity-50" />
            <div className="relative bg-gradient-to-b from-red-900/20 to-black/80 backdrop-blur-xl rounded-2xl p-8 border border-red-500/20 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-500/20 rounded-xl">
                  <X className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-red-400">The Old Way</h3>
              </div>
              
              <div className="space-y-4">
                {oldWaySteps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center justify-between p-3 bg-red-500/5 rounded-xl border border-red-500/10"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-red-400/60 font-mono w-6">{i + 1}.</span>
                      <span className="text-gray-400 line-through text-sm">{step.text}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-red-400/60">
                        <Clock className="w-3 h-3" />
                        {step.time}
                      </span>
                      <span className="flex items-center gap-1 text-red-400/60">
                        <DollarSign className="w-3 h-3" />
                        {step.cost}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-red-500/20 flex items-center justify-between">
                <span className="text-gray-500 text-sm">Total</span>
                <div className="text-right">
                  <p className="text-red-400 font-bold text-lg">~30 minutes</p>
                  <p className="text-red-400/60 text-sm">$45+ in fees</p>
                </div>
              </div>
            </div>
          </div>

          {/* VortexFi Way */}
          <div className="relative group">
            <motion.div
              className="absolute -inset-[1px] bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 rounded-2xl blur-sm"
              animate={{
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="relative bg-gradient-to-b from-green-900/20 to-black/80 backdrop-blur-xl rounded-2xl p-8 border border-green-500/20 h-full">
              <div className="flex items-center gap-3 mb-6">
                <motion.div 
                  className="p-2 bg-green-500/20 rounded-xl"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                >
                  <Zap className="w-5 h-5 text-green-400" />
                </motion.div>
                <h3 className="text-xl font-semibold text-green-400">The VortexFi Way</h3>
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="ml-auto px-3 py-1 bg-green-500/20 rounded-full text-green-400 text-xs font-bold"
                >
                  RECOMMENDED
                </motion.span>
              </div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 p-6 bg-gradient-to-r from-green-500/10 to-cyan-500/10 rounded-xl border border-green-500/20"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">Click "Deposit"</p>
                  <p className="text-green-400/60 text-sm">That's it. Really.</p>
                </div>
              </motion.div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                {[
                  { label: 'Bridging', status: 'Automatic' },
                  { label: 'Swapping', status: 'Automatic' },
                  { label: 'Depositing', status: 'Automatic' },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="text-center p-3 bg-white/5 rounded-xl"
                  >
                    <Check className="w-4 h-4 text-green-400 mx-auto mb-1" />
                    <p className="text-gray-500 text-xs">{item.label}</p>
                    <p className="text-green-400 text-xs font-medium">{item.status}</p>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-green-500/20 flex items-center justify-between">
                <span className="text-gray-500 text-sm">Total</span>
                <div className="text-right">
                  <p className="text-green-400 font-bold text-lg">~30 seconds</p>
                  <p className="text-green-400/60 text-sm">0.1% fee</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Steps Timeline */}
        <div className="relative">
          {/* Animated Progress Line */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-white/5 rounded-full">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full"
              style={{ scaleX: lineProgress, originX: 0 }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: step.delay }}
                onHoverStart={() => setHoveredStep(index)}
                onHoverEnd={() => setHoveredStep(null)}
                className="relative"
              >
                {/* Connection dot for timeline */}
                <div className="hidden lg:flex absolute top-24 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <motion.div
                    className={`w-4 h-4 rounded-full bg-gradient-to-r ${step.color} border-4 border-black`}
                    animate={{
                      scale: hoveredStep === index ? 1.5 : 1,
                    }}
                  />
                </div>

                {/* Card */}
                <motion.div
                  className="relative h-full"
                  whileHover={{ y: -10 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  {/* Glow */}
                  <motion.div
                    className={`absolute -inset-[1px] bg-gradient-to-r ${step.color} rounded-2xl blur-sm opacity-0`}
                    animate={{ opacity: hoveredStep === index ? 0.5 : 0 }}
                  />

                  <div className="relative bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/10 h-full">
                    {/* Number Badge */}
                    <div className="absolute -top-4 -left-4">
                      <motion.div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-sm font-bold text-white shadow-lg`}
                        animate={{
                          rotate: hoveredStep === index ? [0, -10, 10, 0] : 0,
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        {step.number}
                      </motion.div>
                    </div>

                    {/* Icon */}
                    <motion.div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} bg-opacity-20 flex items-center justify-center mb-4 mt-4`}
                      animate={{
                        scale: hoveredStep === index ? 1.1 : 1,
                        rotate: hoveredStep === index ? 5 : 0,
                      }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <step.icon className="w-8 h-8 text-white" />
                    </motion.div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>

                    {/* Learn More */}
                    <motion.div
                      className="mt-4 flex items-center gap-1 text-purple-400 text-sm font-medium opacity-0 group-hover:opacity-100"
                      animate={{ opacity: hoveredStep === index ? 1 : 0 }}
                    >
                      Learn more
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Arrow (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <motion.div
                      animate={{
                        x: [0, 5, 0],
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-8 h-8 text-gray-600" />
                    </motion.div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-20 text-center"
        >
          <p className="text-gray-500 text-sm mb-6">Powered by cutting-edge technology</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {['Polygon AggLayer', 'Unified Bridge', 'bridgeAndCall()', 'ZK Proofs'].map((tech, i) => (
              <motion.div
                key={tech}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="px-5 py-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-purple-500/30 transition-colors"
              >
                <span className="text-gray-300 font-mono text-sm">{tech}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
