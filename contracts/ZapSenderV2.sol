// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IPolygonZkEVMBridgeV2.sol";

/**
 * @title ZapSenderV2
 * @author AggZap Team
 * @notice Source chain contract for initiating cross-chain DeFi deposits (V2)
 * @dev V2 includes: Emergency Pause, Slippage Protection, Withdrawal Flow, Multi-Vault Zapping
 * 
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║                    AggZap V2 Architecture                         ║
 * ╠═══════════════════════════════════════════════════════════════════╣
 * ║  NEW IN V2:                                                        ║
 * ║  • Emergency Pause - Halt all operations if exploit detected      ║
 * ║  • Slippage Protection - minLpOut & deadline parameters           ║
 * ║  • Withdrawal Flow - zapWithdraw() for reverse cross-chain exits  ║
 * ║  • Multi-Vault Zapping - zapMultiple() for portfolio diversification ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */
contract ZapSenderV2 is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ═══════════════════════════════════════════════════════════════════
    //                              STRUCTS
    // ═══════════════════════════════════════════════════════════════════

    /// @notice Intent for multi-vault zapping
    struct ZapIntent {
        address destinationZapContract;
        address token;
        uint256 amount;
        uint32 destinationNetworkId;
        uint256 minLpOut;
    }

    /// @notice Withdrawal request structure
    struct WithdrawRequest {
        address user;
        address lpToken;
        uint256 lpAmount;
        address destinationToken;
        uint32 sourceNetworkId;
        uint256 minAmountOut;
    }

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

    /// @notice Total withdrawals executed
    uint256 public totalWithdrawals;

    /// @notice Total volume in USD (approximated)
    uint256 public totalVolume;

    /// @notice Default slippage tolerance in basis points (50 = 0.5%)
    uint256 public defaultSlippageBps = 50;

    // ═══════════════════════════════════════════════════════════════════
    //                              EVENTS
    // ═══════════════════════════════════════════════════════════════════

    event ZapInitiated(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint32 destinationNetwork,
        address destinationReceiver,
        bytes32 indexed zapId,
        uint256 minLpOut,
        uint256 deadline
    );

    event ZapMultipleInitiated(
        address indexed user,
        uint256 totalAmount,
        uint256 numIntents,
        bytes32 indexed batchId
    );

    event WithdrawInitiated(
        address indexed user,
        address indexed lpToken,
        uint256 lpAmount,
        uint32 destinationNetwork,
        bytes32 indexed withdrawId
    );

    event ReceiverUpdated(uint32 indexed networkId, address receiver);
    event TokenSupportUpdated(address indexed token, bool supported);
    event FeeUpdated(uint256 newFeeBps);
    event FeeRecipientUpdated(address newRecipient);
    event DefaultSlippageUpdated(uint256 newSlippageBps);

    // ═══════════════════════════════════════════════════════════════════
    //                              ERRORS
    // ═══════════════════════════════════════════════════════════════════

    error InvalidBridgeAddress();
    error InvalidDestinationReceiver();
    error UnsupportedToken();
    error InvalidAmount();
    error FeeTooHigh();
    error TransferFailed();
    error DeadlineExpired();
    error SlippageTooHigh();
    error EmptyIntentsArray();
    error TooManyIntents();
    error InvalidLPToken();

    // ═══════════════════════════════════════════════════════════════════
    //                           CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Initialize the ZapSenderV2 contract
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
     * @notice Execute a cross-chain zap with slippage protection
     * @dev V2: Added minLpOut and deadline parameters for protection
     * 
     * @param destinationZapContract Address of ZapReceiver on destination
     * @param token The token to bridge (e.g., USDC)
     * @param amount The amount to bridge
     * @param destinationNetworkId The network ID of the destination chain
     * @param minLpOut Minimum LP tokens expected (slippage protection)
     * @param deadline Transaction deadline timestamp
     * @return zapId Unique identifier for this zap
     */
    function zapLiquidity(
        address destinationZapContract,
        address token,
        uint256 amount,
        uint32 destinationNetworkId,
        uint256 minLpOut,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (bytes32 zapId) {
        // ─────────────────────────────────────────────────────────────
        // DEADLINE CHECK
        // ─────────────────────────────────────────────────────────────
        if (deadline != 0 && block.timestamp > deadline) revert DeadlineExpired();

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
        // ENCODE DESTINATION CALL WITH SLIPPAGE PROTECTION
        // ─────────────────────────────────────────────────────────────
        bytes memory callData = abi.encode(
            uint8(0),           // Action type: 0 = DEPOSIT
            msg.sender,         // Original user (will receive LP tokens)
            token,              // Token being deposited
            amountAfterFee,     // Amount after fees
            minLpOut            // Minimum LP tokens expected
        );

        // ─────────────────────────────────────────────────────────────
        // EXECUTE bridgeAndCall()
        // ─────────────────────────────────────────────────────────────
        bridge.bridgeAndCall(
            destinationNetworkId,
            destinationZapContract,
            msg.sender,
            amountAfterFee,
            token,
            true,
            "",
            callData
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
            zapId,
            minLpOut,
            deadline
        );
    }

    /**
     * @notice Legacy zapLiquidity without slippage protection (backward compatible)
     */
    function zapLiquidity(
        address destinationZapContract,
        address token,
        uint256 amount,
        uint32 destinationNetworkId
    ) external nonReentrant whenNotPaused returns (bytes32 zapId) {
        // Use default slippage and no deadline
        uint256 minLpOut = (amount * (10000 - defaultSlippageBps)) / 10000;
        return this.zapLiquidity(
            destinationZapContract,
            token,
            amount,
            destinationNetworkId,
            minLpOut,
            0 // No deadline
        );
    }

    /**
     * @notice Execute multiple zaps in a single transaction (portfolio diversification)
     * @dev Allows splitting deposits across multiple vaults/chains
     * 
     * @param intents Array of zap intents
     * @return batchId Unique identifier for this batch
     */
    function zapMultiple(
        ZapIntent[] calldata intents
    ) external nonReentrant whenNotPaused returns (bytes32 batchId) {
        if (intents.length == 0) revert EmptyIntentsArray();
        if (intents.length > 10) revert TooManyIntents(); // Max 10 intents per batch

        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < intents.length; i++) {
            ZapIntent calldata intent = intents[i];
            
            // Validation
            if (intent.destinationZapContract == address(0)) revert InvalidDestinationReceiver();
            if (!supportedTokens[intent.token]) revert UnsupportedToken();
            if (intent.amount == 0) revert InvalidAmount();

            // Fee calculation
            uint256 fee = (intent.amount * feeBps) / 10000;
            uint256 amountAfterFee = intent.amount - fee;
            totalAmount += intent.amount;

            // Token transfer
            IERC20(intent.token).safeTransferFrom(msg.sender, address(this), intent.amount);
            
            // Transfer fee
            if (fee > 0 && feeRecipient != address(0)) {
                IERC20(intent.token).safeTransfer(feeRecipient, fee);
            }

            // Bridge approval
            IERC20(intent.token).approve(address(bridge), amountAfterFee);

            // Encode destination call
            bytes memory callData = abi.encode(
                uint8(0),               // Action type: 0 = DEPOSIT
                msg.sender,
                intent.token,
                amountAfterFee,
                intent.minLpOut
            );

            // Execute bridgeAndCall
            bridge.bridgeAndCall(
                intent.destinationNetworkId,
                intent.destinationZapContract,
                msg.sender,
                amountAfterFee,
                intent.token,
                true,
                "",
                callData
            );

            totalZaps++;
        }

        totalVolume += totalAmount;

        batchId = keccak256(abi.encodePacked(
            msg.sender,
            totalAmount,
            intents.length,
            block.timestamp,
            totalZaps
        ));

        emit ZapMultipleInitiated(msg.sender, totalAmount, intents.length, batchId);
    }

    /**
     * @notice Initiate a cross-chain withdrawal (reverse zap)
     * @dev Burns LP tokens on source and requests underlying on destination
     * 
     * @param lpToken The LP token to withdraw
     * @param lpAmount Amount of LP tokens to burn
     * @param destinationToken The underlying token to receive
     * @param destinationNetworkId Network where the vault is located
     * @param minAmountOut Minimum underlying tokens expected
     * @param deadline Transaction deadline
     * @return withdrawId Unique identifier for this withdrawal
     */
    function zapWithdraw(
        address lpToken,
        uint256 lpAmount,
        address destinationToken,
        uint32 destinationNetworkId,
        uint256 minAmountOut,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (bytes32 withdrawId) {
        // Deadline check
        if (deadline != 0 && block.timestamp > deadline) revert DeadlineExpired();

        // Validation
        if (lpToken == address(0)) revert InvalidLPToken();
        if (lpAmount == 0) revert InvalidAmount();

        address destinationReceiver = destinationReceivers[destinationNetworkId];
        if (destinationReceiver == address(0)) revert InvalidDestinationReceiver();

        // Transfer LP tokens from user
        IERC20(lpToken).safeTransferFrom(msg.sender, address(this), lpAmount);

        // Approve bridge for LP tokens
        IERC20(lpToken).approve(address(bridge), lpAmount);

        // Encode withdrawal call
        bytes memory callData = abi.encode(
            uint8(1),               // Action type: 1 = WITHDRAW
            msg.sender,             // User to receive underlying
            lpToken,                // LP token being burned
            lpAmount,               // Amount of LP to burn
            destinationToken,       // Expected underlying token
            minAmountOut            // Minimum amount expected
        );

        // Execute bridgeAndCall for withdrawal
        bridge.bridgeAndCall(
            destinationNetworkId,
            destinationReceiver,
            msg.sender,
            lpAmount,
            lpToken,
            true,
            "",
            callData
        );

        withdrawId = keccak256(abi.encodePacked(
            msg.sender,
            lpToken,
            lpAmount,
            destinationNetworkId,
            block.timestamp,
            totalWithdrawals
        ));

        totalWithdrawals++;

        emit WithdrawInitiated(
            msg.sender,
            lpToken,
            lpAmount,
            destinationNetworkId,
            withdrawId
        );
    }

    /**
     * @notice Zap with native ETH (wraps to WETH)
     */
    function zapLiquidityETH(
        address destinationZapContract,
        uint32 destinationNetworkId,
        uint256 minLpOut,
        uint256 deadline
    ) external payable nonReentrant whenNotPaused returns (bytes32 zapId) {
        if (deadline != 0 && block.timestamp > deadline) revert DeadlineExpired();
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
            uint8(0),           // Action type: 0 = DEPOSIT
            msg.sender,
            address(0),         // address(0) represents native ETH
            amountAfterFee,
            minLpOut
        );

        // bridgeAndCall with native ETH
        bridge.bridgeAndCall{value: amountAfterFee}(
            destinationNetworkId,
            destinationZapContract,
            msg.sender,
            amountAfterFee,
            address(0),
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
            zapId,
            minLpOut,
            deadline
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    //                         ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Emergency pause - halts all zap operations
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }

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
     * @notice Update default slippage tolerance
     */
    function setDefaultSlippage(uint256 newSlippageBps) external onlyOwner {
        if (newSlippageBps > 1000) revert SlippageTooHigh(); // Max 10%
        defaultSlippageBps = newSlippageBps;
        emit DefaultSlippageUpdated(newSlippageBps);
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
     * @notice Calculate minimum output with default slippage
     */
    function calculateMinOutput(uint256 amount) external view returns (uint256) {
        uint256 fee = (amount * feeBps) / 10000;
        uint256 amountAfterFee = amount - fee;
        return (amountAfterFee * (10000 - defaultSlippageBps)) / 10000;
    }

    /**
     * @notice Get protocol statistics
     */
    function getStats() external view returns (
        uint256 _totalZaps,
        uint256 _totalWithdrawals,
        uint256 _totalVolume,
        uint256 _feeBps,
        bool _paused
    ) {
        return (totalZaps, totalWithdrawals, totalVolume, feeBps, paused());
    }

    receive() external payable {}
}
