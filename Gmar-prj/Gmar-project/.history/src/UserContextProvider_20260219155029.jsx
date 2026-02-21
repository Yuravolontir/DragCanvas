 import React, { createContext, useState, useEffect, useContext } from "react";
 import { v4 as uuidv4 } from 'uuid';

  export const UserContext = createContext();
  export const useUserContext = () => useContext(UserContext);

  export default function UserContextProvider(props) {

    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [projects, setProjects] = useState([]);

    const addproject = (project) => {
      let newProject = {
        id: uuidv4(),
        project}
        setProjects([...projects, newProject]);
      }

    // Check if user is logged in on mount
    useEffect(() => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    }, []);

    const login = async (username, password) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:3001/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        setCurrentUser(data.user);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
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
        const response = await fetch('http://localhost:3001/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        setCurrentUser(data.user);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
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
      localStorage.removeItem('currentUser');
    };

    return (
      <UserContext.Provider value={{ currentUser, login, register, logout, loading, error , projects , addproject
  }}>
        {props.children}
      </UserContext.Provider>
    );
  }