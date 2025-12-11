import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert
} from '@mui/material';
import {
  Person as PersonIcon,
  Group as GroupIcon,
  Assessment as AssessmentIcon,
  Add as AddIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  MedicalServices as MedicalServicesIcon,
  CalendarToday as CalendarIcon,
  MonitorHeart as MonitorHeartIcon
} from '@mui/icons-material';
import { authAPI, patientService } from '../services/api';

const DoctorDashboard = () => {
  const [doctorData, setDoctorData] = useState(null);
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [medication, setMedication] = useState('');
  const [prescriptionError, setPrescriptionError] = useState('');
  const [prescriptionSuccess, setPrescriptionSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Update active tab based on URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/diabetes-prediction')) {
      setActiveTab('diabetes');
    } else if (path.includes('/patients')) {
      setActiveTab('patients');
    } else if (path.includes('/appointments')) {
      setActiveTab('appointments');
    } else if (path.includes('/reports')) {
      setActiveTab('reports');
    } else {
      setActiveTab('dashboard');
    }
  }, [location]);


  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch real doctor data from API
        try {
          const doctorInfo = await authAPI.getCurrentUser();
          setDoctorData({
            name: doctorInfo.name || localStorage.getItem('userName') || 'Doctor',
            specialty: doctorInfo.specialty || 'Endocrinologist',
            email: doctorInfo.email || 'doctor@smartdiab.com',
            badgeId: doctorInfo.badge_id || localStorage.getItem('userBadgeId')
          });
        } catch (err) {
          console.error('Error fetching doctor info:', err);
          // Fallback to localStorage
          setDoctorData({
            name: localStorage.getItem('userName') || 'Doctor',
            specialty: 'Endocrinologist',
            email: 'doctor@smartdiab.com',
            badgeId: localStorage.getItem('userBadgeId')
          });
        }

        // Fetch real patients data
        try {
          const patientsData = await patientService.listPatients();
          const patientCount = patientsData.length;

          // Get recent patients (last 3)
          const recentPatientsData = patientsData
            .slice(0, 3)
            .map(patient => ({
              id: patient.id,
              name: patient.name,
              email: patient.email,
              age: patient.age,
              gender: patient.gender,
              lastVisit: patient.updated_at || patient.created_at || 'N/A',
              status: patient.general_state || 'Stable'
            }));

          setRecentPatients(recentPatientsData);

          // Update doctor data with patient count
          setDoctorData(prev => ({
            ...prev,
            patientsCount: patientCount
          }));
        } catch (err) {
          console.error('Error fetching patients:', err);
          setRecentPatients([]);
        }

      } catch (error) {
        console.error('Error fetching doctor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [navigate]);

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userBadgeId');
    localStorage.removeItem('doctorId');

    // Clear session storage
    sessionStorage.clear();

    // Force page reload to login
    window.location.href = '/login';
  };

  const loadPatients = async () => {
    try {
      const data = await patientService.listPatients();
      setPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const handleOpenPrescriptionDialog = () => {
    loadPatients();
    setPrescriptionDialogOpen(true);
    setPrescriptionError('');
    setPrescriptionSuccess('');
  };

  const handleClosePrescriptionDialog = () => {
    setPrescriptionDialogOpen(false);
    setSelectedPatientId('');
    setMedication('');
    setPrescriptionError('');
    setPrescriptionSuccess('');
  };

  const handlePrescribe = async () => {
    try {
      setPrescriptionError('');
      setPrescriptionSuccess('');

      if (!selectedPatientId || !medication.trim()) {
        setPrescriptionError('Please select a patient and enter medication');
        return;
      }

      const patient = await patientService.getPatient(selectedPatientId);
      const currentMeds = patient.current_medications || [];
      const updatedMeds = [...currentMeds, medication.trim()];

      await patientService.updatePatient(selectedPatientId, {
        ...patient,
        current_medications: updatedMeds
      });

      setPrescriptionSuccess('Prescription added successfully!');
      setTimeout(() => {
        handleClosePrescriptionDialog();
      }, 1500);
    } catch (error) {
      console.error('Error adding prescription:', error);
      setPrescriptionError('Failed to add prescription. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <Box sx={{ backgroundColor: '#1976d2', color: 'white', p: 2, mb: 4 }}>
        <Container maxWidth="xl">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              <MedicalServicesIcon sx={{ fontSize: 40, mr: 2 }} />
              <Typography variant="h5" component="h1">
                SmartDiab Doctor Portal
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <Tooltip title="Notifications">
                <IconButton color="inherit" sx={{ mr: 2 }}>
                  <NotificationsIcon />
                </IconButton>
              </Tooltip>
              <Button
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Sidebar */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box display="flex" flexDirection="column" alignItems="center" p={2}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    mb: 2,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem'
                  }}
                >
                  {doctorData?.name?.charAt(0) || 'D'}
                </Avatar>
                <Typography variant="h6" component="h2" align="center">
                  {doctorData?.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  {doctorData?.specialty}
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  {doctorData?.email}
                </Typography>

                <Box mt={3} width="100%">
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/add-patient')}
                  >
                    Add New Patient
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <List component="nav">
                <ListItem
                  button
                  selected={activeTab === 'dashboard'}
                  onClick={() => {
                    navigate('/dashboard');
                    setActiveTab('dashboard');
                  }}
                >
                  <ListItemIcon><PersonIcon /></ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </ListItem>
                <ListItem
                  button
                  selected={activeTab === 'diabetes'}
                  onClick={() => {
                    navigate('/dashboard/diabetes-prediction');
                    setActiveTab('diabetes');
                  }}
                >
                  <ListItemIcon><MonitorHeartIcon /></ListItemIcon>
                  <ListItemText primary="Diabetes Prediction" />
                </ListItem>
                <ListItem
                  button
                  selected={activeTab === 'patients'}
                  onClick={() => {
                    navigate('/dashboard/patients');
                    setActiveTab('patients');
                  }}
                >
                  <ListItemIcon><GroupIcon /></ListItemIcon>
                  <ListItemText primary="My Patients" />
                </ListItem>
                <ListItem
                  button
                  selected={activeTab === 'appointments'}
                  onClick={() => {
                    navigate('/dashboard/appointments');
                    setActiveTab('appointments');
                  }}
                >
                  <ListItemIcon><CalendarIcon /></ListItemIcon>
                  <ListItemText primary="Appointments" />
                </ListItem>
                <ListItem
                  button
                  selected={activeTab === 'reports'}
                  onClick={() => {
                    navigate('/dashboard/reports');
                    setActiveTab('reports');
                  }}
                >
                  <ListItemIcon><AssessmentIcon /></ListItemIcon>
                  <ListItemText primary="Reports" />
                </ListItem>
              </List>
            </Paper>

            {/* Quick Stats */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Quick Stats
              </Typography>
              <Box mt={2}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Total Patients:</strong> {doctorData?.patientsCount || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Badge ID:</strong> {doctorData?.badgeId || 'N/A'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Recent Patients:</strong> {recentPatients.length}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={9}>
            {location.pathname === '/dashboard' ? (
              <>
                {/* Welcome Card */}
                <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
                  <Typography variant="h5" gutterBottom>
                    Welcome back, {doctorData?.name || 'Doctor'}!
                  </Typography>
                  <Typography variant="body1">
                    You have {recentPatients.length} recent patients. Manage your practice efficiently.
                  </Typography>
                </Paper>

                {/* Recent Patients */}
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Recent Patients</Typography>
                    <Button color="primary" onClick={() => navigate('/dashboard/patients')}>
                      View All
                    </Button>
                  </Box>

                  {recentPatients.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No patients yet. Add your first patient to get started.
                      </Typography>
                      <Button
                        variant="contained"
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/dashboard/patients')}
                      >
                        Add Patient
                      </Button>
                    </Box>
                  ) : (
                    <List>
                      {recentPatients.map((patient, index) => (
                        <React.Fragment key={patient.id}>
                          <ListItem
                            button
                            sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                            onClick={() => navigate(`/dashboard/patients/${patient.id}`)}
                          >
                            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                              {patient.name.charAt(0)}
                            </Avatar>
                            <ListItemText
                              primary={patient.name}
                              secondary={`${patient.email || 'No email'} • ${patient.age ? `Age: ${patient.age}` : 'Age: N/A'} • ${patient.gender || 'Gender: N/A'}`}
                            />
                            <Box textAlign="right">
                              <Typography variant="caption" display="block" color="textSecondary">
                                Status
                              </Typography>
                              <Typography variant="body2" color={
                                patient.status === 'Critical' ? 'error' :
                                  patient.status === 'Under Observation' ? 'warning.main' :
                                    'success.main'
                              }>
                                {patient.status}
                              </Typography>
                            </Box>
                          </ListItem>
                          {index < recentPatients.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </Paper>

                {/* Quick Actions */}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Quick Actions
                        </Typography>
                        <Box mt={2}>
                          <Button
                            variant="outlined"
                            fullWidth
                            sx={{ mb: 1, justifyContent: 'flex-start' }}
                            onClick={handleOpenPrescriptionDialog}
                          >
                            Write Prescription
                          </Button>
                          <Button
                            variant="outlined"
                            fullWidth
                            sx={{ mb: 1, justifyContent: 'flex-start' }}
                            onClick={() => navigate('/dashboard/appointments')}
                          >
                            Schedule Appointment
                          </Button>
                          <Button
                            variant="outlined"
                            fullWidth
                            sx={{ justifyContent: 'flex-start' }}
                            onClick={() => navigate('/dashboard/reports')}
                          >
                            View Lab Results
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Today's Schedule
                        </Typography>
                        <List>
                          <ListItem>
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                09:00 AM
                              </Typography>
                              <Typography variant="body2">
                                John Doe - Follow-up
                              </Typography>
                            </Box>
                          </ListItem>
                          <Divider />
                          <ListItem>
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                11:30 AM
                              </Typography>
                              <Typography variant="body2">
                                Jane Smith - Initial Consultation
                              </Typography>
                            </Box>
                          </ListItem>
                          <Divider />
                          <ListItem>
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                03:15 PM
                              </Typography>
                              <Typography variant="body2">
                                Team Meeting
                              </Typography>
                            </Box>
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </>
            ) : (
              <Box sx={{ width: '100%' }}>
                <Outlet />
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Prescription Dialog */}
      <Dialog
        open={prescriptionDialogOpen}
        onClose={handleClosePrescriptionDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Write Prescription</DialogTitle>
        <DialogContent>
          {prescriptionError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {prescriptionError}
            </Alert>
          )}
          {prescriptionSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {prescriptionSuccess}
            </Alert>
          )}

          <TextField
            select
            fullWidth
            label="Select Patient"
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            margin="normal"
            required
          >
            <MenuItem value="">Select a patient...</MenuItem>
            {patients.map((patient) => (
              <MenuItem key={patient.id} value={patient.id}>
                {patient.name} - {patient.email}
              </MenuItem>
            ))}
          </TextField>

          {selectedPatientId && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Patient:</strong> {patients.find(p => p.id === selectedPatientId)?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Current Medications:</strong>
              </Typography>
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                {(patients.find(p => p.id === selectedPatientId)?.current_medications || []).length > 0 ? (
                  patients.find(p => p.id === selectedPatientId)?.current_medications.map((med, idx) => (
                    <li key={idx}>
                      <Typography variant="body2">{med}</Typography>
                    </li>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">No current medications</Typography>
                )}
              </Box>
            </Box>
          )}

          <TextField
            fullWidth
            label="Medication"
            value={medication}
            onChange={(e) => setMedication(e.target.value)}
            margin="normal"
            placeholder="e.g., Metformin 500mg - Take twice daily"
            required
            multiline
            rows={2}
            helperText="Enter medication name, dosage, and instructions"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClosePrescriptionDialog}>Cancel</Button>
          <Button
            onClick={handlePrescribe}
            variant="contained"
            disabled={!selectedPatientId || !medication.trim()}
          >
            Add Prescription
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DoctorDashboard;
