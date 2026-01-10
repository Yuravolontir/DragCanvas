import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';

function ContainerInsideExample() {
  return (
    <Navbar expand="lg" className="bg-body-tertiary">
      <Container>
        <Navbar.Brand href="#">Navbar</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link href="#home">Home</Nav.Link>
            <Nav.Link href="#features">Features</Nav.Link>
            <Nav.Link href="#pricing">Pricing</Nav.Link>
          </Nav>
      </Container>
    </Navbar>
  );
}

export default ContainerInsideExample;