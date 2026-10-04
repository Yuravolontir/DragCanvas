import { useState } from 'react';

import { apiFetch } from '../../api.js';

/**
 * A random temporary password that satisfies the server's rules: at least
 * eight characters with a letter and a digit. Drawn from crypto, not Math.random,
 * because this is a credential however briefly it lives.
 */
function suggestPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const body = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  // Guarantee the two character classes rather than hoping the draw contained them.
  return `Dc${body}7`;
}

/** A user is shown once every active filter agrees they should be. */
function matchesFilters(user, { searchEmail, filterStatus, filterRole }) {
  // Compared against the trimmed value, not the raw one: the guard above used
  // trim() and the comparison did not, so a search for " ivan " matched nobody.
  const needle = searchEmail.trim().toLowerCase();
  if (needle && !String(user.UserEmail || '').toLowerCase().includes(needle)) {
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

  /**
   * A fresh password per reset, not the same one for everybody.
   *
   * This filled the field with the constant "Temp123!". An admin who clicked
   * through the dialog gave every account the same password, and anyone who
   * had ever been reset could guess the next person's. The admin can still
   * type their own - this only changes what the field starts with.
   */
  const handleResetPasswordClick = (user) => {
    setResetTarget(user);
    setTempPassword(suggestPassword());
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
