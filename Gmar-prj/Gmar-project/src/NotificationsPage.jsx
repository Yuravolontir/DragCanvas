import React, { useEffect, useState } from 'react';
import NavBar from './NavBar';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from './UserContextProvider';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [expandedType, setExpandedType] = useState(null);
  const [expandedNotificationId, setExpandedNotificationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const { currentUser, refreshNotifications } = useUserContext();

  useEffect(() => {
    if (!currentUser && !loading) {
      navigate('/login');
      return;
    }
    if (!currentUser?.User_ID) return;

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/notifications/user/${currentUser.User_ID}`);
        const data = await response.json();
        setNotifications(Array.isArray(data) ? data : []);

        const viewedIds = data.map(n => n.Notification_ID);
        localStorage.setItem(`viewedNotifications_${currentUser.User_ID}`, JSON.stringify(viewedIds));

        if (viewedIds.length > 0) {
          fetch('http://localhost:3001/api/notifications/mark-viewed', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.User_ID, notificationIds: viewedIds })
          }).catch(err => console.error('Mark viewed error:', err));
        }
        refreshNotifications();
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [currentUser, navigate]);

  const handleDeleteClick = (notificationId) => {
    setNotificationToDelete(notificationId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    try {
      const response = await fetch(
        `http://localhost:3001/api/notifications/${notificationToDelete}?userId=${currentUser.User_ID}`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      if (response.ok) {
        setNotifications(notifications.filter(n => n.Notification_ID !== notificationToDelete));
        refreshNotifications();
      } else {
        setErrorMessage(data.error || 'Failed to delete notification');
        setShowErrorModal(true);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setErrorMessage('Error deleting notification');
      setShowErrorModal(true);
    } finally {
      setNotificationToDelete(null);
    }
  };

  const groupedNotifications = notifications.reduce((groups, notif) => {
    const type = notif.NotificationType || 'general';
    if (!groups[type]) groups[type] = [];
    groups[type].push(notif);
    return groups;
  }, {});

  const typeConfig = {
    newsletter: { color: '#4f6ef7', bg: '#e8ecfe', label: 'Newsletter' },
    birthday: { color: '#f5a623', bg: '#fef3cd', label: 'Birthday' },
    event: { color: '#34d399', bg: '#d1fae5', label: 'Event' },
    general: { color: '#71717a', bg: '#f4f4f5', label: 'General' },
  };

  if (loading) {
    return (
      <div style={{ background: '#0b1325', minHeight: '100vh' }}>
        <NavBar />
        <Container style={{ paddingTop: '120px', textAlign: 'center', maxWidth: '700px' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#a1a1aa', fontSize: '0.95rem' }}>
            Loading notifications...
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8f9fc', minHeight: '100vh' }}>
      <NavBar />
      <Container style={{ paddingTop: '100px', maxWidth: '700px', paddingBottom: '60px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <div style={{
            width: '40px', height: '40px', background: '#e8ecfe',
            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f6ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontFamily: "'Noto Serif', serif", fontSize: '1.5rem', fontWeight: 900, color: '#dbe2fb', letterSpacing: '-0.03em', margin: 0 }}>
              Notifications
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#71717a', margin: 0 }}>
              {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
            </p>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', background: 'rgba(23, 31, 50, 0.5)', borderRadius: '16px', border: '1px solid rgba(68, 70, 84, 0.2)' }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#a1a1aa', fontSize: '0.9rem' }}>
              No notifications yet.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(groupedNotifications).map(([type, notifs]) => {
              const config = typeConfig[type] || typeConfig.general;
              const isExpanded = expandedType === type;

              return (
                <div key={type} style={{ background: 'rgba(23, 31, 50, 0.5)', borderRadius: '16px', border: '1px solid rgba(68, 70, 84, 0.2)', overflow: 'hidden' }}>
                  <div
                    onClick={() => setExpandedType(isExpanded ? null : type)}
                    style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: config.color }} />
                      <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.9rem', fontWeight: 600, color: '#dbe2fb' }}>
                        {config.label}
                      </span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#a1a1aa', background: '#f4f4f5', padding: '2px 8px', borderRadius: '9999px' }}>
                        {notifs.length}
                      </span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #f4f4f5' }}>
                      {notifs.map((notif, idx) => (
                        <div key={notif.Notification_ID}
                          style={{ padding: '16px 20px', borderBottom: idx < notifs.length - 1 ? '1px solid #f4f4f5' : 'none' }}
                        >
                          <div onClick={() => setExpandedNotificationId(expandedNotificationId === notif.Notification_ID ? null : notif.Notification_ID)}
                            style={{ cursor: 'pointer' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.9rem', fontWeight: 600, color: '#dbe2fb', marginBottom: '4px' }}>
                                  {notif.Subject}
                                </div>
                                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#71717a', marginBottom: '6px', lineHeight: 1.5 }}>
                                  {notif.Message.includes('<html') || notif.Message.includes('<!DOCTYPE')
                                    ? 'HTML content \u2014 click to preview'
                                    : notif.Message.replace(/<[^>]*>/g, '').substring(0, 120) + (notif.Message.length > 120 ? '...' : '')
                                  }
                                </div>
                                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: '#a1a1aa' }}>
                                  {new Date(notif.SentDate).toLocaleString()}
                                </div>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(notif.Notification_ID); }}
                                style={{ marginLeft: '12px', padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#d4d4d8', borderRadius: '6px', transition: 'all 0.15s ease', flexShrink: 0 }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#ff6b6b'; e.currentTarget.style.background = 'rgba(255,107,107,0.06)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#d4d4d8'; e.currentTarget.style.background = 'transparent'; }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                              </button>
                            </div>
                          </div>

                          {expandedNotificationId === notif.Notification_ID && (
                            <div style={{ marginTop: '12px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e4e4e7', background: '#fafafa' }}>
                              {notif.Message.includes('<html') || notif.Message.includes('<!DOCTYPE') ? (
                                <iframe srcDoc={notif.Message} style={{ width: '100%', minHeight: '400px', border: 'none' }} title="Notification content" sandbox="allow-same-origin" />
                              ) : (
                                <div style={{ padding: '14px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#3f3f46' }}>
                                  {/* eslint-disable-next-line react/no-danger */}
                                  <div dangerouslySetInnerHTML={{ __html: notif.Message }} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Container>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Delete Notification</Modal.Title></Modal.Header>
        <Modal.Body>Are you sure you want to delete this notification?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Error</Modal.Title></Modal.Header>
        <Modal.Body>{errorMessage}</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowErrorModal(false)}>OK</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}