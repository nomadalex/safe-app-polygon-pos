import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Divider, Select, Text, TextFieldInput, Title } from '@gnosis.pm/safe-react-components'
import { FormButtonWrapper, FormHeaderWrapper, Heading, Label, RightJustified, Wrapper } from './GeneralStyled'
import { ethers, constants, BigNumber } from 'ethers';
import { SelectItem } from '@gnosis.pm/safe-react-components/dist/inputs/Select'
import { InputAdornment } from '@material-ui/core';

import { useSafeAppsSDK } from '@gnosis.pm/safe-apps-react-sdk';
import { SafeAppProvider } from '@gnosis.pm/safe-apps-provider';
import { initContractsHelper, initTokenContract } from './contracts';

import { getTokenList, TokenInfo } from './tokens';

function buildTokenItems(list: TokenInfo[]) : SelectItem[] {
    return list.map((v, idx) => {
        return {
            id: (idx+1).toString(),
            label: v.symbol,
            iconUrl: v.iconUrl,
        };
    })
}

function getTokenInfo(activeItemId: string, tokenList: TokenInfo[]) : TokenInfo {
    const idx = parseInt(activeItemId)-1;
    return tokenList[idx];
}

const SafeApp = (): React.ReactElement => {
  const { sdk, safe } = useSafeAppsSDK();

  const tokenList = useMemo(() => getTokenList(safe.chainId), [safe]);

  const [targetAddress, setTargetAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectItems] = useState<SelectItem[]>(buildTokenItems(tokenList));
  const [activeItemId, setActiveItemId] = useState("1");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [maxBalance, setMaxBalance] = useState(constants.Zero);
  const [decimals, setDecimals] = useState('18');

  const provider = useMemo(() => new ethers.providers.Web3Provider(new SafeAppProvider(safe, sdk)), [sdk, safe]);

  const contractsHelper = useMemo(() => initContractsHelper(safe.chainId), [safe]);

  useEffect(() => {
    const info = getTokenInfo(activeItemId, tokenList);
    setTokenSymbol(info.symbol);
    setDecimals(info.decimals);
    setMaxBalance(constants.Zero);
    if (activeItemId === "1") {
        provider.getBalance(safe.safeAddress).then(v => {
            setMaxBalance(v);
        });
    } else {
        const contract = initTokenContract(info.address, provider);
        contract.balanceOf(safe.safeAddress).then((v: BigNumber) => {
            setMaxBalance(v);
        })
    }
  }, [activeItemId, safe, provider, tokenList]);

  const formattedMaxBalance = ethers.utils.formatUnits(maxBalance, decimals);

  const onSelect = (id: string) => {
    setActiveItemId(id);
  };

  const onClick = () => {
      const newAmount = ethers.utils.parseUnits(amount ? amount : '0', decimals).toString();
      let txsPromise = null;
      if (activeItemId === "1") {
        txsPromise = contractsHelper?.createDepositEthTransactions(targetAddress, newAmount);
      } else {
          const tokenInfo = getTokenInfo(activeItemId, tokenList);
          txsPromise = contractsHelper?.createDepositErc20Transactions(tokenInfo.address, targetAddress, newAmount);
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
                items={selectItems}
                activeItemId={activeItemId}
                onItemClick={onSelect}
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
