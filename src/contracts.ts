import { ethers } from "ethers";
import { BaseTransaction } from "@gnosis.pm/safe-apps-sdk";

import erc20Abi from "./abi/IERC20.json";
import rootChainManagerAbi from "./abi/pos/RootChainManager.json";

const mainnet = {
    "RootChainManagerAddress": "0xA0c68C638235ee32657e8f720a23ceC1bFc77C77",
    "ERC20Predicate": "0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf",
};

const rinkeby = {
    "RootChainManagerAddress": "0xb19D68085FF3078e1f9911cc2509c4aFB6d40be1",
    "ERC20Predicate": "0xd53E0518e2af7988f928d6D3996665656f966965",
};

export interface ContractsHelper {
    createDepositEthTransactions(user: string, amount: string) : Promise<BaseTransaction[]>;
    createDepositErc20Transactions(tokenAddress: string, user: string, amount: string) : Promise<BaseTransaction[]>;
}

class ContractsHelperImpl implements ContractsHelper {
    _erc20PredicateAddress;
    _erc20Interface;
    _rootChainManagerAddress;
    _rootChainManagerInterface;

    constructor(erc20PredicateAddress: string, rootChainManagerAddress: string) {
        this._erc20PredicateAddress = erc20PredicateAddress;
        this._erc20Interface = new ethers.utils.Interface(erc20Abi);
        this._rootChainManagerAddress = rootChainManagerAddress;
        this._rootChainManagerInterface = new ethers.utils.Interface(rootChainManagerAbi);
    }

    async createDepositEthTransactions(user: string, amount: string): Promise<BaseTransaction[]> {
        const txs = [
            {
              to: this._rootChainManagerAddress,
              value: amount,
              data: this._rootChainManagerInterface.encodeFunctionData('depositEtherFor', [
                user
              ]),
            },
          ];
        return Promise.resolve(txs);
    }

    async createDepositErc20Transactions(tokenAddress: string, user: string, amount: string): Promise<BaseTransaction[]> {
        const depositData = ethers.utils.defaultAbiCoder.encode(['uint256'], [amount]);
        const txs = [
            {
              to: tokenAddress,
              value: '0',
              data: this._erc20Interface.encodeFunctionData('approve', [
                this._erc20PredicateAddress,
                amount,
              ]),
            },
            {
              to: this._rootChainManagerAddress,
              value: '0',
              data: this._rootChainManagerInterface.encodeFunctionData('depositFor', [
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

export function initContractsHelper(chainId: number) : ContractsHelper | null {
    const m = getConfig(chainId);
    if (!m) return null;
    return new ContractsHelperImpl(m["ERC20Predicate"], m["RootChainManagerAddress"]);
}

export function initTokenContract(tokenAddress: string, provider: ethers.providers.Provider) : ethers.Contract {
    return new ethers.Contract(tokenAddress, erc20Abi, provider);
}