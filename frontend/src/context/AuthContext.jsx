import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'https://rhino-field-ops.com';

  useEffect(() => {
    const savedUser = localStorage.getItem('rhino_user');
    const token = localStorage.getItem('rhino_token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { username, password });
      if (response.data.success) {
        const { token, user: loggedUser } = response.data;
        localStorage.setItem('rhino_token', token);
        localStorage.setItem('rhino_user', JSON.stringify(loggedUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(loggedUser);
        return { success: true, role: loggedUser.role };
      }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Authentication rejected.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('rhino_token');
    localStorage.removeItem('rhino_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
