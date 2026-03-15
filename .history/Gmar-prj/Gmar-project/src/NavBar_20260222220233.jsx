  import React from 'react';
  import Container from 'react-bootstrap/Container';
  import Nav from 'react-bootstrap/Nav';
  import Navbar from 'react-bootstrap/Navbar';
  import { useNavigate } from "react-router-dom";
  import { useUserContext } from "./UserContextProvider";


  export default function NavBar() {

    const navigate = useNavigate();
    const { currentUser, logout } = useUserContext();



  const redirect = () => {
    if (!currentUser) {
      return () => navigate("/login");
  }
  else {
      return () => navigate("/create-new-project");
  }
}

  return (

    <Navbar bg="dark" data-bs-theme="dark" fixed="top">
        <Container >
          <Navbar.Brand  onClick={() => navigate("/")}>Home</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link  onClick={redirect()}>Create new project</Nav.Link>
            <Nav.Link onClick={() => navigate("/my-projects")}>My projects</Nav.Link>
            <Nav.Link  onClick={() => navigate("/inspire-me")}>Inspire me!</Nav.Link>
          </Nav>
       <Nav className="ms-auto">
              {currentUser ? (
                <>
                  <Navbar.Text className="me-3" style={{color: 'green'}}>
                    Welcome, {currentUser.UserName}!
                  </Navbar.Text>
                  <Nav.Link onClick={logout}>Logout</Nav.Link>
                </>
              ) : (
                <Nav.Link onClick={() => navigate("/register")}>Register</Nav.Link>
              )}
            </Nav>
        </Container>
      </Navbar>
     
  );

  }
