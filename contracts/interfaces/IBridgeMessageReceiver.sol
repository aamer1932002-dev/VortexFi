// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBridgeMessageReceiver
 * @notice Interface for contracts that receive bridged messages via AggLayer
 * @dev Any contract wanting to receive bridgeAndCall() must implement this
 * 
 * This is the "receiving end" of the AggLayer magic. When bridgeAndCall()
 * is executed on the source chain, the bridge calls onMessageReceived()
 * on the destination contract with the bridged tokens already transferred.
 */
interface IBridgeMessageReceiver {
    /**
     * @notice Function triggered by the bridge when a message is received
     * @dev CRITICAL SECURITY: Always verify msg.sender is the bridge contract!
     * 
     * @param originAddress The address that initiated bridgeAndCall on source chain
     * @param originNetwork The network ID where the call originated
     * @param data The calldata encoded in the original bridgeAndCall
     */
    function onMessageReceived(
        address originAddress,
        uint32 originNetwork,
        bytes memory data
    ) external payable;
}
