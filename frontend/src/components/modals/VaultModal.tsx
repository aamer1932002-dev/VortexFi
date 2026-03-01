'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, ArrowRight, Loader2, CheckCircle2, AlertCircle, Zap, Shield, ExternalLink, Coins } from 'lucide-react';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { ZapProgress } from '@/components/ui/ZapProgress';
import { CONTRACTS, TOKENS, getTxExplorerUrl, type Vault } from '@/lib/config';

// Token type definition
type TokenConfig = {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  icon: string;
};
import { 
  useUSDCBalance, 
  useWETHBalance, 
  useLPBalance,
  useTokenAllowance,
  useApproveToken,
  usePoolDeposit,
  useMintTokens
} from '@/hooks/useContracts';

interface VaultModalProps {
  vault: Vault;
  onClose: () => void;
}

type ZapStep = 'input' | 'approving' | 'depositing' | 'success' | 'error';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 }
  },
};

export function VaultModal({ vault, onClose }: VaultModalProps) {
  const { isConnected, address } = useAccount();
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<ZapStep>('input');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Get token config based on vault
  const token = vault.token === 'USDC' ? TOKENS.USDC : TOKENS.WETH;
  const tokenAddress = token.address;
  const decimals = token.decimals;

  // Hooks for balances
  const { balance: usdcBalance, refetch: refetchUsdc } = useUSDCBalance();
  const { balance: wethBalance, refetch: refetchWeth } = useWETHBalance();
  const { balance: lpBalance, refetch: refetchLp } = useLPBalance();
  
  const balance = vault.token === 'USDC' ? usdcBalance : wethBalance;

  // Allowance hook
  const { allowance, refetch: refetchAllowance } = useTokenAllowance(tokenAddress, CONTRACTS.MockPool);

  // Approve hook
  const { 
    approve, 
    isPending: isApproving, 
    isConfirming: isApprovalConfirming, 
    isSuccess: isApprovalSuccess,
    error: approvalError,
    reset: resetApproval 
  } = useApproveToken();

  // Deposit hook
  const { 
    deposit, 
    hash: depositHash,
    isPending: isDepositing, 
    isConfirming: isDepositConfirming, 
    isSuccess: isDepositSuccess,
    error: depositError,
    reset: resetDeposit 
  } = usePoolDeposit();

  // Mint hook (for getting test tokens)
  const { 
    mintUSDC, 
    mintWETH, 
    isPending: isMinting,
    isSuccess: isMintSuccess 
  } = useMintTokens();

  // Handle approval success -> proceed to deposit
  useEffect(() => {
    if (isApprovalSuccess && step === 'approving') {
      refetchAllowance();
      setStep('depositing');
      // Execute deposit after approval
      deposit(tokenAddress, amount, decimals);
    }
  }, [isApprovalSuccess, step]);

  // Handle deposit success
  useEffect(() => {
    if (isDepositSuccess && depositHash) {
      setTxHash(depositHash);
      setStep('success');
      // Refetch balances
      refetchUsdc();
      refetchWeth();
      refetchLp();
    }
  }, [isDepositSuccess, depositHash]);

  // Handle errors
  useEffect(() => {
    if (approvalError) {
      setErrorMessage(approvalError.message || 'Approval failed');
      setStep('error');
    }
    if (depositError) {
      setErrorMessage(depositError.message || 'Deposit failed');
      setStep('error');
    }
  }, [approvalError, depositError]);

  // Refetch balances after mint
  useEffect(() => {
    if (isMintSuccess) {
      refetchUsdc();
      refetchWeth();
    }
  }, [isMintSuccess]);

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    const amountParsed = parseUnits(amount, decimals);
    
    // Check if we need approval
    if (allowance < amountParsed) {
      setStep('approving');
      await approve(tokenAddress, CONTRACTS.MockPool, amountParsed);
    } else {
      // Already approved, go straight to deposit
      setStep('depositing');
      await deposit(tokenAddress, amount, decimals);
    }
  };

  const handleRetry = () => {
    resetApproval();
    resetDeposit();
    setStep('input');
    setErrorMessage('');
  };

  const handleMint = async () => {
    if (vault.token === 'USDC') {
      await mintUSDC('1000');
    } else {
      await mintWETH('1');
    }
  };

  const estimatedLP = amount ? (parseFloat(amount) * (vault.token === 'USDC' ? 1 : 1)).toFixed(4) : '0';
  const protocolFee = amount ? (parseFloat(amount) * 0.001).toFixed(4) : '0';

  return (
    <AnimatePresence>
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center text-2xl">
                {token.icon}
              </div>
              <div>
                <h2 className="font-semibold text-white">{vault.name}</h2>
                <p className="text-xs text-gray-400">{vault.protocol}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 'input' && (
              <InputStep
                vault={vault}
                token={token}
                amount={amount}
                setAmount={setAmount}
                balance={balance}
                estimatedLP={estimatedLP}
                protocolFee={protocolFee}
                isConnected={isConnected}
                onDeposit={handleDeposit}
                onMint={handleMint}
                isMinting={isMinting}
              />
            )}

            {step === 'approving' && (
              <ProcessingStep
                title="Approving Token"
                description={`Please confirm the approval in your wallet to allow the pool to spend your ${vault.token}.`}
                isWaiting={isApproving}
                isConfirming={isApprovalConfirming}
              />
            )}

            {step === 'depositing' && (
              <ProcessingStep
                title="Depositing to Pool"
                description={`Depositing ${amount} ${vault.token} into the vault. Please confirm in your wallet.`}
                isWaiting={isDepositing}
                isConfirming={isDepositConfirming}
              />
            )}

            {step === 'success' && (
              <SuccessStep
                vault={vault}
                amount={amount}
                estimatedLP={estimatedLP}
                txHash={txHash}
                lpBalance={lpBalance}
                onClose={onClose}
              />
            )}

            {step === 'error' && (
              <ErrorStep
                message={errorMessage}
                onRetry={handleRetry}
                onClose={onClose}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Input Step Component
function InputStep({
  vault,
  token,
  amount,
  setAmount,
  balance,
  estimatedLP,
  protocolFee,
  isConnected,
  onDeposit,
  onMint,
  isMinting,
}: {
  vault: Vault;
  token: TokenConfig;
  amount: string;
  setAmount: (val: string) => void;
  balance: string;
  estimatedLP: string;
  protocolFee: string;
  isConnected: boolean;
  onDeposit: () => void;
  onMint: () => void;
  isMinting: boolean;
}) {
  const hasBalance = parseFloat(balance) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* APY Banner */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 rounded-xl p-4 mb-6 border border-green-500/20">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Current APY</span>
          <span className="text-2xl font-bold text-green-400">{vault.apy}%</span>
        </div>
      </div>

      {/* Input */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-gray-400">Deposit Amount</label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Balance: {parseFloat(balance).toFixed(2)} {vault.token}</span>
            {!hasBalance && (
              <button
                onClick={onMint}
                disabled={isMinting}
                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50"
              >
                {isMinting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Coins className="w-3 h-3" />}
                Get Test Tokens
              </button>
            )}
          </div>
        </div>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-2xl font-semibold text-white pr-24 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              onClick={() => setAmount(balance)}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium"
            >
              MAX
            </button>
            <span className="text-gray-400 font-medium">{vault.token}</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-3 mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">You will receive</span>
          <span className="text-white font-medium">{estimatedLP} zapLP</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Protocol fee (0.1%)</span>
          <span className="text-gray-300">{protocolFee} {vault.token}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Network</span>
          <span className="text-purple-400">Polygon Amoy</span>
        </div>
      </div>

      {/* Security Note */}
      <div className="flex items-start gap-3 p-3 bg-purple-500/5 rounded-lg mb-6 border border-purple-500/10">
        <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400">
          Your funds are secured by smart contracts on Polygon. All transactions are verified on-chain.
        </p>
      </div>

      {/* CTA */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onDeposit}
        disabled={!isConnected || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(balance)}
        className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
      >
        {!isConnected ? (
          'Connect Wallet'
        ) : parseFloat(amount) > parseFloat(balance) ? (
          'Insufficient Balance'
        ) : (
          <>
            <Zap className="w-5 h-5" />
            <span>Deposit {amount || '0'} {vault.token}</span>
          </>
        )}
      </motion.button>
    </motion.div>
  );
}

// Processing Step Component
function ProcessingStep({
  title,
  description,
  isWaiting,
  isConfirming,
}: {
  title: string;
  description: string;
  isWaiting: boolean;
  isConfirming: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="py-8 text-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
      >
        <Loader2 className="w-8 h-8 text-white" />
      </motion.div>
      
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6">{description}</p>
      
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        {isWaiting && (
          <>
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span>Waiting for wallet confirmation...</span>
          </>
        )}
        {isConfirming && (
          <>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <span>Confirming on blockchain...</span>
          </>
        )}
      </div>
    </motion.div>
  );
}

// Success Step Component
function SuccessStep({
  vault,
  amount,
  estimatedLP,
  txHash,
  lpBalance,
  onClose,
}: {
  vault: Vault;
  amount: string;
  estimatedLP: string;
  txHash: string | null;
  lpBalance: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center py-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
      >
        <CheckCircle2 className="w-10 h-10 text-green-400" />
      </motion.div>

      <h3 className="text-2xl font-bold text-white mb-2">Deposit Successful! 🎉</h3>
      <p className="text-gray-400 mb-6">Your funds are now earning yield</p>

      <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400">Deposited</span>
          <span className="font-semibold text-white">{amount} {vault.token}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400">Received</span>
          <span className="font-semibold text-green-400">{estimatedLP} zapLP</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400">Your LP Balance</span>
          <span className="font-semibold text-purple-400">{parseFloat(lpBalance).toFixed(4)} zapLP</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Earning APY</span>
          <span className="font-semibold text-cyan-400">{vault.apy}%</span>
        </div>
      </div>

      <div className="flex gap-3">
        {txHash && (
          <a
            href={getTxExplorerUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-6 py-3 bg-white/5 rounded-xl font-medium text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-2 border border-white/10"
          >
            <ExternalLink className="w-4 h-4" />
            View on Explorer
          </a>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600"
        >
          Done
        </motion.button>
      </div>
    </motion.div>
  );
}

// Error Step Component
function ErrorStep({
  message,
  onRetry,
  onClose,
}: {
  message: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  // Truncate error message
  const shortMessage = message.length > 100 ? message.slice(0, 100) + '...' : message;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center py-4"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>

      <h3 className="text-xl font-semibold text-white mb-2">Transaction Failed</h3>
      <p className="text-gray-400 mb-2">
        Don't worry - your funds are safe.
      </p>
      <p className="text-xs text-red-400/80 mb-6 px-4">
        {shortMessage}
      </p>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-6 py-3 bg-white/5 rounded-xl font-medium text-gray-300 hover:text-white transition-colors border border-white/10"
        >
          Close
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRetry}
          className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600"
        >
          Try Again
        </motion.button>
      </div>
    </motion.div>
  );
}
