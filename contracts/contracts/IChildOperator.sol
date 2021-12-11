pragma solidity ^0.8.0;

interface IChildOperator {
    function withdrawTokens(address withdrawer, address token, bytes calldata _withdrawData) external;
}