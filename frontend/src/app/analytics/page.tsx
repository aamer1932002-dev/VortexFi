'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useTotalTVL, useZapStats, useLPTotalSupply } from '@/hooks/useContracts';
import { VAULTS, formatAmount } from '@/lib/config';
import { BarChart2, TrendingUp, Zap, Layers, RefreshCw } from 'lucide-react';
import { useMemo } from 'react';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Build a simulated 30-day TVL series ending at `currentTvl` */
function buildTvlHistory(currentTvl: number) {
  const days = 30;
  const seed = 42;
  const result = [];
  // walk backwards: start from ~30 % of current value, trend up
  for (let i = 0; i < days; i++) {
    const progress = i / (days - 1);
    // pseudo-noise using sine waves (deterministic so it doesn't flicker)
    const noise = Math.sin(seed + i * 1.3) * 0.07 + Math.cos(seed + i * 0.9) * 0.04;
    const base = currentTvl * (0.3 + 0.7 * progress);
    const value = Math.max(0, base * (1 + noise));
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    result.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tvl: parseFloat(value.toFixed(2)),
    });
  }
  return result;
}

/** Build a simulated 30-day volume series */
function buildVolumeHistory(totalVolume: number) {
  const days = 30;
  const seed = 17;
  return Array.from({ length: days }, (_, i) => {
    const noise = (Math.sin(seed + i * 2.1) * 0.5 + 0.5); // 0–1
    const dayVol = (totalVolume / days) * (0.2 + noise * 1.6);
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volume: parseFloat(dayVol.toFixed(2)),
    };
  });
}

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

  const tvlHistory = useMemo(() => buildTvlHistory(totalTvlUsd || 10000), [totalTvlUsd]);
  const volumeHistory = useMemo(
    () => buildVolumeHistory(parseFloat(stats?.totalVolume ?? '0') || 5000),
    [stats?.totalVolume]
  );

  const vaultApyData = VAULTS.map((v) => ({
    name: v.name.replace('VortexFi ', '').replace(' Vault', ''),
    apy: v.apy,
    risk: v.risk,
  }));

  const tvlPieData = [
    { name: 'USDC', value: parseFloat(usdcTvl) || 0, color: '#22c55e' },
    { name: 'WETH (×$2k)', value: (parseFloat(wethTvl) || 0) * 2000, color: '#3b82f6' },
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

            {/* ── TVL Chart ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Total Value Locked</h2>
                  <p className="text-xs text-gray-500">30-day estimated trend · live endpoint = current value</p>
                </div>
                <div className="text-2xl font-bold text-purple-400">
                  ${isLoading ? '…' : formatAmount(totalTvlUsd)}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={tvlHistory} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
                  <defs>
                    <linearGradient id="tvlGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} interval={6} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => { const n = Number(v ?? 0); return [`$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, 'TVL']; }} />
                  <Area type="monotone" dataKey="tvl" stroke="#8b5cf6" strokeWidth={2} fill="url(#tvlGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* ── Volume Chart ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Daily Volume</h2>
                  <p className="text-xs text-gray-500">30-day estimated distribution of all-time volume</p>
                </div>
                <div className="text-2xl font-bold text-cyan-400">
                  ${statsLoading ? '…' : formatAmount(parseFloat(stats?.totalVolume ?? '0'))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={volumeHistory} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} interval={6} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => { const n = Number(v ?? 0); return [`$${n.toFixed(2)}`, 'Volume']; }} />
                  <Bar dataKey="volume" fill="url(#volGrad)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
                    <div className="font-bold text-green-400">{tvlLoading ? '…' : formatAmount(usdcTvl)} USDC</div>
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
