pragma solidity ^0.8.0;

abstract contract IChildChainManager {
    mapping(address => address) public childToRootToken;
}