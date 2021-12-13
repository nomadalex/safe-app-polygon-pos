// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRootOperator {
    function exitTokens(address _token, address _user, bytes memory _log) external;
}