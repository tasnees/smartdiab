import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocalHospital as MedicalIcon
} from '@mui/icons-material';
import { patientService } from '../services/api';

// Import enhanced components
import GlucoseMonitoring from './GlucoseMonitoring';
import MedicationTracker from './MedicationTracker';
import AlertsPanel from './AlertsPanel';
import AdvancedAnalytics from './AdvancedAnalytics';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [medicalFormData, setMedicalFormData] = useState({
    blood_type: '',
    allergies: '',
    current_medications: '',
    medical_history: '',
    family_history: '',
    general_state: '',
    height: '',
    weight: '',
    blood_pressure: '',
    notes: ''
  });

  useEffect(() => {
    loadPatientData();
  }, [id]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      setError('');

      const patientData = await patientService.getPatient(id);
      setPatient(patientData);

      // Initialize medical form data
      setMedicalFormData({
        blood_type: patientData.blood_type || '',
        allergies: Array.isArray(patientData.allergies) ? patientData.allergies.join(', ') : '',
        current_medications: Array.isArray(patientData.current_medications) ? patientData.current_medications.join(', ') : '',
        medical_history: patientData.medical_history || '',
        family_history: patientData.family_history || '',
        general_state: patientData.general_state || '',
        height: patientData.height || '',
        weight: patientData.weight || '',
        blood_pressure: patientData.blood_pressure || '',
        notes: patientData.notes || ''
      });

      try {
        const predictionsData = await patientService.getPatientPredictions(id);
        setPredictions(predictionsData || []);
      } catch (err) {
        console.error('Error loading predictions:', err);
        setPredictions([]);
      }
    } catch (err) {
      console.error('Error loading patient:', err);
      setError('Failed to load patient data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMedicalFormChange = (e) => {
    const { name, value } = e.target;
    setMedicalFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveMedicalInfo = async () => {
    try {
      setError('');

      // Convert comma-separated strings to arrays
      const updateData = {
        ...patient,
        blood_type: medicalFormData.blood_type,
        allergies: medicalFormData.allergies ? medicalFormData.allergies.split(',').map(a => a.trim()).filter(a => a) : [],
        current_medications: medicalFormData.current_medications ? medicalFormData.current_medications.split(',').map(m => m.trim()).filter(m => m) : [],
        medical_history: medicalFormData.medical_history,
        family_history: medicalFormData.family_history,
        general_state: medicalFormData.general_state,
        height: medicalFormData.height ? parseFloat(medicalFormData.height) : null,
        weight: medicalFormData.weight ? parseFloat(medicalFormData.weight) : null,
        blood_pressure: medicalFormData.blood_pressure,
        notes: medicalFormData.notes
      };

      await patientService.updatePatient(id, updateData);
      setEditDialogOpen(false);
      loadPatientData();
    } catch (err) {
      console.error('Error updating medical info:', err);
      setError('Failed to update medical information. Please try again.');
    }
  };

  const handleMakePrediction = () => {
    navigate('/dashboard/diabetes-prediction', { state: { patient } });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getRiskLevel = (prediction) => {
    if (prediction === 1 || prediction === true) {
      return { label: 'High Risk', color: 'error' };
    }
    return { label: 'Low Risk', color: 'success' };
  };

  const calculateBMI = () => {
    if (patient?.height && patient?.weight) {
      const heightInMeters = patient.height / 100;
      const bmi = patient.weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return 'N/A';
  };

  const getStateColor = (state) => {
    const stateColors = {
      'Stable': 'success',
      'Under Observation': 'warning',
      'Critical': 'error',
      'Recovering': 'info'
    };
    return stateColors[state] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !patient) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Patient not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard/patients')}
        >
          Back to Patients
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/dashboard/patients')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {patient.name}
          </Typography>
          {patient.general_state && (
            <Chip
              label={patient.general_state}
              color={getStateColor(patient.general_state)}
              size="small"
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setEditDialogOpen(true)}
          >
            Edit Medical Info
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleMakePrediction}
            sx={{ borderRadius: 2 }}
          >
            New Prediction
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" />
          <Tab label="Medical Records" />
          <Tab label="Glucose & HbA1c" />
          <Tab label="Medications" />
          <Tab label="Alerts" />
          <Tab label="Analytics" />
          <Tab label="Prediction History" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Personal Information */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Personal Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Full Name</Typography>
                    <Typography variant="body1" fontWeight="medium">{patient.name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Age</Typography>
                    <Typography variant="body1" fontWeight="medium">{patient.age || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Gender</Typography>
                    <Typography variant="body1" fontWeight="medium">{patient.gender || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Blood Type</Typography>
                    <Typography variant="body1" fontWeight="medium">{patient.blood_type || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1" fontWeight="medium">{patient.email || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1" fontWeight="medium">{patient.phone || 'N/A'}</Typography>
                  </Grid>
                  {patient.address && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Address</Typography>
                      <Typography variant="body1" fontWeight="medium">{patient.address}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Vital Signs */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Vital Signs
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Height</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {patient.height ? `${patient.height} cm` : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Weight</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {patient.weight ? `${patient.weight} kg` : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">BMI</Typography>
                    <Typography variant="body1" fontWeight="medium">{calculateBMI()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Blood Pressure</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {patient.blood_pressure || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Allergies */}
          {patient.allergies && patient.allergies.length > 0 && (
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="error">
                    ⚠️ Allergies
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {patient.allergies.map((allergy, index) => (
                      <Chip key={index} label={allergy} color="error" variant="outlined" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          {/* Medical History */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Medical History
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {patient.medical_history || 'No medical history recorded'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Family History */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Family History
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {patient.family_history || 'No family history recorded'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Current Medications */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Current Medications
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {patient.current_medications && patient.current_medications.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {patient.current_medications.map((med, index) => (
                      <Chip key={index} label={med} color="primary" variant="outlined" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body1">No current medications</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Notes */}
          {patient.notes && (
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Notes
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {patient.notes}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Glucose & HbA1c Tab */}
      {tabValue === 2 && (
        <GlucoseMonitoring patientId={id} />
      )}

      {/* Medications Tab */}
      {tabValue === 3 && (
        <MedicationTracker patientId={id} />
      )}

      {/* Alerts Tab */}
      {tabValue === 4 && (
        <AlertsPanel patientId={id} />
      )}

      {/* Analytics Tab */}
      {tabValue === 5 && (
        <AdvancedAnalytics patientId={id} mode="patient" />
      )}

      {/* Prediction History Tab */}
      {tabValue === 6 && (
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Prediction History
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {predictions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No predictions yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Create a diabetes risk assessment for this patient
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleMakePrediction}
                >
                  Make First Prediction
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Risk Level</strong></TableCell>
                      <TableCell><strong>Confidence</strong></TableCell>
                      <TableCell><strong>BMI</strong></TableCell>
                      <TableCell><strong>Blood Glucose</strong></TableCell>
                      <TableCell><strong>HbA1c</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {predictions.map((pred, index) => {
                      const risk = getRiskLevel(pred.prediction);
                      return (
                        <TableRow key={pred.id || index}>
                          <TableCell>{formatDate(pred.created_at)}</TableCell>
                          <TableCell>
                            <Chip
                              label={risk.label}
                              color={risk.color}
                              size="small"
                              icon={risk.color === 'error' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                            />
                          </TableCell>
                          <TableCell>
                            {pred.confidence ? `${(pred.confidence * 100).toFixed(1)}%` : 'N/A'}
                          </TableCell>
                          <TableCell>{pred.input_data?.bmi || 'N/A'}</TableCell>
                          <TableCell>{pred.input_data?.blood_glucose_level || 'N/A'} mg/dL</TableCell>
                          <TableCell>{pred.input_data?.HbA1c_level || 'N/A'}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Medical Info Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MedicalIcon color="primary" />
            Edit Medical Information
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Blood Type"
                name="blood_type"
                value={medicalFormData.blood_type}
                onChange={handleMedicalFormChange}
                placeholder="e.g., A+, O-, B+"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="General State"
                name="general_state"
                select
                SelectProps={{ native: true }}
                value={medicalFormData.general_state}
                onChange={handleMedicalFormChange}
              >
                <option value="">Select...</option>
                <option value="Stable">Stable</option>
                <option value="Under Observation">Under Observation</option>
                <option value="Critical">Critical</option>
                <option value="Recovering">Recovering</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Allergies"
                name="allergies"
                value={medicalFormData.allergies}
                onChange={handleMedicalFormChange}
                placeholder="Separate with commas (e.g., Penicillin, Peanuts, Latex)"
                helperText="Enter allergies separated by commas"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Medications"
                name="current_medications"
                value={medicalFormData.current_medications}
                onChange={handleMedicalFormChange}
                placeholder="Separate with commas (e.g., Metformin 500mg, Aspirin 81mg)"
                helperText="Enter medications separated by commas"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Height (cm)"
                name="height"
                type="number"
                value={medicalFormData.height}
                onChange={handleMedicalFormChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Weight (kg)"
                name="weight"
                type="number"
                value={medicalFormData.weight}
                onChange={handleMedicalFormChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Blood Pressure"
                name="blood_pressure"
                value={medicalFormData.blood_pressure}
                onChange={handleMedicalFormChange}
                placeholder="e.g., 120/80"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medical History"
                name="medical_history"
                value={medicalFormData.medical_history}
                onChange={handleMedicalFormChange}
                multiline
                rows={3}
                placeholder="Enter patient's medical history..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Family History"
                name="family_history"
                value={medicalFormData.family_history}
                onChange={handleMedicalFormChange}
                multiline
                rows={3}
                placeholder="Enter family medical history..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={medicalFormData.notes}
                onChange={handleMedicalFormChange}
                multiline
                rows={2}
                placeholder="Additional notes..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveMedicalInfo} variant="contained">
            Save Medical Information
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientDetail;