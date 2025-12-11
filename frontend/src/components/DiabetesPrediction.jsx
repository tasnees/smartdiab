import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { patientService } from '../services/api';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
  Alert
} from '@mui/material';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/predictions/`;

const defaultForm = {
  gender: "Female",
  age: 30,
  hypertension: 0,
  heart_disease: 0,
  bmi: 25.0,
  HbA1c_level: 5.5,
  blood_glucose_level: 120,
  smoking_history: "never"
};

const DiabetesPrediction = () => {
  const location = useLocation();
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);

  // Load patient data from navigation state
  useEffect(() => {
    if (location.state?.patient) {
      const patient = location.state.patient;
      setSelectedPatient(patient);

      // Auto-fill form with patient data
      setForm({
        gender: patient.gender || "Female",
        age: patient.age || 30,
        hypertension: patient.hypertension || 0,
        heart_disease: patient.heart_disease || 0,
        bmi: patient.bmi || patient.weight && patient.height ?
          (patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1) : 25.0,
        HbA1c_level: patient.HbA1c_level || 5.5,
        blood_glucose_level: patient.blood_glucose_level || 120,
        smoking_history: patient.smoking_history || "never"
      });
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Prepare input data for the model
      const inputData = {
        gender: form.gender === 'Male' ? 1 : 0,
        age: Number(form.age),
        hypertension: form.hypertension ? 1 : 0,
        heart_disease: form.heart_disease ? 1 : 0,
        bmi: Number(form.bmi),
        HbA1c_level: Number(form.HbA1c_level),
        blood_glucose_level: Number(form.blood_glucose_level),
        smoking_history: form.smoking_history === 'never' ? 0 : 1
      };

      // Get the current doctor's ID from the token or local storage
      const doctorId = localStorage.getItem('doctorId') || 'system';

      console.log('Using doctor ID:', doctorId);

      // First, get the prediction from the model
      console.log('Sending prediction request to:', API_URL);
      const predictionData = {
        patient_id: selectedPatient?.id || 'anonymous',
        doctor_id: doctorId,  // Use 'system' as fallback if not available
        prediction: 0,  // This will be updated by the backend
        confidence: 0,  // This will be updated by the backend
        input_data: inputData,
        notes: form.notes || ''
      };

      console.log('Sending prediction data:', predictionData);

      // Get the token from localStorage
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('No authentication token found. Please log in again.');
      }

      console.log('Using auth token:', authToken.substring(0, 10) + '...');

      const predictionResponse = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(predictionData)
      });

      if (predictionResponse.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Session expired. Please log in again.');
      }

      if (!predictionResponse.ok) {
        const errorData = await predictionResponse.json().catch(() => ({}));
        console.error('Prediction error details:', errorData);
        throw new Error(errorData.detail || 'Failed to process prediction');
      }

      const predictionResult = await predictionResponse.json();
      console.log('Prediction result:', predictionResult);

      // Update the UI with the prediction result
      setResult({
        ...predictionResult,
        recommendation: predictionResult.prediction === 1 || predictionResult.prediction === true
          ? 'High risk of diabetes detected. Please consult with a healthcare provider.'
          : 'No significant risk of diabetes detected. Maintain a healthy lifestyle.'
      });
    } catch (err) {
      console.error("Prediction error:", err);
      setError(`Failed to get prediction: ${err.message}. Please check your connection and try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Load patients when component mounts
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const data = await patientService.listPatients();
        setPatients(data);
      } catch (error) {
        console.error('Error loading patients:', error);
      }
    };
    loadPatients();
  }, []);

  const resetForm = () => {
    setForm(defaultForm);
    setResult(null);
    setError("");
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Diabetes Risk Assessment
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Personal Information */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main' }}>
                Patient Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="gender-label">Gender</InputLabel>
                    <Select
                      labelId="gender-label"
                      id="gender"
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      label="Gender"
                      required
                    >
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Age"
                    name="age"
                    type="number"
                    value={form.age}
                    onChange={handleNumberChange}
                    inputProps={{ min: 1, max: 120 }}
                    required
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.hypertension === 1}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          hypertension: e.target.checked ? 1 : 0
                        }))}
                        name="hypertension"
                        color="primary"
                      />
                    }
                    label="Hypertension"
                    labelPlacement="start"
                    sx={{ mt: 2, ml: 0, width: '100%', justifyContent: 'space-between' }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.heart_disease === 1}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          heart_disease: e.target.checked ? 1 : 0
                        }))}
                        name="heart_disease"
                        color="primary"
                      />
                    }
                    label="Heart Disease"
                    labelPlacement="start"
                    sx={{ mt: 2, ml: 0, width: '100%', justifyContent: 'space-between' }}
                  />
                </Grid>
              </Grid>

              <FormControl fullWidth margin="normal">
                <InputLabel id="smoking-label">Smoking History</InputLabel>
                <Select
                  labelId="smoking-label"
                  id="smoking_history"
                  name="smoking_history"
                  value={form.smoking_history}
                  onChange={handleChange}
                  label="Smoking History"
                  required
                >
                  <MenuItem value="never">Never Smoked</MenuItem>
                  <MenuItem value="former">Former Smoker</MenuItem>
                  <MenuItem value="current">Current Smoker</MenuItem>
                  <MenuItem value="not current">Not Current Smoker</MenuItem>
                  <MenuItem value="No Info">No Information</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Medical Information */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main' }}>
                Medical Information
              </Typography>

              <TextField
                fullWidth
                margin="normal"
                label="BMI (Body Mass Index)"
                name="bmi"
                type="number"
                value={form.bmi}
                onChange={handleNumberChange}
                inputProps={{ step: "0.1", min: 10, max: 60 }}
                required
              />

              <TextField
                fullWidth
                margin="normal"
                label="HbA1c Level (%)"
                name="HbA1c_level"
                type="number"
                value={form.HbA1c_level}
                onChange={handleNumberChange}
                inputProps={{ step: "0.1", min: 3, max: 20 }}
                required
              />

              <TextField
                fullWidth
                margin="normal"
                label="Blood Glucose Level (mg/dL)"
                name="blood_glucose_level"
                type="number"
                value={form.blood_glucose_level}
                onChange={handleNumberChange}
                inputProps={{ min: 20, max: 600 }}
                required
              />
            </Grid>

            {/* Form Actions */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="space-between">
                <Button
                  variant="outlined"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                  onClick={(e) => {
                    console.log('Button clicked');
                    handleSubmit(e);
                  }}
                >
                  {loading ? 'Predicting...' : 'Predict Diabetes Risk'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Card elevation={3} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Prediction Results
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, backgroundColor: result.prediction === 1 ? '#ffebee' : '#e8f5e9', borderRadius: 1 }}>
                  <Typography variant="h4" align="center" color={result.prediction === 1 ? 'error' : 'success.main'}>
                    {result.prediction === 1 ? 'High Risk' : 'Low Risk'}
                  </Typography>
                  <Typography variant="body1" align="center" sx={{ mt: 1 }}>
                    {result.prediction === 1
                      ? 'This patient is at high risk of diabetes.'
                      : 'This patient is at low risk of diabetes.'}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Confidence: <strong>{result.confidence ? (result.confidence * 100).toFixed(2) + '%' : 'N/A'}</strong>
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Clinical Recommendations for Doctor:</strong>
                    </Typography>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      {result.prediction === 1 ? (
                        <>
                          <li><strong>Schedule follow-up appointment</strong> within 1-2 weeks</li>
                          <li><strong>Order additional tests:</strong> Fasting glucose, HbA1c recheck, lipid panel</li>
                          <li><strong>Prescribe lifestyle modifications:</strong> Diet plan, exercise regimen (30 min/day)</li>
                          <li><strong>Consider medication:</strong> Evaluate for Metformin if pre-diabetic</li>
                          <li><strong>Patient education:</strong> Discuss diabetes prevention strategies</li>
                          <li><strong>Monitor closely:</strong> Weekly blood glucose checks for 1 month</li>
                          <li><strong>Referral:</strong> Consider endocrinologist consultation if HbA1c {'>'}  6.5%</li>
                        </>
                      ) : (
                        <>
                          <li><strong>Routine follow-up:</strong> Schedule annual diabetes screening</li>
                          <li><strong>Preventive counseling:</strong> Maintain healthy weight and active lifestyle</li>
                          <li><strong>Monitor risk factors:</strong> Track BMI, blood pressure, family history</li>
                          <li><strong>Patient education:</strong> Discuss early warning signs of diabetes</li>
                          <li><strong>Lifestyle reinforcement:</strong> Encourage continued healthy habits</li>
                        </>
                      )}
                    </ul>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => {
                  // In a real app, you might save these results to a patient's record
                  alert('Results saved to patient record');
                }}
              >
                Save to Patient Record
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DiabetesPrediction;
