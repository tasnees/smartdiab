import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
        // Redirect from auth pages if already logged in
        if (['/login', '/signup'].includes(location.pathname)) {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, location]);

  const login = async (badgeId, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.login(badgeId, password);
      console.log('Login response:', response);

      if (!response || !response.access_token) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('authToken', response.access_token);

      // Set user data from response or fetch it if not included
      let userData;
      if (response.user) {
        userData = response.user;
        setUser(userData);
      } else {
        // Fallback: Fetch user data if not included in the response
        userData = await authAPI.getCurrentUser();
        setUser(userData);
      }

      // Store doctor's ID in localStorage for API requests
      if (userData && userData.badge_id) {
        localStorage.setItem('doctorId', userData.badge_id);
      }

      navigate('/dashboard');
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials and try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      await authAPI.register(userData);
      // Don't auto-login after registration
      // Let the user manually login from the login page
      return true;
    } catch (err) {
      setError(err.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    navigate('/login');
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div>Loading...</div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
