// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IAssetProxy {
    function proxyCall(address _dst, bytes memory _calldata) external;
}