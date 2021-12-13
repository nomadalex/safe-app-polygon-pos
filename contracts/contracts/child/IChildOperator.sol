// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IChildOperator {
    function withdrawTokens(address _withdrawer, address _token, bytes memory _withdrawData) external;
}