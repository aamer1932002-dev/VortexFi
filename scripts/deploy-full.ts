import { ethers } from "hardhat";

/**
 * Deploy ALL AggZap contracts to a single network for testing
 * This allows full end-to-end testing without needing two networks
 */

const BRIDGE_ADDRESS = "0x528e26b25a34a4A5d0dbDa1d57D318153d2ED582";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("\n=== AggZap Full Deployment ===");
  console.log("==============================");
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} POL\n`);

  // 1. Deploy Mock Tokens
  console.log("[1/6] Deploying Mock Tokens...");

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  console.log(`   - MockUSDC: ${await usdc.getAddress()}`);

  const MockWETH = await ethers.getContractFactory("MockWETH");
  const weth = await MockWETH.deploy();
  await weth.waitForDeployment();
  console.log(`   - MockWETH: ${await weth.getAddress()}`);

  // 2. Deploy LP Token
  console.log("\n[2/6] Deploying LP Token...");
  const ZapLP = await ethers.getContractFactory("ZapLP");
  const lpToken = await ZapLP.deploy();
  await lpToken.waitForDeployment();
  console.log(`   - ZapLP: ${await lpToken.getAddress()}`);

  // 3. Deploy Mock Pool (with LP token address)
  console.log("\n[3/6] Deploying Mock Pool...");
  const MockPool = await ethers.getContractFactory("MockPool");
  const pool = await MockPool.deploy(await lpToken.getAddress());
  await pool.waitForDeployment();
  console.log(`   - MockPool: ${await pool.getAddress()}`);

  // Set pool as LP token minter
  console.log("   - Setting pool as LP minter...");
  await (await lpToken.setPool(await pool.getAddress())).wait();

  // 4. Deploy ZapSender
  console.log("\n[4/6] Deploying ZapSender...");
  const ZapSender = await ethers.getContractFactory("ZapSender");
  const sender = await ZapSender.deploy(BRIDGE_ADDRESS, deployer.address);
  await sender.waitForDeployment();
  console.log(`   - ZapSender: ${await sender.getAddress()}`);

  // 5. Deploy ZapReceiver
  console.log("\n[5/6] Deploying ZapReceiver...");
  const ZapReceiver = await ethers.getContractFactory("ZapReceiver");
  const receiver = await ZapReceiver.deploy(BRIDGE_ADDRESS);
  await receiver.waitForDeployment();
  console.log(`   - ZapReceiver: ${await receiver.getAddress()}`);

  // 6. Configure all contracts
  console.log("\n[6/6] Configuring contracts...");

  // Pool configuration - add supported tokens
  await (await pool.addSupportedToken(await usdc.getAddress())).wait();
  await (await pool.addSupportedToken(await weth.getAddress())).wait();
  await (await pool.setAuthorizedDepositor(await receiver.getAddress(), true)).wait();
  console.log("   - Pool configured (USDC, WETH supported)");

  // ZapSender configuration
  await (await sender.setSupportedToken(await usdc.getAddress(), true)).wait();
  await (await sender.setSupportedToken(await weth.getAddress(), true)).wait();
  await (await sender.setDestinationReceiver(1, await receiver.getAddress())).wait();
  console.log("   - ZapSender configured");

  // ZapReceiver configuration
  await (await receiver.setPool(await usdc.getAddress(), await pool.getAddress())).wait();
  await (await receiver.authorizeSender(0, await sender.getAddress())).wait();
  console.log("   - ZapReceiver configured");

  // 7. Mint test tokens
  console.log("\n[+] Minting test tokens...");
  await (await usdc.mint(deployer.address, ethers.parseUnits("100000", 6))).wait();
  await (await weth.mint(deployer.address, ethers.parseEther("100"))).wait();
  await (await usdc.mint(await pool.getAddress(), ethers.parseUnits("1000000", 6))).wait();
  console.log("   - 100,000 USDC minted to deployer");
  console.log("   - 100 WETH minted to deployer");
  console.log("   - 1,000,000 USDC added to pool liquidity");

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("DEPLOYMENT COMPLETE!");
  console.log("=".repeat(50));
  console.log(`
Contract Addresses:
   MockUSDC:     ${await usdc.getAddress()}
   MockWETH:     ${await weth.getAddress()}
   ZapLP:        ${await lpToken.getAddress()}
   MockPool:     ${await pool.getAddress()}
   ZapSender:    ${await sender.getAddress()}
   ZapReceiver:  ${await receiver.getAddress()}
   Bridge:       ${BRIDGE_ADDRESS}

View on PolygonScan:
   https://amoy.polygonscan.com/address/${await sender.getAddress()}
  `);

  // Save deployment
  const deployment = {
    network: "amoy",
    chainId: 80002,
    timestamp: new Date().toISOString(),
    contracts: {
      MockUSDC: await usdc.getAddress(),
      MockWETH: await weth.getAddress(),
      ZapLP: await lpToken.getAddress(),
      MockPool: await pool.getAddress(),
      ZapSender: await sender.getAddress(),
      ZapReceiver: await receiver.getAddress(),
      Bridge: BRIDGE_ADDRESS,
    },
  };

  const fs = require("fs");
  const path = require("path");

  // Save to deployments folder
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(deploymentsDir, "amoy-full.json"),
    JSON.stringify(deployment, null, 2)
  );

  // Update frontend config
  const frontendConfig = path.join(__dirname, "..", "frontend", "src", "config", "deployments.json");
  fs.writeFileSync(frontendConfig, JSON.stringify({ amoy: deployment }, null, 2));
  console.log("Deployment saved to deployments/amoy-full.json");
  console.log("Frontend config updated!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
