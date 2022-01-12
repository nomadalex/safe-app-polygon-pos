/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers } from "ethers";
import { BaseTransaction, TokenBalance } from "@gnosis.pm/safe-apps-sdk";

import erc20Abi from "./abi/IERC20.json";
import rootChainManagerAbi from "./abi/pos/RootChainManager.json";
import childChainManagerAbi from "./abi/pos/ChildChainManager.json";
import rootManagerAbi from "./abi/RootManager.json";
import childManagerAbi from "./abi/ChildManager.json";

type IConfig = {
    root: {
        RootChainManagerAddress: string,
        RootManagerAddress: string,
    },
    child: {
        ChildChainManagerAddress: string,
        ChildManagerAddress: string,
        AssetProxyAddress: string,
    }
};

const mainnet : IConfig = {
    root: {
        "RootChainManagerAddress": "0xA0c68C638235ee32657e8f720a23ceC1bFc77C77",
        "RootManagerAddress": "",
    },
    child: {
        "ChildChainManagerAddress": "",
        "ChildManagerAddress": "",
        "AssetProxyAddress": "",
    }
};

const goerli : IConfig = {
    root: {
        "RootChainManagerAddress": "0xBbD7cBFA79faee899Eaf900F13C9065bF03B1A74",
        "RootManagerAddress": "0x17e5204a12Af9fC8d909e143D5696f8d1c5522be",
    },
    child: {
        "ChildChainManagerAddress": "0xb5505a6d998549090530911180f38aC5130101c6",
        "ChildManagerAddress": "0x8b98dD77e07D000801F347631697Dc34d3b7358d",
        "AssetProxyAddress": "0x4F6612b7ddA8cB47D73690f2e61330588eb01AC5",
    }
};

export interface ContractsHelper {
    initTokens(list: TokenBalance[]) : Promise<TokenBalance[]>;
    createDepositEthTransactions(user: string, amount: string) : Promise<BaseTransaction[]>;
    createDepositErc20Transactions(tokenAddress: string, user: string, amount: string) : Promise<BaseTransaction[]>;
    createWithdrawErc20Transactions(tokenAddress: string, user: string, amount: string) : Promise<BaseTransaction[]>;
    createExitTransactions(inputData: string, myLogIndex: number) : Promise<BaseTransaction[]>;
}

class RootContractsHelperImpl implements ContractsHelper {
    _rootChainManagerContract;
    _erc20Interface;
    _rootManagerContract;
    _tokenCache = new Map<string, string>();
    _predicateCache = new Map<string, string>();

    constructor(config: IConfig, provider: ethers.providers.Provider) {
        this._rootChainManagerContract = new ethers.Contract(config.root.RootChainManagerAddress, rootChainManagerAbi, provider);
        this._rootManagerContract = new ethers.Contract(config.root.RootManagerAddress, rootManagerAbi, provider);
        this._erc20Interface = new ethers.utils.Interface(erc20Abi);
    }

    getPredicateForToken(token: string) : string | undefined {
        const type = this._tokenCache.get(token);
        if (!type) return;
        return this._predicateCache.get(type);
    }

    async setupTypePredicate(type: string) {
        if (!this._predicateCache.has(type)) {
            const predicate = await this._rootChainManagerContract.typeToPredicate(type);
            this._predicateCache.set(type, predicate);
        }
    }

    async initTokens(list: TokenBalance[]) : Promise<TokenBalance[]> {
        const m = await Promise.all(list.map(async t => {
            if (t.tokenInfo.type === 'NATIVE_TOKEN') return t;
            if (t.tokenInfo.type === 'ERC20') {
                const type = await this._rootChainManagerContract.tokenToType(t.tokenInfo.address);
                if (type === ethers.constants.HashZero) return null;
                this._tokenCache.set(t.tokenInfo.address, type);
                await this.setupTypePredicate(type);
                return t;
            }
            return null;
        }));

        return m.filter(v => v) as TokenBalance[];
    }

    async createDepositEthTransactions(user: string, amount: string): Promise<BaseTransaction[]> {
        const txs = [
            {
              to: this._rootChainManagerContract.address,
              value: amount,
              data: this._rootChainManagerContract.interface.encodeFunctionData('depositEtherFor', [
                user
              ]),
            },
          ];
        return Promise.resolve(txs);
    }

    async createDepositErc20Transactions(tokenAddress: string, user: string, amount: string): Promise<BaseTransaction[]> {
        const predicate = this.getPredicateForToken(tokenAddress);
        if (!predicate) return [];

        const depositData = ethers.utils.defaultAbiCoder.encode(['uint256'], [amount]);
        const txs = [
            {
              to: tokenAddress,
              value: '0',
              data: this._erc20Interface.encodeFunctionData('approve', [
                predicate,
                amount,
              ]),
            },
            {
              to: this._rootChainManagerContract.address,
              value: '0',
              data: this._rootChainManagerContract.interface.encodeFunctionData('depositFor', [
                user,
                tokenAddress,
                depositData
              ]),
            },
          ];
        return txs;
    }

    createWithdrawErc20Transactions(tokenAddress: string, user: string, amount: string): Promise<BaseTransaction[]> {
        throw new Error("Method not implemented.");
    }

    createExitTransactions(inputData: string, myLogIndex: number): Promise<BaseTransaction[]> {
        const txs = [
            {
              to: this._rootManagerContract.address,
              value: '0',
              data: this._rootManagerContract.interface.encodeFunctionData('exit', [
                inputData,
                myLogIndex
              ]),
            },
          ];
        return Promise.resolve(txs);
    }

}

class ChildContractsHelperImpl implements ContractsHelper {
    _childChainManagerContract;
    _childManagerContract;
    _erc20Interface;
    _assetProxyAddress;

    constructor(config: IConfig, provider: ethers.providers.Provider) {
        this._childChainManagerContract = new ethers.Contract(config.child.ChildManagerAddress, childChainManagerAbi, provider);
        this._childManagerContract = new ethers.Contract(config.child.ChildManagerAddress, childManagerAbi, provider);
        this._erc20Interface = new ethers.utils.Interface(erc20Abi);
        this._assetProxyAddress = config.child.AssetProxyAddress;
    }

    async initTokens(list: TokenBalance[]): Promise<TokenBalance[]> {
        const m = await Promise.all(list.map(async t => {
            if (t.tokenInfo.type === 'NATIVE_TOKEN') return null;
            if (t.tokenInfo.type === 'ERC20') {
                const rootToken = await this._childChainManagerContract.childToRootToken(t.tokenInfo.address);
                if (rootToken === ethers.constants.HashZero) return null;
                return t;
            }
            return null;
        }));

        return m.filter(v => v) as TokenBalance[];
    }
    createDepositEthTransactions(user: string, amount: string): Promise<BaseTransaction[]> {
        throw new Error("Method not implemented.");
    }
    createDepositErc20Transactions(tokenAddress: string, user: string, amount: string): Promise<BaseTransaction[]> {
        throw new Error("Method not implemented.");
    }
    async createWithdrawErc20Transactions(tokenAddress: string, user: string, amount: string): Promise<BaseTransaction[]> {
        const type = "0x8ae85d849167ff996c04040c44924fd364217285e4cad818292c7ac37c0a345b"; // keccak256("ERC20")
        const withdrawData = ethers.utils.defaultAbiCoder.encode(['uint256'], [amount]);
        const txs = [
            {
              to: tokenAddress,
              value: '0',
              data: this._erc20Interface.encodeFunctionData('approve', [
                this._assetProxyAddress,
                amount,
              ]),
            },
            {
              to: this._childManagerContract.address,
              value: '0',
              data: this._childManagerContract.interface.encodeFunctionData('withdrawTo', [
                type,
                tokenAddress,
                user,
                withdrawData
              ]),
            },
          ];
        return txs;
    }
    createExitTransactions(inputData: string, myLogIndex: number): Promise<BaseTransaction[]> {
        throw new Error("Method not implemented.");
    }
}

export function initContractsHelper(chainId: number, provider: ethers.providers.Provider) : ContractsHelper | null {
    if (chainId === 1) { // eth mainnet
        return new RootContractsHelperImpl(mainnet, provider);;
    }
    if (chainId === 5) { // eth goerli
        return new RootContractsHelperImpl(goerli, provider);
    }
    if (chainId === 137) { // polygon mainnet
        return new ChildContractsHelperImpl(mainnet, provider);
    }
    if (chainId === 80001) { // polygon testnet
        return new ChildContractsHelperImpl(goerli, provider);
    }
    return null;
}