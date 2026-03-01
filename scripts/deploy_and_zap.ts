import { ethers } from "hardhat";

/**
 * AggZap Deployment & Interaction Script
 * 
 * This script demonstrates the complete flow of a cross-chain zap:
 * 1. Deploy ZapReceiver on destination chain (Cardona/zkEVM)
 * 2. Deploy MockPool for testing
 * 3. Deploy ZapSender on source chain (Amoy)
 * 4. Configure all contracts
 * 5. Execute a test zap
 * 
 * THE CRITICAL PART: Constructing the bridgeAndCall() payload
 */

// ═══════════════════════════════════════════════════════════════════════
//                         CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════

// Network IDs in Polygon Unified Bridge
const NETWORK_IDS = {
  ETHEREUM_MAINNET: 0,
  POLYGON_ZKEVM: 1,
  POLYGON_POS: 2,
  AMOY_TESTNET: 2,      // Amoy uses same ID as PoS
  CARDONA_TESTNET: 1,   // Cardona uses same ID as zkEVM
};

// Bridge addresses (Unified Bridge)
const BRIDGE_ADDRESSES = {
  AMOY: "0x528e26b25a34a4A5d0dbDa1d57D318153d2ED582",
  CARDONA: "0x528e26b25a34a4A5d0dbDa1d57D318153d2ED582",
};

// For local testing
const LOCAL_BRIDGE = "0x0000000000000000000000000000000000000001";

interface DeployedContracts {
  zapSender?: string;
  zapReceiver?: string;
  mockPool?: string;
  mockUSDC?: string;
  zapLP?: string;
}

// ═══════════════════════════════════════════════════════════════════════
//                         DEPLOYMENT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

async function deployMockTokens() {
  console.log("\n📦 Deploying Mock Tokens...\n");

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  console.log(`   ✅ MockUSDC deployed to: ${await mockUSDC.getAddress()}`);

  const MockWETH = await ethers.getContractFactory("MockWETH");
  const mockWETH = await MockWETH.deploy();
  await mockWETH.waitForDeployment();
  console.log(`   ✅ MockWETH deployed to: ${await mockWETH.getAddress()}`);

  return { mockUSDC, mockWETH };
}

async function deployMockPool() {
  console.log("\n📦 Deploying MockPool...\n");

  const MockPool = await ethers.getContractFactory("MockPool");
  const mockPool = await MockPool.deploy();
  await mockPool.waitForDeployment();
  
  const poolAddress = await mockPool.getAddress();
  const lpTokenAddress = await mockPool.lpToken();
  
  console.log(`   ✅ MockPool deployed to: ${poolAddress}`);
  console.log(`   ✅ ZapLP token at: ${lpTokenAddress}`);

  return { mockPool, lpTokenAddress };
}

async function deployZapReceiver(bridgeAddress: string) {
  console.log("\n📦 Deploying ZapReceiver (Destination Chain)...\n");

  const ZapReceiver = await ethers.getContractFactory("ZapReceiver");
  const zapReceiver = await ZapReceiver.deploy(bridgeAddress);
  await zapReceiver.waitForDeployment();
  
  const address = await zapReceiver.getAddress();
  console.log(`   ✅ ZapReceiver deployed to: ${address}`);

  return zapReceiver;
}

async function deployZapSender(bridgeAddress: string, feeRecipient: string) {
  console.log("\n📦 Deploying ZapSender (Source Chain)...\n");

  const ZapSender = await ethers.getContractFactory("ZapSender");
  const zapSender = await ZapSender.deploy(bridgeAddress, feeRecipient);
  await zapSender.waitForDeployment();
  
  const address = await zapSender.getAddress();
  console.log(`   ✅ ZapSender deployed to: ${address}`);

  return zapSender;
}

// ═══════════════════════════════════════════════════════════════════════
//                    PAYLOAD CONSTRUCTION (THE CRITICAL PART)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Constructs the calldata for bridgeAndCall()
 * 
 * This is what gets executed on ZapReceiver after the bridge completes.
 * The bridge will call: ZapReceiver.onMessageReceived(originAddress, originNetwork, data)
 * 
 * The 'data' parameter contains our encoded intent:
 * - user: who should receive the LP tokens
 * - token: what token is being deposited
 * - amount: how much
 */
function encodeZapCalldata(
  user: string,
  token: string,
  amount: bigint
): string {
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  
  // This matches what ZapReceiver.onMessageReceived() expects to decode
  const encoded = abiCoder.encode(
    ["address", "address", "uint256"],
    [user, token, amount]
  );

  console.log("\n🔧 Encoded Calldata for bridgeAndCall():");
  console.log(`   User: ${user}`);
  console.log(`   Token: ${token}`);
  console.log(`   Amount: ${amount.toString()}`);
  console.log(`   Encoded: ${encoded}\n`);

  return encoded;
}

// ═══════════════════════════════════════════════════════════════════════
//                         LOCAL TEST FLOW
// ═══════════════════════════════════════════════════════════════════════

async function runLocalTest() {
  console.log("\n" + "═".repeat(70));
  console.log("                    AggZap Local Deployment Test");
  console.log("═".repeat(70));

  const [deployer, user] = await ethers.getSigners();
  console.log(`\n👤 Deployer: ${deployer.address}`);
  console.log(`👤 Test User: ${user.address}`);

  // 1. Deploy mock tokens
  const { mockUSDC, mockWETH } = await deployMockTokens();

  // 2. Deploy MockPool (destination chain simulation)
  const { mockPool, lpTokenAddress } = await deployMockPool();

  // 3. Configure MockPool to accept USDC
  await mockPool.setSupportedToken(await mockUSDC.getAddress(), true);
  console.log("   ✅ MockPool configured to accept USDC");

  // 4. Deploy ZapReceiver (would be on destination chain)
  const zapReceiver = await deployZapReceiver(LOCAL_BRIDGE);
  
  // 5. Deploy ZapSender (would be on source chain)
  const zapSender = await deployZapSender(LOCAL_BRIDGE, deployer.address);

  // 6. Configure ZapSender
  await zapSender.setSupportedToken(await mockUSDC.getAddress(), true);
  await zapSender.setDestinationReceiver(
    NETWORK_IDS.CARDONA_TESTNET,
    await zapReceiver.getAddress()
  );
  console.log("   ✅ ZapSender configured");

  // 7. Configure ZapReceiver
  await zapReceiver.authorizeSender(
    NETWORK_IDS.AMOY_TESTNET,
    await zapSender.getAddress()
  );
  await zapReceiver.setPool(await mockUSDC.getAddress(), await mockPool.getAddress());
  console.log("   ✅ ZapReceiver configured");

  // 8. Authorize ZapReceiver as depositor in MockPool
  await mockPool.setAuthorizedDepositor(await zapReceiver.getAddress(), true);
  console.log("   ✅ MockPool authorized ZapReceiver");

  // 9. Give user some USDC
  await mockUSDC.mint(user.address, ethers.parseUnits("10000", 6));
  console.log("   ✅ Minted 10,000 USDC to test user");

  // Display deployment summary
  console.log("\n" + "─".repeat(70));
  console.log("                      Deployment Summary");
  console.log("─".repeat(70));
  console.log(`   MockUSDC:     ${await mockUSDC.getAddress()}`);
  console.log(`   MockWETH:     ${await mockWETH.getAddress()}`);
  console.log(`   MockPool:     ${await mockPool.getAddress()}`);
  console.log(`   ZapLP:        ${lpTokenAddress}`);
  console.log(`   ZapSender:    ${await zapSender.getAddress()}`);
  console.log(`   ZapReceiver:  ${await zapReceiver.getAddress()}`);
  console.log("─".repeat(70));

  // 10. Demonstrate the calldata encoding
  const zapAmount = ethers.parseUnits("100", 6); // 100 USDC
  const calldata = encodeZapCalldata(
    user.address,
    await mockUSDC.getAddress(),
    zapAmount
  );

  console.log("\n" + "═".repeat(70));
  console.log("                    bridgeAndCall() Payload Demo");
  console.log("═".repeat(70));
  console.log(`
In a real cross-chain zap, ZapSender would call:

bridge.bridgeAndCall(
    destinationNetwork: ${NETWORK_IDS.CARDONA_TESTNET},
    destinationAddress: ${await zapReceiver.getAddress()},
    fallbackAddress:    ${user.address},
    amount:             ${zapAmount.toString()} (100 USDC),
    token:              ${await mockUSDC.getAddress()},
    forceUpdateGER:     true,
    permitData:         "",
    callData:           ${calldata}
)

The bridge would then:
1. Lock tokens on source chain
2. Mint equivalent on destination chain
3. Call ZapReceiver.onMessageReceived() with the calldata
4. ZapReceiver decodes and deposits into MockPool
5. User receives LP tokens on destination chain
`);

  return {
    contracts: {
      mockUSDC: await mockUSDC.getAddress(),
      mockWETH: await mockWETH.getAddress(),
      mockPool: await mockPool.getAddress(),
      zapLP: lpTokenAddress,
      zapSender: await zapSender.getAddress(),
      zapReceiver: await zapReceiver.getAddress(),
    },
    instances: {
      mockUSDC,
      mockWETH,
      mockPool,
      zapSender,
      zapReceiver,
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════
//                         TESTNET DEPLOYMENT
// ═══════════════════════════════════════════════════════════════════════

async function deployToAmoy() {
  console.log("\n🚀 Deploying ZapSender to Amoy Testnet...\n");
  
  const [deployer] = await ethers.getSigners();
  const bridgeAddress = BRIDGE_ADDRESSES.AMOY;
  
  const zapSender = await deployZapSender(bridgeAddress, deployer.address);
  
  // Configure with testnet USDC if available
  // await zapSender.setSupportedToken(USDC_AMOY, true);
  
  console.log("\n✅ ZapSender deployed to Amoy!");
  console.log(`   Address: ${await zapSender.getAddress()}`);
  
  return zapSender;
}

async function deployToCardona() {
  console.log("\n🚀 Deploying ZapReceiver & MockPool to Cardona Testnet...\n");
  
  const [deployer] = await ethers.getSigners();
  const bridgeAddress = BRIDGE_ADDRESSES.CARDONA;
  
  // Deploy mock tokens for testing
  const { mockUSDC } = await deployMockTokens();
  
  // Deploy MockPool
  const { mockPool, lpTokenAddress } = await deployMockPool();
  
  // Deploy ZapReceiver
  const zapReceiver = await deployZapReceiver(bridgeAddress);
  
  // Configure
  await mockPool.setSupportedToken(await mockUSDC.getAddress(), true);
  await mockPool.setAuthorizedDepositor(await zapReceiver.getAddress(), true);
  await zapReceiver.setPool(await mockUSDC.getAddress(), await mockPool.getAddress());
  
  console.log("\n✅ Contracts deployed to Cardona!");
  console.log(`   MockUSDC:    ${await mockUSDC.getAddress()}`);
  console.log(`   MockPool:    ${await mockPool.getAddress()}`);
  console.log(`   ZapLP:       ${lpTokenAddress}`);
  console.log(`   ZapReceiver: ${await zapReceiver.getAddress()}`);
  
  return { mockUSDC, mockPool, zapReceiver };
}

// ═══════════════════════════════════════════════════════════════════════
//                              MAIN
// ═══════════════════════════════════════════════════════════════════════

async function main() {
  const networkName = (await ethers.provider.getNetwork()).name;
  
  console.log(`\n🌐 Network: ${networkName}`);
  
  if (networkName === "hardhat" || networkName === "unknown") {
    // Local test
    await runLocalTest();
  } else if (networkName === "amoy") {
    await deployToAmoy();
  } else if (networkName === "cardona") {
    await deployToCardona();
  } else {
    console.log("Unknown network. Running local test instead.");
    await runLocalTest();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export { 
  runLocalTest, 
  deployToAmoy, 
  deployToCardona,
  encodeZapCalldata,
  NETWORK_IDS,
  BRIDGE_ADDRESSES 
};
