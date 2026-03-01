// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title IVaultStrategyV2
 * @notice Interface for all AggZap vault strategies (V2)
 * @dev V2 adds: harvest(), compound(), auto-compound configuration
 */
interface IVaultStrategyV2 {
    function deposit(uint256 amount) external;
    function depositFor(address user, uint256 amount) external;
    function withdraw(uint256 shares) external;
    function withdrawFor(address user, uint256 shares) external;
    function harvest() external returns (uint256);
    function compound() external returns (uint256);
    function getAPY() external view returns (uint256);
    function getTVL() external view returns (uint256);
    function getUserShares(address user) external view returns (uint256);
    function getUserValue(address user) external view returns (uint256);
    function getRiskLevel() external view returns (uint8);
    function getStrategyType() external view returns (string memory);
    function getPendingRewards() external view returns (uint256);
    function getLastHarvestTime() external view returns (uint256);
    function getCompoundInterval() external view returns (uint256);
}

/**
 * @title BaseVaultStrategyV2
 * @notice Base contract for all vault strategies with auto-compound support
 * @dev V2 includes: Emergency Pause, Auto-Compound, Withdrawal for users
 */
abstract contract BaseVaultStrategyV2 is IVaultStrategyV2, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ═══════════════════════════════════════════════════════════════════
    //                              STATE
    // ═══════════════════════════════════════════════════════════════════

    IERC20 public immutable depositToken;
    string public name;
    string public symbol;
    
    uint256 public totalShares;
    mapping(address => uint256) public shares;
    mapping(address => bool) public authorizedDepositors;
    
    uint256 public totalDeposited;
    uint256 public lastHarvestTime;
    uint256 public pendingRewards;
    
    /// @notice Auto-compound configuration
    uint256 public compoundInterval = 1 days;
    uint256 public lastCompoundTime;
    bool public autoCompoundEnabled = true;
    
    /// @notice Keepers authorized to call harvest/compound
    mapping(address => bool) public authorizedKeepers;
    
    /// @notice Performance fee (taken from profits on harvest)
    uint256 public performanceFeeBps = 1000; // 10% default
    address public feeRecipient;

    // ═══════════════════════════════════════════════════════════════════
    //                              EVENTS
    // ═══════════════════════════════════════════════════════════════════

    event Deposit(address indexed user, uint256 amount, uint256 shares);
    event Withdraw(address indexed user, uint256 amount, uint256 shares);
    event Harvest(uint256 profit, uint256 fee);
    event Compound(uint256 amount, uint256 newShares);
    event AuthorizedDepositorSet(address indexed depositor, bool authorized);
    event AuthorizedKeeperSet(address indexed keeper, bool authorized);
    event CompoundIntervalUpdated(uint256 newInterval);
    event AutoCompoundToggled(bool enabled);
    event PerformanceFeeUpdated(uint256 newFeeBps);

    // ═══════════════════════════════════════════════════════════════════
    //                              ERRORS
    // ═══════════════════════════════════════════════════════════════════

    error NotAuthorized();
    error InsufficientShares();
    error ZeroAmount();
    error CompoundTooSoon();
    error NoRewardsToHarvest();

    // ═══════════════════════════════════════════════════════════════════
    //                           CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════

    constructor(
        address _depositToken,
        string memory _name,
        string memory _symbol
    ) Ownable(msg.sender) {
        depositToken = IERC20(_depositToken);
        name = _name;
        symbol = _symbol;
        lastHarvestTime = block.timestamp;
        lastCompoundTime = block.timestamp;
        feeRecipient = msg.sender;
    }

    // ═══════════════════════════════════════════════════════════════════
    //                           MODIFIERS
    // ═══════════════════════════════════════════════════════════════════

    modifier onlyAuthorized() {
        if (msg.sender != owner() && !authorizedDepositors[msg.sender]) {
            revert NotAuthorized();
        }
        _;
    }

    modifier onlyKeeperOrOwner() {
        if (msg.sender != owner() && !authorizedKeepers[msg.sender]) {
            revert NotAuthorized();
        }
        _;
    }

    // ═══════════════════════════════════════════════════════════════════
    //                         CORE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Deposit tokens into the vault
     */
    function deposit(uint256 amount) external override nonReentrant whenNotPaused {
        _deposit(msg.sender, msg.sender, amount);
    }

    /**
     * @notice Deposit tokens on behalf of a user (for ZapReceiver)
     */
    function depositFor(address user, uint256 amount) external override nonReentrant whenNotPaused onlyAuthorized {
        _deposit(msg.sender, user, amount);
    }

    /**
     * @notice Withdraw shares from the vault
     */
    function withdraw(uint256 shareAmount) external override nonReentrant whenNotPaused {
        _withdraw(msg.sender, msg.sender, shareAmount);
    }

    /**
     * @notice Withdraw shares on behalf of a user (for ZapReceiver)
     */
    function withdrawFor(address user, uint256 shareAmount) external override nonReentrant whenNotPaused onlyAuthorized {
        _withdraw(user, user, shareAmount);
    }

    /**
     * @notice Internal deposit logic
     */
    function _deposit(address from, address user, uint256 amount) internal {
        if (amount == 0) revert ZeroAmount();
        
        // Auto-compound if needed before deposit
        if (autoCompoundEnabled && _shouldCompound()) {
            _compound();
        }
        
        uint256 sharesToMint = _calculateShares(amount);
        
        depositToken.safeTransferFrom(from, address(this), amount);
        
        shares[user] += sharesToMint;
        totalShares += sharesToMint;
        totalDeposited += amount;
        
        _afterDeposit(amount);
        
        emit Deposit(user, amount, sharesToMint);
    }

    /**
     * @notice Internal withdraw logic
     */
    function _withdraw(address user, address recipient, uint256 shareAmount) internal {
        if (shareAmount == 0) revert ZeroAmount();
        if (shares[user] < shareAmount) revert InsufficientShares();
        
        // Auto-compound if needed before withdrawal
        if (autoCompoundEnabled && _shouldCompound()) {
            _compound();
        }
        
        uint256 amountToWithdraw = _calculateWithdrawAmount(shareAmount);
        
        shares[user] -= shareAmount;
        totalShares -= shareAmount;
        totalDeposited = totalDeposited > amountToWithdraw ? totalDeposited - amountToWithdraw : 0;
        
        _beforeWithdraw(amountToWithdraw);
        
        depositToken.safeTransfer(recipient, amountToWithdraw);
        
        emit Withdraw(user, amountToWithdraw, shareAmount);
    }

    // ═══════════════════════════════════════════════════════════════════
    //                      AUTO-COMPOUND FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @notice Harvest yields from the strategy
     * @dev Can be called by keepers or owner
     * @return profit The amount of profit harvested
     */
    function harvest() external override nonReentrant onlyKeeperOrOwner returns (uint256 profit) {
        profit = _harvest();
        
        if (profit == 0) revert NoRewardsToHarvest();
        
        // Take performance fee
        uint256 fee = 0;
        if (performanceFeeBps > 0 && feeRecipient != address(0)) {
            fee = (profit * performanceFeeBps) / 10000;
            if (fee > 0) {
                depositToken.safeTransfer(feeRecipient, fee);
            }
        }
        
        pendingRewards += (profit - fee);
        lastHarvestTime = block.timestamp;
        
        emit Harvest(profit, fee);
    }

    /**
     * @notice Compound pending rewards back into the vault
     * @dev Can be called by keepers or owner, or automatically on deposit/withdraw
     * @return compoundedAmount The amount compounded
     */
    function compound() external override nonReentrant onlyKeeperOrOwner returns (uint256 compoundedAmount) {
        if (block.timestamp < lastCompoundTime + compoundInterval) {
            revert CompoundTooSoon();
        }
        
        return _compound();
    }

    /**
     * @notice Internal compound logic
     */
    function _compound() internal returns (uint256 compoundedAmount) {
        if (pendingRewards == 0) return 0;
        
        compoundedAmount = pendingRewards;
        
        // Calculate shares for the compounded amount
        // These shares are distributed proportionally to all existing shareholders
        // by increasing the value of each share (no new shares minted)
        
        // The compounded amount stays in the vault, increasing TVL
        // This means each share is now worth more
        
        pendingRewards = 0;
        lastCompoundTime = block.timestamp;
        
        emit Compound(compoundedAmount, 0);
    }

    /**
     * @notice Check if compound should be triggered
     */
    function _shouldCompound() internal view returns (bool) {
        return pendingRewards > 0 && block.timestamp >= lastCompoundTime + compoundInterval;
    }

    /**
     * @notice Internal harvest logic - override in derived contracts
     * @return profit The harvested profit
     */
    function _harvest() internal virtual returns (uint256 profit) {
        // Base implementation simulates yield based on APY
        // Override in derived contracts for real yield sources
        uint256 timeSinceLastHarvest = block.timestamp - lastHarvestTime;
        uint256 apy = this.getAPY();
        
        // Calculate yield: principal * (APY / 10000) * (time / 365 days)
        uint256 principal = getTVL();
        profit = (principal * apy * timeSinceLastHarvest) / (10000 * 365 days);
        
        return profit;
    }

    // ═══════════════════════════════════════════════════════════════════
    //                         SHARE CALCULATIONS
    // ═══════════════════════════════════════════════════════════════════

    function _calculateShares(uint256 amount) internal view returns (uint256) {
        if (totalShares == 0) {
            return amount;
        }
        return (amount * totalShares) / getTVL();
    }

    function _calculateWithdrawAmount(uint256 shareAmount) internal view returns (uint256) {
        if (totalShares == 0) return 0;
        return (shareAmount * getTVL()) / totalShares;
    }

    // ═══════════════════════════════════════════════════════════════════
    //                         VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    function getUserShares(address user) external view override returns (uint256) {
        return shares[user];
    }

    function getUserValue(address user) external view override returns (uint256) {
        if (totalShares == 0) return 0;
        return (shares[user] * getTVL()) / totalShares;
    }

    function getTVL() public view virtual override returns (uint256) {
        return depositToken.balanceOf(address(this)) + pendingRewards;
    }

    function getPendingRewards() external view override returns (uint256) {
        return pendingRewards;
    }

    function getLastHarvestTime() external view override returns (uint256) {
        return lastHarvestTime;
    }

    function getCompoundInterval() external view override returns (uint256) {
        return compoundInterval;
    }

    // ═══════════════════════════════════════════════════════════════════
    //                         ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setAuthorizedDepositor(address depositor, bool authorized) external onlyOwner {
        authorizedDepositors[depositor] = authorized;
        emit AuthorizedDepositorSet(depositor, authorized);
    }

    function setAuthorizedKeeper(address keeper, bool authorized) external onlyOwner {
        authorizedKeepers[keeper] = authorized;
        emit AuthorizedKeeperSet(keeper, authorized);
    }

    function setCompoundInterval(uint256 newInterval) external onlyOwner {
        compoundInterval = newInterval;
        emit CompoundIntervalUpdated(newInterval);
    }

    function setAutoCompound(bool enabled) external onlyOwner {
        autoCompoundEnabled = enabled;
        emit AutoCompoundToggled(enabled);
    }

    function setPerformanceFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 3000, "Max 30% fee"); // Cap at 30%
        performanceFeeBps = newFeeBps;
        emit PerformanceFeeUpdated(newFeeBps);
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        feeRecipient = newRecipient;
    }

    // Override in derived contracts
    function _afterDeposit(uint256 amount) internal virtual {}
    function _beforeWithdraw(uint256 amount) internal virtual {}
}

// ═══════════════════════════════════════════════════════════════════════════
//                           VAULT IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @title StableYieldVaultV2
 * @notice Low-risk stablecoin yield strategy with auto-compound
 */
contract StableYieldVaultV2 is BaseVaultStrategyV2 {
    uint256 public constant BASE_APY = 500; // 5% base APY
    
    constructor(
        address _depositToken,
        string memory _name,
        string memory _symbol
    ) BaseVaultStrategyV2(_depositToken, _name, _symbol) {}

    function getAPY() external pure override returns (uint256) {
        return BASE_APY;
    }

    function getRiskLevel() external pure override returns (uint8) {
        return 1;
    }

    function getStrategyType() external pure override returns (string memory) {
        return "Stable Yield";
    }
}

/**
 * @title LiquidStakingVaultV2
 * @notice Medium-risk liquid staking strategy with auto-compound
 */
contract LiquidStakingVaultV2 is BaseVaultStrategyV2 {
    uint256 public constant BASE_APY = 800; // 8% base APY
    uint256 public stakingRewards;
    
    constructor(
        address _depositToken,
        string memory _name,
        string memory _symbol
    ) BaseVaultStrategyV2(_depositToken, _name, _symbol) {}

    function getAPY() external pure override returns (uint256) {
        return BASE_APY;
    }

    function getRiskLevel() external pure override returns (uint8) {
        return 2;
    }

    function getStrategyType() external pure override returns (string memory) {
        return "Liquid Staking";
    }

    function addStakingRewards(uint256 amount) external onlyOwner {
        stakingRewards += amount;
    }

    function _harvest() internal override returns (uint256) {
        uint256 rewards = stakingRewards;
        stakingRewards = 0;
        return rewards + super._harvest();
    }

    function getTVL() public view override returns (uint256) {
        return depositToken.balanceOf(address(this)) + pendingRewards + stakingRewards;
    }
}

/**
 * @title DeltaNeutralVaultV2
 * @notice Medium-risk delta neutral strategy with auto-compound
 */
contract DeltaNeutralVaultV2 is BaseVaultStrategyV2 {
    uint256 public constant BASE_APY = 1200; // 12% base APY
    int256 public currentFundingRate;
    
    constructor(
        address _depositToken,
        string memory _name,
        string memory _symbol
    ) BaseVaultStrategyV2(_depositToken, _name, _symbol) {}

    function getAPY() external pure override returns (uint256) {
        return BASE_APY;
    }

    function getRiskLevel() external pure override returns (uint8) {
        return 3;
    }

    function getStrategyType() external pure override returns (string memory) {
        return "Delta Neutral";
    }

    function setFundingRate(int256 rate) external onlyOwner {
        currentFundingRate = rate;
    }
}

/**
 * @title LeveragedYieldVaultV2
 * @notice Higher-risk leveraged yield strategy with auto-compound
 */
contract LeveragedYieldVaultV2 is BaseVaultStrategyV2 {
    uint256 public constant BASE_APY = 1800; // 18% base APY
    uint256 public leverageMultiplier = 3;
    
    constructor(
        address _depositToken,
        string memory _name,
        string memory _symbol
    ) BaseVaultStrategyV2(_depositToken, _name, _symbol) {}

    function getAPY() external pure override returns (uint256) {
        return BASE_APY;
    }

    function getRiskLevel() external pure override returns (uint8) {
        return 4;
    }

    function getStrategyType() external pure override returns (string memory) {
        return "Leveraged Yield";
    }

    function setLeverage(uint256 multiplier) external onlyOwner {
        require(multiplier >= 1 && multiplier <= 5, "Invalid leverage");
        leverageMultiplier = multiplier;
    }

    function getTVL() public view override returns (uint256) {
        return (depositToken.balanceOf(address(this)) + pendingRewards) * leverageMultiplier;
    }
}

/**
 * @title OptionsVaultV2
 * @notice Higher-risk options strategy with auto-compound
 */
contract OptionsVaultV2 is BaseVaultStrategyV2 {
    uint256 public constant BASE_APY = 2500; // 25% base APY
    uint256 public premiumsCollected;
    uint256 public strikePrice;
    bool public isCallStrategy;
    
    constructor(
        address _depositToken,
        string memory _name,
        string memory _symbol,
        bool _isCallStrategy
    ) BaseVaultStrategyV2(_depositToken, _name, _symbol) {
        isCallStrategy = _isCallStrategy;
    }

    function getAPY() external pure override returns (uint256) {
        return BASE_APY;
    }

    function getRiskLevel() external pure override returns (uint8) {
        return 5;
    }

    function getStrategyType() external view override returns (string memory) {
        return isCallStrategy ? "Covered Calls" : "Cash-Secured Puts";
    }

    function setStrike(uint256 _strike) external onlyOwner {
        strikePrice = _strike;
    }

    function collectPremium(uint256 amount) external onlyOwner {
        premiumsCollected += amount;
    }

    function _harvest() internal override returns (uint256) {
        uint256 premiums = premiumsCollected;
        premiumsCollected = 0;
        return premiums + super._harvest();
    }

    function getTVL() public view override returns (uint256) {
        return depositToken.balanceOf(address(this)) + pendingRewards + premiumsCollected;
    }
}

/**
 * @title VaultFactoryV2
 * @notice Factory contract to deploy new V2 vault strategies
 */
contract VaultFactoryV2 is Ownable, Pausable {
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
    ) external onlyOwner whenNotPaused returns (address vault) {
        if (vaultType == VaultType.StableYield) {
            vault = address(new StableYieldVaultV2(depositToken, name, symbol));
        } else if (vaultType == VaultType.LiquidStaking) {
            vault = address(new LiquidStakingVaultV2(depositToken, name, symbol));
        } else if (vaultType == VaultType.DeltaNeutral) {
            vault = address(new DeltaNeutralVaultV2(depositToken, name, symbol));
        } else if (vaultType == VaultType.LeveragedYield) {
            vault = address(new LeveragedYieldVaultV2(depositToken, name, symbol));
        } else if (vaultType == VaultType.OptionsCalls) {
            vault = address(new OptionsVaultV2(depositToken, name, symbol, true));
        } else if (vaultType == VaultType.OptionsPuts) {
            vault = address(new OptionsVaultV2(depositToken, name, symbol, false));
        } else {
            revert("Invalid vault type");
        }

        allVaults.push(vault);
        isVault[vault] = true;
        vaultsByType[vaultType].push(vault);

        Ownable(vault).transferOwnership(msg.sender);

        emit VaultCreated(vault, vaultType, depositToken, name);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
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
