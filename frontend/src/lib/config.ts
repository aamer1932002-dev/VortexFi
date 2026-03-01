// Network and contract configuration for VortexFi
// Using deployed contracts on Polygon Amoy testnet

export const NETWORKS = {
  AMOY: {
    id: 80002,
    name: 'Polygon Amoy',
    icon: '🟣',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    explorer: 'https://amoy.polygonscan.com',
    networkId: 2,
  },
} as const;

// Deployed contract addresses on Polygon Amoy
export const CONTRACTS = {
  MockUSDC: '0x52e5E849e23C763be6A1BdB509f11Da1c212e7a2' as `0x${string}`,
  MockWETH: '0xf2a2Ff159744C7Fc9b06cB52c5e06a63536956fC' as `0x${string}`,
  ZapLP: '0x828fcF4603c201844fdD2DE6D00E76E2097e9f11' as `0x${string}`,
  MockPool: '0x9CC0D4B6f3cF20a8c541C716BF8646c9d562373a' as `0x${string}`,
  ZapSender: '0xE78E6788807c8C3Dbf3d06711d8C525a3C04C474' as `0x${string}`,
  ZapReceiver: '0x0487348876b6cA34F3CCF1459386f2D6e638be8c' as `0x${string}`,
  Bridge: '0x528e26b25a34a4A5d0dbDa1d57D318153d2ED582' as `0x${string}`,
} as const;

// Token configurations
export const TOKENS = {
  USDC: {
    address: CONTRACTS.MockUSDC,
    symbol: 'USDC',
    name: 'Mock USDC',
    decimals: 6,
    icon: '💵',
  },
  WETH: {
    address: CONTRACTS.MockWETH,
    symbol: 'WETH',
    name: 'Mock WETH',
    decimals: 18,
    icon: '💎',
  },
  ZapLP: {
    address: CONTRACTS.ZapLP,
    symbol: 'zapLP',
    name: 'VortexFi LP Token',
    decimals: 18,
    icon: '🔮',
  },
} as const;

// Vault definitions with real contract addresses
export interface Vault {
  id: string;
  name: string;
  description: string;
  apy: number;
  token: 'USDC' | 'WETH';
  risk: 'Low' | 'Medium' | 'High';
  protocol: string;
  poolAddress: `0x${string}`;
  featured?: boolean;
  trending?: boolean;
}

export const VAULTS: Vault[] = [
  {
    id: 'usdc-stable-yield',
    name: 'USDC Stable Yield',
    description: 'Earn stable yield on USDC through cross-chain DeFi strategies powered by Polygon AggLayer.',
    apy: 8.5,
    token: 'USDC',
    risk: 'Low',
    protocol: 'VortexFi Pool',
    poolAddress: CONTRACTS.MockPool,
    featured: true,
  },
  {
    id: 'weth-yield',
    name: 'WETH Yield Vault',
    description: 'Maximize your ETH holdings with optimized yield strategies across the Polygon ecosystem.',
    apy: 5.2,
    token: 'WETH',
    risk: 'Low',
    protocol: 'VortexFi Pool',
    poolAddress: CONTRACTS.MockPool,
  },
  {
    id: 'usdc-boosted',
    name: 'USDC Boosted',
    description: 'Enhanced stablecoin yields using leveraged lending strategies. Medium risk for higher returns.',
    apy: 12.5,
    token: 'USDC',
    risk: 'Medium',
    protocol: 'VortexFi Pool',
    poolAddress: CONTRACTS.MockPool,
    trending: true,
  },
  {
    id: 'weth-delta',
    name: 'ETH Delta Neutral',
    description: 'Market-neutral strategy capturing funding rates while minimizing directional exposure.',
    apy: 15.2,
    token: 'WETH',
    risk: 'Medium',
    protocol: 'VortexFi Pool',
    poolAddress: CONTRACTS.MockPool,
  },
  {
    id: 'usdc-aggressive',
    name: 'USDC Aggressive',
    description: 'High-yield stablecoin vault using recursive leverage. Higher risk for maximum returns.',
    apy: 22.5,
    token: 'USDC',
    risk: 'High',
    protocol: 'VortexFi Pool',
    poolAddress: CONTRACTS.MockPool,
  },
  {
    id: 'weth-options',
    name: 'ETH Options Vault',
    description: 'Generate premium income through automated covered call strategies on ETH.',
    apy: 28.0,
    token: 'WETH',
    risk: 'High',
    protocol: 'VortexFi Pool',
    poolAddress: CONTRACTS.MockPool,
    trending: true,
  },
];

// Helper function to format address
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Helper function to format amount
export function formatAmount(amount: string | number, decimals: number = 2): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(decimals)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(decimals)}K`;
  }
  return num.toFixed(decimals);
}

// Get explorer URL for address
export function getExplorerUrl(address: string, type: 'address' | 'tx' = 'address'): string {
  return `${NETWORKS.AMOY.explorer}/${type}/${address}`;
}

// Get explorer URL for transaction
export function getTxExplorerUrl(txHash: string): string {
  return `${NETWORKS.AMOY.explorer}/tx/${txHash}`;
}
