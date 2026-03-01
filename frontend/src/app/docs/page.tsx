'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import {
  BookOpen,
  Zap,
  Shield,
  GitBranch,
  Coins,
  ArrowRight,
  ExternalLink,
  Code2,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { CONTRACTS, getExplorerUrl } from '@/lib/config';

const sections = [
  {
    id: 'overview',
    icon: BookOpen,
    title: 'Overview',
    color: 'purple',
    content: (
      <div className="space-y-3 text-gray-300 leading-relaxed">
        <p>
          <strong className="text-white">VortexFi</strong> is a cross-chain DeFi yield aggregator deployed on{' '}
          <strong className="text-purple-400">Polygon Amoy</strong> (zkEVM testnet). It allows users to deposit
          assets into automatically managed yield strategies while bridging liquidity across chains via the
          Polygon zkEVM Bridge.
        </p>
        <p>
          The protocol consists of a <em>ZapSender</em> on the source chain, a <em>ZapReceiver</em> on the
          destination chain, and a set of modular vault strategies — each optimised for a different risk/return
          profile.
        </p>
      </div>
    ),
  },
  {
    id: 'architecture',
    icon: Layers,
    title: 'Architecture',
    color: 'blue',
    content: (
      <div className="space-y-4">
        <p className="text-gray-300 leading-relaxed">
          VortexFi is composed of the following on-chain components:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: 'ZapSender', desc: 'Accepts user funds, encodes a cross-chain message, and forwards it through the Polygon zkEVM Bridge.' },
            { name: 'ZapReceiver', desc: 'Receives the bridged message, decodes it, and deposits funds into the target MockPool on behalf of the user.' },
            { name: 'MockPool', desc: 'A simulated AMM pool that mints LP tokens proportional to the deposited asset value.' },
            { name: 'VaultFactory', desc: 'Deploys and registers new strategy vaults. Supports multiple vault archetypes.' },
            { name: 'BaseVaultStrategy', desc: 'Abstract base contract inherited by all vault strategies. Manages deposit/withdraw logic and access control.' },
            { name: 'StableYieldVault', desc: 'Low-risk strategy: deposits into stablecoin pools to earn steady, predictable yield.' },
            { name: 'LiquidStakingVault', desc: 'Medium-risk strategy: wraps liquid staking tokens (stETH / rETH) to capture staking rewards.' },
          ].map((item) => (
            <div key={item.name} className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="font-mono text-sm text-cyan-400 mb-1">{item.name}</div>
              <div className="text-xs text-gray-400">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'vaults',
    icon: Coins,
    title: 'Vault Strategies',
    color: 'green',
    content: (
      <div className="space-y-4 text-gray-300">
        <p className="leading-relaxed">
          Each vault strategy is an isolated smart contract that targets a specific yield source. Vaults are
          non-custodial — the user always retains ownership of their LP tokens.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-2 pr-4 text-gray-400 font-medium">Vault</th>
                <th className="pb-2 pr-4 text-gray-400 font-medium">Risk</th>
                <th className="pb-2 text-gray-400 font-medium">Strategy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                ['Stable Yield', 'Low', 'Stablecoin pools (USDC/DAI/USDT)'],
                ['Liquid Staking', 'Low–Med', 'stETH / rETH wrapping'],
                ['Leveraged Yield', 'High', 'Recursive borrow–deposit on lending protocols'],
                ['Delta Neutral', 'Med', 'Hedge directional exposure via perp shorts'],
                ['Options Vault', 'Med–High', 'Sells covered calls / cash-secured puts for premium'],
              ].map(([vault, risk, strategy]) => (
                <tr key={vault}>
                  <td className="py-2 pr-4 font-medium text-white">{vault}</td>
                  <td className="py-2 pr-4 text-yellow-400">{risk}</td>
                  <td className="py-2 text-gray-400">{strategy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: 'how-to-use',
    icon: Zap,
    title: 'How to Use',
    color: 'yellow',
    content: (
      <ol className="space-y-4 text-gray-300">
        {[
          ['Get Testnet MATIC', 'Visit the Polygon Amoy faucet (faucet.polygon.technology) and request test MATIC for gas fees.'],
          ['Connect your wallet', 'Click "Connect Wallet" in the header and choose MetaMask or any WalletConnect-compatible wallet. Switch to Polygon Amoy (Chain ID 80002).'],
          ['Mint test tokens', 'Go to the Portfolio page and click "+1000" next to USDC or "+1" next to WETH to mint testnet tokens.'],
          ['Select a vault', 'Navigate to the Vaults page, browse the available strategies, and click a vault card to open the deposit modal.'],
          ['Deposit', 'Enter the amount, approve the token (first-time only), then click Deposit. Your transaction is sent cross-chain via the Polygon zkEVM Bridge.'],
          ['Track positions', 'Open the Portfolio page to view live balances and pool TVL. Open the History page to see all past transactions.'],
          ['Withdraw', 'In the Portfolio page, enter the LP amount you wish to redeem and click Withdraw LP Tokens.'],
        ].map(([title, desc], i) => (
          <li key={title} className="flex gap-4">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400 text-sm font-bold">
              {i + 1}
            </div>
            <div>
              <div className="font-medium text-white mb-0.5">{title}</div>
              <div className="text-sm text-gray-400">{desc}</div>
            </div>
          </li>
        ))}
      </ol>
    ),
  },
  {
    id: 'contracts',
    icon: Code2,
    title: 'Deployed Contracts',
    color: 'cyan',
    content: (
      <div className="space-y-2">
        <p className="text-gray-400 text-sm mb-4">All contracts are deployed on Polygon Amoy (Chain ID: 80002).</p>
        {Object.entries(CONTRACTS).map(([name, addr]) => (
          <div key={name} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl text-sm">
            <span className="text-gray-300 font-medium">{name}</span>
            <a
              href={getExplorerUrl(addr)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-mono text-purple-400 hover:text-purple-300 transition-colors"
            >
              {addr.slice(0, 8)}…{addr.slice(-6)}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'bridge',
    icon: GitBranch,
    title: 'Bridge & Cross-Chain Flow',
    color: 'pink',
    content: (
      <div className="space-y-3 text-gray-300 leading-relaxed">
        <p>
          VortexFi uses the{' '}
          <a
            href="https://docs.polygon.technology/zkEVM/architecture/protocol/lxly-bridge/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-400 hover:text-pink-300 underline underline-offset-2"
          >
            Polygon LxLy Bridge (v2)
          </a>{' '}
          for trustless asset and message passing between chains.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-xs text-gray-300 leading-6">
          User Wallet<br />
          &nbsp;&nbsp;↓ approve + deposit(amount, vault)<br />
          ZapSender.zapAndBridge()<br />
          &nbsp;&nbsp;↓ bridgeMessage(destinationNetwork, ZapReceiver, calldata)<br />
          PolygonZkEVMBridgeV2 (source)<br />
          &nbsp;&nbsp;↓ cross-chain message relay<br />
          PolygonZkEVMBridgeV2 (dest)<br />
          &nbsp;&nbsp;↓ claimMessage() → onMessageReceived()<br />
          ZapReceiver → MockPool.deposit() → LP tokens → User
        </div>
        <p className="text-sm text-gray-400">
          On testnet the bridge can take 1–5 minutes to finalise. The History page tracks each transaction hash
          so you can follow the journey on the explorer.
        </p>
      </div>
    ),
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Security & Disclaimer',
    color: 'red',
    content: (
      <div className="space-y-3 text-gray-300 leading-relaxed">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm">
          <strong className="text-red-400">Testnet only.</strong> VortexFi is currently deployed on Polygon Amoy
          testnet. All tokens are worthless mock assets. Do <em>not</em> send real funds to these contracts.
        </div>
        <p>
          The contracts have not undergone a formal security audit. They are provided for demonstration and
          hackathon purposes. Use at your own risk.
        </p>
        <p>
          Source code is available on{' '}
          <a
            href="https://github.com/aamer1932002-dev/VortexFi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
          >
            GitHub
          </a>
          .
        </p>
      </div>
    ),
  },
];

const colorMap: Record<string, string> = {
  purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  blue:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
  green:  'text-green-400 bg-green-500/10 border-green-500/20',
  yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  cyan:   'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  pink:   'text-pink-400 bg-pink-500/10 border-pink-500/20',
  red:    'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function DocsPage() {
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
          {/* Page Header */}
          <div className="max-w-4xl mx-auto mb-14 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6"
            >
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-400 font-medium">Documentation</span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="text-white">VortexFi </span>
              <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Docs
              </span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Everything you need to understand, interact with, and build on VortexFi.
            </p>
          </div>

          {/* Quick nav */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex flex-wrap gap-2 justify-center">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowRight className="w-3 h-3" />
                  {s.title}
                </a>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="max-w-4xl mx-auto space-y-8">
            {sections.map((section, i) => {
              const Icon = section.icon;
              const colorCls = colorMap[section.color] ?? colorMap.purple;
              return (
                <motion.div
                  key={section.id}
                  id={section.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colorCls}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-white">{section.title}</h2>
                  </div>
                  {section.content}
                </motion.div>
              );
            })}
          </div>

          {/* Footer CTA */}
          <div className="max-w-4xl mx-auto mt-12 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <RefreshCw className="w-4 h-4" />
              Docs are auto-generated from live contract data where applicable
            </div>
          </div>
        </motion.div>

        <Footer />
      </div>
    </main>
  );
}
