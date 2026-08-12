import { apiFetch, setToken, clearToken, getToken } from './api.js';
import React, { createContext, useState, useEffect, useContext }
  from "react";
import { v4 as uuidv4 } from 'uuid';

export const UserContext = createContext();
export const useUserContext = () => useContext(UserContext);

export default function UserContextProvider(props) {

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(null);
  const [projects, setProjects] = useState([]);

  // Add notification state and refetch function
  const [notificationsVersion, setNotificationsVersion] =
    useState(0);

  const refreshNotifications = () => {
    setNotificationsVersion(prev => prev + 1);
  };

  const addproject = (name, project) => {
    let newProject = {
      id: uuidv4(),
      created: new Date(),
      name: name,
      project: project
    }
    setProjects([...projects, newProject]);
  }
  const deleteproject = (id) => {
    setProjects(projects.filter(p => p.id !== id));
  }
  /**
   * Restore the session on mount.
   *
   * The stored copy is used first so the page paints immediately instead of
   * flashing a logged-out header, and then the server is asked who this user
   * currently is. Roles used to be kept in localStorage and never refreshed,
   * which meant a demoted admin kept seeing the admin panel until they cleared
   * their browser - the server now answers 403, so the UI has to agree.
   */
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser && storedUser !== 'undefined') {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch {
      localStorage.removeItem('currentUser');
    }

    // Left over from when roles lived here; removed so nothing reads them again
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isSuperAdmin');

    // Only ask when there is a session to ask about - an anonymous visitor
    // browsing templates must not be bounced to the login page.
    if (!getToken()) return;

    apiFetch('/api/users/me')
      .then((user) => {
        setCurrentUser(user);
        setIsAdmin(user.IsAdmin);
        setIsSuperAdmin(user.IsSuperAdmin);
        localStorage.setItem('currentUser', JSON.stringify(user));
      })
      .catch(() => {
        // A 401 (deactivated, deleted, expired) is already handled inside
        // apiFetch, which clears the token and redirects to login.
        localStorage.removeItem('currentUser');
      });
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    if (!email || !password) {
      setError('Email and password are required');
      setLoading(false);
      return { success: false, error: 'Email and password are required' };
    }
    try {
      const data2 = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      });

      // The token proves our identity on every later request
      setToken(data2.token);

      setCurrentUser(data2);
      setIsAdmin(data2.IsAdmin);
      setIsSuperAdmin(data2.IsSuperAdmin);
      // Roles are deliberately not stored - they are read from the server, so
      // a change of role takes effect without the user clearing their browser
      localStorage.setItem('currentUser',JSON.stringify(data2));

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password, birthDate = null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: { username, email, password, birthDate }
      });

      // Registration does not issue a token, so log the new user in right away
      const session = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      });
      setToken(session.token);

      setCurrentUser(data.user);
      setIsAdmin(data.user.IsAdmin);
      setIsSuperAdmin(data.user.IsSuperAdmin);
      localStorage.setItem('currentUser',
        JSON.stringify(data.user));
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearToken();
    setCurrentUser(null);
    setIsAdmin(null);
    setIsSuperAdmin(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <UserContext.Provider value={{
      currentUser,
      login,
      register,
      logout,
      loading,
      error,
      projects,
      addproject,
      deleteproject,
      isAdmin,
      isSuperAdmin,
      notificationsVersion,
      refreshNotifications
    }}>
      {props.children}
    </UserContext.Provider>
  );
}