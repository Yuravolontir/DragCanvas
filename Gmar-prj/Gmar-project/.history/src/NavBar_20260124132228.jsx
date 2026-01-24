import React from 'react';

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

import { useNavigate } from "react-router-dom";
import {UserContext} from "./UserContextProvider";
import { useContext, useState } from "react"

function ContainerInsideExample() {

  const navigate = useNavigate();

  const {useritems} = useContext(UserContext);
  const {addUserItem} = useContext(UserContext);
  const storedUser = localStorage.getItem('currentUser');

  const redirect = () => {
    if (storedUser) {
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
          {storedUser ? `Welcome ${JSON.parse(storedUser).username}` : 'Welcome Guest'}
        </Container>
      </Navbar>
     
  );
}

export default ContainerInsideExample;