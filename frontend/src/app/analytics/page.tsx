'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useTotalTVL, useZapStats, useLPTotalSupply } from '@/hooks/useContracts';
import { VAULTS, formatAmount } from '@/lib/config';
import { BarChart2, TrendingUp, Zap, Layers, RefreshCw, Database } from 'lucide-react';

// custom tooltip shared styles
const tooltipStyle = {
  backgroundColor: '#0f0f14',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 13,
};

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { totalTvlUsd, usdcTvl, wethTvl, isLoading: tvlLoading } = useTotalTVL();
  const { stats, isLoading: statsLoading } = useZapStats();
  const { totalSupply, isLoading: lpLoading } = useLPTotalSupply();

  const isLoading = tvlLoading || statsLoading || lpLoading;

  const usdcTvlNum = parseFloat(usdcTvl) || 0;
  const wethTvlUsd = (parseFloat(wethTvl) || 0) * 2000;
  const totalVolume = parseFloat(stats?.totalVolume ?? '0') || 0;

  const vaultApyData = VAULTS.map((v) => ({
    name: v.name.replace('VortexFi ', '').replace(' Vault', ''),
    apy: v.apy,
    risk: v.risk,
  }));

  const tvlPieData = [
    { name: 'USDC', value: usdcTvlNum, color: '#22c55e' },
    { name: 'WETH (×$2k)', value: wethTvlUsd, color: '#3b82f6' },
  ];

  // summary stat cards
  const statCards = [
    {
      label: 'Total Value Locked',
      value: isLoading ? '…' : `$${formatAmount(totalTvlUsd)}`,
      sub: 'USDC + WETH pool',
      icon: Layers,
      color: 'purple',
    },
    {
      label: 'Total Volume',
      value: statsLoading ? '…' : `$${formatAmount(parseFloat(stats?.totalVolume ?? '0'))}`,
      sub: 'All-time zap volume',
      icon: TrendingUp,
      color: 'cyan',
    },
    {
      label: 'Total Zaps',
      value: statsLoading ? '…' : (stats?.totalZaps ?? 0).toLocaleString(),
      sub: 'Cross-chain zap txns',
      icon: Zap,
      color: 'yellow',
    },
    {
      label: 'LP Total Supply',
      value: lpLoading ? '…' : parseFloat(totalSupply).toLocaleString('en-US', { maximumFractionDigits: 2 }),
      sub: 'zapLP outstanding',
      icon: BarChart2,
      color: 'pink',
    },
  ];

  const colorMap: Record<string, string> = {
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    cyan:   'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    pink:   'text-pink-400 bg-pink-500/10 border-pink-500/20',
  };

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
          <div className="max-w-7xl mx-auto mb-14 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6"
            >
              <BarChart2 className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-400 font-medium">Protocol Analytics</span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="text-white">Protocol </span>
              <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Analytics
              </span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Live on-chain stats for the VortexFi protocol on Polygon Amoy.
            </p>
            {isLoading && (
              <div className="flex items-center justify-center gap-2 mt-4 text-gray-500 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Fetching live data…
              </div>
            )}
          </div>

          <div className="max-w-7xl mx-auto space-y-10">

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statCards.map((card, i) => {
                const Icon = card.icon;
                const cls = colorMap[card.color];
                return (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${cls}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-0.5">{card.value}</div>
                    <div className="text-xs text-gray-500">{card.label}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{card.sub}</div>
                  </motion.div>
                );
              })}
            </div>

            {/* ── Live TVL Snapshot ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Total Value Locked</h2>
                  <p className="text-xs text-gray-500">Live on-chain pool balances · updated every block</p>
                </div>
                <div className="text-2xl font-bold text-purple-400">
                  {isLoading ? '…' : `$${formatAmount(totalTvlUsd)}`}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total TVL */}
                <div className="p-5 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex flex-col gap-2">
                  <div className="text-xs text-gray-400">Total TVL (USD)</div>
                  <div className="text-3xl font-bold text-purple-400">
                    {tvlLoading ? '…' : `$${formatAmount(totalTvlUsd)}`}
                  </div>
                  <div className="text-xs text-gray-500">USDC + WETH combined</div>
                </div>
                {/* USDC */}
                <div className="p-5 bg-green-500/10 border border-green-500/20 rounded-2xl flex flex-col gap-2">
                  <div className="text-xs text-gray-400">USDC in Pool</div>
                  <div className="text-3xl font-bold text-green-400">
                    {tvlLoading ? '…' : formatAmount(usdcTvlNum)}
                  </div>
                  <div className="text-xs text-gray-500">Raw on-chain balance</div>
                </div>
                {/* WETH */}
                <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex flex-col gap-2">
                  <div className="text-xs text-gray-400">WETH in Pool</div>
                  <div className="text-3xl font-bold text-blue-400">
                    {tvlLoading ? '…' : `${parseFloat(wethTvl).toFixed(4)} WETH`}
                  </div>
                  <div className="text-xs text-gray-500">≈ ${tvlLoading ? '…' : formatAmount(wethTvlUsd)} USD</div>
                </div>
              </div>

              {/* TVL bar showing USDC vs WETH proportions */}
              {!tvlLoading && totalTvlUsd > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>USDC {totalTvlUsd > 0 ? ((usdcTvlNum / totalTvlUsd) * 100).toFixed(1) : 0}%</span>
                    <span>WETH {totalTvlUsd > 0 ? ((wethTvlUsd / totalTvlUsd) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden flex">
                    <div
                      className="h-full bg-green-500 transition-all duration-700"
                      style={{ width: `${totalTvlUsd > 0 ? (usdcTvlNum / totalTvlUsd) * 100 : 50}%` }}
                    />
                    <div className="h-full bg-blue-500 flex-1" />
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
                <Database className="w-3 h-3" />
                Historical charts require an on-chain indexer — showing live snapshot only
              </div>
            </motion.div>

            {/* ── Protocol Activity ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Protocol Activity</h2>
                  <p className="text-xs text-gray-500">All-time stats read directly from ZapSender contract</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex flex-col gap-2">
                  <div className="text-xs text-gray-400">All-Time Volume</div>
                  <div className="text-3xl font-bold text-cyan-400">
                    {statsLoading ? '…' : `$${formatAmount(totalVolume)}`}
                  </div>
                  <div className="text-xs text-gray-500">Cumulative zap volume (USDC)</div>
                </div>
                <div className="p-5 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex flex-col gap-2">
                  <div className="text-xs text-gray-400">Total Zap Transactions</div>
                  <div className="text-3xl font-bold text-yellow-400">
                    {statsLoading ? '…' : (stats?.totalZaps ?? 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Cross-chain zaps executed</div>
                </div>
                <div className="p-5 bg-pink-500/10 border border-pink-500/20 rounded-2xl flex flex-col gap-2">
                  <div className="text-xs text-gray-400">zapLP Total Supply</div>
                  <div className="text-3xl font-bold text-pink-400">
                    {lpLoading ? '…' : parseFloat(totalSupply).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-gray-500">LP tokens outstanding</div>
                </div>
              </div>

              {/* Avg volume per zap */}
              {!statsLoading && (stats?.totalZaps ?? 0) > 0 && (
                <div className="mt-4 p-4 bg-white/5 rounded-xl flex items-center justify-between text-sm">
                  <span className="text-gray-400">Average volume per zap</span>
                  <span className="font-bold text-white">
                    ${formatAmount(totalVolume / (stats?.totalZaps ?? 1))} USDC
                  </span>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
                <Database className="w-3 h-3" />
                Per-day breakdown requires an on-chain indexer — showing cumulative totals only
              </div>
            </motion.div>

            {/* ── APY + Pie side-by-side ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Vault APY Comparison */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <h2 className="text-lg font-bold text-white mb-1">Vault APY Comparison</h2>
                <p className="text-xs text-gray-500 mb-6">Annualised yield across all strategies</p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={vaultApyData} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#d1d5db', fontSize: 11 }} tickLine={false} axisLine={false} width={110} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${Number(v ?? 0)}%`, 'APY']} />
                    <Bar dataKey="apy" radius={[0, 6, 6, 0]}>
                      {vaultApyData.map((entry, i) => {
                        const riskColor = entry.risk === 'Low' ? '#22c55e' : entry.risk === 'Medium' ? '#f59e0b' : '#ef4444';
                        return <Cell key={i} fill={riskColor} fillOpacity={0.85} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Low risk</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Medium risk</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> High risk</span>
                </div>
              </motion.div>

              {/* TVL Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <h2 className="text-lg font-bold text-white mb-1">TVL Distribution</h2>
                <p className="text-xs text-gray-500 mb-6">Asset breakdown in the pool (live)</p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={tvlPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {tvlPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => { const n = Number(v ?? 0); return [`$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, '']; }} />
                    <Legend formatter={(value) => <span style={{ color: '#9ca3af', fontSize: 13 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Live numbers */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div className="text-xs text-gray-400 mb-1">USDC in Pool</div>
                    <div className="font-bold text-green-400">{tvlLoading ? '…' : formatAmount(usdcTvlNum)} USDC</div>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <div className="text-xs text-gray-400 mb-1">WETH in Pool</div>
                    <div className="font-bold text-blue-400">{tvlLoading ? '…' : parseFloat(wethTvl).toFixed(4)} WETH</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── Protocol Fee Info ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <h2 className="text-lg font-bold text-white mb-4">Protocol Parameters</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="text-gray-400 mb-1">Zap Fee</div>
                  <div className="font-bold text-white">
                    {statsLoading ? '…' : `${((stats?.feeBps ?? 0) / 100).toFixed(2)}%`}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{stats?.feeBps ?? 0} bps</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="text-gray-400 mb-1">Bridge</div>
                  <div className="font-bold text-white">Polygon LxLy</div>
                  <div className="text-xs text-gray-600 mt-1">v2 Bridge</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="text-gray-400 mb-1">Network</div>
                  <div className="font-bold text-white">Polygon Amoy</div>
                  <div className="text-xs text-gray-600 mt-1">Chain ID 80002</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="text-gray-400 mb-1">LP Token</div>
                  <div className="font-bold text-white">zapLP</div>
                  <div className="text-xs text-gray-600 mt-1">ERC-20, 18 dec</div>
                </div>
              </div>
            </motion.div>

          </div>
        </motion.div>

        <Footer />
      </div>
    </main>
  );
}
