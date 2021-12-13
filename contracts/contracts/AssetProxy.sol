// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./IAssetProxy.sol";

contract AssetProxy is IAssetProxy, Ownable {
    function proxyCall(address _dst, bytes memory _calldata) external override onlyOwner {
        (bool success,) = _dst.delegatecall(_calldata);
        require(success);
    }
}