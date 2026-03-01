'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { useZapStats } from '@/hooks/useContracts';
import { CONTRACTS, getExplorerUrl } from '@/lib/config';
import { GitBranch, Zap, ArrowRight, ExternalLink, RefreshCw, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import type { Transaction } from '@/components/TransactionHistory';

// ─── Bridge Flow Diagram ───────────────────────────────────────────────────────

function FlowNode({ label, sub, color, delay }: { label: string; sub: string; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 180 }}
      className={`relative flex flex-col items-center justify-center w-36 h-20 rounded-2xl border text-center px-2 ${color}`}
    >
      {/* pulsing ring */}
      <motion.div
        className={`absolute inset-0 rounded-2xl ${color}`}
        animate={{ opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 2.5, repeat: Infinity, delay }}
      />
      <div className="relative font-bold text-sm text-white">{label}</div>
      <div className="relative text-xs text-gray-400 mt-0.5">{sub}</div>
    </motion.div>
  );
}

function FlowArrow({ delay, label }: { delay: number; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 mx-1">
      {label && <div className="text-xs text-gray-500 whitespace-nowrap">{label}</div>}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay }}
        className="flex items-center gap-0.5"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 1, 0.2], x: [0, 4, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          >
            <ArrowRight className="w-4 h-4 text-purple-400" />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Tx Status Badge ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Transaction['status'] }) {
  const map = {
    completed: { cls: 'bg-green-500/15 text-green-400 border-green-500/30', icon: <CheckCircle2 className="w-3 h-3" />, label: 'Completed' },
    pending:   { cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: <Clock className="w-3 h-3" />, label: 'Pending' },
    bridging:  { cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: <RefreshCw className="w-3 h-3 animate-spin" />, label: 'Bridging' },
    failed:    { cls: 'bg-red-500/15 text-red-400 border-red-500/30', icon: <AlertCircle className="w-3 h-3" />, label: 'Failed' },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BridgePage() {
  const { address } = useAccount();
  const { stats, isLoading: statsLoading, refetch } = useZapStats();
  const [bridgeTxs, setBridgeTxs] = useState<Transaction[]>([]);

  // Load bridge/deposit transactions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('vortexfi_transactions');
      if (stored) {
        const all: Transaction[] = JSON.parse(stored);
        const relevant = address
          ? all.filter((tx) => !tx.walletAddress || tx.walletAddress.toLowerCase() === address.toLowerCase())
          : all;
        setBridgeTxs(relevant.slice(0, 10));
      }
    } catch {}
  }, [address]);

  const stepContracts = [
    { label: 'ZapSender', addr: CONTRACTS.ZapSender, color: 'bg-purple-500/10 border-purple-500/20 text-purple-400', desc: 'Accepts user deposit, encodes cross-chain message' },
    { label: 'PolygonBridge', addr: CONTRACTS.Bridge, color: 'bg-blue-500/10 border-blue-500/20 text-blue-400', desc: 'Polygon LxLy Bridge v2 – message relay between chains' },
    { label: 'ZapReceiver', addr: CONTRACTS.ZapReceiver, color: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400', desc: 'Decodes message, deposits into pool, mints LP' },
    { label: 'MockPool', addr: CONTRACTS.MockPool, color: 'bg-green-500/10 border-green-500/20 text-green-400', desc: 'AMM pool that issues zapLP tokens proportional to deposit' },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden">
      <ParticleBackground />
      <div className="fixed inset-0 bg-hero-glow pointer-events-none" />

      <div className="relative z-10">
        <Header />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="pt-32 pb-20 px-4"
        >
          {/* ── Page Header ── */}
          <div className="max-w-5xl mx-auto mb-14 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6"
            >
              <GitBranch className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">Cross-Chain Bridge</span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="text-white">Bridge </span>
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Explorer
              </span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Follow the cross-chain flow powered by Polygon's LxLy Bridge — from your wallet to yield, trustlessly.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-10">

            {/* ── Live Stats ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Total Zaps', value: statsLoading ? '…' : (stats?.totalZaps ?? 0).toLocaleString(), icon: Zap, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
                { label: 'Total Zap Volume', value: statsLoading ? '…' : `$${parseFloat(stats?.totalVolume ?? '0').toLocaleString('en-US', { maximumFractionDigits: 2 })}`, icon: GitBranch, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
                { label: 'Protocol Fee', value: statsLoading ? '…' : `${((stats?.feeBps ?? 0) / 100).toFixed(2)}%`, icon: CheckCircle2, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl"
                  >
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${card.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-white">{card.value}</div>
                      <div className="text-xs text-gray-500">{card.label}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* ── Animated Flow Diagram ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}  
              viewport={{ once: true }}
              className="bg-white/5 border border-white/10 rounded-2xl p-8"
            >
              <h2 className="text-lg font-bold text-white mb-2">Cross-Chain Flow</h2>
              <p className="text-xs text-gray-500 mb-8">How your deposit travels from wallet to yield-bearing position</p>

              {/* Flow nodes – horizontal scroll on mobile */}
              <div className="overflow-x-auto pb-2">
                <div className="flex items-center gap-0 min-w-max mx-auto w-fit">
                  <div className="flex flex-col items-center gap-1">
                    <FlowNode label="Your Wallet" sub="Source" color="bg-white/5 border-white/15" delay={0} />
                    <span className="text-xs text-gray-600">approve + deposit()</span>
                  </div>
                  <FlowArrow delay={0.1} label="call" />
                  <div className="flex flex-col items-center gap-1">
                    <FlowNode label="ZapSender" sub="Polygon Amoy" color="bg-purple-500/10 border-purple-500/30" delay={0.15} />
                    <span className="text-xs text-gray-600">zapAndBridge()</span>
                  </div>
                  <FlowArrow delay={0.25} label="bridgeMessage" />
                  <div className="flex flex-col items-center gap-1">
                    <FlowNode label="LxLy Bridge" sub="Polygon v2" color="bg-blue-500/10 border-blue-500/30" delay={0.3} />
                    <span className="text-xs text-gray-600">relay ~1–5 min</span>
                  </div>
                  <FlowArrow delay={0.4} label="claimMessage" />
                  <div className="flex flex-col items-center gap-1">
                    <FlowNode label="ZapReceiver" sub="Destination" color="bg-cyan-500/10 border-cyan-500/30" delay={0.45} />
                    <span className="text-xs text-gray-600">onMessageReceived()</span>
                  </div>
                  <FlowArrow delay={0.55} label="deposit()" />
                  <div className="flex flex-col items-center gap-1">
                    <FlowNode label="MockPool" sub="AMM" color="bg-green-500/10 border-green-500/30" delay={0.6} />
                    <span className="text-xs text-gray-600">mint zapLP</span>
                  </div>
                  <FlowArrow delay={0.7} label="transfer" />
                  <div className="flex flex-col items-center gap-1">
                    <FlowNode label="Your Wallet" sub="Destination" color="bg-white/5 border-white/15" delay={0.75} />
                    <span className="text-xs text-gray-600">zapLP received ✓</span>
                  </div>
                </div>
              </div>

              {/* Timing info */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                {[
                  { step: '1. Approve & Zap', time: '~30 sec', desc: 'Token approval + ZapSender call on source chain' },
                  { step: '2. Bridge Relay', time: '1–5 min', desc: 'Polygon LxLy message relay between networks' },
                  { step: '3. Receive LP', time: '~30 sec', desc: 'ZapReceiver deposits and mints zapLP to user' },
                ].map((item) => (
                  <div key={item.step} className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white">{item.step}</span>
                      <span className="text-xs text-purple-400 font-mono">{item.time}</span>
                    </div>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Contract Pipeline ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <h2 className="text-lg font-bold text-white mb-6">Contract Pipeline</h2>
              <div className="space-y-3">
                {stepContracts.map((c, i) => (
                  <div key={c.label} className="flex items-center gap-4">
                    {/* step number */}
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold ${c.color}`}>
                      {i + 1}
                    </div>
                    {/* info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-mono text-sm font-bold ${c.color.split(' ').find(cl => cl.startsWith('text-'))}`}>{c.label}</span>
                        <a
                          href={getExplorerUrl(c.addr)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          {c.addr.slice(0, 8)}…{c.addr.slice(-6)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
                    </div>
                    {/* connector line */}
                    {i < stepContracts.length - 1 && (
                      <div className="hidden md:flex items-center">
                        <ArrowRight className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Recent Bridge Transactions ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Recent Bridge Transactions</h2>
                  <p className="text-xs text-gray-500">
                    {address ? `Showing transactions for ${address.slice(0,6)}…${address.slice(-4)}` : 'Connect wallet to filter by address'}
                  </p>
                </div>
                <button
                  onClick={() => refetch()}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              <AnimatePresence>
                {bridgeTxs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No bridge transactions yet.</p>
                    <p className="text-xs mt-1">Deposit into a vault to see your cross-chain activity here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bridgeTxs.map((tx, i) => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex flex-wrap items-center gap-3 p-4 bg-white/5 hover:bg-white/[0.07] border border-white/10 rounded-xl transition-colors"
                      >
                        <div className="text-xl flex-shrink-0">
                          {tx.type === 'deposit' ? '📥' : tx.type === 'withdraw' ? '📤' : '🌉'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-white capitalize text-sm">{tx.type}</span>
                            <span className="text-gray-400 text-sm">{tx.amount} {tx.token}</span>
                            {tx.vault && <span className="text-xs text-gray-500">{tx.vault}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                            <span>{tx.sourceChain} → {tx.destChain}</span>
                            <span>·</span>
                            <span>{new Date(tx.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={tx.status} />
                          {tx.txHash && (
                            <a
                              href={`https://amoy.polygonscan.com/tx/${tx.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                            >
                              View <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ── Explorer Links ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <a
                href="https://amoy.polygonscan.com/address/0xE78E6788807c8C3Dbf3d06711d8C525a3C04C474"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-5 bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-purple-500/30 rounded-2xl transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                  📤
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white mb-0.5">ZapSender on Explorer</div>
                  <div className="text-xs text-gray-400">View all outbound zap transactions</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" />
              </a>

              <a
                href="https://amoy.polygonscan.com/address/0x9AB03AeefC2740C6a704d4640504F68A1b3a8565"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-5 bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/30 rounded-2xl transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                  📥
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white mb-0.5">ZapReceiver on Explorer</div>
                  <div className="text-xs text-gray-400">View all inbound message receipts</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
              </a>
            </motion.div>

          </div>
        </motion.div>

        <Footer />
      </div>
    </main>
  );
}
