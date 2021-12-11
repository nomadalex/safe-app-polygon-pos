pragma solidity ^0.8.0;

interface IRootOperator {
    function exitTokens(address token, address user, bytes memory log) external;
}