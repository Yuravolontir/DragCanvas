import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

function ContainerInsideExample() {
  return (
    <Navbar bg="dark" data-bs-theme="dark">
        <Container>
          <Navbar.Brand href="#home">Home</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link href="#home">Create new project</Nav.Link>
            <Nav.Link href="#features">My projects</Nav.Link>
            <Nav.Link href="#pricing">Inspire me!</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
  );
}

export default ContainerInsideExample;