import styled from "styled-components";

function Footer() {

    const Container = styled.footer`
        align-self: flex-end;
        margin-top: 100px;
        width: 100%;

        margin-top: 1px solid #FFF;
        flex-direction: column;
    `;

    const Divider = styled.div<{ bold?: boolean }>`
        margin-left: auto;
        margin-right: auto;
        margin-top: 7px;
        width: 100%;
        height: ${(props) => (props.bold ? '5px' : '2px')};
        background-color: #785a00;
    `;

    const Text = styled.p`
        color: #FFF;
        font-size: 12px;
        text-align: center;
        margin-top: 10px;
        padding-bottom: 15px;
        `;

    return (
        <Container>
            <Divider />
            <Divider />
            <Divider />
            <Divider bold={true} />
            <Text>made by Gargant and designed by AMDevSolutions</Text>
        </Container>
    );
}

export default Footer;