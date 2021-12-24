// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../IAssetProxy.sol";
import "./IChildOperator.sol";
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

    function withdrawTo(bytes32 _type, address _token, address _user, bytes calldata _withdrawData) external {
        address rootToken = IChildChainManager(childChainManager).childToRootToken(_token);
        require(rootToken != address(0), "TOKEN_NOT_MAPPED");

        address op = operators[_type];
        require(op != address(0), "OPERATOR_NOT_FOUND");

        IAssetProxy(assetProxy).setOperator(op);
        IChildOperator(assetProxy).withdrawTokens(msg.sender, _token, _withdrawData);
        IAssetProxy(assetProxy).setOperator(address(0));

        emit WithdrawTo(_user);
    }
}