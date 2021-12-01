import styled from 'styled-components';
import media from 'styled-media-query';
import { Text } from '@gnosis.pm/safe-react-components';

export const Wrapper = styled.div`
  max-width: 450px;
  min-width: 150px;
  margin-top: 45px;
  margin-left: auto;
  margin-right: auto;
  font-family: Averta, Roboto;
`;

export const Heading = styled.h4`
  font-size: 1rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin: 0 0 auto 0;
  ${media.lessThan('small')`
  font-size:0.8rem;
  `}
`;

export const Label = styled(Text)`
  margin-bottom: 16px;
`;

export const RightJustified = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  margin-left: auto;
`;

export const FormButtonWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  margin-top: 24px;
`;

export const FormHeaderWrapper = styled.div`
  margin-bottom: 24px;
`;
