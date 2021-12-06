import { ethers } from "ethers";
import { BaseTransaction, TokenBalance } from "@gnosis.pm/safe-apps-sdk";

import erc20Abi from "./abi/IERC20.json";
import rootChainManagerAbi from "./abi/pos/RootChainManager.json";

const mainnet = {
    "RootChainManagerAddress": "0xA0c68C638235ee32657e8f720a23ceC1bFc77C77",
};

const rinkeby = {
    "RootChainManagerAddress": "0xc6E587652347d7843b576E4b418AAb1BD2334aBc",
};

export interface ContractsHelper {
    initTokens(list: TokenBalance[]) : Promise<TokenBalance[]>;
    createDepositEthTransactions(user: string, amount: string) : Promise<BaseTransaction[]>;
    createDepositErc20Transactions(tokenAddress: string, user: string, amount: string) : Promise<BaseTransaction[]>;
}

class ContractsHelperImpl implements ContractsHelper {
    _rootChainManagerContract;
    _erc20Interface;
    _tokenCache = new Map<string, string>();
    _predicateCache = new Map<string, string>();

    constructor(rootChainManagerAddress: string, provider: ethers.providers.Provider) {
        this._rootChainManagerContract = new ethers.Contract(rootChainManagerAddress, rootChainManagerAbi, provider);
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
}

function getConfig(chainId: number) {
    if (chainId === 1) {
        return mainnet;
    }
    if (chainId === 4) {
        return rinkeby;
    }
    return null;
}

export function initContractsHelper(chainId: number, provider: ethers.providers.Provider) : ContractsHelper | null {
    const m = getConfig(chainId);
    if (!m) return null;
    return new ContractsHelperImpl(m["RootChainManagerAddress"], provider);
}