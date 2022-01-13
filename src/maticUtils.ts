import { use, Web3SideChainClient, RootChain, IPOSClientConfig, ExitUtil } from '@maticnetwork/maticjs'
import { Web3ClientPlugin } from '@maticnetwork/maticjs-ethers'
import { ethers } from 'ethers';

// install ethers plugin
use(Web3ClientPlugin)

const LOG_EVENT_SIG = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'; // erc20 transfer
const MY_LOG_EVENT_SIG = '0x579bef04d7a3da58f11e75bdd3f91f1f2aabee3c8f555d7d0bd4f28761bdc565'; // WithdrawTo(address)

const MUMBAI_URL = "https://rpc-endpoints.superfluid.dev/mumbai";
const POLYGON_URL = "https://polygon-rpc.com";

export interface IMaticUtils {
    init() : Promise<void>;
    getExitPayload(txHash: string) : Promise<string>;
    getMyLogIndex(payload: string): number;
}

class MaticUtils implements IMaticUtils {
    _isTest;
    _parentProvider;
    _childProvider;
    _exitUtils: ExitUtil | undefined;

    constructor(isTest: boolean, parentProvider: ethers.providers.Provider, childProvider: ethers.providers.Provider) {
        this._isTest = isTest;
        this._parentProvider = parentProvider;
        this._childProvider = childProvider;
    }

    async init(): Promise<void> {
        this._exitUtils = await getExitUtil(this._isTest, this._parentProvider, this._childProvider);
    }

    getExitPayload(txHash: string): Promise<string> {
        if (!this._exitUtils) return Promise.reject("NO_INIT");
        return this._exitUtils.buildPayloadForExit(txHash, LOG_EVENT_SIG, false);
    }

    getMyLogIndex(payload: string): number {
        return findMyLogIndex(getLogs(payload), MY_LOG_EVENT_SIG);
    }
}

export function initMaticUtils(chainId: number, provider: ethers.providers.Provider): IMaticUtils {
    if (chainId === 1) {
        return new MaticUtils(false, provider, getChildProvider(false));
    }
    if (chainId === 5) {
        return new MaticUtils(true, provider, getChildProvider(true));
    }
    throw new Error("Invaild ChainID");
}

function getChildProvider(isTest: boolean) : ethers.providers.Provider {
    if (isTest) {
        return new ethers.providers.JsonRpcProvider(MUMBAI_URL);
    }
    return new ethers.providers.JsonRpcProvider(POLYGON_URL);
}

async function getExitUtil(isTest: boolean, parentProvider: ethers.providers.Provider, childProvider: ethers.providers.Provider) {
    const rootChainAddress = isTest ? "0x2890bA17EfE978480615e330ecB65333b880928e" : "0x86E4Dc95c7FBdBf52e33D563BbDB00823894C287";
    const client = new Web3SideChainClient<IPOSClientConfig>();
    // initiate client
    await client.init({
        // log: true,
        network: isTest ? 'testnet' : 'mainnet',
        version: isTest ? 'mumbai' : 'v1',
        parent: {
            provider: parentProvider,
            defaultConfig: {
                from: ""
            }
        },
        child: {
            provider: childProvider,
            defaultConfig: {
                from: ""
            }
        }
    });

    // create root chain instance
    const rootChain = new RootChain(client, rootChainAddress);

    // create exitUtil Instance
    return new ExitUtil(client, rootChain);
}

type ILog = {
    address: string,
    topics: string[],
    data: string
};

function findMyLogIndex(logs: ILog[], logEventSig: string) {
    const logIndex = logs.findIndex(log => log.topics[0].toLowerCase() === logEventSig.toLowerCase());
    if (logIndex < 0) {
        throw new Error("Log not found in receipt");
    }
    return logIndex;
}

function getLogs(proof: string) : ILog[] {
    const data = ethers.utils.RLP.decode(proof);
    const receipt = ethers.utils.RLP.decode(data[6]);
    return receipt[3].map((v: unknown[]) => {
        return {
            address: v[0],
            topics: v[1],
            data: v[2],
        };
    });
}