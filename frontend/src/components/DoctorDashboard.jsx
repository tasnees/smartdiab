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
  Tooltip
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
import { authAPI } from '../services/api';

const DoctorDashboard = () => {
  const [doctorData, setDoctorData] = useState(null);
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
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

        // In a real app, you would fetch the doctor's data from your API
        // For now, we'll use mock data
        setDoctorData({
          name: localStorage.getItem('userName') || 'Dr. Smith',
          specialty: 'Endocrinologist',
          patientsCount: 42,
          yearsOfExperience: 8,
          email: 'dr.smith@example.com'
        });

        // Mock recent patients data
        setRecentPatients([
          { id: 1, name: 'John Doe', lastVisit: '2023-11-10', status: 'Stable', nextAppointment: '2023-11-20' },
          { id: 2, name: 'Jane Smith', lastVisit: '2023-11-09', status: 'Improving', nextAppointment: '2023-11-18' },
          { id: 3, name: 'Robert Johnson', lastVisit: '2023-11-08', status: 'Critical', nextAppointment: '2023-11-15' },
        ]);

      } catch (error) {
        console.error('Error fetching doctor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userBadgeId');
    navigate('/login');
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
                  <strong>Experience:</strong> {doctorData?.yearsOfExperience || 0} years
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Next Appointment:</strong> Today, 2:30 PM
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
                    Welcome back, Dr. {doctorData?.name?.split(' ')[1] || ''}!
                  </Typography>
                  <Typography variant="body1">
                    You have 3 appointments today and 5 pending tasks.
                  </Typography>
                </Paper>
                
                {/* Recent Patients */}
                <Paper sx={{ p: 3, mb: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Patients</Typography>
                <Button color="primary" onClick={() => navigate('/patients')}>
                  View All
                </Button>
              </Box>
              
              <List>
                {recentPatients.map((patient, index) => (
                  <React.Fragment key={patient.id}>
                    <ListItem 
                      button 
                      sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                      onClick={() => navigate(`/patient/${patient.id}`)}
                    >
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        {patient.name.charAt(0)}
                      </Avatar>
                      <ListItemText 
                        primary={patient.name} 
                        secondary={`Last visit: ${patient.lastVisit} • Status: ${patient.status}`} 
                      />
                      <Box textAlign="right">
                        <Typography variant="caption" display="block" color="textSecondary">
                          Next Appointment
                        </Typography>
                        <Typography variant="body2">
                          {patient.nextAppointment}
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < recentPatients.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
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
                        onClick={() => navigate('/new-prescription')}
                      >
                        Write Prescription
                      </Button>
                      <Button 
                        variant="outlined" 
                        fullWidth 
                        sx={{ mb: 1, justifyContent: 'flex-start' }}
                        onClick={() => navigate('/schedule-appointment')}
                      >
                        Schedule Appointment
                      </Button>
                      <Button 
                        variant="outlined" 
                        fullWidth 
                        sx={{ justifyContent: 'flex-start' }}
                        onClick={() => navigate('/lab-results')}
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
    </Box>
  );
};

export default DoctorDashboard;
