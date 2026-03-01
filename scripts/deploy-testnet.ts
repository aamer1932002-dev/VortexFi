import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * AggZap Testnet Deployment Script
 * 
 * Deploys contracts to Polygon Amoy (source) and Cardona zkEVM (destination)
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-testnet.ts --network amoy
 *   npx hardhat run scripts/deploy-testnet.ts --network cardona
 */

// AggLayer Bridge addresses
const BRIDGE_ADDRESSES: Record<string, string> = {
  amoy: "0x528e26b25a34a4A5d0dbDa1d57D318153d2ED582",      // Polygon Amoy bridge
  cardona: "0x528e26b25a34a4A5d0dbDa1d57D318153d2ED582",  // Cardona zkEVM bridge
};

// Network IDs for AggLayer
const NETWORK_IDS: Record<string, number> = {
  amoy: 0,      // Polygon Amoy is network 0
  cardona: 1,   // Cardona zkEVM is network 1
};

interface DeploymentResult {
  network: string;
  chainId: number;
  contracts: Record<string, string>;
  timestamp: string;
}

async function main() {
  const networkName = network.name;
  console.log(`\n🚀 Deploying AggZap to ${networkName}...\n`);

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log(`📍 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH/MATIC\n`);

  if (balance === 0n) {
    console.error("❌ No balance! Get testnet tokens from:");
    console.error("   Amoy: https://faucet.polygon.technology/");
    console.error("   Cardona: https://faucet.polygon.technology/");
    process.exit(1);
  }

  const bridgeAddress = BRIDGE_ADDRESSES[networkName];
  if (!bridgeAddress) {
    console.error(`❌ Unknown network: ${networkName}`);
    console.error("   Supported: amoy, cardona");
    process.exit(1);
  }

  const deployment: DeploymentResult = {
    network: networkName,
    chainId: (await ethers.provider.getNetwork()).chainId.toString() as unknown as number,
    contracts: {},
    timestamp: new Date().toISOString(),
  };

  try {
    if (networkName === "amoy") {
      // Deploy source chain contracts
      await deploySourceChain(deployer, bridgeAddress, deployment);
    } else if (networkName === "cardona") {
      // Deploy destination chain contracts
      await deployDestinationChain(deployer, bridgeAddress, deployment);
    }

    // Save deployment info
    saveDeployment(deployment);
    
    console.log("\n✅ Deployment complete!");
    console.log(`📁 Deployment saved to deployments/${networkName}.json`);

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

async function deploySourceChain(
  deployer: any,
  bridgeAddress: string,
  deployment: DeploymentResult
) {
  console.log("📦 Deploying Source Chain Contracts (Amoy)...\n");

  // Deploy Mock USDC for testing
  console.log("  Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const usdcAddress = await mockUSDC.getAddress();
  console.log(`  ✓ MockUSDC: ${usdcAddress}`);
  deployment.contracts.MockUSDC = usdcAddress;

  // Deploy Mock WETH for testing
  console.log("  Deploying MockWETH...");
  const MockWETH = await ethers.getContractFactory("MockWETH");
  const mockWETH = await MockWETH.deploy();
  await mockWETH.waitForDeployment();
  const wethAddress = await mockWETH.getAddress();
  console.log(`  ✓ MockWETH: ${wethAddress}`);
  deployment.contracts.MockWETH = wethAddress;

  // Deploy ZapSender
  console.log("  Deploying ZapSender...");
  const ZapSender = await ethers.getContractFactory("ZapSender");
  const zapSender = await ZapSender.deploy(bridgeAddress, deployer.address);
  await zapSender.waitForDeployment();
  const senderAddress = await zapSender.getAddress();
  console.log(`  ✓ ZapSender: ${senderAddress}`);
  deployment.contracts.ZapSender = senderAddress;

  // Configure ZapSender
  console.log("\n⚙️  Configuring ZapSender...");
  
  // Add supported tokens
  const tx1 = await zapSender.setSupportedToken(usdcAddress, true);
  await tx1.wait();
  console.log("  ✓ Added USDC as supported token");

  const tx2 = await zapSender.setSupportedToken(wethAddress, true);
  await tx2.wait();
  console.log("  ✓ Added WETH as supported token");

  // Mint test tokens to deployer
  console.log("\n🪙 Minting test tokens...");
  const mintTx1 = await mockUSDC.mint(deployer.address, ethers.parseUnits("10000", 6));
  await mintTx1.wait();
  console.log("  ✓ Minted 10,000 USDC");

  const mintTx2 = await mockWETH.mint(deployer.address, ethers.parseEther("10"));
  await mintTx2.wait();
  console.log("  ✓ Minted 10 WETH");

  deployment.contracts.Bridge = bridgeAddress;
}

async function deployDestinationChain(
  deployer: any,
  bridgeAddress: string,
  deployment: DeploymentResult
) {
  console.log("📦 Deploying Destination Chain Contracts (Cardona)...\n");

  // Deploy Mock USDC
  console.log("  Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const usdcAddress = await mockUSDC.getAddress();
  console.log(`  ✓ MockUSDC: ${usdcAddress}`);
  deployment.contracts.MockUSDC = usdcAddress;

  // Deploy Mock WETH
  console.log("  Deploying MockWETH...");
  const MockWETH = await ethers.getContractFactory("MockWETH");
  const mockWETH = await MockWETH.deploy();
  await mockWETH.waitForDeployment();
  const wethAddress = await mockWETH.getAddress();
  console.log(`  ✓ MockWETH: ${wethAddress}`);
  deployment.contracts.MockWETH = wethAddress;

  // Deploy LP Token for pools
  console.log("  Deploying ZapLP Token...");
  const ZapLP = await ethers.getContractFactory("ZapLP");
  const zapLP = await ZapLP.deploy();
  await zapLP.waitForDeployment();
  const lpAddress = await zapLP.getAddress();
  console.log(`  ✓ ZapLP: ${lpAddress}`);
  deployment.contracts.ZapLP = lpAddress;

  // Deploy Multiple Mock Pools (Different Strategies)
  console.log("\n📊 Deploying Vault Strategies...");

  // 1. USDC Stable Pool (Low Risk, ~5% APY)
  console.log("  Deploying USDC Stable Pool...");
  const USDCPool = await ethers.getContractFactory("MockPool");
  const usdcPool = await USDCPool.deploy(
    usdcAddress,
    lpAddress,
    "AggZap USDC Stable",
    "azUSDC"
  );
  await usdcPool.waitForDeployment();
  const usdcPoolAddress = await usdcPool.getAddress();
  console.log(`  ✓ USDC Stable Pool: ${usdcPoolAddress}`);
  deployment.contracts.USDCStablePool = usdcPoolAddress;

  // 2. ETH Yield Pool (Medium Risk, ~8% APY)
  console.log("  Deploying ETH Yield Pool...");
  const ETHPool = await ethers.getContractFactory("MockPool");
  const ethPool = await ETHPool.deploy(
    wethAddress,
    lpAddress,
    "AggZap ETH Yield",
    "azETH"
  );
  await ethPool.waitForDeployment();
  const ethPoolAddress = await ethPool.getAddress();
  console.log(`  ✓ ETH Yield Pool: ${ethPoolAddress}`);
  deployment.contracts.ETHYieldPool = ethPoolAddress;

  // Deploy ZapReceiver
  console.log("\n  Deploying ZapReceiver...");
  const ZapReceiver = await ethers.getContractFactory("ZapReceiver");
  const zapReceiver = await ZapReceiver.deploy(bridgeAddress);
  await zapReceiver.waitForDeployment();
  const receiverAddress = await zapReceiver.getAddress();
  console.log(`  ✓ ZapReceiver: ${receiverAddress}`);
  deployment.contracts.ZapReceiver = receiverAddress;

  // Configure contracts
  console.log("\n⚙️  Configuring contracts...");

  // Set up LP token minting
  const lpMintTx = await zapLP.setMinter(usdcPoolAddress, true);
  await lpMintTx.wait();
  const lpMintTx2 = await zapLP.setMinter(ethPoolAddress, true);
  await lpMintTx2.wait();
  console.log("  ✓ LP minting configured");

  // Configure USDC Pool
  const poolTx1 = await usdcPool.setSupportedToken(usdcAddress, true);
  await poolTx1.wait();
  const poolTx2 = await usdcPool.setAuthorizedDepositor(receiverAddress, true);
  await poolTx2.wait();
  console.log("  ✓ USDC Pool configured");

  // Configure ETH Pool
  const poolTx3 = await ethPool.setSupportedToken(wethAddress, true);
  await poolTx3.wait();
  const poolTx4 = await ethPool.setAuthorizedDepositor(receiverAddress, true);
  await poolTx4.wait();
  console.log("  ✓ ETH Pool configured");

  // Configure ZapReceiver with pools
  const recTx1 = await zapReceiver.setPool(usdcAddress, usdcPoolAddress);
  await recTx1.wait();
  const recTx2 = await zapReceiver.setPool(wethAddress, ethPoolAddress);
  await recTx2.wait();
  console.log("  ✓ ZapReceiver pools configured");

  // Mint tokens to pools for liquidity
  console.log("\n🪙 Adding pool liquidity...");
  const mintTx1 = await mockUSDC.mint(usdcPoolAddress, ethers.parseUnits("100000", 6));
  await mintTx1.wait();
  const mintTx2 = await mockWETH.mint(ethPoolAddress, ethers.parseEther("100"));
  await mintTx2.wait();
  console.log("  ✓ Liquidity added to pools");

  deployment.contracts.Bridge = bridgeAddress;
}

function saveDeployment(deployment: DeploymentResult) {
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filePath = path.join(deploymentsDir, `${deployment.network}.json`);
  fs.writeFileSync(filePath, JSON.stringify(deployment, null, 2));

  // Also update frontend config
  updateFrontendConfig(deployment);
}

function updateFrontendConfig(deployment: DeploymentResult) {
  const frontendConfigPath = path.join(
    __dirname,
    "..",
    "frontend",
    "src",
    "config",
    "deployments.json"
  );

  let allDeployments: Record<string, DeploymentResult> = {};
  
  // Load existing deployments if exists
  if (fs.existsSync(frontendConfigPath)) {
    allDeployments = JSON.parse(fs.readFileSync(frontendConfigPath, "utf-8"));
  }

  allDeployments[deployment.network] = deployment;

  // Ensure directory exists
  const configDir = path.dirname(frontendConfigPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(frontendConfigPath, JSON.stringify(allDeployments, null, 2));
  console.log(`📱 Frontend config updated: frontend/src/config/deployments.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
