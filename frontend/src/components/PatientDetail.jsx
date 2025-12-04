// frontend/src/components/PatientDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Paper, Grid, Button, 
  Tabs, Tab, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { patientService } from '../services/patientService';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch patient details
        const patientData = await patientService.getPatient(id);
        setPatient(patientData);
        
        // Fetch patient's predictions
        const preds = await patientService.getPatientPredictions(id);
        setPredictions(preds);
      } catch (error) {
        console.error('Error fetching patient data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!patient) {
    return <div>Patient not found</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">
          {patient.name}'s Medical Record
        </Typography>
      </Box>

      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="Overview" />
        <Tab label="Diabetes Predictions" />
        <Tab label="Appointments" />
        <Tab label="Documents" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Typography><strong>Name:</strong> {patient.name}</Typography>
              <Typography><strong>Email:</strong> {patient.email}</Typography>
              <Typography><strong>Phone:</strong> {patient.phone}</Typography>
              <Typography>
                <strong>Date of Birth:</strong> {new Date(patient.dateOfBirth).toLocaleDateString()}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Medical Information
              </Typography>
              {/* Add medical information fields here */}
              <Button 
                variant="outlined" 
                onClick={() => navigate(`/dashboard/diabetes-prediction?patientId=${id}`)}
                sx={{ mt: 2 }}
              >
                New Diabetes Assessment
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Diabetes Risk Assessments</Typography>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Risk Level</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {predictions.map((pred) => (
                  <TableRow key={pred.id}>
                    <TableCell>
                      {new Date(pred.timestamp).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span style={{ 
                        color: pred.prediction === 1 ? 'red' : 'green',
                        fontWeight: 'bold'
                      }}>
                        {pred.prediction === 1 ? 'High Risk' : 'Low Risk'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {(pred.confidence * 100).toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        onClick={() => navigate(`/dashboard/diabetes-prediction?predictionId=${pred.id}`)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default PatientDetail;