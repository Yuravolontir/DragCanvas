import { useState } from 'react';

import { apiFetch } from '../../api.js';

/** A user is shown once every active filter agrees they should be. */
function matchesFilters(user, { searchEmail, filterStatus, filterRole }) {
  if (searchEmail.trim() && !user.UserEmail.toLowerCase().includes(searchEmail.toLowerCase())) {
    return false;
  }

  if (filterStatus === 'active' && !user.IsActive) return false;
  if (filterStatus === 'inactive' && user.IsActive) return false;

  if (filterRole === 'admin' && !(user.IsAdmin && !user.IsSuperAdmin)) return false;
  if (filterRole === 'user' && (user.IsAdmin || user.IsSuperAdmin)) return false;
  if (filterRole === 'super-admin' && !user.IsSuperAdmin) return false;

  return true;
}

/**
 * The user table: the list itself, its filters, and every dialog that acts on
 * one user - delete, reset password, change role, view profile.
 *
 * Fetching starts only when `fetchUsers` is called - AdminPanel calls it once
 * the viewer is confirmed to be an admin, so this hook does not need to know
 * about session state at all.
 *
 * @param {(message: string, type?: 'success'|'error') => void} showAlertModal
 */
export function useAdminUsers({ showAlertModal }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchEmail, setSearchEmail] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [roleTarget, setRoleTarget] = useState(null);
  const [makeAdmin, setMakeAdmin] = useState(true);

  const [profileUser, setProfileUser] = useState(null);
  const [profileStats, setProfileStats] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // The Node service, not the legacy C# one. This is the endpoint that
      // carries the authorisation work - admin-guarded, roles read live from
      // the database - and unlike the old one it returns the real table.
      const data = await apiFetch('/api/users');
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) => matchesFilters(user, { searchEmail, filterStatus, filterRole }),
  );

  const confirmDelete = async () => {
    try {
      // Who is doing the deleting comes from the token, so there is no adminID
      // to send - and nothing the browser could claim about it would be believed.
      const data = await apiFetch(`/api/users/${deleteTarget.User_ID}`, { method: 'DELETE' });
      setDeleteTarget(null);
      showAlertModal(data.message || 'User deleted');
      fetchUsers();
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  const handleStatusChange = async (user, newStatus) => {
    try {
      // adminID is no longer sent - the server takes it from the token.
      await apiFetch('/api/users/update-status', {
        method: 'POST',
        body: { targetID: user.User_ID, newStatus },
      });
      showAlertModal(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  const handleResetPasswordClick = (user) => {
    setResetTarget(user);
    setTempPassword('Temp123!');
  };

  const confirmResetPassword = async () => {
    try {
      const data = await apiFetch('/api/users/reset-password', {
        method: 'POST',
        body: { targetID: resetTarget.User_ID, newPassword: tempPassword },
      });
      setResetTarget(null);
      showAlertModal(data.message);
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  const handleRoleChangeClick = (user, nextMakeAdmin) => {
    setRoleTarget(user);
    setMakeAdmin(nextMakeAdmin);
  };

  const confirmRoleChange = async () => {
    try {
      const data = await apiFetch('/api/users/update-role', {
        method: 'POST',
        body: { targetID: roleTarget.User_ID, makeAdmin },
      });
      setRoleTarget(null);
      showAlertModal(data.message);
      fetchUsers();
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

  const handleViewProfile = async (user) => {
    setProfileUser(user);
    setProfileStats(null);
    try {
      const data = await apiFetch(`/api/users/${user.User_ID}/stats`);
      setProfileStats(data);
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
      setProfileStats(null);
    }
  };

  return {
    users,
    filteredUsers,
    loading,
    error,
    fetchUsers,

    filters: {
      searchEmail,
      filterStatus,
      filterRole,
      onSearchChange: setSearchEmail,
      onStatusFilterChange: setFilterStatus,
      onRoleFilterChange: setFilterRole,
    },

    actions: {
      onViewProfile: handleViewProfile,
      onStatusChange: handleStatusChange,
      onResetPassword: handleResetPasswordClick,
      onDelete: setDeleteTarget,
      onRoleChange: handleRoleChangeClick,
    },

    deleteDialog: {
      show: Boolean(deleteTarget),
      user: deleteTarget,
      onClose: () => setDeleteTarget(null),
      onConfirm: confirmDelete,
    },
    resetDialog: {
      show: Boolean(resetTarget),
      user: resetTarget,
      password: tempPassword,
      onPasswordChange: setTempPassword,
      onClose: () => setResetTarget(null),
      onConfirm: confirmResetPassword,
    },
    roleDialog: {
      show: Boolean(roleTarget),
      user: roleTarget,
      makeAdmin,
      onClose: () => setRoleTarget(null),
      onConfirm: confirmRoleChange,
    },
    profileDialog: {
      show: Boolean(profileUser),
      user: profileUser,
      statistics: profileStats,
      onClose: () => setProfileUser(null),
    },
  };
}
