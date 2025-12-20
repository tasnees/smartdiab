import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// Lazy load components for better performance
const DoctorDashboard = React.lazy(() => import('./components/DoctorDashboard.jsx'));
const DiabetesPrediction = React.lazy(() => import('./components/DiabetesPrediction.jsx'));
const Patients = React.lazy(() => import('./components/Patients.jsx'));
const PatientDetail = React.lazy(() => import('./components/PatientDetail.jsx'));
const Appointments = React.lazy(() => import('./components/Appointments.jsx'));
const Reports = React.lazy(() => import('./components/Reports.jsx'));
const Auth = React.lazy(() => import('./Auth'));

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

// Private route component that uses the auth context
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Main app content component
const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Redirect to dashboard if already authenticated and on auth pages
  const redirectPath = location.state?.from?.pathname || '/';

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={redirectPath} replace />
            ) : (
              <Auth isLogin={true} />
            )
          }
        />

        <Route
          path="/signup"
          element={
            isAuthenticated ? (
              <Navigate to={redirectPath} replace />
            ) : (
              <Auth isLogin={false} />
            )
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DoctorDashboard />
            </PrivateRoute>
          }
        >
          <Route index element={null} />
          <Route
            path="diabetes-prediction"
            element={
              <Box sx={{ width: '100%' }}>
                <DiabetesPrediction />
              </Box>
            }
          />
          <Route
            path="patients"
            element={
              <Box sx={{ width: '100%' }}>
                <Patients />
              </Box>
            }
          />
          <Route
            path="patients/:id"
            element={
              <Box sx={{ width: '100%' }}>
                <PatientDetail />
              </Box>
            }
          />
          <Route
            path="appointments"
            element={
              <Box sx={{ width: '100%' }}>
                <Appointments />
              </Box>
            }
          />
          <Route
            path="reports"
            element={
              <Box sx={{ width: '100%' }}>
                <Reports />
              </Box>
            }
          />
        </Route>

        {/* Redirect root to dashboard if authenticated, otherwise to login */}
        <Route
          path="/"
          element={
            <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
          }
        />

        {/* Catch all other routes */}
        <Route
          path="*"
          element={
            <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
          }
        />
      </Routes>
    </Suspense>
  );
};

// Main App component with providers
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
