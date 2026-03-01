// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IBridgeMessageReceiver.sol";
import "./interfaces/IPolygonZkEVMBridgeV2.sol";

/**
 * @title ZapReceiver
 * @author AggZap Team
 * @notice Destination chain contract that receives bridged funds and executes DeFi actions
 * @dev Implements IBridgeMessageReceiver to receive bridgeAndCall() messages
 * 
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         ZapReceiver Flow                                   ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                            ║
 * ║  [AggLayer Bridge]                                                         ║
 * ║        │                                                                   ║
 * ║        │ 1. Bridge calls onMessageReceived()                               ║
 * ║        ▼                                                                   ║
 * ║  [ZapReceiver.sol]                                                         ║
 * ║        │                                                                   ║
 * ║        │ 2. Decode user intent from calldata                               ║
 * ║        │ 3. Validate origin (ZapSender on source chain)                    ║
 * ║        │ 4. Execute DeFi action (deposit into pool)                        ║
 * ║        ▼                                                                   ║
 * ║  [MockPool / Real DeFi]                                                    ║
 * ║        │                                                                   ║
 * ║        │ 5. Receive deposit, mint LP tokens                                ║
 * ║        ▼                                                                   ║
 * ║  [User Wallet on Destination Chain]                                        ║
 * ║        │                                                                   ║
 * ║        └── 6. User now has LP tokens representing their position!          ║
 * ║                                                                            ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 * 
 * SECURITY CONSIDERATIONS:
 * - Only the bridge contract can call onMessageReceived()
 * - Origin address must be a whitelisted ZapSender
 * - Reentrancy protection on all state-changing functions
 */
contract ZapReceiver is IBridgeMessageReceiver, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ═══════════════════════════════════════════════════════════════════
    //                              STATE
    // ═══════════════════════════════════════════════════════════════════

    /// @notice The Polygon Unified Bridge contract
    IPolygonZkEVMBridgeV2 public immutable bridge;

    /// @notice Mapping of network ID => authorized ZapSender address
    mapping(uint32 => address) public authorizedSenders;

    /// @notice Mapping of token => pool address for deposits
    mapping(address => address) public tokenPools;

    /// @notice Total deposits received
    uint256 public totalDeposits;

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
        address originSender
    );

    event DepositExecuted(
        address indexed user,
        address indexed pool,
        address indexed token,
        uint256 amount,
        uint256 lpReceived
    );

    event SenderAuthorized(uint32 indexed networkId, address sender);
    event PoolConfigured(address indexed token, address pool);

    // ═══════════════════════════════════════════════════════════════════
    //                              ERRORS
    // ═══════════════════════════════════════════════════════════════════

    error UnauthorizedCaller();
    error UnauthorizedSender();
    error InvalidPool();
    error InvalidToken();
    error DepositFailed();

    // ═══════════════════════════════════════════════════════════════════
    //                           CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Initialize the ZapReceiver contract
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
     * @dev This function is called by the bridge when bridgeAndCall() completes
     * 
     * CRITICAL SECURITY:
     * 1. msg.sender MUST be the bridge contract
     * 2. originAddress MUST be an authorized ZapSender
     * 
     * The tokens have ALREADY been transferred to this contract by the bridge
     * before this function is called. We just need to:
     * 1. Decode the user's intent
     * 2. Execute the DeFi action
     * 3. Send LP tokens to the user
     * 
     * @param originAddress The contract that called bridgeAndCall (ZapSender)
     * @param originNetwork The network ID where the call originated
     * @param data Encoded user intent (user address, token, amount)
     */
    function onMessageReceived(
        address originAddress,
        uint32 originNetwork,
        bytes memory data
    ) external payable override nonReentrant {
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
        // DECODE USER INTENT
        // ─────────────────────────────────────────────────────────────
        (
            address user,
            address token,
            uint256 amount
        ) = abi.decode(data, (address, address, uint256));

        emit ZapReceived(user, token, amount, originNetwork, originAddress);

        // ─────────────────────────────────────────────────────────────
        // EXECUTE DEFI ACTION
        // ─────────────────────────────────────────────────────────────
        _executeDeposit(user, token, amount);
    }

    // ═══════════════════════════════════════════════════════════════════
    //                      INTERNAL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Execute the DeFi deposit on behalf of the user
     * @dev This is where the magic happens - user's cross-chain deposit completes
     * 
     * @param user The original user who initiated the zap
     * @param token The token that was bridged
     * @param amount The amount to deposit
     */
    function _executeDeposit(
        address user,
        address token,
        uint256 amount
    ) internal {
        address pool = tokenPools[token];
        
        // If no pool configured, just send tokens to user
        if (pool == address(0)) {
            if (token == address(0)) {
                // Native ETH
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

        // Call the pool's deposit function
        // The pool should mint LP tokens directly to the user
        uint256 lpBefore = _getLPBalance(pool, user);
        
        try IMockPool(pool).depositFor{value: token == address(0) ? amount : 0}(
            user,
            token,
            amount
        ) {
            uint256 lpAfter = _getLPBalance(pool, user);
            uint256 lpReceived = lpAfter - lpBefore;
            
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
     * @notice Get user's LP balance in a pool
     */
    function _getLPBalance(address pool, address user) internal view returns (uint256) {
        try IMockPool(pool).lpToken() returns (address lpToken) {
            return IERC20(lpToken).balanceOf(user);
        } catch {
            return 0;
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //                         ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

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
        uint256 _totalVolume
    ) {
        return (totalDeposits, totalVolume);
    }

    receive() external payable {}
}

/**
 * @notice Interface for mock DeFi pools
 */
interface IMockPool {
    function depositFor(address user, address token, uint256 amount) external payable;
    function lpToken() external view returns (address);
}
