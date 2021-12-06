pragma solidity 0.6.6;

import "./ContextMixin.sol";
import "./ITokenPredicate.sol";
import "./RootChainManagerStorage.sol";

contract RootChainManager is ContextMixin, RootChainManagerStorage {
    address public constant ETHER_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    function _msgSender()
        internal
        view
        returns (address payable sender)
    {
        return ContextMixin.msgSender();
    }

    /**
     * @notice Register a token predicate address against its type, callable only by ADMIN
     * @dev A predicate is a contract responsible to process the token specific logic while locking or exiting tokens
     * @param tokenType bytes32 unique identifier for the token type
     * @param predicateAddress address of token predicate address
     */
    function registerPredicate(bytes32 tokenType, address predicateAddress)
        external
    {
        typeToPredicate[tokenType] = predicateAddress;
    }

    /**
     * @notice Map a token to enable its movement via the PoS Portal, callable only by mappers
     * @param rootToken address of token on root chain
     * @param childToken address of token on child chain
     * @param tokenType bytes32 unique identifier for the token type
     */
    function mapToken(
        address rootToken,
        address childToken,
        bytes32 tokenType
    ) external {
        // explicit check if token is already mapped to avoid accidental remaps
        require(
            rootToChildToken[rootToken] == address(0) &&
            childToRootToken[childToken] == address(0),
            "RootChainManager: ALREADY_MAPPED"
        );
        _mapToken(rootToken, childToken, tokenType);
    }

    /**
     * @notice Clean polluted token mapping
     * @param rootToken address of token on root chain. Since rename token was introduced later stage, 
     * clean method is used to clean pollulated mapping
     */
    function cleanMapToken(
        address rootToken,
        address childToken
    ) external {
        rootToChildToken[rootToken] = address(0);
        childToRootToken[childToken] = address(0);
        tokenToType[rootToken] = bytes32(0);
    }

    function _mapToken(
        address rootToken,
        address childToken,
        bytes32 tokenType
    ) private {
        require(
            typeToPredicate[tokenType] != address(0x0),
            "RootChainManager: TOKEN_TYPE_NOT_SUPPORTED"
        );

        rootToChildToken[rootToken] = childToken;
        childToRootToken[childToken] = rootToken;
        tokenToType[rootToken] = tokenType;
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
        _depositFor(user, ETHER_ADDRESS, depositData);

        // payable(typeToPredicate[tokenToType[ETHER_ADDRESS]]).transfer(msg.value);
        // transfer doesn't work as expected when receiving contract is proxified so using call
        (bool success, /* bytes memory data */) = typeToPredicate[tokenToType[ETHER_ADDRESS]].call{value: msg.value}("");
        if (!success) {
            revert("RootChainManager: ETHER_TRANSFER_FAILED");
        }
    }

    function _depositFor(
        address user,
        address rootToken,
        bytes memory depositData
    ) private {
        bytes32 tokenType = tokenToType[rootToken];
        require(
            rootToChildToken[rootToken] != address(0x0) &&
               tokenType != 0,
            "RootChainManager: TOKEN_NOT_MAPPED"
        );
        address predicateAddress = typeToPredicate[tokenType];
        require(
            predicateAddress != address(0),
            "RootChainManager: INVALID_TOKEN_TYPE"
        );
        require(
            user != address(0),
            "RootChainManager: INVALID_USER"
        );

        ITokenPredicate(predicateAddress).lockTokens(
            _msgSender(),
            user,
            rootToken,
            depositData
        );
    }
}