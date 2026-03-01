// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPolygonZkEVMBridgeV2
 * @notice Interface for the Polygon Unified Bridge (AggLayer)
 * @dev This is the core interface for cross-chain communication in Polygon 2.0
 * 
 * The Unified Bridge enables atomic cross-chain operations through:
 * 1. bridgeAsset() - Simple token bridging
 * 2. bridgeMessage() - Cross-chain messaging
 * 3. bridgeAndCall() - Atomic bridge + contract call (THE KEY FUNCTION)
 * 
 * bridgeAndCall() is what makes AggZap possible - it bridges tokens AND
 * executes a function on the destination chain in a single atomic operation.
 */
interface IPolygonZkEVMBridgeV2 {
    /**
     * @notice Deposit add a new leaf to the merkle tree
     * @param destinationNetwork Network destination
     * @param destinationAddress Address destination
     * @param amount Amount of tokens
     * @param token Token address, 0 address is reserved for ether
     * @param forceUpdateGlobalExitRoot Indicates if the global exit root is updated or not
     * @param permitData Raw data of the call `permit` of the token
     */
    function bridgeAsset(
        uint32 destinationNetwork,
        address destinationAddress,
        uint256 amount,
        address token,
        bool forceUpdateGlobalExitRoot,
        bytes calldata permitData
    ) external payable;

    /**
     * @notice Bridge message and send ETH value
     * @param destinationNetwork Network destination
     * @param destinationAddress Address destination
     * @param forceUpdateGlobalExitRoot Indicates if the global exit root is updated or not
     * @param metadata Message metadata
     */
    function bridgeMessage(
        uint32 destinationNetwork,
        address destinationAddress,
        bool forceUpdateGlobalExitRoot,
        bytes calldata metadata
    ) external payable;

    /**
     * @notice Bridge tokens AND call a contract on the destination chain
     * @dev THIS IS THE MAGIC FUNCTION that enables "One-Click Yield"
     * 
     * Why use bridgeAndCall instead of bridgeAsset?
     * - bridgeAsset only moves tokens, requiring a second tx to use them
     * - bridgeAndCall atomically bridges AND executes your intended action
     * - Reduces 4+ transactions to 1, saving time and gas
     * - Enables true "chain abstraction" - user doesn't know they're cross-chain
     * 
     * @param destinationNetwork Network destination (e.g., 1 for zkEVM mainnet)
     * @param destinationAddress Address on destination that receives tokens
     * @param fallbackAddress If the call fails, tokens go here (safety net)
     * @param amount Amount of tokens to bridge
     * @param token Token address (use address(0) for native ETH)
     * @param forceUpdateGlobalExitRoot Update global exit root immediately
     * @param permitData Optional permit data for gasless approvals
     * @param callData The encoded function call to execute on destination
     */
    function bridgeAndCall(
        uint32 destinationNetwork,
        address destinationAddress,
        address fallbackAddress,
        uint256 amount,
        address token,
        bool forceUpdateGlobalExitRoot,
        bytes calldata permitData,
        bytes calldata callData
    ) external payable;

    /**
     * @notice Returns the address of the wrapper for a given token on a network
     * @param originNetwork Origin network
     * @param originTokenAddress Origin token address, 0 for ETH
     */
    function getTokenWrappedAddress(
        uint32 originNetwork,
        address originTokenAddress
    ) external view returns (address);

    /**
     * @notice Returns the network ID of this chain
     */
    function networkID() external view returns (uint32);
}
