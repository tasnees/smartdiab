
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, 
  TableRow, Paper, IconButton, TextField, 
  Dialog, DialogTitle, DialogContent, 
  DialogActions, DialogContentText 
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import api from '../services/api';

// Alias for easier access
const patientService = api.patients;

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        console.log('Fetching patients...');
        const response = await patientService.listPatients();
        console.log('Patients response:', response);
        const patientsData = response.data || response;
        setPatients(Array.isArray(patientsData) ? patientsData : []);
      } catch (error) {
        console.error('Error fetching patients:', error);
        if (error.response?.status === 401) {
          // Handle unauthorized (token expired)
          localStorage.removeItem('authToken');
          // Optionally redirect to login
          // navigate('/login');
        }
        // Set empty array to prevent UI errors
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const handleCreatePatient = async () => {
    try {
      console.log('Creating patient:', newPatient);
      const response = await patientService.createPatient(newPatient);
      console.log('Create patient response:', response);
      
      // Refresh patient list
      const listResponse = await patientService.listPatients();
      console.log('Refreshed patients list:', listResponse);
      
      // Handle both response formats: direct array or { data: [...] }
      const patientsData = Array.isArray(listResponse) ? listResponse : 
                         (listResponse.data || []);
      
      setPatients(patientsData);
      setOpenDialog(false);
      setNewPatient({ name: '', email: '', phone: '', dateOfBirth: '' });
    } catch (error) {
      console.error('Error creating patient:', error);
      // You might want to show an error message to the user here
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Patient Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Patient
        </Button>
      </Box>

      <TextField
        fullWidth
        margin="normal"
        variant="outlined"
        placeholder="Search patients..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
        }}
        sx={{ mb: 3 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Date of Birth</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPatients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell>{patient.name}</TableCell>
                <TableCell>{patient.email}</TableCell>
                <TableCell>{patient.phone}</TableCell>
                <TableCell>
                  {new Date(patient.dateOfBirth).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => navigate(`/patient/${patient.id}`)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add New Patient</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Full Name"
            fullWidth
            value={newPatient.name}
            onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={newPatient.email}
            onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Phone"
            fullWidth
            value={newPatient.phone}
            onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Date of Birth"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={newPatient.dateOfBirth}
            onChange={(e) => setNewPatient({...newPatient, dateOfBirth: e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreatePatient} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientManagement;