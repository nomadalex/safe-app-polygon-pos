// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract IRootChainManager {
    mapping(address => address) public childToRootToken;
    mapping(address => bytes32) public tokenToType;

    function exit(bytes calldata inputData) virtual external;
}
