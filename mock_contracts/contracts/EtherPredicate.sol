pragma solidity 0.6.6;

import {ITokenPredicate} from "./ITokenPredicate.sol";

contract EtherPredicate is ITokenPredicate {
    event LockedEther(
        address indexed depositor,
        address indexed depositReceiver,
        uint256 amount
    );

    constructor() public {}

    /**
     * @notice Receive Ether to lock for deposit, callable only by manager
     */
    receive() external payable {}

    /**
     * @notice handle ether lock, callable only by manager
     * @param depositor Address who wants to deposit tokens
     * @param depositReceiver Address (address) who wants to receive tokens on child chain
     * @param depositData ABI encoded amount
     */
    function lockTokens(
        address depositor,
        address depositReceiver,
        address,
        bytes calldata depositData
    )
        external
        override
    {
        uint256 amount = abi.decode(depositData, (uint256));
        emit LockedEther(depositor, depositReceiver, amount);
    }

    function testWithdraw() external {
        (bool success, /* bytes memory data */) = msg.sender.call{value: address(this).balance}("");
        if (!success) {
            revert("EtherPredicate: ETHER_TRANSFER_FAILED");
        }
    }
}
