import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Divider, Select, Text, TextFieldInput, Title } from '@gnosis.pm/safe-react-components'
import { FormButtonWrapper, FormHeaderWrapper, Heading, Label, RightJustified, Wrapper } from './GeneralStyled'
import { ethers, constants, BigNumber } from 'ethers';
import { SelectItem } from '@gnosis.pm/safe-react-components/dist/inputs/Select'
import { InputAdornment } from '@material-ui/core';

import { useSafeAppsSDK } from '@gnosis.pm/safe-apps-react-sdk';
import { SafeAppProvider } from '@gnosis.pm/safe-apps-provider';
import { initContractsHelper } from './contracts';

import SafeAppsSDK from '@gnosis.pm/safe-apps-sdk';
import { TokenBalance } from '@gnosis.pm/safe-apps-sdk';

async function getBalances(sdk: SafeAppsSDK) : Promise<TokenBalance[]> {
    const balances = await sdk.safe.experimental_getBalances({ currency: "USD" });
    return balances.items;
}

function buildTokenItems(list: TokenBalance[]) : SelectItem[] {
    return list.map((v, idx) => {
        return {
            id: (idx+1).toString(),
            label: v.tokenInfo.symbol,
            iconUrl: v.tokenInfo.logoUri || undefined,
        };
    })
}

function getTokenInfo(activeItemId: string, tokenList: TokenBalance[]) : TokenBalance {
    const idx = parseInt(activeItemId)-1;
    return tokenList[idx];
}

const SafeApp = (): React.ReactElement => {
  const { sdk, safe } = useSafeAppsSDK();

  const [tokenList, setTokenList] = useState([] as TokenBalance[]);
  const [targetAddress, setTargetAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [activeItemId, setActiveItemId] = useState("1");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [maxBalance, setMaxBalance] = useState(constants.Zero);
  const [decimals, setDecimals] = useState('18');

  const formattedMaxBalance = ethers.utils.formatUnits(maxBalance, decimals);

  const provider = useMemo(() => new ethers.providers.Web3Provider(new SafeAppProvider(safe, sdk)), [sdk, safe]);
  const contractsHelper = useMemo(() => initContractsHelper(safe.chainId, provider), [safe, provider]);

  useEffect(() => {
    getBalances(sdk).then(list => {
        return contractsHelper?.initTokens(list);
    }).then(list => {
        setTokenList(list || []);
    });
  }, [sdk, safe, contractsHelper]);

  useEffect(() => {
    const info = getTokenInfo(activeItemId, tokenList);
    if (!info) return;

    setTokenSymbol(info.tokenInfo.symbol);
    setDecimals(info.tokenInfo.decimals.toString());
    setMaxBalance(BigNumber.from(info.balance));
  }, [activeItemId, tokenList]);

  const onClick = () => {
      const token = getTokenInfo(activeItemId, tokenList);
      if (!token) return;

      const newAmount = ethers.utils.parseUnits(amount ? amount : '0', decimals);
      if (newAmount.isZero()) return;

      let txsPromise = null;
      switch (token.tokenInfo.type) {
          case 'NATIVE_TOKEN':
              txsPromise = contractsHelper?.createDepositEthTransactions(targetAddress, newAmount.toString());
              break;
          case 'ERC20':
              txsPromise = contractsHelper?.createDepositErc20Transactions(token.tokenInfo.address, targetAddress, newAmount.toString());
              break;
          default:
              break;
      }

      txsPromise?.then(txs => {
        sdk.txs.send({ txs });
      });
      return;
  };

  return (
    <Wrapper>
        <Card>
            <FormHeaderWrapper>
                <Title size="md">Deposit</Title>
            </FormHeaderWrapper>
            
            <Divider />

            <Label size="lg">Choose the target address you want to deposit to</Label>
            <TextFieldInput
                name={'target'}
                label={"Target"}
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
            />

            <Divider />
    
            <Label size="lg">Select the token to deposit</Label>
            <Select
                items={buildTokenItems(tokenList)}
                activeItemId={activeItemId}
                onItemClick={setActiveItemId}
                fallbackImage={"https://gnosis-safe.io/app/static/media/token_placeholder.c1abe466.svg"}
            />

            <Divider />

            <Label size="lg">Choose the amount you want to deposit</Label>
            <TextFieldInput
                  name={'amount'}
                  label={"Amount"}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  InputProps={{
                      endAdornment: (
                          <InputAdornment position="end">
                              <Button color="secondary" size="md" onClick={() => setAmount(formattedMaxBalance)}>
                                  <Heading>MAX</Heading>
                              </Button>
                          </InputAdornment>
                      ),
                  }}          
            />
            <RightJustified>
                <Text size="lg">
                    Maximum {formattedMaxBalance} {tokenSymbol}
                </Text>
            </RightJustified>

            <Divider />

            <FormButtonWrapper>
                <Button color="primary" size="lg" variant="contained" onClick={onClick}>
                    Deposit {tokenSymbol}
                </Button>
            </FormButtonWrapper>
        </Card>
    </Wrapper>
  )
}

export default SafeApp
