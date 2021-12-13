// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IRootOperator.sol";
import "../lib/RLPReader.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ERC20Operator is IRootOperator {
    using RLPReader for bytes;
    using RLPReader for RLPReader.RLPItem;
    using SafeERC20 for IERC20;

    bytes32 public constant TOKEN_TYPE = keccak256("ERC20");

    bytes32 public constant TRANSFER_EVENT_SIG = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef;

    function exitTokens(address _token, address _user, bytes memory _log) external override {
        RLPReader.RLPItem[] memory logRLPList = _log.toRlpItem().toList();
        RLPReader.RLPItem[] memory logTopicRLPList = logRLPList[1].toList(); // topics

        require(
            bytes32(logTopicRLPList[0].toUint()) == TRANSFER_EVENT_SIG, // topic0 is event sig
            "INVALID_SIGNATURE"
        );

        require(
            address(uint160(logTopicRLPList[1].toUint())) == address(this), // topic1 is from address
            "INVAILD_PROXY"
        );

        require(
            address(uint160(logTopicRLPList[2].toUint())) == address(0), // topic2 is to address
            "INVALID_RECEIVER"
        );

        IERC20(_token).safeTransfer(
            _user,
            logRLPList[2].toUint() // log data field
        );
    }
}