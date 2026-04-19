import React, { useState, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { useNavigate } from "react-router-dom";
import { useUserContext } from "./UserContextProvider";

export default function NavBar() {
  const navigate = useNavigate();
  const { currentUser, logout, isAdmin, isSuperAdmin, notificationsVersion } = useUserContext();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser?.User_ID) return;
      try {
        const response = await fetch(`http://localhost:3001/api/notifications/user/${currentUser.User_ID}`);
        const data = await response.json();
        const viewedIds = JSON.parse(localStorage.getItem(`viewedNotifications_${currentUser.User_ID}`) || '[]');
        const unreadNotifications = data.filter(n => !viewedIds.includes(n.Notification_ID));
        setUnreadCount(unreadNotifications.length);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    fetchNotifications();
  }, [currentUser?.User_ID, notificationsVersion]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const redirect = () => {
    if (!currentUser) {
      navigate("/login");
    } else {
      navigate("/create-new-project");
    }
  };

  return (
    <Navbar
      expand="lg"
      fixed="top"
      style={{
        background: scrolled ? 'rgba(11, 19, 37, 0.85)' : 'rgba(11, 19, 37, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(68, 70, 84, 0.15)',
        padding: '0',
        transition: 'all 0.3s ease',
        boxShadow: '0 8px 32px 0 rgba(0, 8, 20, 0.08)',
      }}
    >
      <Container style={{ maxWidth: '1200px' }}>
        <Navbar.Brand
          onClick={() => navigate("/")}
          style={{
            fontFamily: "'Noto Serif', serif",
            fontWeight: 900,
            fontSize: '1.35rem',
            color: '#4f6ef7',
            cursor: 'pointer',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 0',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#b9c3ff' }}>grid_view</span>
          DragCanvas
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-nav" style={{ border: '1px solid rgba(68, 70, 84, 0.3)' }} />

        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto" style={{ gap: '4px', marginLeft: '24px' }}>
            {[
              { label: 'Create', onClick: redirect },
              { label: 'My Projects', onClick: () => navigate("/my-projects") },
              { label: 'Templates', onClick: () => navigate("/inspire-me") },
            ].map((item, i) => (
              <Nav.Link
                key={i}
                onClick={item.onClick}
                style={{
                  color: '#71717a',
                  fontSize: '0.875rem',
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 500,
                  padding: '8px 14px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#b9c3ff';
                  e.target.style.background = 'rgba(79, 110, 247, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#71717a';
                  e.target.style.background = 'transparent';
                }}
              >
                {item.label}
              </Nav.Link>
            ))}
          </Nav>

          <Nav className="ms-auto" style={{ alignItems: 'center', gap: '8px' }}>
            {currentUser ? (
              <>
                <span style={{
                  color: '#71717a',
                  fontSize: '0.8rem',
                  fontFamily: "'Manrope', sans-serif",
                  padding: '6px 14px',
                  background: 'rgba(34, 42, 61, 0.6)',
                  borderRadius: '8px',
                  border: '1px solid rgba(68, 70, 84, 0.15)',
                }}>
                  <span style={{ color: '#c4c5d7' }}>{getGreeting()}</span>,{' '}
                  <span style={{ color: '#b9c3ff', fontWeight: 600 }}>{currentUser.UserName}</span>
                </span>

                {(isAdmin || isSuperAdmin) && (
                  <Nav.Link
                    onClick={() => navigate("/admin-panel")}
                    style={{
                      color: '#71717a',
                      fontSize: '0.8rem',
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 500,
                      padding: '6px 12px',
                      borderRadius: '8px',
                    }}
                  >
                    Admin
                  </Nav.Link>
                )}

                <Nav.Link
                  onClick={() => navigate("/notifications")}
                  style={{
                    position: 'relative',
                    padding: '8px',
                    color: '#71717a',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: '#ff6b6b',
                      color: 'white',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      fontSize: '10px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #0b1325',
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Nav.Link>

                <Nav.Link
                  onClick={logout}
                  style={{
                    color: '#71717a',
                    fontSize: '0.8rem',
                    fontFamily: "'Manrope', sans-serif",
                    padding: '6px 12px',
                    borderRadius: '8px',
                  }}
                >
                  Sign Out
                </Nav.Link>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Nav.Link
                  onClick={() => navigate("/login")}
                  style={{
                    color: '#71717a',
                    fontSize: '0.85rem',
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 500,
                    padding: '8px 16px',
                    borderRadius: '8px',
                  }}
                >
                  Sign In
                </Nav.Link>
                <button
                  onClick={() => navigate("/register")}
                  style={{
                    background: 'rgba(79, 110, 247, 0.1)',
                    color: '#b9c3ff',
                    border: 'none',
                    fontSize: '0.85rem',
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 600,
                    padding: '8px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(79, 110, 247, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(79, 110, 247, 0.1)';
                  }}
                >
                  Get Started
                </button>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
