import { ethers } from "hardhat";

// Deployed contract addresses on Polygon Amoy
const DEPLOYED = {
  ZapSender: "0xE78E6788807c8C3Dbf3d06711d8C525a3C04C474",
  ZapReceiver: "0x0487348876b6cA34F3CCF1459386f2D6e638be8c",
  MockPool: "0x9CC0D4B6f3cF20a8c541C716BF8646c9d562373a",
  MockUSDC: "0x52e5E849e23C763be6A1BdB509f11Da1c212e7a2",
  MockWETH: "0xf2a2Ff159744C7Fc9b06cB52c5e06a63536956fC",
  ZapLP: "0x828fcF4603c201844fdD2DE6D00E76E2097e9f11",
  Bridge: "0x528e26b25a34a4A5d0dbDa1d57D318153d2ED582"
};

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         AggZap E2E Testing on Polygon Amoy                ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const [signer] = await ethers.getSigners();
  console.log("📍 Connected with wallet:", signer.address);
  
  const balance = await ethers.provider.getBalance(signer.address);
  console.log("💰 MATIC Balance:", ethers.formatEther(balance), "MATIC\n");

  // Connect to deployed contracts
  console.log("🔗 Connecting to deployed contracts...\n");
  
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const MockWETH = await ethers.getContractFactory("MockWETH");
  const ZapLP = await ethers.getContractFactory("ZapLP");
  const MockPool = await ethers.getContractFactory("MockPool");
  const ZapSender = await ethers.getContractFactory("ZapSender");
  const ZapReceiver = await ethers.getContractFactory("ZapReceiver");
  
  const usdc = MockUSDC.attach(DEPLOYED.MockUSDC);
  const weth = MockWETH.attach(DEPLOYED.MockWETH);
  const zapLP = ZapLP.attach(DEPLOYED.ZapLP);
  const pool = MockPool.attach(DEPLOYED.MockPool);
  const zapSender = ZapSender.attach(DEPLOYED.ZapSender);
  const zapReceiver = ZapReceiver.attach(DEPLOYED.ZapReceiver);

  // ========== STEP 1: Check Token Balances ==========
  console.log("═══════════════════════════════════════════════════════════");
  console.log("📊 STEP 1: Checking Token Balances");
  console.log("═══════════════════════════════════════════════════════════\n");
  
  const usdcBalance = await usdc.balanceOf(signer.address);
  const wethBalance = await weth.balanceOf(signer.address);
  const lpBalance = await zapLP.balanceOf(signer.address);
  
  console.log(`   USDC Balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);
  console.log(`   WETH Balance: ${ethers.formatEther(wethBalance)} WETH`);
  console.log(`   LP Balance:   ${ethers.formatEther(lpBalance)} ZAP-LP\n`);

  // ========== STEP 2: Mint Test Tokens if needed ==========
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🪙 STEP 2: Minting Test Tokens (if needed)");
  console.log("═══════════════════════════════════════════════════════════\n");
  
  const mintAmount = ethers.parseUnits("1000", 6); // 1000 USDC
  
  if (usdcBalance < mintAmount) {
    console.log("   Minting 1000 USDC...");
    try {
      const tx1 = await usdc.mint(signer.address, mintAmount);
      await tx1.wait();
      console.log("   ✅ Minted 1000 USDC\n");
    } catch (e: any) {
      console.log("   ⚠️ Could not mint USDC:", e.reason || e.message);
    }
  } else {
    console.log("   ✅ Already have sufficient USDC\n");
  }

  // ========== STEP 3: Check Contract States ==========
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🔍 STEP 3: Checking Contract States");
  console.log("═══════════════════════════════════════════════════════════\n");
  
  try {
    // Check MockPool supported tokens
    const isUsdcSupported = await pool.supportedTokens(DEPLOYED.MockUSDC);
    const isWethSupported = await pool.supportedTokens(DEPLOYED.MockWETH);
    
    console.log("   MockPool Token Support:");
    console.log(`   - USDC supported: ${isUsdcSupported}`);
    console.log(`   - WETH supported: ${isWethSupported}`);
    
    // Check LP token address
    const lpTokenAddress = await pool.lpToken();
    console.log(`   - LP Token: ${lpTokenAddress}`);
    console.log(`   - Expected ZapLP: ${DEPLOYED.ZapLP}\n`);
    
  } catch (e: any) {
    console.log("   ⚠️ Error checking pool state:", e.reason || e.message);
  }

  // ========== STEP 4: Test Direct Pool Deposit (User → Pool) ==========
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🧪 STEP 4: Testing Direct Pool Deposit");
  console.log("═══════════════════════════════════════════════════════════\n");
  
  const depositAmount = ethers.parseUnits("100", 6); // 100 USDC
  
  try {
    // First, approve the pool to spend USDC
    console.log("   Approving USDC for MockPool...");
    const approveTx = await usdc.approve(DEPLOYED.MockPool, depositAmount);
    await approveTx.wait();
    console.log("   ✅ Approved 100 USDC for pool\n");
    
    // Check allowance
    const allowance = await usdc.allowance(signer.address, DEPLOYED.MockPool);
    console.log(`   Current allowance: ${ethers.formatUnits(allowance, 6)} USDC\n`);
    
    // Try deposit - correct signature: deposit(user, token, amount)
    console.log("   Attempting deposit of 100 USDC...");
    const depositTx = await pool.deposit(
      signer.address,           // user
      DEPLOYED.MockUSDC,        // token
      depositAmount             // amount
    );
    await depositTx.wait();
    console.log("   ✅ Deposit successful!\n");
    
    // Check new LP balance
    const newLPBalance = await zapLP.balanceOf(signer.address);
    console.log(`   New LP Balance: ${ethers.formatEther(newLPBalance)} ZAP-LP\n`);
    
  } catch (e: any) {
    console.log("   ❌ Deposit failed:", e.reason || e.message);
    console.log("\n   This may be due to token not being supported in pool.");
    console.log("   Checking if we need to add supported token...\n");
  }

  // ========== STEP 5: Check ZapSender Configuration ==========
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🔧 STEP 5: Checking ZapSender Configuration");
  console.log("═══════════════════════════════════════════════════════════\n");
  
  try {
    const bridgeAddress = await zapSender.bridge();
    console.log(`   Bridge address: ${bridgeAddress}`);
    console.log(`   Expected bridge: ${DEPLOYED.Bridge}\n`);
  } catch (e: any) {
    console.log("   ⚠️ Could not read ZapSender config:", e.reason || e.message);
  }

  // ========== STEP 6: Simulate Cross-Chain Zap (ZapSender) ==========
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🌉 STEP 6: Testing ZapSender (Cross-Chain Zap Initiation)");
  console.log("═══════════════════════════════════════════════════════════\n");
  
  const zapAmount = ethers.parseUnits("50", 6); // 50 USDC
  
  try {
    // Approve ZapSender
    console.log("   Approving USDC for ZapSender...");
    const approveTx = await usdc.approve(DEPLOYED.ZapSender, zapAmount);
    await approveTx.wait();
    console.log("   ✅ Approved 50 USDC for ZapSender\n");
    
    // Check balances before zap
    const usdcBefore = await usdc.balanceOf(signer.address);
    console.log(`   USDC before zap: ${ethers.formatUnits(usdcBefore, 6)}`);
    
    // Execute zap - correct signature: zapLiquidity(destinationZapContract, token, amount, destinationNetworkId)
    console.log("\n   Executing zapLiquidity...");
    console.log("   (This will transfer tokens to the bridge for cross-chain delivery)\n");
    
    const zapTx = await zapSender.zapLiquidity(
      DEPLOYED.ZapReceiver,     // destinationZapContract
      DEPLOYED.MockUSDC,        // token
      zapAmount,                // amount
      1                         // destinationNetworkId (1 = Ethereum in this mock)
    );
    
    const receipt = await zapTx.wait();
    console.log("   ✅ zapLiquidity executed!");
    console.log(`   Transaction hash: ${receipt?.hash}`);
    console.log(`   Gas used: ${receipt?.gasUsed.toString()}\n`);
    
    // Check balances after zap
    const usdcAfter = await usdc.balanceOf(signer.address);
    console.log(`   USDC after zap: ${ethers.formatUnits(usdcAfter, 6)}`);
    console.log(`   USDC transferred: ${ethers.formatUnits(usdcBefore - usdcAfter, 6)}\n`);
    
  } catch (e: any) {
    console.log("   ❌ ZapSender failed:", e.reason || e.message);
    console.log("\n   The zap may fail if token is not supported or receiver not set.");
    console.log("   Checking ZapSender configuration...\n");
  }

  // ========== STEP 7: Test Withdraw (if LP balance exists) ==========
  console.log("═══════════════════════════════════════════════════════════");
  console.log("💸 STEP 7: Testing Withdrawal");
  console.log("═══════════════════════════════════════════════════════════\n");
  
  const currentLP = await zapLP.balanceOf(signer.address);
  
  if (currentLP > 0n) {
    try {
      const withdrawAmount = currentLP / 2n; // Withdraw half
      console.log(`   Withdrawing ${ethers.formatEther(withdrawAmount)} LP tokens...`);
      
      // The withdraw function: withdraw(user, lpAmount)
      const withdrawTx = await pool.withdraw(signer.address, withdrawAmount);
      await withdrawTx.wait();
      console.log("   ✅ Withdrawal successful!\n");
      
      // Check final balances
      const finalUsdc = await usdc.balanceOf(signer.address);
      const finalLP = await zapLP.balanceOf(signer.address);
      console.log(`   Final USDC: ${ethers.formatUnits(finalUsdc, 6)}`);
      console.log(`   Final LP: ${ethers.formatEther(finalLP)}\n`);
      
    } catch (e: any) {
      console.log("   ❌ Withdraw failed:", e.reason || e.message);
    }
  } else {
    console.log("   ⚠️ No LP tokens to withdraw\n");
  }

  // ========== FINAL SUMMARY ==========
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                    E2E Test Summary                        ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  const finalUsdcBalance = await usdc.balanceOf(signer.address);
  const finalWethBalance = await weth.balanceOf(signer.address);
  const finalLpBalance = await zapLP.balanceOf(signer.address);
  const finalMaticBalance = await ethers.provider.getBalance(signer.address);
  
  console.log("   📊 Final Balances:");
  console.log(`   - MATIC: ${ethers.formatEther(finalMaticBalance)}`);
  console.log(`   - USDC:  ${ethers.formatUnits(finalUsdcBalance, 6)}`);
  console.log(`   - WETH:  ${ethers.formatEther(finalWethBalance)}`);
  console.log(`   - LP:    ${ethers.formatEther(finalLpBalance)}\n`);
  
  console.log("   🔗 Contract Addresses:");
  console.log(`   - ZapSender:   ${DEPLOYED.ZapSender}`);
  console.log(`   - ZapReceiver: ${DEPLOYED.ZapReceiver}`);
  console.log(`   - MockPool:    ${DEPLOYED.MockPool}`);
  console.log(`   - MockUSDC:    ${DEPLOYED.MockUSDC}`);
  console.log(`   - MockWETH:    ${DEPLOYED.MockWETH}`);
  console.log(`   - ZapLP:       ${DEPLOYED.ZapLP}\n`);
  
  console.log("   🌐 Frontend: https://vortexfi.vercel.app");
  console.log("   📦 GitHub:   https://github.com/AhmedAmer72/AggZap\n");
  
  console.log("═══════════════════════════════════════════════════════════");
  console.log("                    E2E Test Complete!");
  console.log("═══════════════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed with error:", error);
    process.exit(1);
  });
