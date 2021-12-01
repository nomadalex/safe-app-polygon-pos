import React, { useState } from 'react'
import { Button, Card, Divider, Select, Text, TextFieldInput, Title } from '@gnosis.pm/safe-react-components'
import { FormButtonWrapper, FormHeaderWrapper, Heading, Label, RightJustified, Wrapper } from './GeneralStyled'
import { ethers, constants } from 'ethers';
import { SelectItem } from '@gnosis.pm/safe-react-components/dist/inputs/Select'
import { InputAdornment } from '@material-ui/core';

import ethIcon from './assets/eth.png';

const tokens : SelectItem[] = [
    {
        id: "1",
        label: "ETH",
        iconUrl: ethIcon,
    }
];

const SafeApp = (): React.ReactElement => {
  const [amount, setAmount] = useState('');
  const [selectItems] = useState<SelectItem[]>(tokens);
  const [activeItemId, setActiveItemId] = useState("1");
  const [tokenSymbol] = useState('ETH');
  const [maxBalance] = useState(constants.Zero);
  const [decimals] = useState('18');
  const formattedMaxBalance = ethers.utils.formatUnits(maxBalance, decimals);

  const onSelect = (id: string) => {
    setActiveItemId(id);
  };

  const onClick = () => {
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
                value={""}
                onChange={(e) => setAmount(e.target.value)}         
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
