import axios from 'axios';

// Types for better IDE support and documentation
/**
 * @typedef {Object} User
 * @property {string} id - The user's unique ID
 * @property {string} name - The user's full name
 * @property {string} badgeId - The user's badge ID
 * @property {string} [email] - The user's email (optional)
 */

/**
 * @typedef {Object} AuthResponse
 * @property {string} access_token - JWT access token
 * @property {User} user - User information
 */

// Get API URL from environment variables with fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  },
  withCredentials: true,
  timeout: 10000, // 10 seconds
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // For login endpoint, we want to keep the full response
    if (response.config.url.includes('/token')) {
      return response;
    }
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Handle specific status codes
      switch (status) {
        case 400:
          throw new Error(data.detail || 'Invalid request');
        case 401:
          localStorage.removeItem('authToken');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          throw new Error('Session expired. Please log in again.');
        case 403:
          throw new Error('You do not have permission to perform this action');
        case 404:
          throw new Error('The requested resource was not found');
        case 500:
          throw new Error('A server error occurred. Please try again later.');
        default:
          throw new Error(data.detail || 'An error occurred');
      }
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something happened in setting up the request
      throw new Error(error.message || 'An error occurred');
    }
  }
);

/**
 * Authentication API service
 */
export const authAPI = {
  /**
   * Log in a user
   * @param {string} badgeId - User's badge ID
   * @param {string} password - User's password
   * @returns {Promise<AuthResponse>} Authentication response with token and user data
   */
  login: async (badgeId, password) => {
    try {
      console.log('Attempting login with badgeId:', badgeId);

      const formData = new URLSearchParams();
      formData.append('username', badgeId);
      formData.append('password', password);

      console.log('Sending login request to /api/auth/token');

      const response = await api.post('/api/auth/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        timeout: 10000, // 10 seconds timeout
        validateStatus: (status) => status < 500, // Don't throw for 4xx errors
      });

      console.log('Login response status:', response.status);
      console.log('Response data:', response.data);

      if (response.status === 401) {
        throw new Error('Invalid credentials. Please check your badge ID and password.');
      }

      if (!response.data) {
        console.error('No data in login response');
        throw new Error('No data received from server. Please try again.');
      }

      if (!response.data.access_token) {
        console.error('No access token in response:', response.data);
        throw new Error('Authentication failed: No access token received');
      }

      const result = {
        access_token: response.data.access_token,
        token_type: response.data.token_type || 'bearer',
        user: response.data.user || {
          badge_id: badgeId,
          name: 'Doctor', // Default name if not provided
          email: ''
        }
      };

      console.log('Login successful:', {
        hasToken: !!result.access_token,
        user: result.user
      });

      return result;

    } catch (error) {
      console.error('Login API error details:', {
        name: error.name,
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        } : 'No response',
        request: error.request ? 'Request was made but no response received' : 'No request was made',
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data
        }
      });

      // Provide more specific error messages based on the error type
      if (error.code === 'ECONNABORTED') {
        throw new Error('Connection timeout. Please check your internet connection and try again.');
      }

      if (error.response) {
        // Handle specific HTTP error statuses
        switch (error.response.status) {
          case 400:
            throw new Error('Invalid request. Please check your input and try again.');
          case 401:
            throw new Error('Invalid credentials. Please check your badge ID and password.');
          case 403:
            throw new Error('Access denied. You do not have permission to access this resource.');
          case 404:
            throw new Error('The requested resource was not found.');
          case 500:
            throw new Error('A server error occurred. Please try again later.');
          default:
            throw new Error(`An error occurred (${error.response.status}): ${error.response.statusText}`);
        }
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection.');
      } else {
        throw new Error(error.message || 'An unknown error occurred during login.');
      }
    }
  },

  /**
   * Validate registration payload without creating user
   * @param {Object} userData - Raw registration data
   * @returns {Promise<Object>} Validation response
   */
  testRegistration: async ({ name, badgeId, password, email }) => {
    const requestData = {
      name: name?.trim() || '',
      badgeId: badgeId?.trim() || '',
      password: password || '',
      ...(email ? { email: email.trim() } : {}),
    };

    console.log('Testing registration payload', {
      ...requestData,
      password: '***redacted***',
    });

    try {
      const response = await api.post('/api/auth/test-register', requestData);
      return response.data || response;
    } catch (error) {
      console.error('Test registration error', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        (error.response?.data && error.response.data.detail) ||
        'Registration data is invalid. Please review your input.'
      );
    }
  },

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.name - User's full name
   * @param {string} userData.badgeId - User's badge ID
   * @param {string} userData.password - User's password
   * @param {string} [userData.email] - User's email (optional)
   * @returns {Promise<User>} Created user data
   */
  register: async ({ name, badgeId, password, email }) => {
    const requestData = {
      name: name?.trim() || '',
      badgeId: badgeId?.trim() || '',
      password: password || '',
      ...(email ? { email: email.trim() } : {}),
    };

    console.log('Submitting registration', {
      ...requestData,
      password: '***redacted***',
    });

    try {
      const response = await api.post('/api/auth/register', requestData);
      console.log('Registration successful', response.data);
      return response.data || response;
    } catch (error) {
      console.error('Registration request failed', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        (error.response?.data && error.response.data.detail) ||
        'Registration failed. Please try again.'
      );
    }
  },

  /**
   * Get current user data
   * @returns {Promise<User>} Current user data
   */
  getCurrentUser: async () => {
    return api.get('/api/auth/me');
  },
};

/**
 * Patient service for handling patient-related API calls
 */
export const patientService = {
  /**
   * Create a new patient
   * @param {Object} patientData - Patient data
   * @returns {Promise<Object>} Created patient data
   */
  createPatient: async (patientData) => {
    const response = await api.post('/api/patients/', patientData);
    return response.data || response;
  },

  /**
   * List all patients
   * @param {Object} [params] - Query parameters
   * @param {number} [params.page] - Page number
   * @param {number} [params.limit] - Items per page
   * @returns {Promise<{data: Array, pagination: Object}>} Paginated list of patients
   */
  listPatients: async (params = {}) => {
    const response = await api.get('/api/patients/', { params });
    return response.data || response;
  },

  /**
   * Get a single patient by ID
   * @param {string} id - Patient ID
   * @returns {Promise<Object>} Patient data
   */
  getPatient: async (id) => {
    const response = await api.get(`/api/patients/${id}`);
    return response.data || response;
  },

  /**
   * Update a patient
   * @param {string} id - Patient ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated patient data
   */
  updatePatient: async (id, updates) => {
    const response = await api.put(`/api/patients/${id}`, updates);
    return response.data || response;
  },

  /**
   * Delete a patient
   * @param {string} id - Patient ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  deletePatient: async (id) => {
    const response = await api.delete(`/api/patients/${id}`);
    return response.data || response;
  },

  /**
   * Get predictions for a patient
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} List of predictions
   */
  getPatientPredictions: async (patientId) => {
    const response = await api.get(`/api/predictions/patients/${patientId}/`);
    return response.data || response;
  },

  /**
   * Save a new prediction
   * @param {Object} predictionData - Prediction data
   * @returns {Promise<Object>} Created prediction
   */
  savePrediction: async (predictionData) => {
    const response = await api.post('/api/predictions/', predictionData);
    return response.data || response;
  },

  /**
   * Get a single prediction by ID
   * @param {string} id - Prediction ID
   * @returns {Promise<Object>} Prediction data
   */
  getPrediction: async (id) => {
    const response = await api.get(`/api/predictions/${id}`);
    return response.data || response;
  },
};

// Export all services for easier imports
export default {
  auth: authAPI,
  patients: patientService,
  // Add more services here as they are created
};

// Export API instance for direct usage if needed
export { api };
