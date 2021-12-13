// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IChildOperator.sol";
import "./IChildERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ERC20Operator is IChildOperator {
    using SafeERC20 for IChildERC20;

    bytes32 public constant TOKEN_TYPE = keccak256("ERC20");

    function withdrawTokens(address _withdrawer, address _token, bytes memory _withdrawData) external override {
        uint256 amount = abi.decode(_withdrawData, (uint256));
        IChildERC20(_token).safeTransferFrom(_withdrawer, address(this), amount);
        IChildERC20(_token).withdraw(amount);
    }
}