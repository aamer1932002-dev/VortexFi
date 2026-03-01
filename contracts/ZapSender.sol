// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IPolygonZkEVMBridgeV2.sol";

/**
 * @title ZapSender
 * @author AggZap Team
 * @notice Source chain contract for initiating cross-chain DeFi deposits
 * @dev This is the "entry point" for users on Polygon PoS/Amoy
 * 
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║                        AggZap Architecture                        ║
 * ╠═══════════════════════════════════════════════════════════════════╣
 * ║  User (Polygon PoS)                                                ║
 * ║       │                                                            ║
 * ║       ▼                                                            ║
 * ║  [ZapSender.sol] ──bridgeAndCall()──► [AggLayer Bridge]           ║
 * ║       │                                      │                     ║
 * ║       │                                      ▼                     ║
 * ║       │                              [ZapReceiver.sol]            ║
 * ║       │                                      │                     ║
 * ║       │                                      ▼                     ║
 * ║       │                              [DeFi Protocol]              ║
 * ║       │                                      │                     ║
 * ║       └──────────── LP Tokens ◄──────────────┘                    ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 * 
 * WHY bridgeAndCall() IS USED:
 * Traditional bridging requires multiple transactions:
 *   1. Approve bridge on source chain
 *   2. Bridge tokens (wait for finality)
 *   3. Claim on destination
 *   4. Approve DeFi protocol
 *   5. Deposit into DeFi protocol
 * 
 * With bridgeAndCall():
 *   1. Single transaction that does EVERYTHING atomically
 * 
 * This is the "Chain Abstraction" that VCs are funding in 2025.
 */
contract ZapSender is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ═══════════════════════════════════════════════════════════════════
    //                              STATE
    // ═══════════════════════════════════════════════════════════════════

    /// @notice The Polygon Unified Bridge contract
    IPolygonZkEVMBridgeV2 public immutable bridge;

    /// @notice Mapping of destination network ID to ZapReceiver address
    mapping(uint32 => address) public destinationReceivers;

    /// @notice Mapping of supported tokens
    mapping(address => bool) public supportedTokens;

    /// @notice Protocol fee in basis points (100 = 1%)
    uint256 public feeBps = 10; // 0.1% default fee

    /// @notice Fee recipient
    address public feeRecipient;

    /// @notice Total zaps executed
    uint256 public totalZaps;

    /// @notice Total volume in USD (approximated)
    uint256 public totalVolume;

    // ═══════════════════════════════════════════════════════════════════
    //                              EVENTS
    // ═══════════════════════════════════════════════════════════════════

    event ZapInitiated(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint32 destinationNetwork,
        address destinationReceiver,
        bytes32 indexed zapId
    );

    event ReceiverUpdated(uint32 indexed networkId, address receiver);
    event TokenSupportUpdated(address indexed token, bool supported);
    event FeeUpdated(uint256 newFeeBps);
    event FeeRecipientUpdated(address newRecipient);

    // ═══════════════════════════════════════════════════════════════════
    //                              ERRORS
    // ═══════════════════════════════════════════════════════════════════

    error InvalidBridgeAddress();
    error InvalidDestinationReceiver();
    error UnsupportedToken();
    error InvalidAmount();
    error FeeTooHigh();
    error TransferFailed();

    // ═══════════════════════════════════════════════════════════════════
    //                           CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Initialize the ZapSender contract
     * @param _bridge Address of the Polygon Unified Bridge
     * @param _feeRecipient Address to receive protocol fees
     */
    constructor(
        address _bridge,
        address _feeRecipient
    ) Ownable(msg.sender) {
        if (_bridge == address(0)) revert InvalidBridgeAddress();
        bridge = IPolygonZkEVMBridgeV2(_bridge);
        feeRecipient = _feeRecipient == address(0) ? msg.sender : _feeRecipient;
    }

    // ═══════════════════════════════════════════════════════════════════
    //                         CORE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Execute a cross-chain zap to deposit into a DeFi protocol
     * @dev This is the main entry point for users
     * 
     * FLOW:
     * 1. User calls zapLiquidity() with their tokens
     * 2. Contract transfers tokens from user
     * 3. Contract approves bridge to spend tokens
     * 4. Contract encodes the destination call (depositFor(user))
     * 5. Contract calls bridgeAndCall() - THE MAGIC HAPPENS
     * 6. Bridge atomically moves tokens and calls ZapReceiver
     * 7. ZapReceiver deposits into DeFi and mints LP to user
     * 
     * @param destinationZapContract Address of ZapReceiver on destination
     * @param token The token to bridge (e.g., USDC)
     * @param amount The amount to bridge
     * @param destinationNetworkId The network ID of the destination chain
     * @return zapId Unique identifier for this zap
     */
    function zapLiquidity(
        address destinationZapContract,
        address token,
        uint256 amount,
        uint32 destinationNetworkId
    ) external nonReentrant returns (bytes32 zapId) {
        // ─────────────────────────────────────────────────────────────
        // VALIDATION
        // ─────────────────────────────────────────────────────────────
        if (destinationZapContract == address(0)) revert InvalidDestinationReceiver();
        if (!supportedTokens[token]) revert UnsupportedToken();
        if (amount == 0) revert InvalidAmount();

        // ─────────────────────────────────────────────────────────────
        // FEE CALCULATION
        // ─────────────────────────────────────────────────────────────
        uint256 fee = (amount * feeBps) / 10000;
        uint256 amountAfterFee = amount - fee;

        // ─────────────────────────────────────────────────────────────
        // TOKEN TRANSFER
        // ─────────────────────────────────────────────────────────────
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Transfer fee to recipient
        if (fee > 0 && feeRecipient != address(0)) {
            IERC20(token).safeTransfer(feeRecipient, fee);
        }

        // ─────────────────────────────────────────────────────────────
        // BRIDGE APPROVAL
        // ─────────────────────────────────────────────────────────────
        IERC20(token).approve(address(bridge), amountAfterFee);

        // ─────────────────────────────────────────────────────────────
        // ENCODE DESTINATION CALL
        // This is what gets executed on ZapReceiver after bridging
        // ─────────────────────────────────────────────────────────────
        bytes memory callData = abi.encode(
            msg.sender,  // Original user (will receive LP tokens)
            token,       // Token being deposited
            amountAfterFee // Amount after fees
        );

        // ─────────────────────────────────────────────────────────────
        // EXECUTE bridgeAndCall() - THE CORE OF AGGLAYER
        // ─────────────────────────────────────────────────────────────
        // Why bridgeAndCall() instead of bridgeAsset():
        // - bridgeAsset() only moves tokens, requiring manual claim
        // - bridgeAndCall() atomically bridges AND calls destination contract
        // - User gets their DeFi position in ONE transaction
        // - This is what makes AggZap "chainless"
        bridge.bridgeAndCall(
            destinationNetworkId,      // Where we're going (e.g., zkEVM)
            destinationZapContract,    // Who receives the call (ZapReceiver)
            msg.sender,                // Fallback: if call fails, user gets tokens
            amountAfterFee,            // How much to bridge
            token,                     // What token
            true,                      // Force update global exit root (faster)
            "",                        // No permit data (already approved)
            callData                   // The encoded depositFor() call
        );

        // ─────────────────────────────────────────────────────────────
        // RECORD KEEPING
        // ─────────────────────────────────────────────────────────────
        zapId = keccak256(abi.encodePacked(
            msg.sender,
            token,
            amount,
            destinationNetworkId,
            block.timestamp,
            totalZaps
        ));

        totalZaps++;
        totalVolume += amount;

        emit ZapInitiated(
            msg.sender,
            token,
            amount,
            destinationNetworkId,
            destinationZapContract,
            zapId
        );
    }

    /**
     * @notice Zap with native ETH (wraps to WETH)
     * @param destinationZapContract Address of ZapReceiver on destination
     * @param destinationNetworkId The network ID of the destination chain
     */
    function zapLiquidityETH(
        address destinationZapContract,
        uint32 destinationNetworkId
    ) external payable nonReentrant returns (bytes32 zapId) {
        if (destinationZapContract == address(0)) revert InvalidDestinationReceiver();
        if (msg.value == 0) revert InvalidAmount();

        uint256 fee = (msg.value * feeBps) / 10000;
        uint256 amountAfterFee = msg.value - fee;

        // Transfer fee
        if (fee > 0 && feeRecipient != address(0)) {
            (bool sent, ) = feeRecipient.call{value: fee}("");
            if (!sent) revert TransferFailed();
        }

        bytes memory callData = abi.encode(
            msg.sender,
            address(0), // address(0) represents native ETH
            amountAfterFee
        );

        // bridgeAndCall with native ETH
        bridge.bridgeAndCall{value: amountAfterFee}(
            destinationNetworkId,
            destinationZapContract,
            msg.sender,
            amountAfterFee,
            address(0), // Native ETH
            true,
            "",
            callData
        );

        zapId = keccak256(abi.encodePacked(
            msg.sender,
            address(0),
            msg.value,
            destinationNetworkId,
            block.timestamp,
            totalZaps
        ));

        totalZaps++;
        totalVolume += msg.value;

        emit ZapInitiated(
            msg.sender,
            address(0),
            msg.value,
            destinationNetworkId,
            destinationZapContract,
            zapId
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    //                         ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Set the ZapReceiver address for a destination network
     */
    function setDestinationReceiver(
        uint32 networkId,
        address receiver
    ) external onlyOwner {
        destinationReceivers[networkId] = receiver;
        emit ReceiverUpdated(networkId, receiver);
    }

    /**
     * @notice Add or remove a supported token
     */
    function setSupportedToken(
        address token,
        bool supported
    ) external onlyOwner {
        supportedTokens[token] = supported;
        emit TokenSupportUpdated(token, supported);
    }

    /**
     * @notice Update the protocol fee (max 1%)
     */
    function setFee(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > 100) revert FeeTooHigh(); // Max 1%
        feeBps = newFeeBps;
        emit FeeUpdated(newFeeBps);
    }

    /**
     * @notice Update the fee recipient
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }

    /**
     * @notice Emergency token recovery
     */
    function recoverTokens(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        if (token == address(0)) {
            (bool sent, ) = to.call{value: amount}("");
            if (!sent) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //                         VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Get the receiver address for a destination network
     */
    function getDestinationReceiver(uint32 networkId) external view returns (address) {
        return destinationReceivers[networkId];
    }

    /**
     * @notice Check if a token is supported
     */
    function isTokenSupported(address token) external view returns (bool) {
        return supportedTokens[token];
    }

    /**
     * @notice Calculate the fee for an amount
     */
    function calculateFee(uint256 amount) external view returns (uint256) {
        return (amount * feeBps) / 10000;
    }

    /**
     * @notice Get protocol statistics
     */
    function getStats() external view returns (
        uint256 _totalZaps,
        uint256 _totalVolume,
        uint256 _feeBps
    ) {
        return (totalZaps, totalVolume, feeBps);
    }

    receive() external payable {}
}
