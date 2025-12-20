/**
 * Enhanced API Services for Comprehensive Diabetes Management
 * Includes all new features: glucose, medications, lab results, etc.
 */

import { api } from './api';

/**
 * Glucose Monitoring Service
 */
export const glucoseService = {
    // Glucose Readings
    createReading: async (readingData) => {
        const response = await api.post('/api/glucose/readings', readingData);
        return response.data || response;
    },

    getPatientReadings: async (patientId, params = {}) => {
        const response = await api.get(`/api/glucose/readings/patient/${patientId}`, { params });
        return response.data || response;
    },

    getReading: async (readingId) => {
        const response = await api.get(`/api/glucose/readings/${readingId}`);
        return response.data || response;
    },

    deleteReading: async (readingId) => {
        return api.delete(`/api/glucose/readings/${readingId}`);
    },

    getStatistics: async (patientId, days = 30) => {
        const response = await api.get(`/api/glucose/readings/patient/${patientId}/statistics`, {
            params: { days }
        });
        return response.data || response;
    },

    // HbA1c
    createHbA1c: async (hba1cData) => {
        const response = await api.post('/api/glucose/hba1c', hba1cData);
        return response.data || response;
    },

    getPatientHbA1c: async (patientId) => {
        const response = await api.get(`/api/glucose/hba1c/patient/${patientId}`);
        return response.data || response;
    },

    getHbA1cTrend: async (patientId) => {
        const response = await api.get(`/api/glucose/hba1c/patient/${patientId}/trend`);
        return response.data || response;
    },

    deleteHbA1c: async (readingId) => {
        return api.delete(`/api/glucose/hba1c/${readingId}`);
    },
};

/**
 * Medication Management Service
 */
export const medicationService = {
    // Medications
    createMedication: async (medicationData) => {
        const response = await api.post('/api/medications', medicationData);
        return response.data || response;
    },

    getPatientMedications: async (patientId, activeOnly = true) => {
        const response = await api.get(`/api/medications/patient/${patientId}`, {
            params: { active_only: activeOnly }
        });
        return response.data || response;
    },

    getMedication: async (medicationId) => {
        const response = await api.get(`/api/medications/${medicationId}`);
        return response.data || response;
    },

    updateMedication: async (medicationId, updates) => {
        const response = await api.put(`/api/medications/${medicationId}`, updates);
        return response.data || response;
    },

    deleteMedication: async (medicationId) => {
        return api.delete(`/api/medications/${medicationId}`);
    },

    // Adherence
    createAdherence: async (adherenceData) => {
        const response = await api.post('/api/medications/adherence', adherenceData);
        return response.data || response;
    },

    getPatientAdherence: async (patientId, params = {}) => {
        const response = await api.get(`/api/medications/adherence/patient/${patientId}`, { params });
        return response.data || response;
    },

    getAdherenceStatistics: async (patientId, days = 30) => {
        const response = await api.get(`/api/medications/adherence/patient/${patientId}/statistics`, {
            params: { days }
        });
        return response.data || response;
    },

    updateAdherence: async (adherenceId, updates) => {
        const response = await api.put(`/api/medications/adherence/${adherenceId}`, updates);
        return response.data || response;
    },

    checkInteractions: async (patientId) => {
        const response = await api.get(`/api/medications/patient/${patientId}/check-interactions`);
        return response.data || response;
    },
};

/**
 * Lab Results Service
 */
export const labResultsService = {
    createLabResult: async (labResultData) => {
        const response = await api.post('/api/lab-results', labResultData);
        return response.data || response;
    },

    getPatientLabResults: async (patientId, testType = null) => {
        const params = testType ? { test_type: testType } : {};
        const response = await api.get(`/api/lab-results/patient/${patientId}`, { params });
        return response.data || response;
    },

    getLabResult: async (resultId) => {
        const response = await api.get(`/api/lab-results/${resultId}`);
        return response.data || response;
    },

    updateLabResult: async (resultId, updates) => {
        const response = await api.put(`/api/lab-results/${resultId}`, updates);
        return response.data || response;
    },

    deleteLabResult: async (resultId) => {
        return api.delete(`/api/lab-results/${resultId}`);
    },

    getLabResultTrends: async (patientId, testType) => {
        const response = await api.get(`/api/lab-results/patient/${patientId}/trends/${testType}`);
        return response.data || response;
    },
};

/**
 * Complication Screening Service
 */
export const screeningService = {
    createScreening: async (screeningData) => {
        const response = await api.post('/api/screenings', screeningData);
        return response.data || response;
    },

    getPatientScreenings: async (patientId, screeningType = null) => {
        const params = screeningType ? { screening_type: screeningType } : {};
        const response = await api.get(`/api/screenings/patient/${patientId}`, { params });
        return response.data || response;
    },

    getScreening: async (screeningId) => {
        const response = await api.get(`/api/screenings/${screeningId}`);
        return response.data || response;
    },

    updateScreening: async (screeningId, updates) => {
        const response = await api.put(`/api/screenings/${screeningId}`, updates);
        return response.data || response;
    },

    deleteScreening: async (screeningId) => {
        return api.delete(`/api/screenings/${screeningId}`);
    },

    getDueScreenings: async (patientId) => {
        const response = await api.get(`/api/screenings/patient/${patientId}/due-screenings`);
        return response.data || response;
    },
};

/**
 * Nutrition Tracking Service
 */
export const nutritionService = {
    createLog: async (logData) => {
        const response = await api.post('/api/nutrition/logs', logData);
        return response.data || response;
    },

    getPatientLogs: async (patientId, params = {}) => {
        const response = await api.get(`/api/nutrition/logs/patient/${patientId}`, { params });
        return response.data || response;
    },

    getLog: async (logId) => {
        const response = await api.get(`/api/nutrition/logs/${logId}`);
        return response.data || response;
    },

    updateLog: async (logId, updates) => {
        const response = await api.put(`/api/nutrition/logs/${logId}`, updates);
        return response.data || response;
    },

    deleteLog: async (logId) => {
        return api.delete(`/api/nutrition/logs/${logId}`);
    },

    getSummary: async (patientId, days = 7) => {
        const response = await api.get(`/api/nutrition/logs/patient/${patientId}/summary`, {
            params: { days }
        });
        return response.data || response;
    },
};

/**
 * Activity Tracking Service
 */
export const activityService = {
    createLog: async (logData) => {
        const response = await api.post('/api/activity/logs', logData);
        return response.data || response;
    },

    getPatientLogs: async (patientId, params = {}) => {
        const response = await api.get(`/api/activity/logs/patient/${patientId}`, { params });
        return response.data || response;
    },

    getLog: async (logId) => {
        const response = await api.get(`/api/activity/logs/${logId}`);
        return response.data || response;
    },

    updateLog: async (logId, updates) => {
        const response = await api.put(`/api/activity/logs/${logId}`, updates);
        return response.data || response;
    },

    deleteLog: async (logId) => {
        return api.delete(`/api/activity/logs/${logId}`);
    },

    getSummary: async (patientId, days = 7) => {
        const response = await api.get(`/api/activity/logs/patient/${patientId}/summary`, {
            params: { days }
        });
        return response.data || response;
    },

    getGlucoseImpact: async (patientId, days = 30) => {
        const response = await api.get(`/api/activity/logs/patient/${patientId}/glucose-impact`, {
            params: { days }
        });
        return response.data || response;
    },
};

/**
 * Messaging Service
 */
export const messagingService = {
    sendMessage: async (messageData) => {
        const response = await api.post('/api/messages', messageData);
        return response.data || response;
    },

    getInbox: async (userId, unreadOnly = false) => {
        const response = await api.get(`/api/messages/inbox/${userId}`, {
            params: { unread_only: unreadOnly }
        });
        return response.data || response;
    },

    getSentMessages: async (userId) => {
        const response = await api.get(`/api/messages/sent/${userId}`);
        return response.data || response;
    },

    getConversation: async (user1Id, user2Id) => {
        const response = await api.get(`/api/messages/conversation/${user1Id}/${user2Id}`);
        return response.data || response;
    },

    getMessage: async (messageId) => {
        const response = await api.get(`/api/messages/${messageId}`);
        return response.data || response;
    },

    markAsRead: async (messageId) => {
        const response = await api.put(`/api/messages/${messageId}/mark-read`);
        return response.data || response;
    },

    deleteMessage: async (messageId) => {
        return api.delete(`/api/messages/${messageId}`);
    },

    getUnreadCount: async (userId) => {
        const response = await api.get(`/api/messages/unread-count/${userId}`);
        return response.data || response;
    },
};

/**
 * Alerts & Notifications Service
 */
export const alertsService = {
    createAlert: async (alertData) => {
        const response = await api.post('/api/alerts', alertData);
        return response.data || response;
    },

    getPatientAlerts: async (patientId, params = {}) => {
        const response = await api.get(`/api/alerts/patient/${patientId}`, { params });
        return response.data || response;
    },

    getDoctorAlerts: async (doctorId, params = {}) => {
        const response = await api.get(`/api/alerts/doctor/${doctorId}`, { params });
        return response.data || response;
    },

    getAlert: async (alertId) => {
        const response = await api.get(`/api/alerts/${alertId}`);
        return response.data || response;
    },

    acknowledgeAlert: async (alertId, acknowledgedBy, actionTaken = null) => {
        const response = await api.put(`/api/alerts/${alertId}/acknowledge`, null, {
            params: { acknowledged_by: acknowledgedBy, action_taken: actionTaken }
        });
        return response.data || response;
    },

    deleteAlert: async (alertId) => {
        return api.delete(`/api/alerts/${alertId}`);
    },

    getCriticalAlerts: async (patientId) => {
        const response = await api.get(`/api/alerts/patient/${patientId}/critical`);
        return response.data || response;
    },

    getAlertsSummary: async (doctorId) => {
        const response = await api.get(`/api/alerts/doctor/${doctorId}/summary`);
        return response.data || response;
    },
};

/**
 * Analytics Service
 */
export const analyticsService = {
    getPatientOverview: async (patientId, days = 30) => {
        const response = await api.get(`/api/analytics/patient/${patientId}/overview`, {
            params: { days }
        });
        return response.data || response;
    },

    getPopulationHealth: async (doctorId) => {
        const response = await api.get(`/api/analytics/doctor/${doctorId}/population-health`);
        return response.data || response;
    },

    getRiskStratification: async (patientId) => {
        const response = await api.get(`/api/analytics/patient/${patientId}/risk-stratification`);
        return response.data || response;
    },

    getPatientTrends: async (patientId, days = 90) => {
        const response = await api.get(`/api/analytics/patient/${patientId}/trends`, {
            params: { days }
        });
        return response.data || response;
    },
};

// Export all services
export default {
    glucose: glucoseService,
    medication: medicationService,
    labResults: labResultsService,
    screening: screeningService,
    nutrition: nutritionService,
    activity: activityService,
    messaging: messagingService,
    alerts: alertsService,
    analytics: analyticsService,
};
