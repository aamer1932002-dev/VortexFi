// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ZapLP
 * @notice LP token minted when users deposit into the MockPool
 */
contract ZapLP is ERC20, Ownable {
    address public pool;

    error OnlyPool();

    modifier onlyPool() {
        if (msg.sender != pool) revert OnlyPool();
        _;
    }

    constructor() ERC20("AggZap LP Token", "zapLP") Ownable(msg.sender) {}

    function setPool(address _pool) external onlyOwner {
        pool = _pool;
    }

    function mint(address to, uint256 amount) external onlyPool {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyPool {
        _burn(from, amount);
    }
}

/**
 * @title MockPool
 * @notice A mock DeFi pool for testing cross-chain deposits
 */
contract MockPool is Ownable {
    using SafeERC20 for IERC20;

    // State
    ZapLP public lpToken;
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public tokenBalances;
    mapping(address => uint256) public userDeposits;
    
    // Authorized depositors (ZapReceiver)
    mapping(address => bool) public authorizedDepositors;

    // Events
    event Deposit(address indexed user, address indexed token, uint256 amount, uint256 lpMinted);
    event Withdraw(address indexed user, uint256 lpBurned, uint256 usdcAmount, uint256 wethAmount);
    event TokenAdded(address indexed token);
    event DepositorAuthorized(address indexed depositor, bool authorized);

    // Errors
    error UnsupportedToken();
    error InsufficientLP();
    error ZeroAmount();

    constructor(address _lpToken) Ownable(msg.sender) {
        lpToken = ZapLP(_lpToken);
    }

    function addSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = true;
        emit TokenAdded(token);
    }

    function setAuthorizedDepositor(address depositor, bool authorized) external onlyOwner {
        authorizedDepositors[depositor] = authorized;
        emit DepositorAuthorized(depositor, authorized);
    }

    /**
     * @notice Deposit tokens into the pool
     * @param user The user receiving LP tokens
     * @param token The token being deposited
     * @param amount The amount to deposit
     */
    function deposit(address user, address token, uint256 amount) external returns (uint256 lpAmount) {
        if (amount == 0) revert ZeroAmount();
        if (!supportedTokens[token]) revert UnsupportedToken();

        // Transfer tokens from sender
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Track balances
        tokenBalances[token] += amount;
        userDeposits[user] += amount;

        // Calculate LP tokens (1:1 for simplicity, normalized to 18 decimals)
        uint8 decimals = ERC20(token).decimals();
        if (decimals < 18) {
            lpAmount = amount * (10 ** (18 - decimals));
        } else {
            lpAmount = amount;
        }

        // Mint LP tokens
        lpToken.mint(user, lpAmount);

        emit Deposit(user, token, amount, lpAmount);
        return lpAmount;
    }

    /**
     * @notice Withdraw from the pool by burning LP tokens
     * @param user The user withdrawing
     * @param lpAmount The amount of LP tokens to burn
     */
    function withdraw(address user, uint256 lpAmount) external returns (uint256, uint256) {
        if (lpAmount == 0) revert ZeroAmount();
        if (lpToken.balanceOf(user) < lpAmount) revert InsufficientLP();

        // Burn LP tokens
        lpToken.burn(user, lpAmount);

        // For simplicity, return proportional share (mock implementation)
        // In real vault, would calculate based on actual pool shares
        uint256 usdcToReturn = lpAmount / (10 ** 12); // Convert back to 6 decimals
        uint256 wethToReturn = 0;

        emit Withdraw(user, lpAmount, usdcToReturn, wethToReturn);
        return (usdcToReturn, wethToReturn);
    }

    /**
     * @notice Get user's LP balance in this pool
     */
    function getUserLPBalance(address user) external view returns (uint256) {
        return lpToken.balanceOf(user);
    }

    /**
     * @notice Get total value locked for a token
     */
    function getTVL(address token) external view returns (uint256) {
        return tokenBalances[token];
    }
}
