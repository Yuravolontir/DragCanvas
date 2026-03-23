 import React, { useState, useEffect } from 'react';
  import Container from 'react-bootstrap/Container';
  import Nav from 'react-bootstrap/Nav';
  import Navbar from 'react-bootstrap/Navbar';
  import { useNavigate } from "react-router-dom";
  import { useUserContext } from "./UserContextProvider";


  export default function NavBar() {

    const navigate = useNavigate();
    const { currentUser, logout, isAdmin, isSuperAdmin,
  notificationsVersion } = useUserContext();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
      const fetchNotifications = async () => {
        if (!currentUser?.User_ID) return;

        try {
          const response = await fetch(`http://localhost:3001/api/notifications/user/${currentUser.User_ID}`);
          const data = await response.json();
          setNotifications(data);
          setUnreadCount(data.length);
        } catch (err) {
          console.error('Failed to fetch notifications:', err);
        }
      };
      fetchNotifications();
    }, [currentUser?.User_ID, notificationsVersion]);  // Added notificationsVersion dependency


    const redirect = () => {
      if (!currentUser) {
        navigate("/login");
      } else {
        navigate("/create-new-project");
      }
    }

    const adminPanel = () => {
      navigate("/admin-panel");
    }


    return (

      <Navbar bg="dark" data-bs-theme="dark" fixed="top">
          <Container >
            <Navbar.Brand  onClick={() =>
  navigate("/")}>Home</Navbar.Brand>
            <Nav className="me-auto">
              <Nav.Link  onClick={redirect}>Create new
  project</Nav.Link>
              <Nav.Link onClick={() => navigate("/my-projects")}>My
   projects</Nav.Link>
              <Nav.Link  onClick={() =>
  navigate("/inspire-me")}>Inspire me!</Nav.Link>
            </Nav>
         <Nav className="ms-auto">
                {currentUser ? (
                  <>
                    <Navbar.Text className="me-3" style={{color: 'green'}}>
                      Welcome, {currentUser.UserName}!
                    </Navbar.Text>

                 {isAdmin || isSuperAdmin ? ( <Nav.Link
    onClick={adminPanel}>AdminPanel</Nav.Link>) : (<></>)}

    {/* Notification Bell */}
    <Nav.Link onClick={() => navigate("/notifications")}
    style={{position: 'relative'}}>
      🔔
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute',
          top: '-5px',
          right: '-5px',
          background: 'red',
          color: 'white',
          borderRadius: '50%',
          padding: '2px 6px',
          fontSize: '10px',
          fontWeight: 'bold'
        }}>
          {unreadCount}
        </span>
      )}
    </Nav.Link>


                    <Nav.Link onClick={logout}>Logout</Nav.Link>
                  </>
                ) : (
                  <Nav.Link onClick={() =>
  navigate("/register")}>Register</Nav.Link>
                )}
              </Nav>
          </Container>
        </Navbar>

    );

    }