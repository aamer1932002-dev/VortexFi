// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IVaultStrategy
 * @notice Interface for all AggZap vault strategies
 */
interface IVaultStrategy {
    function deposit(uint256 amount) external;
    function depositFor(address user, uint256 amount) external;
    function withdraw(uint256 shares) external;
    function getAPY() external view returns (uint256);
    function getTVL() external view returns (uint256);
    function getUserShares(address user) external view returns (uint256);
    function getRiskLevel() external view returns (uint8); // 1-5 scale
    function getStrategyType() external view returns (string memory);
}

/**
 * @title BaseVaultStrategy
 * @notice Base contract for all vault strategies
 */
abstract contract BaseVaultStrategy is IVaultStrategy, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable depositToken;
    string public name;
    string public symbol;
    
    uint256 public totalShares;
    mapping(address => uint256) public shares;
    mapping(address => bool) public authorizedDepositors;
    
    uint256 public totalDeposited;
    uint256 public lastHarvestTime;
    
    event Deposit(address indexed user, uint256 amount, uint256 shares);
    event Withdraw(address indexed user, uint256 amount, uint256 shares);
    event Harvest(uint256 profit);
    event AuthorizedDepositorSet(address indexed depositor, bool authorized);

    constructor(
        address _depositToken,
        string memory _name,
        string memory _symbol
    ) Ownable(msg.sender) {
        depositToken = IERC20(_depositToken);
        name = _name;
        symbol = _symbol;
        lastHarvestTime = block.timestamp;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner() || authorizedDepositors[msg.sender],
            "Not authorized"
        );
        _;
    }

    function setAuthorizedDepositor(address depositor, bool authorized) external onlyOwner {
        authorizedDepositors[depositor] = authorized;
        emit AuthorizedDepositorSet(depositor, authorized);
    }

    function deposit(uint256 amount) external override nonReentrant {
        _deposit(msg.sender, msg.sender, amount);
    }

    function depositFor(address user, uint256 amount) external override nonReentrant onlyAuthorized {
        _deposit(msg.sender, user, amount);
    }

    function _deposit(address from, address user, uint256 amount) internal {
        require(amount > 0, "Amount must be > 0");
        
        uint256 sharesToMint = _calculateShares(amount);
        
        depositToken.safeTransferFrom(from, address(this), amount);
        
        shares[user] += sharesToMint;
        totalShares += sharesToMint;
        totalDeposited += amount;
        
        _afterDeposit(amount);
        
        emit Deposit(user, amount, sharesToMint);
    }

    function withdraw(uint256 shareAmount) external override nonReentrant {
        require(shareAmount > 0, "Shares must be > 0");
        require(shares[msg.sender] >= shareAmount, "Insufficient shares");
        
        uint256 amountToWithdraw = _calculateWithdrawAmount(shareAmount);
        
        shares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;
        totalDeposited -= amountToWithdraw;
        
        _beforeWithdraw(amountToWithdraw);
        
        depositToken.safeTransfer(msg.sender, amountToWithdraw);
        
        emit Withdraw(msg.sender, amountToWithdraw, shareAmount);
    }

    function _calculateShares(uint256 amount) internal view returns (uint256) {
        if (totalShares == 0) {
            return amount;
        }
        return (amount * totalShares) / getTVL();
    }

    function _calculateWithdrawAmount(uint256 shareAmount) internal view returns (uint256) {
        return (shareAmount * getTVL()) / totalShares;
    }

    function getUserShares(address user) external view override returns (uint256) {
        return shares[user];
    }

    function getTVL() public view virtual override returns (uint256) {
        return depositToken.balanceOf(address(this));
    }

    // Override in derived contracts
    function _afterDeposit(uint256 amount) internal virtual {}
    function _beforeWithdraw(uint256 amount) internal virtual {}
}

/**
 * @title StableYieldVault
 * @notice Low-risk stablecoin yield strategy
 * @dev Simulates lending protocol yields (Aave-like)
 */
contract StableYieldVault is BaseVaultStrategy {
    uint256 public constant BASE_APY = 500; // 5% base APY
    uint256 public constant APY_DECIMALS = 10000;
    
    constructor(
        address _depositToken,
        string memory _name,
        string memory _symbol
    ) BaseVaultStrategy(_depositToken, _name, _symbol) {}

    function getAPY() external pure override returns (uint256) {
        return BASE_APY; // 5% APY
    }

    function getRiskLevel() external pure override returns (uint8) {
        return 1; // Low risk
    }

    function getStrategyType() external pure override returns (string memory) {
        return "Stable Yield";
    }
}

/**
 * @title LiquidStakingVault
 * @notice Medium-risk liquid staking strategy
 * @dev Simulates ETH staking yields (Lido-like)
 */
contract LiquidStakingVault is BaseVaultStrategy {
    uint256 public constant BASE_APY = 800; // 8% base APY
    uint256 public stakingRewards;
    
    constructor(
        address _depositToken,
        string memory _name,
        string memory _symbol
    ) BaseVaultStrategy(_depositToken, _name, _symbol) {}

    function getAPY() external pure override returns (uint256) {
        return BASE_APY; // 8% APY
    }

    function getRiskLevel() external pure override returns (uint8) {
        return 2; // Medium-low risk
    }

    function getStrategyType() external pure override returns (string memory) {
        return "Liquid Staking";
    }

    // Simulate receiving staking rewards
    function addStakingRewards(uint256 amount) external onlyOwner {
        stakingRewards += amount;
        emit Harvest(amount);
    }

    function getTVL() public view override returns (uint256) {
        return depositToken.balanceOf(address(this)) + stakingRewards;
    }
}

/**
 * @title DeltaNeutralVault
 * @notice Medium-risk delta neutral strategy
 * @dev Simulates perp funding rate arbitrage (GMX-like)
 */
contract DeltaNeutralVault is BaseVaultStrategy {
    uint256 public constant BASE_APY = 1200; // 12% base APY
    int256 public currentFundingRate; // Can be positive or negative
    
    constructor(
        address _depositToken,
        string memory _name,
        string memory _symbol
    ) BaseVaultStrategy(_depositToken, _name, _symbol) {}

    function getAPY() external pure override returns (uint256) {
        return BASE_APY; // 12% APY (can vary based on funding)
    }

    function getRiskLevel() external pure override returns (uint8) {
        return 3; // Medium risk
    }

    function getStrategyType() external pure override returns (string memory) {
        return "Delta Neutral";
    }

    function setFundingRate(int256 rate) external onlyOwner {
        currentFundingRate = rate;
    }
}

/**
 * @title LeveragedYieldVault
 * @notice Higher-risk leveraged yield strategy
 * @dev Simulates leveraged lending (Morpho-like)
 */
contract LeveragedYieldVault is BaseVaultStrategy {
    uint256 public constant BASE_APY = 1800; // 18% base APY
    uint256 public leverageMultiplier = 3; // 3x leverage
    uint256 public borrowedAmount;
    
    constructor(
        address _depositToken,
        string memory _name,
        string memory _symbol
    ) BaseVaultStrategy(_depositToken, _name, _symbol) {}

    function getAPY() external pure override returns (uint256) {
        return BASE_APY; // 18% APY
    }

    function getRiskLevel() external pure override returns (uint8) {
        return 4; // Higher risk
    }

    function getStrategyType() external pure override returns (string memory) {
        return "Leveraged Yield";
    }

    function setLeverage(uint256 multiplier) external onlyOwner {
        require(multiplier >= 1 && multiplier <= 5, "Invalid leverage");
        leverageMultiplier = multiplier;
    }

    function getTVL() public view override returns (uint256) {
        return depositToken.balanceOf(address(this)) * leverageMultiplier;
    }
}

/**
 * @title OptionsVault
 * @notice Higher-risk covered call/put selling strategy
 * @dev Simulates options premium collection (Ribbon-like)
 */
contract OptionsVault is BaseVaultStrategy {
    uint256 public constant BASE_APY = 2500; // 25% base APY
    uint256 public premiumsCollected;
    uint256 public strikePrice;
    bool public isCallStrategy; // true = covered calls, false = cash-secured puts
    
    constructor(
        address _depositToken,
        string memory _name,
        string memory _symbol,
        bool _isCallStrategy
    ) BaseVaultStrategy(_depositToken, _name, _symbol) {
        isCallStrategy = _isCallStrategy;
    }

    function getAPY() external pure override returns (uint256) {
        return BASE_APY; // 25% APY
    }

    function getRiskLevel() external pure override returns (uint8) {
        return 5; // High risk
    }

    function getStrategyType() external view override returns (string memory) {
        return isCallStrategy ? "Covered Calls" : "Cash-Secured Puts";
    }

    function setStrike(uint256 _strike) external onlyOwner {
        strikePrice = _strike;
    }

    function collectPremium(uint256 amount) external onlyOwner {
        premiumsCollected += amount;
        emit Harvest(amount);
    }

    function getTVL() public view override returns (uint256) {
        return depositToken.balanceOf(address(this)) + premiumsCollected;
    }
}

/**
 * @title VaultFactory
 * @notice Factory contract to deploy new vault strategies
 */
contract VaultFactory is Ownable {
    enum VaultType {
        StableYield,
        LiquidStaking,
        DeltaNeutral,
        LeveragedYield,
        OptionsCalls,
        OptionsPuts
    }

    address[] public allVaults;
    mapping(address => bool) public isVault;
    mapping(VaultType => address[]) public vaultsByType;

    event VaultCreated(
        address indexed vault,
        VaultType vaultType,
        address depositToken,
        string name
    );

    constructor() Ownable(msg.sender) {}

    function createVault(
        VaultType vaultType,
        address depositToken,
        string memory name,
        string memory symbol
    ) external onlyOwner returns (address vault) {
        if (vaultType == VaultType.StableYield) {
            vault = address(new StableYieldVault(depositToken, name, symbol));
        } else if (vaultType == VaultType.LiquidStaking) {
            vault = address(new LiquidStakingVault(depositToken, name, symbol));
        } else if (vaultType == VaultType.DeltaNeutral) {
            vault = address(new DeltaNeutralVault(depositToken, name, symbol));
        } else if (vaultType == VaultType.LeveragedYield) {
            vault = address(new LeveragedYieldVault(depositToken, name, symbol));
        } else if (vaultType == VaultType.OptionsCalls) {
            vault = address(new OptionsVault(depositToken, name, symbol, true));
        } else if (vaultType == VaultType.OptionsPuts) {
            vault = address(new OptionsVault(depositToken, name, symbol, false));
        } else {
            revert("Invalid vault type");
        }

        allVaults.push(vault);
        isVault[vault] = true;
        vaultsByType[vaultType].push(vault);

        // Transfer ownership to msg.sender
        Ownable(vault).transferOwnership(msg.sender);

        emit VaultCreated(vault, vaultType, depositToken, name);
    }

    function getAllVaults() external view returns (address[] memory) {
        return allVaults;
    }

    function getVaultsByType(VaultType vaultType) external view returns (address[] memory) {
        return vaultsByType[vaultType];
    }

    function getVaultCount() external view returns (uint256) {
        return allVaults.length;
    }
}
