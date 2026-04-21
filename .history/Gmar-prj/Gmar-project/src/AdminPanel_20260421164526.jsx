import React, { useEffect, useState } from 'react';
import NavBar from './NavBar';
import Table from 'react-bootstrap/Table';
import Container from 'react-bootstrap/Container';
import { Badge, Form, InputGroup, Button, Modal, Alert } from 'react-bootstrap';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [userToReset, setUserToReset] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [userToChangeRole, setUserToChangeRole] = useState(null);
  const [makeAdmin, setMakeAdmin] = useState(true);

   // Templates
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'templates'
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Alert modal
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success'); // success or error

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [userStats, setUserStats] = useState(null);

     const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(true);

        // Notification Sub-tabs
    const [activeNotificationSubTab, setActiveNotificationSubTab] = useState('manage');

        // Schedules State
    const [schedules, setSchedules] = useState([]);
    const [loadingSchedules, setLoadingSchedules] = useState(true);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);

    // Notification Templates State
    const [notificationTemplates, setNotificationTemplates] = useState([]);
    const [loadingTemplatesNotification, setLoadingTemplatesNotification] = useState(true);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);

    // Notification Logs State
    const [notificationLogs, setNotificationLogs] = useState([]);
    const [logStats, setLogStats] = useState({ Total: 0, Delivered: 0, Viewed: 0, Failed: 0 });
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [logPage, setLogPage] = useState(1);
    const [logFilters, setLogFilters] = useState({ status: '', startDate: '', endDate: '', search: '' });

    // Notification Settings State
    const [notificationSettings, setNotificationSettings] = useState([]);

        // Newsletter Compose Modal
    const [showNewsletterModal, setShowNewsletterModal] =
  useState(false);
    const [newsletterSubject, setNewsletterSubject] = useState('');
    const [newsletterMessage, setNewsletterMessage] = useState('');
    const [recipientType, setRecipientType] = useState('all'); //'all' or 'selected'
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    const [sending, setSending] = useState(false);

    useEffect(() => {
      fetchUsers();
      fetchTemplates();
      fetchNotifications();
    }, []);

    useEffect(() => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    }, []);

    // Fetch templates and notifications when currentUser is loaded
    useEffect(() => {
      if (currentUser?.User_ID) {
        fetchTemplates();
        fetchNotifications();
      }
    }, [currentUser?.User_ID]);

    // Access control - check if user is admin or superadmin
    useEffect(() => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (!user.IsAdmin && !user.IsSuperAdmin) {
          window.location.href = '/';
        }
      } else {
        window.location.href = '/';
      }
    }, []);

  useEffect(() => {
    let filtered = users;

    if (searchEmail.trim() !== '') {
      filtered = filtered.filter(user =>
        user.UserEmail.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }

    if (filterStatus === 'active') {
      filtered = filtered.filter(user => user.IsActive);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(user => !user.IsActive);
    }

    if (filterRole === 'admin') {
      filtered = filtered.filter(user =>  user.IsAdmin && !user.IsSuperAdmin);
    } else if (filterRole === 'user') {
      filtered = filtered.filter(user => !user.IsAdmin && !user.IsSuperAdmin);
    } else if (filterRole === 'super-admin') {
      filtered = filtered.filter(user => user.IsSuperAdmin);
    }


    setFilteredUsers(filtered);
  }, [searchEmail, users, filterStatus, filterRole, currentUser]);

  const showAlertModal = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!currentUser) {
      showAlertModal('You must be logged in', 'error');
      return;
    }

    try {
      const response = await fetch('https://localhost:7112/api/Users/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetID: userToDelete.User_ID,
          adminID: currentUser.User_ID,
          confirmDelete: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowDeleteModal(false);
        showAlertModal('User deleted successfully');
        fetchUsers();
      } else {
        showAlertModal(data.error || 'Delete failed', 'error');
      }
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

    const handleUpdateStatusClick = async (user, newStatus) => {
      if (!currentUser) {
        showAlertModal('You must be logged in', 'error');
        return;
      }

      try {
        const response = await
  fetch('http://localhost:3001/api/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetID: user.User_ID,
          adminID: currentUser.User_ID,
          newStatus: newStatus
        })
      });

      const data = await response.json();

      if (response.ok) {
        showAlertModal(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
        fetchUsers();
      } else {
        showAlertModal(data.error || 'Update failed', 'error');
      }
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  const handleResetPasswordClick = (user) => {
    setUserToReset(user);
    setTempPassword('Temp123!');
    setShowResetModal(true);
  };

 const confirmResetPassword = async () => {
      if (!currentUser) {
        showAlertModal('You must be logged in', 'error');
        return;
      }

      try {
        const response = await
  fetch('http://localhost:3001/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetID: userToReset.User_ID,
          adminID: currentUser.User_ID,
          newPassword: tempPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowResetModal(false);
        showAlertModal(data.message);
      } else {
        showAlertModal(data.error || 'Reset failed', 'error');
      }
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  const handleRoleChangeClick = (user, makeAdmin) => {
    setUserToChangeRole(user);
    setMakeAdmin(makeAdmin);
    setShowRoleModal(true);
  };

const confirmRoleChange = async () => {
      if (!currentUser) {
        showAlertModal('You must be logged in', 'error');
        return;
      }

      try {
        const response = await
  fetch('http://localhost:3001/api/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetID: userToChangeRole.User_ID,
          adminID: currentUser.User_ID,
          makeAdmin: makeAdmin
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowRoleModal(false);
        showAlertModal(data.message);
        fetchUsers();
      } else {
        showAlertModal(data.error || 'Role change failed', 'error');
      }
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await
  fetch('https://localhost:7112/api/Users');    //C#
        const data = await response.json();
        
        console.log(data)
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch users');
        }

        setUsers(data);
        setFilteredUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const handleViewProfile = async (user) => {
      setUserProfile(user);
      setShowProfileModal(true);

      // Fetch user statistics
      try {
        const response = await
  fetch(`'https://localhost:7112/api/Users/${user.User_ID}`);   //C#
        const data = await response.json();
        setUserStats(data);
      } catch (err) {
        console.error('Failed to fetch user stats:', err);
        setUserStats(null);
      }
    };

    
    
       const fetchTemplates = async () => {
          // Only fetch if we have a user
          if (!currentUser?.User_ID) {
            return;
          }

          setLoadingTemplates(true);
          try {
            const response = await fetch(`http://localhost:3001/api/templates/all?userId=${currentUser.User_ID}`);

            if (!response.ok) {
              throw new Error('Failed to fetch templates');
            }

            const data = await response.json();
            setTemplates(Array.isArray(data) ? data : []);
          } catch (err) {
            console.error('Failed to fetch templates:', err);
            setTemplates([]);
          } finally {
            setLoadingTemplates(false);
          }
        };

 const toggleTemplateVisibility = async (templateId, currentStatus) =>
   {
      try {
        const response = await
  fetch(`http://localhost:3001/api/templates/${templateId}/visibility`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isActive: !currentStatus,
            userId: currentUser.User_ID
          })
        });

        if (response.ok) {
          showAlertModal('Template visibility updated', 'success');
          fetchTemplates();
        } else {
          const data = await response.json();
          showAlertModal(data.error || 'Failed to update visibility',
  'error');
        }
      } catch (err) {
        showAlertModal(err.message, 'error');
      }
    };


    const fetchNotifications = async () => {
      // Only fetch if we have a user
      if (!currentUser?.User_ID) {
        return;
      }

      setLoadingNotifications(true);
      try {
        const response = await fetch(`http://localhost:3001/api/notifications/all?userId=${currentUser.User_ID}`);

        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();
        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        setNotifications([]);
      } finally {
        setLoadingNotifications(false);
      }
    };

  const handleSendNewsletter = async () => {
      if (!newsletterSubject.trim() || !newsletterMessage.trim()) {
        showAlertModal('Please enter subject and message',
  'error');
        return;
      }

      if (recipientType === 'selected' && selectedRecipients.length
   === 0) {
        showAlertModal('Please select at least one recipient',
  'error');
        return;
      }

      setSending(true);
      try {
        const response = await
  fetch('http://localhost:3001/api/notifications/send-newsletter',
  {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: newsletterSubject,
            message: newsletterMessage,
            recipientType: recipientType,
            recipientIds: recipientType === 'selected' ?
  selectedRecipients : null,
            userId: currentUser.User_ID
          })
        });

        const data = await response.json();

        if (response.ok) {
          showAlertModal(`Newsletter sent to ${data.sentCount}
  recipients!`, 'success');
          setShowNewsletterModal(false);
          setNewsletterSubject('');
          setNewsletterMessage('');
          setRecipientType('all');
          setSelectedRecipients([]);
          fetchNotifications();
        } else {
          showAlertModal(data.error || 'Failed to send newsletter',
   'error');
        }
      } catch (err) {
        showAlertModal(err.message, 'error');
      } finally {
        setSending(false);
      }
    };

  // ============================================
  // NOTIFICATION SCHEDULES FUNCTIONS
  // ============================================
  const fetchSchedules = async () => {
    if (!currentUser?.User_ID) return;

    setLoadingSchedules(true);
    try {
      const response = await fetch(`http://localhost:3001/api/schedules?userId=${currentUser.User_ID}`);
      const data = await response.json();
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
      setSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleSaveSchedule = async (scheduleData) => {
    try {
      const url = editingSchedule
        ? `http://localhost:3001/api/schedules/${editingSchedule.Schedule_ID}`
        : 'http://localhost:3001/api/schedules';

      const response = await fetch(url, {
        method: editingSchedule ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...scheduleData, userId: currentUser.User_ID })
      });

      const data = await response.json();

      if (response.ok) {
        showAlertModal(editingSchedule ? 'Schedule updated!' : 'Schedule created!', 'success');
        setShowScheduleModal(false);
        setEditingSchedule(null);
        fetchSchedules();
      } else {
        showAlertModal(data.error || 'Failed to save schedule', 'error');
      }
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  const handleToggleSchedule = async (scheduleId, isActive) => {
    try {
      const response = await fetch(`http://localhost:3001/api/schedules/${scheduleId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        showAlertModal('Schedule updated!', 'success');
        fetchSchedules();
      }
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/schedules/${scheduleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showAlertModal('Schedule deleted!', 'success');
        fetchSchedules();
      }
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  // ============================================
  // NOTIFICATION TEMPLATES FUNCTIONS
  // ============================================
  const fetchNotificationTemplates = async () => {
    setLoadingTemplatesNotification(true);
    try {
      const response = await fetch('http://localhost:3001/api/notification-templates');
      const data = await response.json();
      setNotificationTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch notification templates:', err);
      setNotificationTemplates([]);
    } finally {
      setLoadingTemplatesNotification(false);
    }
  };

  const handleSaveNotificationTemplate = async (templateData) => {
    try {
      const url = editingTemplate
        ? `http://localhost:3001/api/notification-templates/${editingTemplate.Template_ID}`
        : 'http://localhost:3001/api/notification-templates';

      const response = await fetch(url, {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...templateData, userId: currentUser.User_ID })
      });

      const data = await response.json();

      if (response.ok) {
        showAlertModal(editingTemplate ? 'Template updated!' : 'Template created!', 'success');
        setShowTemplateModal(false);
        setEditingTemplate(null);
        fetchNotificationTemplates();
      } else {
        showAlertModal(data.error || 'Failed to save template', 'error');
      }
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  const handleToggleNotificationTemplate = async (templateId, isActive) => {
    try {
      const response = await fetch(`http://localhost:3001/api/notification-templates/${templateId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        showAlertModal('Template updated!', 'success');
        fetchNotificationTemplates();
      }
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  const handleDeleteNotificationTemplate = async (templateId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/notification-templates/${templateId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showAlertModal('Template deleted!', 'success');
        fetchNotificationTemplates();
      }
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  // ============================================
  // NOTIFICATION LOGS FUNCTIONS
  // ============================================
  const fetchNotificationLogs = async (page = 1) => {
    if (!currentUser?.User_ID) return;

    setLoadingLogs(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 50,
        ...logFilters
      });

      const response = await fetch(`http://localhost:3001/api/notification-logs?${params}`);
      const data = await response.json();
      setNotificationLogs(data.logs || []);
      setLogPage(data.page || 1);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setNotificationLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchLogStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/notification-logs/stats');
      const data = await response.json();
      setLogStats(data);
    } catch (err) {
      console.error('Failed to fetch log stats:', err);
    }
  };

  // ============================================
  // NOTIFICATION SETTINGS FUNCTIONS
  // ============================================
  const fetchNotificationSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/notification-settings');
      const data = await response.json();
      setNotificationSettings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch notification settings:', err);
      setNotificationSettings([]);
    }
  };

  const handleSaveNotificationSettings = async (settings) => {
    try {
      const response = await fetch('http://localhost:3001/api/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, userId: currentUser.User_ID })
      });

      if (response.ok) {
        showAlertModal('Settings saved!', 'success');
        fetchNotificationSettings();
      }
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  // Fetch all notification-related data when currentUser is loaded
  useEffect(() => {
    if (currentUser?.User_ID) {
      fetchSchedules();
      fetchNotificationTemplates();
      fetchNotificationLogs();
      fetchLogStats();
      fetchNotificationSettings();
    }
  }, [currentUser?.User_ID]);

  if (loading) return (
    <div>
      <NavBar />
      <div className="text-center mt-5">
        <h3>Loading users...</h3>
      </div>
    </div>
  );

  if (error) return (
    <div>
      <NavBar />
      <Container className="mt-5">
        <div className="alert alert-danger">Error: {error}</div>
      </Container>
    </div>
  );

   return (
      <div>
        <NavBar />
        <Container className="mt-5">
          <div className="d-flex justify-content-between
  align-items-center mb-4">
            <h2>Admin Panel</h2>
            <div>
              <Button
                variant={activeTab === 'users' ? 'primary' :
  'outline-primary'}
                onClick={() => setActiveTab('users')}
                className="me-2"
              >
                👥 Users
              </Button>
              <Button
                variant={activeTab === 'templates' ? 'primary' :
  'outline-primary'}
                onClick={() => setActiveTab('templates')}
              >
                📄 Templates
              </Button>
                              <Button
                  variant={activeTab === 'notifications' ?
  'primary' : 'outline-primary'}
                  onClick={() => setActiveTab('notifications')}
                  className="ms-2"
                >
                  🔔 Notifications
                </Button>
            </div>
          </div>

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <>
              <div className="d-flex gap-3 mb-3">
                <InputGroup style={{ maxWidth: '400px' }}>
                  <InputGroup.Text>🔍</InputGroup.Text>
                  <Form.Control
                    placeholder="Search email..."
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                  />
                </InputGroup>

                <Form.Select
                  style={{ width: '150px' }}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>

                <Form.Select
                  style={{ width: '150px' }}
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                  {currentUser?.IsSuperAdmin && (
                    <option value="super-admin">Super Admin</option>
                  )}
                </Form.Select>
              </div>

              <Table striped bordered hover>
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.User_ID}>
                      <td>#{user.User_ID}</td>
                      <td>{user.UserName}</td>
                      <td>{user.UserEmail}</td>
                      <td>
                        {user.IsSuperAdmin && <Badge bg="danger"
  className="me-2">SuperAdmin</Badge>}
                        {user.IsAdmin && !user.IsSuperAdmin && <Badge
  bg="danger" className="me-2">Admin</Badge>}
                        {user.IsActive ? <Badge
  bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>}
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-2">
                          {(currentUser?.IsSuperAdmin || !user.IsSuperAdmin) && (
                            <Button variant="info" size="sm" onClick={() => handleViewProfile(user)}>
                              👤 View Profile
                            </Button>
                          )}
                          {!user.IsSuperAdmin && user.User_ID !==
  currentUser?.User_ID && (
                            user.IsActive ? (
                              <Button variant="warning" size="sm"
  onClick={() => handleUpdateStatusClick(user, false)}>
                                Deactivate
                              </Button>
                            ) : (
                              <Button variant="success" size="sm"
  onClick={() => handleUpdateStatusClick(user, true)}>
                                Activate
                              </Button>
                            )
                          )}
                          {!user.IsSuperAdmin && user.User_ID !==
  currentUser?.User_ID && (
                            <Button variant="outline-warning" size="sm"
  onClick={() => handleResetPasswordClick(user)}>
                              Reset Password
                            </Button>
                          )}
                          {!user.IsAdmin && !user.IsSuperAdmin &&
  user.User_ID !== currentUser?.User_ID && (
                            <Button variant="outline-danger" size="sm"
  onClick={() => handleDeleteClick(user)}>
                              Delete
                            </Button>
                          )}
                          {currentUser?.IsSuperAdmin &&
  !user.IsSuperAdmin && user.User_ID !== currentUser?.User_ID && (
                            user.IsAdmin ? (
                              <Button variant="outline-secondary"
  size="sm" onClick={() => handleRoleChangeClick(user, false)}>
                                Remove Admin
                              </Button>
                            ) : (
                              <Button variant="outline-info" size="sm"
  onClick={() => handleRoleChangeClick(user, true)}>
                                Make Admin
                              </Button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {filteredUsers.length === 0 && <p className="text-center
  mt-4">No users found.</p>}
            </>
          )}

          {/* TEMPLATES TAB */}
          {activeTab === 'templates' && (
            <>
              {loadingTemplates ? (
                <p className="text-center mt-4">Loading templates...</p>
              ) : templates.length === 0 ? (
                <p className="text-center mt-4">No templates found.</p>
              ) : (
                <Table striped bordered hover>
                  <thead className="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>Thumbnail</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Components</th>
                      <th>Created By</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((template) => (
                      <tr key={template.Template_ID}>
                        <td>#{template.Template_ID}</td>
                        <td>
                          {template.ThumbnailURL ? (
                            <img
                              src={template.ThumbnailURL}
                              alt={template.TemplateName}
                              style={{ width: '60px', height: '40px',
  objectFit: 'cover', borderRadius: '4px' }}
                            />
                          ) : (
                            <span className="text-muted">No img</span>
                          )}
                        </td>
                        <td>{template.TemplateName}</td>
                        <td><Badge
  bg="info">{template.Category}</Badge></td>
                        <td>{template.ComponentCount}</td>
                        <td>{template.CreatedByName}</td>
                        <td>
                          {template.IsActive ?
                            <Badge bg="success">Visible</Badge> :
                            <Badge bg="secondary">Hidden</Badge>
                          }
                        </td>
                        <td>
                          <Button
                            variant={template.IsActive ? 'warning' :
  'success'}
                            size="sm"
                            onClick={() =>
  toggleTemplateVisibility(template.Template_ID, template.IsActive)}
                          >
                            {template.IsActive ? 'Hide' : 'Show'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </>
          )}

       
{/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <>
                {/* Sub-tab Navigation */}
                <div className="d-flex gap-2 mb-3">
                  <Button
                    variant={activeNotificationSubTab === 'manage' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => setActiveNotificationSubTab('manage')}
                  >
                    📋 Manage
                  </Button>
                  <Button
                    variant={activeNotificationSubTab === 'schedules' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => setActiveNotificationSubTab('schedules')}
                  >
                    📅 Schedules
                  </Button>
                  <Button
                    variant={activeNotificationSubTab === 'templates' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => setActiveNotificationSubTab('templates')}
                  >
                    📝 Templates
                  </Button>
                  <Button
                    variant={activeNotificationSubTab === 'logs' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => setActiveNotificationSubTab('logs')}
                  >
                    📊 Logs
                  </Button>
                  <Button
                    variant={activeNotificationSubTab === 'settings' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => setActiveNotificationSubTab('settings')}
                  >
                    ⚙️ Settings
                  </Button>
                </div>

                {/* MANAGE SUB-TAB */}
                {activeNotificationSubTab === 'manage' && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h4>🔔 Notifications</h4>
                      <Button variant="primary" onClick={() => setShowNewsletterModal(true)}>
                        ✉️ Compose Newsletter
                      </Button>
                    </div>

                    {loadingNotifications ? (
                      <p className="text-center mt-4">Loading notifications...</p>
                    ) : notifications.length === 0 ? (
                      <p className="text-center mt-4">No notifications found.</p>
                    ) : (
                      <Table striped bordered hover size="sm">
                        <thead className="table-dark">
                          <tr>
                            <th>ID</th>
                            <th>Subject</th>
                            <th>Type</th>
                            <th>Recipients</th>
                            <th>Status</th>
                            <th>Stats</th>
                            <th>Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {notifications.map((notif) => (
                            <tr key={notif.Notification_ID}>
                              <td>#{notif.Notification_ID}</td>
                              <td>{notif.Subject}</td>
                              <td>
                                {notif.NotificationType === 'newsletter' && <Badge bg="primary">Newsletter</Badge>}
                                {notif.NotificationType === 'birthday' && <Badge bg="warning">Birthday</Badge>}
                                {notif.NotificationType === 'event' && <Badge bg="info">Event</Badge>}
                                {notif.NotificationType === 'automated' && <Badge bg="secondary">Automated</Badge>}
                              </td>
                              <td>
                                {notif.RecipientType === 'all' && <Badge bg="success">All Users</Badge>}
                                {notif.RecipientType === 'selected' && <Badge bg="info">Selected ({notif.RecipientIDs ? JSON.parse(notif.RecipientIDs).length : 0})</Badge>}
                                {notif.RecipientType === 'automated' && <Badge bg="warning">Automated</Badge>}
                              </td>
                              <td>
                                {notif.Status === 'draft' && <Badge bg="secondary">Draft</Badge>}
                                {notif.Status === 'scheduled' && <Badge bg="info">Scheduled</Badge>}
                                {notif.Status === 'sent' && <Badge bg="success">Sent</Badge>}
                                {notif.Status === 'failed' && <Badge bg="danger">Failed</Badge>}
                              </td>
                              <td>
                                <small>
                                  Sent: {notif.SentCount || 0}<br/>
                                  Opened: {notif.OpenedCount || 0}<br/>
                                  Failed: {notif.FailedCount || 0}
                                </small>
                              </td>
                              <td>{new Date(notif.CreatedDate).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </>
                )}

                {/* SCHEDULES SUB-TAB */}
                {activeNotificationSubTab === 'schedules' && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h4>📅 Notification Schedules</h4>
                      <Button variant="primary" onClick={() => { setEditingSchedule(null); setShowScheduleModal(true); }}>
                        ➕ Add Schedule
                      </Button>
                    </div>

                    {loadingSchedules ? (
                      <p className="text-center mt-4">Loading schedules...</p>
                    ) : schedules.length === 0 ? (
                      <p className="text-center mt-4">No schedules found.</p>
                    ) : (
                      <Table striped bordered hover size="sm">
                        <thead className="table-dark">
                          <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Frequency</th>
                            <th>Time</th>
                            <th>Next Run</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schedules.map((schedule) => (
                            <tr key={schedule.Schedule_ID}>
                              <td>#{schedule.Schedule_ID}</td>
                              <td>{schedule.ScheduleName}</td>
                              <td>
                                {schedule.NotificationType === 'birthday' && <Badge bg="warning">Birthday</Badge>}
                                {schedule.NotificationType === 'event' && <Badge bg="info">Event</Badge>}
                                {schedule.NotificationType === 'custom' && <Badge bg="secondary">Custom</Badge>}
                              </td>
                              <td>{schedule.Frequency}</td>
                              <td>{schedule.ScheduleTime}</td>
                              <td>{schedule.NextRunDate ? new Date(schedule.NextRunDate).toLocaleString() : '-'}</td>
                              <td>
                                {schedule.IsActive ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>}
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  <Button variant="outline-primary" size="sm" onClick={() => { setEditingSchedule(schedule); setShowScheduleModal(true); }}>
                                    Edit
                                  </Button>
                                  <Button
                                    variant={schedule.IsActive ? "outline-warning" : "outline-success"}
                                    size="sm"
                                    onClick={() => handleToggleSchedule(schedule.Schedule_ID, !schedule.IsActive)}
                                  >
                                    {schedule.IsActive ? 'Disable' : 'Enable'}
                                  </Button>
                                  <Button variant="outline-danger" size="sm" onClick={() => { if (window.confirm('Delete this schedule?')) handleDeleteSchedule(schedule.Schedule_ID); }}>
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </>
                )}

                {/* TEMPLATES SUB-TAB */}
                {activeNotificationSubTab === 'templates' && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h4>📝 Notification Templates</h4>
                      <Button variant="primary" onClick={() => { setEditingTemplate(null); setShowTemplateModal(true); }}>
                        ➕ Add Template
                      </Button>
                    </div>

                    {loadingTemplatesNotification ? (
                      <p className="text-center mt-4">Loading templates...</p>
                    ) : notificationTemplates.length === 0 ? (
                      <p className="text-center mt-4">No templates found.</p>
                    ) : (
                      <Table striped bordered hover size="sm">
                        <thead className="table-dark">
                          <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Subject</th>
                            <th>Variables</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {notificationTemplates.map((template) => (
                            <tr key={template.Template_ID}>
                              <td>#{template.Template_ID}</td>
                              <td>{template.TemplateName}</td>
                              <td>
                                {template.TemplateType === 'birthday' && <Badge bg="warning">Birthday</Badge>}
                                {template.TemplateType === 'event' && <Badge bg="info">Event</Badge>}
                                {template.TemplateType === 'newsletter' && <Badge bg="primary">Newsletter</Badge>}
                                {template.TemplateType === 'custom' && <Badge bg="secondary">Custom</Badge>}
                              </td>
                              <td>{template.Subject}</td>
                              <td><small>{template.Variables || '-'}</small></td>
                              <td>
                                {template.IsActive ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>}
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  <Button variant="outline-primary" size="sm" onClick={() => { setEditingTemplate(template); setShowTemplateModal(true); }}>
                                    Edit
                                  </Button>
                                  <Button
                                    variant={template.IsActive ? "outline-warning" : "outline-success"}
                                    size="sm"
                                    onClick={() => handleToggleNotificationTemplate(template.Template_ID, !template.IsActive)}
                                  >
                                    {template.IsActive ? 'Hide' : 'Show'}
                                  </Button>
                                  <Button variant="outline-danger" size="sm" onClick={() => { if (window.confirm('Delete this template?')) handleDeleteNotificationTemplate(template.Template_ID); }}>
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </>
                )}

                {/* LOGS SUB-TAB */}
                {activeNotificationSubTab === 'logs' && (
                  <>
                    <h4 className="mb-3">📊 Notification Logs</h4>

                    {/* Summary Cards */}
                    <div className="d-flex gap-3 mb-3">
                      <div className="flex-fill p-3 border rounded bg-light">
                        <h6 className="mb-1">Total</h6>
                        <h3 className="mb-0">{logStats.Total || 0}</h3>
                      </div>
                      <div className="flex-fill p-3 border rounded bg-light">
                        <h6 className="mb-1">Delivered</h6>
                        <h3 className="mb-0 text-success">{logStats.Delivered || 0}</h3>
                      </div>
                      <div className="flex-fill p-3 border rounded bg-light">
                        <h6 className="mb-1">Viewed</h6>
                        <h3 className="mb-0 text-primary">{logStats.Viewed || 0}</h3>
                      </div>
                      <div className="flex-fill p-3 border rounded bg-light">
                        <h6 className="mb-1">Failed</h6>
                        <h3 className="mb-0 text-danger">{logStats.Failed || 0}</h3>
                      </div>
                    </div>

                    {/* Filters */}
                    <div className="d-flex gap-2 mb-3">
                      <Form.Select
                        style={{ width: '150px' }}
                        value={logFilters.status}
                        onChange={(e) => { setLogFilters({ ...logFilters, status: e.target.value }); fetchNotificationLogs(1); }}
                      >
                        <option value="">All Status</option>
                        <option value="delivered">Delivered</option>
                        <option value="viewed">Viewed</option>
                        <option value="failed">Failed</option>
                      </Form.Select>
                      <Form.Control
                        style={{ width: '200px' }}
                        placeholder="Search username or email..."
                        value={logFilters.search}
                        onChange={(e) => setLogFilters({ ...logFilters, search: e.target.value })}
                      />
                      <Button variant="primary" onClick={() => fetchNotificationLogs(1)}>
                        Search
                      </Button>
                    </div>

                    {loadingLogs ? (
                      <p className="text-center mt-4">Loading logs...</p>
                    ) : notificationLogs.length === 0 ? (
                      <p className="text-center mt-4">No logs found.</p>
                    ) : (
                      <Table striped bordered hover size="sm">
                        <thead className="table-dark">
                          <tr>
                            <th>Date</th>
                            <th>Recipient</th>
                            <th>Subject</th>
                            <th>Status</th>
                            <th>Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {notificationLogs.map((log) => (
                            <tr key={log.Log_ID}>
                              <td>{new Date(log.DeliveredDate).toLocaleString()}</td>
                              <td>
                                <div>{log.UserName}</div>
                                <small className="text-muted">{log.UserEmail}</small>
                              </td>
                              <td>{log.Subject || '-'}</td>
                              <td>
                                {log.Status === 'delivered' && <Badge bg="success">Delivered</Badge>}
                                {log.Status === 'viewed' && <Badge bg="primary">Viewed</Badge>}
                                {log.Status === 'failed' && <Badge bg="danger">Failed</Badge>}
                              </td>
                              <td><small className="text-danger">{log.ErrorMessage || '-'}</small></td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </>
                )}

                {/* SETTINGS SUB-TAB */}
                {activeNotificationSubTab === 'settings' && (
                  <>
                    <h4 className="mb-3">⚙️ Notification Settings</h4>
                    <p className="text-muted mb-3">Enable or disable notification types globally.</p>

                    {notificationSettings.length === 0 ? (
                      <p className="text-center mt-4">Loading settings...</p>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {notificationSettings.map((setting) => (
                          <div key={setting.Setting_ID} className="d-flex justify-content-between align-items-center p-3 border rounded">
                            <div>
                              <h5 className="mb-1">
                                {setting.NotificationType === 'newsletter' && '✉️ Newsletter Notifications'}
                                {setting.NotificationType === 'birthday' && '🎂 Birthday Notifications'}
                                {setting.NotificationType === 'event' && '📅 Event Notifications'}
                                {setting.NotificationType === 'automated' && '🤖 Automated Notifications'}
                              </h5>
                              <small className="text-muted">
                                {setting.IsEnabled ? 'Currently enabled - users will receive these notifications' : 'Currently disabled - users will not receive these notifications'}
                              </small>
                            </div>
                            <Button
                              variant={setting.IsEnabled ? 'success' : 'secondary'}
                              onClick={async () => {
                                const newEnabled = !setting.IsEnabled;
                                try {
                                  const response = await fetch('http://localhost:3001/api/notification-settings', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      settings: [{ notificationType: setting.NotificationType, isEnabled: newEnabled }],
                                      userId: currentUser.User_ID
                                    })
                                  });
                                  if (response.ok) {
                                    setNotificationSettings(prev => prev.map(s =>
                                      s.Setting_ID === setting.Setting_ID ? { ...s, IsEnabled: newEnabled } : s
                                    ));
                                    showAlertModal(`${setting.NotificationType} ${newEnabled ? 'enabled' : 'disabled'}!`, 'success');
                                  } else {
                                    const data = await response.json();
                                    showAlertModal(data.error || 'Failed to update', 'error');
                                  }
                                } catch (err) {
                                  showAlertModal(err.message, 'error');
                                }
                              }}
                            >
                              {setting.IsEnabled ? 'Enabled' : 'Disabled'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}


      </Container>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Delete <strong>{userToDelete?.UserName}</strong> ({userToDelete?.UserEmail})?</p>
          <p className="text-danger">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </Modal.Footer>
      </Modal>

      {/* Reset Password Modal */}
      <Modal show={showResetModal} onHide={() => setShowResetModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reset Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Reset password for <strong>{userToReset?.UserName}</strong> ({userToReset?.UserEmail})?</p>
          <Form.Group className="mb-3">
            <Form.Label>Temporary Password:</Form.Label>
            <Form.Control
              type="text"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
            />
          </Form.Group>
          <p className="text-warning">User should change this password after logging in.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResetModal(false)}>Cancel</Button>
          <Button variant="warning" onClick={confirmResetPassword}>Reset Password</Button>
        </Modal.Footer>
      </Modal>

      {/* Role Change Modal */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{makeAdmin ? 'Make Admin' : 'Remove Admin'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            {makeAdmin ? 'Grant admin role to' : 'Remove admin role from'} <strong>{userToChangeRole?.UserName}</strong> ({userToChangeRole?.UserEmail})?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>Cancel</Button>
          <Button variant={makeAdmin ? 'info' : 'secondary'} onClick={confirmRoleChange}>
            {makeAdmin ? 'Make Admin' : 'Remove Admin'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Alert Modal */}
      <Modal show={showAlert} onHide={() => setShowAlert(false)} centered>
        <Modal.Header closeButton className={alertType === 'success' ? 'text-success' : 'text-danger'}>
          <Modal.Title>{alertType === 'success' ? 'Success' : 'Error'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant={alertType === 'success' ? 'success' : 'danger'}>
            {alertMessage}
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowAlert(false)}>OK</Button>
        </Modal.Footer>
      </Modal>

       {/* View Profile Modal */}
        <Modal show={showProfileModal} onHide={() =>
  setShowProfileModal(false)} centered size="lg">
          <Modal.Header closeButton className="bg-primary
  text-white">
            <Modal.Title>👤 User Profile</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {userProfile && (
              <div>
                {/* User Info */}
                <div className="mb-4">
                  <h5 className="mb-3">📋 Account Information</h5>
                  <Table bordered size="sm">
                    <tbody>
                      <tr>
                        <td><strong>User ID:</strong></td>
                        <td>#{userProfile.User_ID}</td>
                      </tr>
                      <tr>
                        <td><strong>Username:</strong></td>
                        <td>{userProfile.UserName}</td>
                      </tr>
                      <tr>
                        <td><strong>Email:</strong></td>
                        <td>{userProfile.UserEmail}</td>
                      </tr>
                      <tr>
                        <td><strong>Status:</strong></td>
                        <td>
                          {userProfile.IsActive ?
                            <Badge bg="success">Active</Badge> :
                            <Badge bg="secondary">Inactive</Badge>
                          }
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Role:</strong></td>
                        <td>
                          {userProfile.IsSuperAdmin && <Badge
  bg="danger">Super Admin</Badge>}
                          {userProfile.IsAdmin &&
  !userProfile.IsSuperAdmin && <Badge bg="danger">Admin</Badge>}
                          {!userProfile.IsAdmin &&
  !userProfile.IsSuperAdmin && <Badge bg="primary">User</Badge>}
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Member Since:</strong></td>
                        <td>{new
  Date(userProfile.CreatedDate).toLocaleDateString()}</td>
                      </tr>
                      <tr>
                        <td><strong>Last Login:</strong></td>
                        <td>
                          {userProfile.LastLoginDate ?
                            new
  Date(userProfile.LastLoginDate).toLocaleString() :
                            <span
  className="text-muted">Never</span>
                          }
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>

                {/* Statistics */}
                {userStats && (
                  <div className="mb-4">
                    <h5 className="mb-3">📊 Statistics</h5>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="card text-center">
                          <div className="card-body">
                            <h3
  className="text-primary">{userStats?.TotalProjects || 0}</h3>
                            <p className="card-text mb-0">Total
  Projects</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card text-center">
                          <div className="card-body">
                            <h3
  className="text-success">{userStats?.PublishedProjects || 0}</h3>
                            <p className="card-text
  mb-0">Published</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card text-center">
                          <div className="card-body">
                            <h3
  className="text-info">{userStats?.TotalComponents || 0}</h3>
                            <p className="card-text
  mb-0">Components Created</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card text-center">
                          <div className="card-body">
                            <h3
  className="text-warning">{userStats?.TotalExports || 0}</h3>
                            <p className="card-text
  mb-0">Exports</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card text-center">
                          <div className="card-body">
                            <h3
  className="text-secondary">{userStats?.TotalActivities || 0}</h3>
                            <p className="card-text
  mb-0">Activities</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card text-center">
                          <div className="card-body">
                            <h3
  className="text-danger">{userStats?.TotalAuditEntries || 0}</h3>
                            <p className="card-text mb-0">Audit
  Entries</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Activity placeholder */}
                <div>
                  <h5 className="mb-3">🕒 Recent Activity</h5>
                  <p className="text-muted">Activity history can be
   fetched from audit log if needed.</p>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() =>
  setShowProfileModal(false)}>Close</Button>
          </Modal.Footer>
        </Modal>
  {/* Newsletter Compose Modal */}
        <Modal show={showNewsletterModal} onHide={() =>
  setShowNewsletterModal(false)} centered size="lg">
          <Modal.Header closeButton className="bg-primary
  text-white">
            <Modal.Title>✉️ Compose Newsletter</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Subject *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter newsletter subject..."
                  value={newsletterSubject}
                  onChange={(e) =>
  setNewsletterSubject(e.target.value)}
                  maxLength={200}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Recipients *</Form.Label>
                <Form.Select
                  value={recipientType}
                  onChange={(e) =>
  setRecipientType(e.target.value)}
                >
                  <option value="all">All Users</option>
                  <option value="selected">Selected Users</option>
                </Form.Select>
              </Form.Group>

              {recipientType === 'selected' && (
                <Form.Group className="mb-3">
                  <Form.Label>Select Users</Form.Label>
                  <div style={{ maxHeight: '200px', overflowY:
  'auto', border: '1px solid #dee2e6', padding: '10px',
  borderRadius: '5px' }}>
                    {users.filter(u => u.IsActive).map(user => (
                      <Form.Check
                        key={user.User_ID}
                        type="checkbox"
                        id={`user-${user.User_ID}`}
                        label={`${user.UserName}
  (${user.UserEmail})`}

  checked={selectedRecipients.includes(user.User_ID)}
                        onChange={(e) => {
                          if (e.target.checked) {

  setSelectedRecipients([...selectedRecipients, user.User_ID]);
                          } else {

  setSelectedRecipients(selectedRecipients.filter(id => id !==
  user.User_ID));
                          }
                        }}
                      />
                    ))}
                  </div>
                  <small className="text-muted">
                    {selectedRecipients.length} user(s) selected
                  </small>
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Message *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={8}
                  placeholder="Enter your newsletter message..."
                  value={newsletterMessage}
                  onChange={(e) =>
  setNewsletterMessage(e.target.value)}
                />
                <small className="text-muted">HTML tags
  allowed</small>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() =>
  setShowNewsletterModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSendNewsletter}
              disabled={sending}
            >
              {sending ? 'Sending...' : '🚀 Send Newsletter'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Schedule Modal */}
        <Modal show={showScheduleModal} onHide={() => setShowScheduleModal(false)} centered size="lg">
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>{editingSchedule ? '✏️ Edit Schedule' : '➕ Add Schedule'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ScheduleForm
              schedule={editingSchedule}
              users={users}
              templates={notificationTemplates}
              onSave={handleSaveSchedule}
              onCancel={() => setShowScheduleModal(false)}
            />
          </Modal.Body>
        </Modal>

        {/* Notification Template Modal */}
        <Modal show={showTemplateModal} onHide={() => setShowTemplateModal(false)} centered size="lg">
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>{editingTemplate ? '✏️ Edit Template' : '➕ Add Template'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <NotificationTemplateForm
              template={editingTemplate}
              onSave={handleSaveNotificationTemplate}
              onCancel={() => setShowTemplateModal(false)}
            />
          </Modal.Body>
        </Modal>

       </div>
  );
}

// ============================================
// SCHEDULE FORM COMPONENT
// ============================================
function ScheduleForm({ schedule, users, templates, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    scheduleName: schedule?.ScheduleName || '',
    notificationType: schedule?.NotificationType || 'custom',
    frequency: schedule?.Frequency || 'daily',
    scheduleTime: schedule?.ScheduleTime || '09:00',
    scheduleDay: schedule?.ScheduleDay || 1,
    templateId: schedule?.Template_ID || '',
    recipientType: schedule?.RecipientType || 'all',
    recipientIds: schedule?.RecipientIDs ? JSON.parse(schedule.RecipientIDs) : [],
    messageOverride: schedule?.MessageOverride || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Schedule Name *</Form.Label>
        <Form.Control
          type="text"
          value={formData.scheduleName}
          onChange={(e) => setFormData({ ...formData, scheduleName: e.target.value })}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Notification Type *</Form.Label>
        <Form.Select
          value={formData.notificationType}
          onChange={(e) => setFormData({ ...formData, notificationType: e.target.value })}
        >
          <option value="custom">Custom Message</option>
          <option value="birthday">Birthday Greeting</option>
          <option value="event">Event Reminder</option>
        </Form.Select>
      </Form.Group>

      <div className="d-flex gap-3 mb-3">
        <Form.Group className="flex-fill">
          <Form.Label>Frequency *</Form.Label>
          <Form.Select
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="flex-fill">
          <Form.Label>Time *</Form.Label>
          <Form.Control
            type="time"
            value={formData.scheduleTime}
            onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
            required
          />
        </Form.Group>
      </div>

      {(formData.frequency === 'weekly' || formData.frequency === 'monthly') && (
        <Form.Group className="mb-3">
          <Form.Label>Day ({formData.frequency === 'weekly' ? '1-7 (Sun-Sat)' : '1-31'}) *</Form.Label>
          <Form.Control
            type="number"
            min={formData.frequency === 'weekly' ? 1 : 1}
            max={formData.frequency === 'weekly' ? 7 : 31}
            value={formData.scheduleDay}
            onChange={(e) => setFormData({ ...formData, scheduleDay: parseInt(e.target.value) })}
            required
          />
        </Form.Group>
      )}

      <Form.Group className="mb-3">
        <Form.Label>Recipients *</Form.Label>
        <Form.Select
          value={formData.recipientType}
          onChange={(e) => setFormData({ ...formData, recipientType: e.target.value })}
        >
          <option value="all">All Users</option>
          <option value="selected">Selected Users</option>
        </Form.Select>
      </Form.Group>

      {formData.recipientType === 'selected' && (
        <Form.Group className="mb-3">
          <Form.Label>Select Users</Form.Label>
          <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #dee2e6', padding: '10px', borderRadius: '5px' }}>
            {users.filter(u => u.IsActive).map(user => (
              <Form.Check
                key={user.User_ID}
                type="checkbox"
                label={`${user.UserName} (${user.UserEmail})`}
                checked={formData.recipientIds.includes(user.User_ID)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({ ...formData, recipientIds: [...formData.recipientIds, user.User_ID] });
                  } else {
                    setFormData({ ...formData, recipientIds: formData.recipientIds.filter(id => id !== user.User_ID) });
                  }
                }}
              />
            ))}
          </div>
          <small className="text-muted">{formData.recipientIds.length} user(s) selected</small>
        </Form.Group>
      )}

      {formData.notificationType === 'custom' && (
        <>
          <Form.Group className="mb-3">
            <Form.Label>Or Use Template</Form.Label>
            <Form.Select
              value={formData.templateId}
              onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
            >
              <option value="">No Template</option>
              {templates.filter(t => t.IsActive).map(t => (
                <option key={t.Template_ID} value={t.Template_ID}>{t.TemplateName}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Message Override (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={formData.messageOverride}
              onChange={(e) => setFormData({ ...formData, messageOverride: e.target.value })}
              placeholder="Enter custom message or leave blank to use template..."
            />
            <small className="text-muted">HTML allowed. Use {'{username}'} for user's name.</small>
          </Form.Group>
        </>
      )}

      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit">{schedule ? 'Update' : 'Create'} Schedule</Button>
      </Modal.Footer>
    </Form>
  );
}

// ============================================
// NOTIFICATION TEMPLATE FORM COMPONENT
// ============================================
function NotificationTemplateForm({ template, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    templateName: template?.TemplateName || '',
    templateType: template?.TemplateType || 'custom',
    subject: template?.Subject || '',
    message: template?.Message || '',
    variables: template?.Variables ? JSON.parse(template.Variables) : []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const addVariable = () => {
    const varName = prompt('Enter variable name (e.g., username, date):');
    if (varName) {
      setFormData({ ...formData, variables: [...formData.variables, varName] });
    }
  };

  const removeVariable = (index) => {
    setFormData({ ...formData, variables: formData.variables.filter((_, i) => i !== index) });
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Template Name *</Form.Label>
        <Form.Control
          type="text"
          value={formData.templateName}
          onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Template Type *</Form.Label>
        <Form.Select
          value={formData.templateType}
          onChange={(e) => setFormData({ ...formData, templateType: e.target.value })}
        >
          <option value="birthday">Birthday</option>
          <option value="event">Event</option>
          <option value="newsletter">Newsletter</option>
          <option value="custom">Custom</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Subject *</Form.Label>
        <Form.Control
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="e.g., Happy Birthday {username}!"
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Message *</Form.Label>
        <Form.Control
          as="textarea"
          rows={6}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Enter message content... Use {variable} for placeholders"
          required
        />
        <small className="text-muted">HTML allowed. Common variables: {'{username}'}, {'{date}'}, {'{event_name}'}</small>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Variables (Placeholders)</Form.Label>
        <div className="d-flex gap-2 flex-wrap">
          {formData.variables.map((v, i) => (
            <Badge key={i} bg="info" className="d-flex align-items-center">
              {'{' + v + '}'}
              <span
                style={{ cursor: 'pointer', marginLeft: '5px' }}
                onClick={() => removeVariable(i)}
              >
                ×
              </span>
            </Badge>
          ))}
          <Button variant="outline-primary" size="sm" onClick={addVariable}>
            + Add Variable
          </Button>
        </div>
        <small className="text-muted">Click to remove placeholders</small>
      </Form.Group>

      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit">{template ? 'Update' : 'Create'} Template</Button>
      </Modal.Footer>
    </Form>
  );
}
