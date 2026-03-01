'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Wallet, TrendingUp, Coins, RefreshCw, ExternalLink, ArrowDownToLine, Loader2 } from 'lucide-react';
import { 
  useUSDCBalance, 
  useWETHBalance, 
  useLPBalance, 
  useUserDeposits,
  useTotalTVL,
  usePoolWithdraw,
  useMintTokens
} from '@/hooks/useContracts';
import { CONTRACTS, getExplorerUrl, formatAmount } from '@/lib/config';

export default function Portfolio() {
  const { isConnected, address } = useAccount();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Fetch real balances from contracts
  const { balance: usdcBalance, isLoading: usdcLoading, refetch: refetchUsdc } = useUSDCBalance();
  const { balance: wethBalance, isLoading: wethLoading, refetch: refetchWeth } = useWETHBalance();
  const { balance: lpBalance, isLoading: lpLoading, refetch: refetchLp } = useLPBalance();
  const { deposits: userDeposits, isLoading: depositsLoading } = useUserDeposits();
  const { totalTvlUsd, usdcTvl, wethTvl, isLoading: tvlLoading } = useTotalTVL();

  // Withdraw hook
  const { 
    withdraw, 
    isPending: withdrawPending, 
    isConfirming: withdrawConfirming,
    isSuccess: withdrawSuccess,
    reset: resetWithdraw 
  } = usePoolWithdraw();

  // Mint hook
  const { mintUSDC, mintWETH, isPending: mintPending, isSuccess: mintSuccess } = useMintTokens();

  const isLoading = usdcLoading || wethLoading || lpLoading || depositsLoading || tvlLoading;

  const handleRefresh = () => {
    refetchUsdc();
    refetchWeth();
    refetchLp();
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    await withdraw(withdrawAmount);
    setWithdrawAmount('');
    handleRefresh();
  };

  const handleMintUSDC = async () => {
    await mintUSDC('1000');
    setTimeout(handleRefresh, 2000);
  };

  const handleMintWETH = async () => {
    await mintWETH('1');
    setTimeout(handleRefresh, 2000);
  };

  // Calculate estimated value (simplified - assume 1 LP = $1 for demo)
  const lpValue = parseFloat(lpBalance);
  const totalValue = parseFloat(usdcBalance) + (parseFloat(wethBalance) * 2000) + lpValue;

  if (!isConnected) {
    return (
      <section className="py-16 px-4" id="portfolio">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl"
          >
            <Wallet className="w-16 h-16 mx-auto mb-6 text-purple-400" />
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Connect your wallet to view your portfolio, track balances, and manage your positions.
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4" id="portfolio">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              Your{' '}
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Portfolio
              </span>
            </h2>
            <p className="text-gray-400">
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </motion.div>

        {/* Token Balances */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {/* USDC Balance */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-2xl">
                  💵
                </div>
                <div>
                  <div className="text-sm text-gray-400">USDC Balance</div>
                  <div className="text-2xl font-bold">
                    {isLoading ? '...' : formatAmount(usdcBalance)}
                  </div>
                </div>
              </div>
              <button
                onClick={handleMintUSDC}
                disabled={mintPending}
                className="px-3 py-1.5 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50"
              >
                {mintPending ? <Loader2 className="w-3 h-3 animate-spin" /> : '+1000'}
              </button>
            </div>
            <a
              href={getExplorerUrl(CONTRACTS.MockUSDC)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
            >
              View Contract <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* WETH Balance */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl">
                  💎
                </div>
                <div>
                  <div className="text-sm text-gray-400">WETH Balance</div>
                  <div className="text-2xl font-bold">
                    {isLoading ? '...' : parseFloat(wethBalance).toFixed(4)}
                  </div>
                </div>
              </div>
              <button
                onClick={handleMintWETH}
                disabled={mintPending}
                className="px-3 py-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors disabled:opacity-50"
              >
                {mintPending ? <Loader2 className="w-3 h-3 animate-spin" /> : '+1'}
              </button>
            </div>
            <a
              href={getExplorerUrl(CONTRACTS.MockWETH)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
            >
              View Contract <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* LP Token Balance */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl">
                🔮
              </div>
              <div>
                <div className="text-sm text-gray-400">LP Token Balance</div>
                <div className="text-2xl font-bold text-purple-400">
                  {isLoading ? '...' : parseFloat(lpBalance).toFixed(4)}
                </div>
              </div>
            </div>
            <a
              href={getExplorerUrl(CONTRACTS.ZapLP)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
            >
              View Contract <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>

        {/* Pool Stats & Withdraw */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pool TVL */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Pool Statistics
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Value Locked</span>
                <span className="font-bold text-xl">${tvlLoading ? '...' : formatAmount(totalTvlUsd)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">USDC in Pool</span>
                <span className="font-medium">{tvlLoading ? '...' : formatAmount(usdcTvl)} USDC</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">WETH in Pool</span>
                <span className="font-medium">{tvlLoading ? '...' : parseFloat(wethTvl).toFixed(4)} WETH</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Your Deposits</span>
                <span className="font-medium text-green-400">{depositsLoading ? '...' : formatAmount(userDeposits)} USDC</span>
              </div>
            </div>

            <a
              href={getExplorerUrl(CONTRACTS.MockPool)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 mt-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
            >
              View Pool Contract <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Withdraw Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-cyan-400" />
              Withdraw from Pool
            </h3>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">LP Amount to Withdraw</label>
                <span className="text-xs text-gray-500">
                  Available: {parseFloat(lpBalance).toFixed(4)} LP
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-medium text-white pr-20 focus:outline-none focus:border-purple-500/50"
                />
                <button
                  onClick={() => setWithdrawAmount(lpBalance)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-400 hover:text-purple-300"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Estimated Return</span>
                <span className="font-medium">
                  ~{withdrawAmount ? (parseFloat(withdrawAmount) / 1e12).toFixed(2) : '0'} USDC
                </span>
              </div>
            </div>

            <button
              onClick={handleWithdraw}
              disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > parseFloat(lpBalance) || withdrawPending || withdrawConfirming}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all"
            >
              {withdrawPending || withdrawConfirming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {withdrawPending ? 'Confirm in Wallet...' : 'Withdrawing...'}
                </>
              ) : (
                <>
                  <ArrowDownToLine className="w-5 h-5" />
                  Withdraw LP Tokens
                </>
              )}
            </button>
          </motion.div>
        </div>

        {/* Contract Addresses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            Deployed Contracts (Polygon Amoy)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {Object.entries(CONTRACTS).map(([name, address]) => (
              <div key={name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">{name}</span>
                <a
                  href={getExplorerUrl(address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-mono text-xs"
                >
                  {address.slice(0, 6)}...{address.slice(-4)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
