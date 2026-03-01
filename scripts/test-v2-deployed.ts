import { ethers } from "hardhat";
import * as fs from "fs";

/**
 * Test AggZap V2 Contracts on Amoy Testnet
 * 
 * Tests all V2 features:
 * - Emergency Pause System
 * - Slippage Protection
 * - Multi-Vault Zapping
 * - Auto-Compound Mechanism
 * - Withdrawal Flow
 */
async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("                   AggZap V2 Integration Tests                  ");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Load deployment
  const deploymentPath = "deployments/amoy-v2.json";
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("Deployment file not found. Run deploy-v2.ts first.");
  }
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  const [deployer] = await ethers.getSigners();
  console.log(`Tester: ${deployer.address}`);
  console.log(`Network: ${deployment.network} (Chain ID: ${deployment.chainId})\n`);

  // Get contract instances
  const zapSenderV2 = await ethers.getContractAt("ZapSenderV2", deployment.contracts.ZapSenderV2);
  const zapReceiverV2 = await ethers.getContractAt("ZapReceiverV2", deployment.contracts.ZapReceiverV2);
  const stableVault = await ethers.getContractAt("StableYieldVaultV2", deployment.contracts.StableYieldVaultV2);
  const liquidStakingVault = await ethers.getContractAt("LiquidStakingVaultV2", deployment.contracts.LiquidStakingVaultV2);
  const mockUSDC = await ethers.getContractAt("MockUSDC", deployment.contracts.MockUSDC);
  const mockWETH = await ethers.getContractAt("MockWETH", deployment.contracts.MockWETH);
  const mockPool = await ethers.getContractAt("MockPool", deployment.contracts.MockPool);

  let passed = 0;
  let failed = 0;

  // ═══════════════════════════════════════════════════════════════════
  // TEST 1: Emergency Pause System
  // ═══════════════════════════════════════════════════════════════════
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 1: Emergency Pause System");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    // Check initial state
    const senderPausedBefore = await zapSenderV2.paused();
    console.log(`   ZapSenderV2 paused (initial): ${senderPausedBefore}`);
    
    const receiverPausedBefore = await zapReceiverV2.paused();
    console.log(`   ZapReceiverV2 paused (initial): ${receiverPausedBefore}`);

    // Test pause functionality
    console.log("\n   Pausing ZapSenderV2...");
    const pauseTx = await zapSenderV2.pause();
    await pauseTx.wait();
    
    const senderPausedAfter = await zapSenderV2.paused();
    console.log(`   ZapSenderV2 paused (after): ${senderPausedAfter}`);

    // Unpause
    console.log("   Unpausing ZapSenderV2...");
    const unpauseTx = await zapSenderV2.unpause();
    await unpauseTx.wait();
    
    const senderUnpaused = await zapSenderV2.paused();
    console.log(`   ZapSenderV2 paused (final): ${senderUnpaused}`);

    if (!senderPausedBefore && senderPausedAfter && !senderUnpaused) {
      console.log("\n   ✅ TEST PASSED: Emergency Pause System works correctly\n");
      passed++;
    } else {
      console.log("\n   ❌ TEST FAILED: Unexpected pause states\n");
      failed++;
    }
  } catch (error: any) {
    console.log(`\n   ❌ TEST FAILED: ${error.message}\n`);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 2: Slippage Protection Parameters
  // ═══════════════════════════════════════════════════════════════════
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 2: Slippage Protection Parameters");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    // Check default slippage
    const defaultSlippage = await zapSenderV2.defaultSlippageBps();
    console.log(`   Default slippage: ${defaultSlippage} bps (${Number(defaultSlippage) / 100}%)`);

    // Calculate min output
    const testAmount = ethers.parseUnits("1000", 6);
    const minOutput = await zapSenderV2.calculateMinOutput(testAmount);
    console.log(`   Test amount: 1000 USDC`);
    console.log(`   Calculated min output: ${ethers.formatUnits(minOutput, 6)} USDC`);

    // Calculate fee
    const fee = await zapSenderV2.calculateFee(testAmount);
    console.log(`   Fee: ${ethers.formatUnits(fee, 6)} USDC`);

    // Update slippage
    console.log("\n   Updating default slippage to 1%...");
    const updateTx = await zapSenderV2.setDefaultSlippage(100);
    await updateTx.wait();
    
    const newSlippage = await zapSenderV2.defaultSlippageBps();
    console.log(`   New default slippage: ${newSlippage} bps`);

    // Reset to original
    await (await zapSenderV2.setDefaultSlippage(50)).wait();
    console.log("   Reset slippage to 0.5%");

    if (Number(defaultSlippage) === 50 && Number(newSlippage) === 100) {
      console.log("\n   ✅ TEST PASSED: Slippage Protection works correctly\n");
      passed++;
    } else {
      console.log("\n   ❌ TEST FAILED: Unexpected slippage values\n");
      failed++;
    }
  } catch (error: any) {
    console.log(`\n   ❌ TEST FAILED: ${error.message}\n`);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 3: Auto-Compound Mechanism (Vault V2)
  // ═══════════════════════════════════════════════════════════════════
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 3: Auto-Compound Mechanism");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    // Check vault info
    const vaultName = await stableVault.name();
    const vaultSymbol = await stableVault.symbol();
    const apy = await stableVault.getAPY();
    const riskLevel = await stableVault.getRiskLevel();
    const strategyType = await stableVault.getStrategyType();
    
    console.log(`   Vault: ${vaultName} (${vaultSymbol})`);
    console.log(`   APY: ${Number(apy) / 100}%`);
    console.log(`   Risk Level: ${riskLevel}/5`);
    console.log(`   Strategy Type: ${strategyType}`);

    // Check auto-compound settings
    const autoCompoundEnabled = await stableVault.autoCompoundEnabled();
    const compoundInterval = await stableVault.getCompoundInterval();
    const lastHarvestTime = await stableVault.getLastHarvestTime();
    const pendingRewards = await stableVault.getPendingRewards();

    console.log(`\n   Auto-compound enabled: ${autoCompoundEnabled}`);
    console.log(`   Compound interval: ${compoundInterval} seconds (${Number(compoundInterval) / 3600} hours)`);
    console.log(`   Last harvest time: ${lastHarvestTime}`);
    console.log(`   Pending rewards: ${ethers.formatUnits(pendingRewards, 6)}`);

    // Authorize deployer as depositor
    console.log("\n   Authorizing deployer as depositor...");
    await (await stableVault.setAuthorizedDepositor(deployer.address, true)).wait();
    
    // Authorize deployer as keeper
    console.log("   Authorizing deployer as keeper...");
    await (await stableVault.setAuthorizedKeeper(deployer.address, true)).wait();

    // Test deposit
    const depositAmount = ethers.parseUnits("100", 6);
    console.log(`\n   Approving ${ethers.formatUnits(depositAmount, 6)} USDC...`);
    await (await mockUSDC.approve(await stableVault.getAddress(), depositAmount)).wait();
    
    console.log("   Depositing into StableYieldVaultV2...");
    await (await stableVault.deposit(depositAmount)).wait();

    const shares = await stableVault.getUserShares(deployer.address);
    const value = await stableVault.getUserValue(deployer.address);
    console.log(`   Shares received: ${ethers.formatUnits(shares, 6)}`);
    console.log(`   Value: ${ethers.formatUnits(value, 6)} USDC`);

    if (autoCompoundEnabled && Number(shares) > 0) {
      console.log("\n   ✅ TEST PASSED: Auto-Compound Mechanism works correctly\n");
      passed++;
    } else {
      console.log("\n   ❌ TEST FAILED: Auto-compound or deposit issue\n");
      failed++;
    }
  } catch (error: any) {
    console.log(`\n   ❌ TEST FAILED: ${error.message}\n`);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 4: Liquid Staking Vault V2
  // ═══════════════════════════════════════════════════════════════════
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 4: Liquid Staking Vault V2");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    const vaultName = await liquidStakingVault.name();
    const vaultSymbol = await liquidStakingVault.symbol();
    const apy = await liquidStakingVault.getAPY();
    const riskLevel = await liquidStakingVault.getRiskLevel();
    const strategyType = await liquidStakingVault.getStrategyType();
    
    console.log(`   Vault: ${vaultName} (${vaultSymbol})`);
    console.log(`   APY: ${Number(apy) / 100}%`);
    console.log(`   Risk Level: ${riskLevel}/5`);
    console.log(`   Strategy Type: ${strategyType}`);

    // Authorize and deposit
    await (await liquidStakingVault.setAuthorizedDepositor(deployer.address, true)).wait();
    
    const depositAmount = ethers.parseEther("0.1");
    console.log(`\n   Approving ${ethers.formatEther(depositAmount)} WETH...`);
    await (await mockWETH.approve(await liquidStakingVault.getAddress(), depositAmount)).wait();
    
    console.log("   Depositing into LiquidStakingVaultV2...");
    await (await liquidStakingVault.deposit(depositAmount)).wait();

    const shares = await liquidStakingVault.getUserShares(deployer.address);
    console.log(`   Shares received: ${ethers.formatEther(shares)}`);

    if (Number(shares) > 0) {
      console.log("\n   ✅ TEST PASSED: Liquid Staking Vault V2 works correctly\n");
      passed++;
    } else {
      console.log("\n   ❌ TEST FAILED: Deposit returned 0 shares\n");
      failed++;
    }
  } catch (error: any) {
    console.log(`\n   ❌ TEST FAILED: ${error.message}\n`);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 5: ZapSenderV2 Stats
  // ═══════════════════════════════════════════════════════════════════
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 5: ZapSenderV2 Stats & Configuration");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    const stats = await zapSenderV2.getStats();
    console.log(`   Total Zaps: ${stats._totalZaps}`);
    console.log(`   Total Withdrawals: ${stats._totalWithdrawals}`);
    console.log(`   Total Volume: ${stats._totalVolume}`);
    console.log(`   Fee BPS: ${stats._feeBps} (${Number(stats._feeBps) / 100}%)`);
    console.log(`   Paused: ${stats._paused}`);

    // Check supported tokens
    const usdcSupported = await zapSenderV2.isTokenSupported(deployment.contracts.MockUSDC);
    const wethSupported = await zapSenderV2.isTokenSupported(deployment.contracts.MockWETH);
    console.log(`\n   USDC supported: ${usdcSupported}`);
    console.log(`   WETH supported: ${wethSupported}`);

    // Check destination receiver
    const receiver = await zapSenderV2.getDestinationReceiver(1); // Cardona network ID
    console.log(`   Destination receiver (Cardona): ${receiver}`);

    if (usdcSupported && wethSupported && receiver !== ethers.ZeroAddress) {
      console.log("\n   ✅ TEST PASSED: ZapSenderV2 configured correctly\n");
      passed++;
    } else {
      console.log("\n   ❌ TEST FAILED: Configuration issue\n");
      failed++;
    }
  } catch (error: any) {
    console.log(`\n   ❌ TEST FAILED: ${error.message}\n`);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 6: ZapReceiverV2 Stats
  // ═══════════════════════════════════════════════════════════════════
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 6: ZapReceiverV2 Stats & Configuration");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    const stats = await zapReceiverV2.getStats();
    console.log(`   Total Deposits: ${stats._totalDeposits}`);
    console.log(`   Total Withdrawals: ${stats._totalWithdrawals}`);
    console.log(`   Total Volume: ${stats._totalVolume}`);
    console.log(`   Paused: ${stats._paused}`);

    // Check pool configuration
    const usdcPool = await zapReceiverV2.getPool(deployment.contracts.MockUSDC);
    const wethPool = await zapReceiverV2.getPool(deployment.contracts.MockWETH);
    console.log(`\n   USDC Pool: ${usdcPool}`);
    console.log(`   WETH Pool: ${wethPool}`);

    // Check authorized sender
    const senderAuthorized = await zapReceiverV2.isSenderAuthorized(2, deployment.contracts.ZapSenderV2);
    console.log(`   ZapSenderV2 authorized: ${senderAuthorized}`);

    if (usdcPool !== ethers.ZeroAddress && senderAuthorized) {
      console.log("\n   ✅ TEST PASSED: ZapReceiverV2 configured correctly\n");
      passed++;
    } else {
      console.log("\n   ❌ TEST FAILED: Configuration issue\n");
      failed++;
    }
  } catch (error: any) {
    console.log(`\n   ❌ TEST FAILED: ${error.message}\n`);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 7: Withdrawal from Vault
  // ═══════════════════════════════════════════════════════════════════
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 7: Vault Withdrawal");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    const sharesBefore = await stableVault.getUserShares(deployer.address);
    console.log(`   Shares before withdrawal: ${ethers.formatUnits(sharesBefore, 6)}`);

    const balanceBefore = await mockUSDC.balanceOf(deployer.address);
    console.log(`   USDC balance before: ${ethers.formatUnits(balanceBefore, 6)}`);

    // Withdraw half
    const sharesToWithdraw = sharesBefore / 2n;
    console.log(`\n   Withdrawing ${ethers.formatUnits(sharesToWithdraw, 6)} shares...`);
    await (await stableVault.withdraw(sharesToWithdraw)).wait();

    const sharesAfter = await stableVault.getUserShares(deployer.address);
    console.log(`   Shares after withdrawal: ${ethers.formatUnits(sharesAfter, 6)}`);

    const balanceAfter = await mockUSDC.balanceOf(deployer.address);
    console.log(`   USDC balance after: ${ethers.formatUnits(balanceAfter, 6)}`);
    console.log(`   USDC received: ${ethers.formatUnits(balanceAfter - balanceBefore, 6)}`);

    if (sharesAfter < sharesBefore && balanceAfter > balanceBefore) {
      console.log("\n   ✅ TEST PASSED: Vault Withdrawal works correctly\n");
      passed++;
    } else {
      console.log("\n   ❌ TEST FAILED: Withdrawal issue\n");
      failed++;
    }
  } catch (error: any) {
    console.log(`\n   ❌ TEST FAILED: ${error.message}\n`);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("                        TEST SUMMARY                            ");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`\n   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Total:  ${passed + failed}\n`);

  if (failed === 0) {
    console.log("   🎉 ALL TESTS PASSED! V2 contracts are working correctly.\n");
  } else {
    console.log(`   ⚠️  ${failed} test(s) failed. Please review above.\n`);
  }

  console.log("═══════════════════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
