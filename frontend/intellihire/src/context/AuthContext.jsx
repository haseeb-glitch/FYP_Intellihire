import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('intellihire_token');
    const savedUser = localStorage.getItem('intellihire_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('intellihire_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('intellihire_token', newToken);
    localStorage.setItem('intellihire_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (username, email, password) => {
    const res = await authAPI.register(username, email, password);
    return res.data;
  };

  const sendOtp = async (email) => {
    const res = await authAPI.sendOtp(email);
    return res.data;
  };

  const verifyOtp = async (email, otp) => {
    const res = await authAPI.verifyOtp(email, otp);
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('intellihire_token', newToken);
    localStorage.setItem('intellihire_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const forgotPassword = async (email) => {
    const res = await authAPI.forgotPassword(email);
    return res.data;
  };

  const updateProfile = async (username, full_name) => {
    const res = await authAPI.updateProfile(username, full_name);
    const userData = res.data.user;
    localStorage.setItem('intellihire_user', JSON.stringify(userData));
    setUser(userData);
    return res.data;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await authAPI.changePassword(currentPassword, newPassword);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('intellihire_token');
    localStorage.removeItem('intellihire_user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated,
      login,
      register,
      sendOtp,
      verifyOtp,
      forgotPassword,
      updateProfile,
      changePassword,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
