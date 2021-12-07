import { TokenBalance } from "@gnosis.pm/safe-apps-sdk";
import SafeAppsSDK from "@gnosis.pm/safe-apps-sdk/dist/src/sdk";

export async function getBalances(sdk: SafeAppsSDK) : Promise<TokenBalance[]> {
    const balances = await sdk.safe.experimental_getBalances({ currency: "USD" });
    return balances.items;
}