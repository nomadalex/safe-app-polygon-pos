// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../lib/ExitPayloadReader.sol";
import "../IAssetProxy.sol";
import "./IRootChainManager.sol";

contract RootManager is Ownable {
    using RLPReader for RLPReader.RLPItem;
    using ExitPayloadReader for bytes;
    using ExitPayloadReader for ExitPayloadReader.ExitPayload;
    using ExitPayloadReader for ExitPayloadReader.Receipt;
    using ExitPayloadReader for ExitPayloadReader.Log;

    address public assetProxy;
    address public childManagerAddress;
    address public rootChainManager;

    mapping (bytes32 => address) public operators;

    function initialize(address _assetProxy, address _childManagerAddress, address _rootChainManager) external onlyOwner {
        require(assetProxy == address(0), "ALREADY_INITIALIZED");
        assetProxy = _assetProxy;
        childManagerAddress = _childManagerAddress;
        rootChainManager = _rootChainManager;
    }

    function registerOperator(bytes32 _type, address _operator) external onlyOwner {
        require(operators[_type] == address(0), "ALREADY_REGISTERED");
        operators[_type] = _operator;
    }

    function getMyLog(ExitPayloadReader.Receipt memory receipt, uint myLogIndex) private pure returns (ExitPayloadReader.Log memory) {
        RLPReader.RLPItem memory logData = receipt.data[3].toList()[myLogIndex];
        return ExitPayloadReader.Log(logData, logData.toList()); 
    }

    function getToken(address childToken) private view returns (address) {
        return IRootChainManager(rootChainManager).childToRootToken(childToken);
    }

    function getOperator(address rootToken) private view returns (address) {
        bytes32 type_ = IRootChainManager(rootChainManager).tokenToType(rootToken);
        require(type_ != bytes32(0), "TYPE_NOT_FOUND");
        return operators[type_];
    }

    function exitTokens(address _operator, address _token, address _user, bytes memory _log) private {
        IAssetProxy(assetProxy).proxyCall(_operator, abi.encodeWithSignature("exitTokens(address,address,bytes)", _token, _user, _log));
    }

    function exit(bytes calldata inputData, uint myLogIndex) external {
        ExitPayloadReader.ExitPayload memory payload = inputData.toExitPayload();
        ExitPayloadReader.Receipt memory receipt = payload.getReceipt();
        ExitPayloadReader.Log memory mylog = getMyLog(receipt, myLogIndex);
        require(mylog.getEmitter() == childManagerAddress, "EVENT_EMITTER_NOT_MATCH");

        ExitPayloadReader.Log memory log = receipt.getLog();

        address rootToken = getToken(log.getEmitter());
        require(rootToken != address(0), "TOKEN_NOT_FOUND");
        address operator = getOperator(rootToken);
        require(operator != address(0), "OPERATOR_NOT_FOUND");

        IRootChainManager(rootChainManager).exit(inputData);

        address user = abi.decode(mylog.getData(), (address));
        exitTokens(operator, rootToken, user, log.toRlpBytes());
    }
}