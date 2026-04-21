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
  const [notificationCount, setNotificationCount] = useState(0);
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
  // Check if user is logged in on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      const storedIsAdmin = localStorage.getItem('isAdmin');
      const storedIsSuperAdmin = localStorage.getItem('isSuperAdmin');
      if (storedUser && storedUser !== 'undefined') {
        setCurrentUser(JSON.parse(storedUser));
      }
      if (storedIsAdmin && storedIsAdmin !== 'undefined') {
        setIsAdmin(JSON.parse(storedIsAdmin));
      }
      if (storedIsSuperAdmin && storedIsSuperAdmin !== 'undefined') {
        setIsSuperAdmin(JSON.parse(storedIsSuperAdmin));
      }
    } catch (e) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('isSuperAdmin');
    }
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
      debugger;

      const data = {
        UserEmail: `${email}`,
        Password: `${password}`,
        IPAddress: "uknown"
      }

      const response = await fetch('https://localhost:7112/api/Users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8 ',
          'Accept': 'application/json; charset=utf-8 '
        },
        body: JSON.stringify(data)
      });

      const data2 = await response.json();

      if (!response.ok) {
        throw new Error(data2.error || 'Login failed');
      }

      setCurrentUser(data2);
      setIsAdmin(data2.IsAdmin);
      setIsSuperAdmin(data2.IsSuperAdmin);
      localStorage.setItem('currentUser',JSON.stringify(data2));
      localStorage.setItem('isAdmin',JSON.stringify(data2.IsAdmin));
      localStorage.setItem('isSuperAdmin',JSON.stringify(data2.IsSuperAdmin));

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await
        fetch('http://localhost:3001/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setCurrentUser(data.user);
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
    setCurrentUser(null);
    setIsAdmin(null);
    setIsSuperAdmin(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isSuperAdmin');
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