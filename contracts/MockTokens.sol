// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @notice A mock USDC token for testing on testnets
 * @dev Anyone can mint for testing purposes
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private _decimals = 6; // USDC uses 6 decimals

    constructor() ERC20("Mock USDC", "USDC") Ownable(msg.sender) {
        // Mint initial supply to deployer
        _mint(msg.sender, 1_000_000 * 10**6); // 1M USDC
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Mint tokens for testing
     * @dev Anyone can call this on testnet
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Faucet function - get 1000 USDC
     */
    function faucet() external {
        _mint(msg.sender, 1000 * 10**6);
    }
}

/**
 * @title MockWETH
 * @notice A mock WETH token for testing
 */
contract MockWETH is ERC20, Ownable {
    constructor() ERC20("Mock Wrapped ETH", "WETH") Ownable(msg.sender) {}

    function deposit() external payable {
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        _burn(msg.sender, amount);
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "ETH transfer failed");
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    receive() external payable {
        _mint(msg.sender, msg.value);
    }
}
