pragma solidity 0.6.6;

import "./ContextMixin.sol";
import "./ITokenPredicate.sol";

contract RootChainManager is ContextMixin {
    address public predicateAddress;
    address public ethPredicateAddress;

    function setPredicateAddress(address addr, address eth) external {
        predicateAddress = addr;
        ethPredicateAddress = eth;
    }

    function _msgSender()
        internal
        view
        returns (address payable sender)
    {
        return ContextMixin.msgSender();
    }

    /**
     * @notice Move ether from root to child chain, accepts ether transfer
     * Keep in mind this ether cannot be used to pay gas on child chain
     * Use Matic tokens deposited using plasma mechanism for that
     * @param user address of account that should receive WETH on child chain
     */
    function depositEtherFor(address user) external payable {
        _depositEtherFor(user);
    }

    /**
     * @notice Move tokens from root to child chain
     * @dev This mechanism supports arbitrary tokens as long as its predicate has been registered and the token is mapped
     * @param user address of account that should receive this deposit on child chain
     * @param rootToken address of token that is being deposited
     * @param depositData bytes data that is sent to predicate and child token contracts to handle deposit
     */
    function depositFor(
        address user,
        address rootToken,
        bytes calldata depositData
    ) external {
        _depositFor(user, rootToken, depositData);
    }

    function _depositEtherFor(address user) private {
        bytes memory depositData = abi.encode(msg.value);
        ITokenPredicate(ethPredicateAddress).lockTokens(
            _msgSender(),
            user,
            address(0),
            depositData
        );

        // payable(typeToPredicate[tokenToType[ETHER_ADDRESS]]).transfer(msg.value);
        // transfer doesn't work as expected when receiving contract is proxified so using call
        (bool success, /* bytes memory data */) = ethPredicateAddress.call{value: msg.value}("");
        if (!success) {
            revert("RootChainManager: ETHER_TRANSFER_FAILED");
        }
    }

    function _depositFor(
        address user,
        address rootToken,
        bytes memory depositData
    ) private {
        ITokenPredicate(predicateAddress).lockTokens(
            _msgSender(),
            user,
            rootToken,
            depositData
        );
    }
}