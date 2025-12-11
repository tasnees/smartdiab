import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Container,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Link as MuiLink
} from '@mui/material';
import { useAuth } from './contexts/AuthContext';

const Auth = ({ isLogin: initialIsLogin }) => {
  const { login, register, error: authError, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    badgeId: '',
    email: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = initialIsLogin || location.pathname === '/login';
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    // Reset form when switching between login/signup
    setFormData(prev => ({
      ...prev,
      name: '',
      badgeId: '',
      password: ''
    }));
    setError(authError || '');
  }, [isLogin, authError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.badgeId || !formData.password || (!isLogin && (!formData.name || !formData.email))) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        // Handle login
        const success = await login(formData.badgeId, formData.password);
        if (success) {
          navigate(from, { replace: true });
        }

        // Redirect to the requested page or home
        const redirectTo = location.state?.from?.pathname || '/';
        navigate(redirectTo);
      } else {
        // Handle signup - ensure all required fields are included
        const userData = {
          name: formData.name.trim(),
          badgeId: formData.badgeId.trim(),
          password: formData.password,
          email: formData.email?.trim()
        };

        // Validate required fields
        if (!userData.name || !userData.badgeId || !userData.password || !userData.email) {
          setError('Name, email, badge ID, and password are required');
          return;
        }

        console.log('Registering with:', userData);
        const success = await register(userData);

        if (success) {
          navigate(from, { replace: true });
        }

        // Redirect to home after registration
        navigate('/');
      }
    } catch (err) {
      setError(err.message || (isLogin
        ? 'Invalid badge ID or password. Please try again.'
        : 'Failed to create account. The badge ID might already be in use.'));
      console.error('Auth error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{
        mt: 8,
        p: { xs: 3, sm: 4 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: 2
      }}>
        <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          {isLogin ? 'Welcome Back' : 'Create an Account'}
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              width: '100%',
              mb: 2,
              '& .MuiAlert-message': { width: '100%' }
            }}
          >
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          {!isLogin && (
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              autoComplete="name"
              autoFocus={!isLogin}
              value={formData.name}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
          )}

          {!isLogin && (
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            id="badgeId"
            label="Badge ID"
            name="badgeId"
            autoComplete="username"
            autoFocus={isLogin}
            value={formData.badgeId}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            value={formData.password}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />

          {isLogin && (
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}>
              <FormControlLabel
                control={
                  <Checkbox
                    value="remember"
                    color="primary"
                    checked={formData.rememberMe}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        rememberMe: e.target.checked
                      }))
                    }
                  />
                }
                label="Remember me"
              />
              <MuiLink
                component={Link}
                to="/forgot-password"
                variant="body2"
                sx={{ textDecoration: 'none' }}
              >
                Forgot password?
              </MuiLink>
            </Box>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{
              mt: 2,
              mb: 3,
              py: 1.5,
              fontSize: '1rem',
              textTransform: 'none',
              borderRadius: 2,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
              }
            }}
            disabled={authLoading || isSubmitting}
          >
            {(authLoading || isSubmitting) ? (
              <CircularProgress size={24} color="inherit" />
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </Button>

          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <MuiLink
                component={Link}
                to={isLogin ? '/signup' : '/login'}
                state={{ from: location.state?.from }}
                color="primary"
                size="small"
                sx={{
                  textDecoration: 'none',
                  textTransform: 'none',
                  fontWeight: 600,
                  p: 0,
                  minWidth: 'auto',
                  '&:hover': {
                    background: 'none',
                    textDecoration: 'underline'
                  }
                }}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Auth;
