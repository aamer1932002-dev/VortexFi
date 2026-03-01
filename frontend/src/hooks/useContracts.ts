'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACTS, TOKENS } from '@/lib/config';
import { MOCK_USDC_ABI, MOCK_WETH_ABI, ZAP_LP_ABI, MOCK_POOL_ABI, ZAP_SENDER_ABI, ERC20_ABI } from '@/lib/contracts';

// ============================================
// Token Balance Hooks
// ============================================

export function useUSDCBalance() {
  const { address } = useAccount();
  
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.MockUSDC,
    abi: MOCK_USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return {
    balance: data ? formatUnits(data, 6) : '0',
    balanceRaw: data ?? BigInt(0),
    isLoading,
    refetch,
  };
}

export function useWETHBalance() {
  const { address } = useAccount();
  
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.MockWETH,
    abi: MOCK_WETH_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return {
    balance: data ? formatUnits(data, 18) : '0',
    balanceRaw: data ?? BigInt(0),
    isLoading,
    refetch,
  };
}

export function useLPBalance() {
  const { address } = useAccount();
  
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.ZapLP,
    abi: ZAP_LP_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return {
    balance: data ? formatUnits(data, 18) : '0',
    balanceRaw: data ?? BigInt(0),
    isLoading,
    refetch,
  };
}

// ============================================
// Pool Data Hooks
// ============================================

export function usePoolTVL(tokenAddress: `0x${string}`) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.MockPool,
    abi: MOCK_POOL_ABI,
    functionName: 'getTVL',
    args: [tokenAddress],
  });

  const decimals = tokenAddress === CONTRACTS.MockUSDC ? 6 : 18;

  return {
    tvl: data ? formatUnits(data, decimals) : '0',
    tvlRaw: data ?? BigInt(0),
    isLoading,
    refetch,
  };
}

export function useTotalTVL() {
  const { tvl: usdcTvl, isLoading: usdcLoading } = usePoolTVL(CONTRACTS.MockUSDC);
  const { tvl: wethTvl, isLoading: wethLoading } = usePoolTVL(CONTRACTS.MockWETH);

  // For display, we show USDC TVL + estimated WETH value (assume 1 ETH = $2000 for demo)
  const totalTvlUsd = parseFloat(usdcTvl) + (parseFloat(wethTvl) * 2000);

  return {
    usdcTvl,
    wethTvl,
    totalTvlUsd,
    isLoading: usdcLoading || wethLoading,
  };
}

export function useUserDeposits() {
  const { address } = useAccount();
  
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.MockPool,
    abi: MOCK_POOL_ABI,
    functionName: 'userDeposits',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return {
    deposits: data ? formatUnits(data, 6) : '0',
    depositsRaw: data ?? BigInt(0),
    isLoading,
    refetch,
  };
}

export function useUserPoolLPBalance() {
  const { address } = useAccount();
  
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.MockPool,
    abi: MOCK_POOL_ABI,
    functionName: 'getUserLPBalance',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return {
    lpBalance: data ? formatUnits(data, 18) : '0',
    lpBalanceRaw: data ?? BigInt(0),
    isLoading,
    refetch,
  };
}

// ============================================
// Token Allowance Hooks
// ============================================

export function useTokenAllowance(tokenAddress: `0x${string}`, spender: `0x${string}`) {
  const { address } = useAccount();
  
  const { data, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, spender] : undefined,
    query: { enabled: !!address },
  });

  return {
    allowance: data ?? BigInt(0),
    isLoading,
    refetch,
  };
}

// ============================================
// ZapSender Stats Hook
// ============================================

export function useZapStats() {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.ZapSender,
    abi: ZAP_SENDER_ABI,
    functionName: 'getStats',
  });

  return {
    stats: data ? {
      totalZaps: Number(data[0]),
      totalVolume: formatUnits(data[1], 6),
      feeBps: Number(data[2]),
    } : null,
    isLoading,
    refetch,
  };
}

// ============================================
// Token Approval Hook
// ============================================

export function useApproveToken() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = async (
    tokenAddress: `0x${string}`,
    spender: `0x${string}`,
    amount: bigint
  ) => {
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amount],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// ============================================
// Pool Deposit Hook
// ============================================

export function usePoolDeposit() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });

  const deposit = async (
    tokenAddress: `0x${string}`,
    amount: string,
    decimals: number = 6
  ) => {
    if (!address) throw new Error('Wallet not connected');
    
    const amountParsed = parseUnits(amount, decimals);
    
    writeContract({
      address: CONTRACTS.MockPool,
      abi: MOCK_POOL_ABI,
      functionName: 'deposit',
      args: [address, tokenAddress, amountParsed],
    });
  };

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    receipt,
    error,
    reset,
  };
}

// ============================================
// Pool Withdraw Hook
// ============================================

export function usePoolWithdraw() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });

  const withdraw = async (lpAmount: string) => {
    if (!address) throw new Error('Wallet not connected');
    
    const amountParsed = parseUnits(lpAmount, 18);
    
    writeContract({
      address: CONTRACTS.MockPool,
      abi: MOCK_POOL_ABI,
      functionName: 'withdraw',
      args: [address, amountParsed],
    });
  };

  return {
    withdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    receipt,
    error,
    reset,
  };
}

// ============================================
// Mint Test Tokens Hook (for testing)
// ============================================

export function useMintTokens() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const mintUSDC = async (amount: string = '1000') => {
    if (!address) throw new Error('Wallet not connected');
    
    writeContract({
      address: CONTRACTS.MockUSDC,
      abi: MOCK_USDC_ABI,
      functionName: 'mint',
      args: [address, parseUnits(amount, 6)],
    });
  };

  const mintWETH = async (amount: string = '1') => {
    if (!address) throw new Error('Wallet not connected');
    
    writeContract({
      address: CONTRACTS.MockWETH,
      abi: MOCK_WETH_ABI,
      functionName: 'mint',
      args: [address, parseUnits(amount, 18)],
    });
  };

  return {
    mintUSDC,
    mintWETH,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// ============================================
// Combined Deposit Flow Hook
// ============================================

export function useDepositFlow() {
  const { address } = useAccount();
  const approveHook = useApproveToken();
  const depositHook = usePoolDeposit();

  const executeDeposit = async (
    tokenAddress: `0x${string}`,
    amount: string,
    decimals: number = 6
  ) => {
    if (!address) throw new Error('Wallet not connected');
    
    const amountParsed = parseUnits(amount, decimals);
    
    // First approve
    await approveHook.approve(tokenAddress, CONTRACTS.MockPool, amountParsed);
  };

  const confirmDeposit = async (
    tokenAddress: `0x${string}`,
    amount: string,
    decimals: number = 6
  ) => {
    await depositHook.deposit(tokenAddress, amount, decimals);
  };

  return {
    executeDeposit,
    confirmDeposit,
    approval: approveHook,
    deposit: depositHook,
  };
}

// ============================================
// LP Token Total Supply Hook
// ============================================

export function useLPTotalSupply() {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.ZapLP,
    abi: ZAP_LP_ABI,
    functionName: 'totalSupply',
  });

  return {
    totalSupply: data ? formatUnits(data, 18) : '0',
    totalSupplyRaw: data ?? BigInt(0),
    isLoading,
    refetch,
  };
}
