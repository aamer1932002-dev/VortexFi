// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IBridgeMessageReceiver.sol";
import "./interfaces/IPolygonZkEVMBridgeV2.sol";

/**
 * @title ZapReceiverV2
 * @author AggZap Team
 * @notice Destination chain contract that receives bridged funds and executes DeFi actions (V2)
 * @dev V2 includes: Emergency Pause, Slippage Protection, Withdrawal Processing
 * 
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                       ZapReceiverV2 Features                               ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  NEW IN V2:                                                                ║
 * ║  • Emergency Pause - Halt deposit/withdraw operations                      ║
 * ║  • Slippage Protection - Revert if minLpOut not met                       ║
 * ║  • Withdrawal Processing - Handle reverse zaps from ZapSenderV2           ║
 * ║  • Action Types - Support DEPOSIT (0) and WITHDRAW (1) operations         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */
contract ZapReceiverV2 is IBridgeMessageReceiver, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ═══════════════════════════════════════════════════════════════════
    //                              ENUMS
    // ═══════════════════════════════════════════════════════════════════

    /// @notice Action types for cross-chain messages
    enum ActionType {
        DEPOSIT,    // 0: Deposit into vault
        WITHDRAW    // 1: Withdraw from vault
    }

    // ═══════════════════════════════════════════════════════════════════
    //                              STATE
    // ═══════════════════════════════════════════════════════════════════

    /// @notice The Polygon Unified Bridge contract
    IPolygonZkEVMBridgeV2 public immutable bridge;

    /// @notice Mapping of network ID => authorized ZapSender address
    mapping(uint32 => address) public authorizedSenders;

    /// @notice Mapping of token => pool address for deposits
    mapping(address => address) public tokenPools;

    /// @notice Mapping of LP token => underlying token
    mapping(address => address) public lpToUnderlying;

    /// @notice Total deposits received
    uint256 public totalDeposits;

    /// @notice Total withdrawals processed
    uint256 public totalWithdrawals;

    /// @notice Total volume processed
    uint256 public totalVolume;

    // ═══════════════════════════════════════════════════════════════════
    //                              EVENTS
    // ═══════════════════════════════════════════════════════════════════

    event ZapReceived(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint32 originNetwork,
        address originSender,
        ActionType actionType
    );

    event DepositExecuted(
        address indexed user,
        address indexed pool,
        address indexed token,
        uint256 amount,
        uint256 lpReceived
    );

    event WithdrawExecuted(
        address indexed user,
        address indexed pool,
        address indexed lpToken,
        uint256 lpAmount,
        uint256 underlyingReceived
    );

    event SlippageProtectionTriggered(
        address indexed user,
        uint256 received,
        uint256 minExpected
    );

    event SenderAuthorized(uint32 indexed networkId, address sender);
    event PoolConfigured(address indexed token, address pool);
    event LPMappingConfigured(address indexed lpToken, address underlyingToken);

    // ═══════════════════════════════════════════════════════════════════
    //                              ERRORS
    // ═══════════════════════════════════════════════════════════════════

    error UnauthorizedCaller();
    error UnauthorizedSender();
    error InvalidPool();
    error InvalidToken();
    error DepositFailed();
    error WithdrawFailed();
    error SlippageExceeded();
    error InvalidActionType();

    // ═══════════════════════════════════════════════════════════════════
    //                           CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Initialize the ZapReceiverV2 contract
     * @param _bridge Address of the Polygon Unified Bridge on this chain
     */
    constructor(address _bridge) Ownable(msg.sender) {
        bridge = IPolygonZkEVMBridgeV2(_bridge);
    }

    // ═══════════════════════════════════════════════════════════════════
    //                    BRIDGE MESSAGE RECEIVER
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Receives cross-chain messages from the AggLayer bridge
     * @dev V2: Now handles both DEPOSIT and WITHDRAW actions with slippage protection
     * 
     * @param originAddress The contract that called bridgeAndCall (ZapSender)
     * @param originNetwork The network ID where the call originated
     * @param data Encoded user intent (action type, user, token, amount, minOut)
     */
    function onMessageReceived(
        address originAddress,
        uint32 originNetwork,
        bytes memory data
    ) external payable override nonReentrant whenNotPaused {
        // ─────────────────────────────────────────────────────────────
        // SECURITY CHECK: Only bridge can call this function
        // ─────────────────────────────────────────────────────────────
        if (msg.sender != address(bridge)) revert UnauthorizedCaller();

        // ─────────────────────────────────────────────────────────────
        // SECURITY CHECK: Verify origin is authorized ZapSender
        // ─────────────────────────────────────────────────────────────
        if (authorizedSenders[originNetwork] != originAddress) {
            revert UnauthorizedSender();
        }

        // ─────────────────────────────────────────────────────────────
        // DECODE ACTION TYPE
        // ─────────────────────────────────────────────────────────────
        uint8 actionType = abi.decode(data, (uint8));

        if (actionType == uint8(ActionType.DEPOSIT)) {
            _handleDeposit(data, originNetwork, originAddress);
        } else if (actionType == uint8(ActionType.WITHDRAW)) {
            _handleWithdraw(data, originNetwork, originAddress);
        } else {
            revert InvalidActionType();
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //                      INTERNAL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Handle deposit action
     */
    function _handleDeposit(
        bytes memory data,
        uint32 originNetwork,
        address originAddress
    ) internal {
        (
            ,                   // actionType already decoded
            address user,
            address token,
            uint256 amount,
            uint256 minLpOut
        ) = abi.decode(data, (uint8, address, address, uint256, uint256));

        emit ZapReceived(user, token, amount, originNetwork, originAddress, ActionType.DEPOSIT);

        _executeDeposit(user, token, amount, minLpOut);
    }

    /**
     * @notice Handle withdraw action
     */
    function _handleWithdraw(
        bytes memory data,
        uint32 originNetwork,
        address originAddress
    ) internal {
        (
            ,                       // actionType already decoded
            address user,
            address lpToken,
            uint256 lpAmount,
            address destinationToken,
            uint256 minAmountOut
        ) = abi.decode(data, (uint8, address, address, uint256, address, uint256));

        emit ZapReceived(user, lpToken, lpAmount, originNetwork, originAddress, ActionType.WITHDRAW);

        _executeWithdraw(user, lpToken, lpAmount, destinationToken, minAmountOut);
    }

    /**
     * @notice Execute the DeFi deposit on behalf of the user with slippage protection
     * @dev V2: Added minLpOut check for slippage protection
     * 
     * @param user The original user who initiated the zap
     * @param token The token that was bridged
     * @param amount The amount to deposit
     * @param minLpOut Minimum LP tokens expected
     */
    function _executeDeposit(
        address user,
        address token,
        uint256 amount,
        uint256 minLpOut
    ) internal {
        address pool = tokenPools[token];
        
        // If no pool configured, just send tokens to user
        if (pool == address(0)) {
            if (token == address(0)) {
                (bool sent, ) = user.call{value: amount}("");
                if (!sent) revert DepositFailed();
            } else {
                IERC20(token).safeTransfer(user, amount);
            }
            emit DepositExecuted(user, address(0), token, amount, amount);
            return;
        }

        // Deposit into pool
        if (token != address(0)) {
            IERC20(token).approve(pool, amount);
        }

        uint256 lpBefore = _getLPBalance(pool, user);
        
        try IMockPoolV2(pool).depositFor{value: token == address(0) ? amount : 0}(
            user,
            token,
            amount
        ) {
            uint256 lpAfter = _getLPBalance(pool, user);
            uint256 lpReceived = lpAfter - lpBefore;
            
            // ─────────────────────────────────────────────────────────
            // SLIPPAGE PROTECTION CHECK
            // ─────────────────────────────────────────────────────────
            if (minLpOut > 0 && lpReceived < minLpOut) {
                emit SlippageProtectionTriggered(user, lpReceived, minLpOut);
                revert SlippageExceeded();
            }
            
            totalDeposits++;
            totalVolume += amount;

            emit DepositExecuted(user, pool, token, amount, lpReceived);
        } catch {
            // If deposit fails, send tokens directly to user as fallback
            if (token == address(0)) {
                (bool sent, ) = user.call{value: amount}("");
                if (!sent) revert DepositFailed();
            } else {
                IERC20(token).safeTransfer(user, amount);
            }
            emit DepositExecuted(user, address(0), token, amount, amount);
        }
    }

    /**
     * @notice Execute withdrawal from vault
     * @dev Burns LP tokens and sends underlying to user
     * 
     * @param user The user receiving underlying tokens
     * @param lpToken The LP token being burned
     * @param lpAmount Amount of LP to burn
     * @param destinationToken Expected underlying token
     * @param minAmountOut Minimum underlying expected
     */
    function _executeWithdraw(
        address user,
        address lpToken,
        uint256 lpAmount,
        address destinationToken,
        uint256 minAmountOut
    ) internal {
        address pool = tokenPools[lpToUnderlying[lpToken]];
        
        if (pool == address(0)) {
            // No pool configured, just return LP tokens to user
            IERC20(lpToken).safeTransfer(user, lpAmount);
            emit WithdrawExecuted(user, address(0), lpToken, lpAmount, lpAmount);
            return;
        }

        // Get balance before withdrawal
        uint256 underlyingBefore;
        if (destinationToken == address(0)) {
            underlyingBefore = user.balance;
        } else {
            underlyingBefore = IERC20(destinationToken).balanceOf(user);
        }

        // Approve pool to burn LP tokens
        IERC20(lpToken).approve(pool, lpAmount);

        try IMockPoolV2(pool).withdrawFor(user, lpToken, lpAmount) {
            // Get balance after withdrawal
            uint256 underlyingAfter;
            if (destinationToken == address(0)) {
                underlyingAfter = user.balance;
            } else {
                underlyingAfter = IERC20(destinationToken).balanceOf(user);
            }
            
            uint256 underlyingReceived = underlyingAfter - underlyingBefore;

            // Slippage protection
            if (minAmountOut > 0 && underlyingReceived < minAmountOut) {
                emit SlippageProtectionTriggered(user, underlyingReceived, minAmountOut);
                revert SlippageExceeded();
            }

            totalWithdrawals++;

            emit WithdrawExecuted(user, pool, lpToken, lpAmount, underlyingReceived);
        } catch {
            // If withdrawal fails, return LP tokens to user
            IERC20(lpToken).safeTransfer(user, lpAmount);
            emit WithdrawExecuted(user, address(0), lpToken, lpAmount, 0);
        }
    }

    /**
     * @notice Get user's LP balance in a pool
     */
    function _getLPBalance(address pool, address user) internal view returns (uint256) {
        try IMockPoolV2(pool).lpToken() returns (address lpToken) {
            return IERC20(lpToken).balanceOf(user);
        } catch {
            return 0;
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //                         ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Emergency pause - halts all operations
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
     * @notice Authorize a ZapSender from a specific network
     */
    function authorizeSender(
        uint32 networkId,
        address sender
    ) external onlyOwner {
        authorizedSenders[networkId] = sender;
        emit SenderAuthorized(networkId, sender);
    }

    /**
     * @notice Configure pool for a token
     */
    function setPool(
        address token,
        address pool
    ) external onlyOwner {
        tokenPools[token] = pool;
        emit PoolConfigured(token, pool);
    }

    /**
     * @notice Configure LP token to underlying mapping
     */
    function setLPMapping(
        address lpToken,
        address underlyingToken
    ) external onlyOwner {
        lpToUnderlying[lpToken] = underlyingToken;
        emit LPMappingConfigured(lpToken, underlyingToken);
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
            require(sent, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //                         VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Get the pool address for a token
     */
    function getPool(address token) external view returns (address) {
        return tokenPools[token];
    }

    /**
     * @notice Get underlying token for an LP token
     */
    function getUnderlying(address lpToken) external view returns (address) {
        return lpToUnderlying[lpToken];
    }

    /**
     * @notice Check if a sender is authorized
     */
    function isSenderAuthorized(
        uint32 networkId,
        address sender
    ) external view returns (bool) {
        return authorizedSenders[networkId] == sender;
    }

    /**
     * @notice Get statistics
     */
    function getStats() external view returns (
        uint256 _totalDeposits,
        uint256 _totalWithdrawals,
        uint256 _totalVolume,
        bool _paused
    ) {
        return (totalDeposits, totalWithdrawals, totalVolume, paused());
    }

    receive() external payable {}
}

/**
 * @notice Interface for V2 DeFi pools with withdrawal support
 */
interface IMockPoolV2 {
    function depositFor(address user, address token, uint256 amount) external payable;
    function withdrawFor(address user, address lpToken, uint256 lpAmount) external;
    function lpToken() external view returns (address);
}
