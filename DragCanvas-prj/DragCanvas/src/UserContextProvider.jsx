import React, { useCallback, useEffect, useState } from 'react';

import { apiFetch, clearToken, getToken, setToken } from './api.js';
import { UserContext } from './userContext.js';

const STORED_USER_KEY = 'currentUser';

/** Save the non-sensitive user profile used to paint the UI after a refresh. */
function storeUser(user) {
  localStorage.setItem(STORED_USER_KEY, JSON.stringify(user));
}

/** Read the cached profile without allowing malformed JSON to crash the app. */
function readStoredUser() {
  try {
    const value = localStorage.getItem(STORED_USER_KEY);
    return value && value !== 'undefined' ? JSON.parse(value) : null;
  } catch {
    localStorage.removeItem(STORED_USER_KEY);
    return null;
  }
}

/**
 * Makes login state available to every component below App.
 *
 * The provider is the single owner of the current user, roles, authentication
 * loading state, and authentication errors. Pages consume those values through
 * useUserContext() instead of reading localStorage independently.
 */
export default function UserContextProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [notificationsVersion, setNotificationsVersion] = useState(0);

  const updateUserState = useCallback((user) => {
    setCurrentUser(user);
    setIsAdmin(Boolean(user?.IsAdmin));
    setIsSuperAdmin(Boolean(user?.IsSuperAdmin));
  }, []);

  const refreshNotifications = useCallback(() => {
    setNotificationsVersion((previousVersion) => previousVersion + 1);
  }, []);

  /**
   * Restore the session after a browser refresh.
   *
   * The cached profile paints the header immediately. The server response then
   * replaces it with the authoritative user and role information.
   */
  useEffect(() => {
    const cachedUser = readStoredUser();
    if (cachedUser) {
      updateUserState(cachedUser);
    }

    // These keys belonged to an older implementation. Roles must come from
    // the server so demotions and account changes take effect immediately.
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isSuperAdmin');

    // Anonymous visitors may browse the public pages without being redirected.
    if (!getToken()) {
      setSessionReady(true);
      return;
    }

    apiFetch('/api/users/me')
      .then((freshUser) => {
        updateUserState(freshUser);
        storeUser(freshUser);
      })
      .catch(() => {
        // apiFetch handles an expired token and redirects to login. This only
        // removes the stale visual profile left in localStorage.
        localStorage.removeItem(STORED_USER_KEY);
      })
      .finally(() => setSessionReady(true));
  }, [updateUserState]);

  const login = async (email, password) => {
    if (!email || !password) {
      const message = 'Email and password are required';
      setError(message);
      return { success: false, error: message };
    }

    setLoading(true);
    setError(null);

    try {
      const session = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      // The token proves this user's identity on every later API request.
      setToken(session.token);
      updateUserState(session);
      storeUser(session);

      return { success: true };
    } catch (loginError) {
      setError(loginError.message);
      return { success: false, error: loginError.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password, birthDate = null) => {
    setLoading(true);
    setError(null);

    try {
      const registration = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: { username, email, password, birthDate },
      });

      // Registration creates the account but does not issue a token, so the
      // new user is logged in immediately with a second request.
      const session = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      setToken(session.token);
      updateUserState(registration.user);
      storeUser(registration.user);

      return { success: true };
    } catch (registrationError) {
      setError(registrationError.message);
      return { success: false, error: registrationError.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem(STORED_USER_KEY);
    updateUserState(null);
  };

  const contextValue = {
    currentUser,
    isAdmin,
    isSuperAdmin,
    login,
    register,
    logout,
    loading,
    error,
    sessionReady,
    notificationsVersion,
    refreshNotifications,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}
