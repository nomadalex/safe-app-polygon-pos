// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../IAssetProxy.sol";
import "./IChildChainManager.sol";
import "../Initializable.sol";

contract ChildManager is Ownable, Initializable {
    event WithdrawTo(address user);

    address public assetProxy;
    address public childChainManager;
    mapping (bytes32 => address) public operators;

    function initialize(address _assetProxy, address _childChainManager) external initializer {
        assetProxy = _assetProxy;
        childChainManager = _childChainManager;
    }

    function registerOperator(bytes32 _type, address _operator) external onlyOwner {
        require(operators[_type] == address(0), "ALREADY_REGISTERED");
        operators[_type] = _operator;
    }

    function withdrawTokens(address _operator, address _withdrawer, address _token, bytes memory _withdrawData) private {
        IAssetProxy(assetProxy).proxyCall(_operator, abi.encodeWithSignature("withdrawTokens(address,address,bytes)", _withdrawer, _token, _withdrawData));
    }

    function withdrawTo(bytes32 _type, address _token, address _user, bytes calldata _withdrawData) external {
        address rootToken = IChildChainManager(childChainManager).childToRootToken(_token);
        require(rootToken != address(0), "TOKEN_NOT_MAPPED");

        address op = operators[_type];
        require(op != address(0), "OPERATOR_NOT_FOUND");
        withdrawTokens(op, msg.sender, _token, _withdrawData);
        emit WithdrawTo(_user);
    }
}