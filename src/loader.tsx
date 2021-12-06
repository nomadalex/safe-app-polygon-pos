import { Loader as OrigLoader } from '@gnosis.pm/safe-react-components';
import styled from 'styled-components';

const Wrapper = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
`;

export const Loader = (props: any) => {
    return (
        <Wrapper>
            <OrigLoader {...props} />
        </Wrapper>
    );
}