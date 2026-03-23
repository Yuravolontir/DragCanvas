import React, { useEffect, useState } from 'react';
  import NavBar from './NavBar';
  import Container from 'react-bootstrap/Container';
  import Card from 'react-bootstrap/Card';
  import Button from 'react-bootstrap/Button';
  import Modal from 'react-bootstrap/Modal';
  import { useNavigate } from 'react-router-dom';
  import { useUserContext } from './UserContextProvider';

  export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [expandedType, setExpandedType] = useState(null);
    const [expandedNotificationId, setExpandedNotificationId] =
  useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [notificationToDelete, setNotificationToDelete] =
  useState(null);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const navigate = useNavigate();
 const { currentUser, refreshNotifications } = useUserContext();
 
       useEffect(() => {
      // Don't redirect while UserContext is still initializing
      // Only redirect if we're certain there's no user (not loading)
      if (!currentUser && !loading) {
        navigate('/login');
        return;
      }

      // Wait for currentUser to be loaded
      if (!currentUser?.User_ID) {
        return;
      }

      const fetchNotifications = async () => {
        try {
          const response = await fetch(`http://localhost:3001/api/notifications/user/${currentUser.User_ID}`);
          const data = await response.json();
          setNotifications(data);
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
        setNotifications(notifications.filter(n =>
  n.Notification_ID !== notificationToDelete));
        refreshNotifications();  // ADD THIS LINE - updates bell
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

    const groupedNotifications = notifications.reduce((groups,
  notif) => {
      const type = notif.NotificationType || 'general';
      if (!groups[type]) groups[type] = [];
      groups[type].push(notif);
      return groups;
    }, {});

    const typeIcons = {
      newsletter: '📧',
      birthday: '🎂',
      event: '📅',
      general: '🔔'
    };

    const typeColors = {
      newsletter: '#667eea',
      birthday: '#f59e0b',
      event: '#10b981',
      general: '#6c757d'
    };

    if (loading) {
      return (
        <div>
          <NavBar />
          <Container className="mt-5" style={{ paddingTop: '100px',
   textAlign: 'center' }}>
            <p>Loading notifications...</p>
          </Container>
        </div>
      );
    }

    return (
      <div>
        <NavBar />
        <Container className="mt-5" style={{ paddingTop: '100px',
  maxWidth: '800px' }}>
          <h2 className="mb-4">🔔 Notifications</h2>

          {notifications.length === 0 ? (
            <Card className="text-center p-5">
              <p className="text-muted mb-0">No notifications
  yet.</p>
            </Card>
          ) : (
            Object.entries(groupedNotifications).map(([type,
  notifs]) => (
              <div key={type} className="mb-4">
                <div
                  onClick={() => setExpandedType(expandedType ===
  type ? null : type)}
                  style={{
                    padding: '15px 20px',
                    background: typeColors[type] || '#6c757d',
                    color: 'white',
                    borderRadius: '8px 8px 0 0',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: '600',
                    fontSize: '16px'
                  }}
                >
                  <span>
                    {typeIcons[type] || '🔔'}
  {type.charAt(0).toUpperCase() + type.slice(1)}
                    <span style={{ marginLeft: '10px', fontSize:
  '14px', opacity: 0.8 }}>
                      ({notifs.length})
                    </span>
                  </span>
                  <span style={{ fontSize: '20px' }}>
                    {expandedType === type ? '▲' : '▼'}
                  </span>
                </div>

                {expandedType === type && (
                  <div style={{
                    border: '1px solid #dee2e6',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    background: 'white'
                  }}>
                    {notifs.map(notif => (
                      <div
                        key={notif.Notification_ID}
                        style={{
                          padding: '16px 20px',
                          borderBottom: '1px solid #f1f3f5',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) =>
  e.currentTarget.style.background = '#f8f9fa'}
                        onMouseLeave={(e) =>
  e.currentTarget.style.background = 'white'}
                      >
                        <div onClick={() =>
                          setExpandedNotificationId(
                            expandedNotificationId ===
  notif.Notification_ID ? null : notif.Notification_ID
                          )}>
                          <div style={{ display: 'flex',
  justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600',
  fontSize: '16px', marginBottom: '6px' }}>
                                {notif.Subject}
                              </div>
                              <div style={{ fontSize: '14px',
  color: '#6c757d', marginBottom: '8px' }}>
                                {notif.Message.replace(/<[^>]*>/g,
  '').substring(0, 150)}
                                {notif.Message.length > 150 &&
  '...'}
                              </div>
                              <div style={{ fontSize: '12px',
  color: '#adb5bd' }}>
                                {new
  Date(notif.SentDate).toLocaleString()}
                              </div>
                            </div>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();

  handleDeleteClick(notif.Notification_ID);
                              }}
                              style={{ marginLeft: '10px',
  flexShrink: 0 }}
                            >
                              🗑️
                            </Button>
                          </div>
                        </div>

                        {expandedNotificationId ===
  notif.Notification_ID && (
                          <div style={{
                            marginTop: '12px',
                            padding: '12px',
                            background: '#f8f9fa',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}>
                            <div dangerouslySetInnerHTML={{ __html:
   notif.Message }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </Container>

        {/* Delete Confirmation Modal */}
        <Modal show={showDeleteModal} onHide={() =>
  setShowDeleteModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Delete Notification</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to delete this notification?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() =>
  setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Error Modal */}
        <Modal show={showErrorModal} onHide={() =>
  setShowErrorModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Error</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {errorMessage}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={() =>
  setShowErrorModal(false)}>
              OK
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }