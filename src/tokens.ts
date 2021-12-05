import ethIcon from './assets/eth.png';

export interface TokenInfo {
    address: string,
    symbol: string,
    decimals: string,
    iconUrl: string,
}

const mainnet : TokenInfo[] = [
    {
        address: "",
        symbol: "ETH",
        decimals: "18",
        iconUrl: ethIcon,
    },
];

const rinkeby : TokenInfo[] = [
    {
        address: "",
        symbol: "ETH",
        decimals: "18",
        iconUrl: ethIcon,
    },
    {
        address: "0xd92e713d051c37ebb2561803a3b5fbabc4962431",
        symbol: "USDT",
        decimals: "6",
        iconUrl: ethIcon,
    },
    {
        address: "0x01be23585060835e02b77ef475b0cc51aa1e0709",
        symbol: "LINK",
        decimals: "18",
        iconUrl: ethIcon,
    },
];

export function getTokenList(chainId: number) : TokenInfo[] {
    if (chainId === 1) {
        return mainnet;
    }
    if (chainId === 4) {
        return rinkeby;
    }
    return [];
}