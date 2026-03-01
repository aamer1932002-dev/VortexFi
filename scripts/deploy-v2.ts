import { ethers } from "hardhat";
import * as fs from "fs";

/**
 * Deploy AggZap V2 Contracts
 * 
 * V2 Features:
 * - Emergency Pause System
 * - Slippage Protection
 * - Withdrawal Flow (Reverse Zap)
 * - Auto-Compound Mechanism
 * - Multi-Vault Zapping
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("                   AggZap V2 Deployment                        ");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  // ═══════════════════════════════════════════════════════════════════
  // BRIDGE ADDRESS (Polygon Unified Bridge)
  // ═══════════════════════════════════════════════════════════════════
  const BRIDGE_ADDRESS = "0x528e26b25a34a4A5d0dbDa1d57D318153d2ED582";
  
  // Network IDs
  const AMOY_NETWORK_ID = 2;
  const CARDONA_NETWORK_ID = 1;

  // ═══════════════════════════════════════════════════════════════════
  // DEPLOY MOCK TOKENS (if not already deployed)
  // ═══════════════════════════════════════════════════════════════════
  console.log("📦 Deploying Mock Tokens...\n");

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  console.log(`✅ MockUSDC deployed: ${await mockUSDC.getAddress()}`);

  const MockWETH = await ethers.getContractFactory("MockWETH");
  const mockWETH = await MockWETH.deploy();
  await mockWETH.waitForDeployment();
  console.log(`✅ MockWETH deployed: ${await mockWETH.getAddress()}`);

  // ═══════════════════════════════════════════════════════════════════
  // DEPLOY ZAP LP TOKEN
  // ═══════════════════════════════════════════════════════════════════
  console.log("\n📦 Deploying ZapLP Token...\n");

  const ZapLP = await ethers.getContractFactory("ZapLP");
  const zapLP = await ZapLP.deploy();
  await zapLP.waitForDeployment();
  console.log(`✅ ZapLP deployed: ${await zapLP.getAddress()}`);

  // ═══════════════════════════════════════════════════════════════════
  // DEPLOY MOCK POOL
  // ═══════════════════════════════════════════════════════════════════
  console.log("\n📦 Deploying MockPool...\n");

  const MockPool = await ethers.getContractFactory("MockPool");
  const mockPool = await MockPool.deploy(await zapLP.getAddress());
  await mockPool.waitForDeployment();
  console.log(`✅ MockPool deployed: ${await mockPool.getAddress()}`);

  // Set pool on LP token
  await zapLP.setPool(await mockPool.getAddress());
  console.log(`   └── LP Token linked to MockPool`);

  // ═══════════════════════════════════════════════════════════════════
  // DEPLOY ZAP SENDER V2
  // ═══════════════════════════════════════════════════════════════════
  console.log("\n📦 Deploying ZapSenderV2...\n");

  const ZapSenderV2 = await ethers.getContractFactory("ZapSenderV2");
  const zapSenderV2 = await ZapSenderV2.deploy(BRIDGE_ADDRESS, deployer.address);
  await zapSenderV2.waitForDeployment();
  console.log(`✅ ZapSenderV2 deployed: ${await zapSenderV2.getAddress()}`);

  // ═══════════════════════════════════════════════════════════════════
  // DEPLOY ZAP RECEIVER V2
  // ═══════════════════════════════════════════════════════════════════
  console.log("\n📦 Deploying ZapReceiverV2...\n");

  const ZapReceiverV2 = await ethers.getContractFactory("ZapReceiverV2");
  const zapReceiverV2 = await ZapReceiverV2.deploy(BRIDGE_ADDRESS);
  await zapReceiverV2.waitForDeployment();
  console.log(`✅ ZapReceiverV2 deployed: ${await zapReceiverV2.getAddress()}`);

  // ═══════════════════════════════════════════════════════════════════
  // DEPLOY VAULT STRATEGIES V2 (Individual vaults instead of factory)
  // Note: VaultFactoryV2 exceeds contract size limit, deploying vaults directly
  // ═══════════════════════════════════════════════════════════════════
  console.log("\n📦 Deploying V2 Vault Strategies...\n");

  const StableYieldVaultV2 = await ethers.getContractFactory("StableYieldVaultV2");
  const stableVault = await StableYieldVaultV2.deploy(
    await mockUSDC.getAddress(),
    "Stable USDC Vault V2",
    "sUSDC-V2"
  );
  await stableVault.waitForDeployment();
  console.log(`✅ StableYieldVaultV2 deployed: ${await stableVault.getAddress()}`);

  const LiquidStakingVaultV2 = await ethers.getContractFactory("LiquidStakingVaultV2");
  const liquidStakingVault = await LiquidStakingVaultV2.deploy(
    await mockWETH.getAddress(),
    "Liquid Staking WETH V2",
    "lsWETH-V2"
  );
  await liquidStakingVault.waitForDeployment();
  console.log(`✅ LiquidStakingVaultV2 deployed: ${await liquidStakingVault.getAddress()}`);

  // ═══════════════════════════════════════════════════════════════════
  // CONFIGURE CONTRACTS
  // ═══════════════════════════════════════════════════════════════════
  console.log("\n⚙️ Configuring Contracts...\n");

  // Configure MockPool
  await mockPool.addSupportedToken(await mockUSDC.getAddress());
  await mockPool.addSupportedToken(await mockWETH.getAddress());
  await mockPool.setAuthorizedDepositor(await zapReceiverV2.getAddress(), true);
  console.log("   └── MockPool configured with tokens and depositor");

  // Configure ZapSenderV2
  await zapSenderV2.setSupportedToken(await mockUSDC.getAddress(), true);
  await zapSenderV2.setSupportedToken(await mockWETH.getAddress(), true);
  await zapSenderV2.setDestinationReceiver(CARDONA_NETWORK_ID, await zapReceiverV2.getAddress());
  console.log("   └── ZapSenderV2 configured with tokens and receiver");

  // Configure ZapReceiverV2
  await zapReceiverV2.authorizeSender(AMOY_NETWORK_ID, await zapSenderV2.getAddress());
  await zapReceiverV2.setPool(await mockUSDC.getAddress(), await mockPool.getAddress());
  await zapReceiverV2.setPool(await mockWETH.getAddress(), await mockPool.getAddress());
  await zapReceiverV2.setLPMapping(await zapLP.getAddress(), await mockUSDC.getAddress());
  console.log("   └── ZapReceiverV2 configured with sender and pools");

  // ═══════════════════════════════════════════════════════════════════
  // MINT TEST TOKENS
  // ═══════════════════════════════════════════════════════════════════
  console.log("\n💰 Minting Test Tokens...\n");

  await mockUSDC.mint(deployer.address, ethers.parseUnits("100000", 6));
  await mockWETH.mint(deployer.address, ethers.parseEther("100"));
  console.log("   └── Minted 100,000 USDC and 100 WETH to deployer");

  // ═══════════════════════════════════════════════════════════════════
  // SAVE DEPLOYMENT INFO
  // ═══════════════════════════════════════════════════════════════════
  const deployment = {
    network: network.name,
    chainId: network.chainId.toString(),
    timestamp: new Date().toISOString(),
    version: "V2",
    contracts: {
      MockUSDC: await mockUSDC.getAddress(),
      MockWETH: await mockWETH.getAddress(),
      ZapLP: await zapLP.getAddress(),
      MockPool: await mockPool.getAddress(),
      ZapSenderV2: await zapSenderV2.getAddress(),
      ZapReceiverV2: await zapReceiverV2.getAddress(),
      StableYieldVaultV2: await stableVault.getAddress(),
      LiquidStakingVaultV2: await liquidStakingVault.getAddress(),
      Bridge: BRIDGE_ADDRESS,
    },
    features: {
      emergencyPause: true,
      slippageProtection: true,
      withdrawalFlow: true,
      autoCompound: true,
      multiVaultZapping: true,
    },
  };

  const deploymentPath = `deployments/${network.name}-v2.json`;
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("                   DEPLOYMENT COMPLETE                          ");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("\n📄 Contract Addresses:\n");
  console.log(`   MockUSDC:             ${deployment.contracts.MockUSDC}`);
  console.log(`   MockWETH:             ${deployment.contracts.MockWETH}`);
  console.log(`   ZapLP:                ${deployment.contracts.ZapLP}`);
  console.log(`   MockPool:             ${deployment.contracts.MockPool}`);
  console.log(`   ZapSenderV2:          ${deployment.contracts.ZapSenderV2}`);
  console.log(`   ZapReceiverV2:        ${deployment.contracts.ZapReceiverV2}`);
  console.log(`   StableYieldVaultV2:   ${deployment.contracts.StableYieldVaultV2}`);
  console.log(`   LiquidStakingVaultV2: ${deployment.contracts.LiquidStakingVaultV2}`);
  console.log(`   Bridge:               ${deployment.contracts.Bridge}`);
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log(`\n📁 Deployment saved to: ${deploymentPath}\n`);
  
  console.log("✨ V2 FEATURES ENABLED:");
  console.log("   ⏸️  Emergency Pause System");
  console.log("   🛡️  Slippage Protection (minLpOut, deadline)");
  console.log("   🔄  Withdrawal Flow (zapWithdraw)");
  console.log("   🔁  Auto-Compound Mechanism (harvest, compound)");
  console.log("   📊  Multi-Vault Zapping (zapMultiple)");
  console.log("\n═══════════════════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
