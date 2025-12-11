import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
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
    Chip,
    CircularProgress,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { patientService } from '../services/api';

const Patients = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        age: '',
        gender: '',
        address: ''
    });

    // Load patients on component mount
    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await patientService.listPatients();
            setPatients(data);
        } catch (err) {
            console.error('Error loading patients:', err);
            setError('Failed to load patients. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (patient = null) => {
        if (patient) {
            setSelectedPatient(patient);
            setFormData({
                name: patient.name || '',
                email: patient.email || '',
                phone: patient.phone || '',
                age: patient.age || '',
                gender: patient.gender || '',
                address: patient.address || ''
            });
        } else {
            setSelectedPatient(null);
            setFormData({
                name: '',
                email: '',
                phone: '',
                age: '',
                gender: '',
                address: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedPatient(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            age: '',
            gender: '',
            address: ''
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');

            if (selectedPatient) {
                // Update existing patient
                await patientService.updatePatient(selectedPatient.id, formData);
            } else {
                // Create new patient
                await patientService.createPatient(formData);
            }

            handleCloseDialog();
            loadPatients();
        } catch (err) {
            console.error('Error saving patient:', err);
            setError(err.message || 'Failed to save patient. Please try again.');
        }
    };

    const handleDelete = async (patientId) => {
        if (window.confirm('Are you sure you want to delete this patient?')) {
            try {
                await patientService.deletePatient(patientId);
                loadPatients();
            } catch (err) {
                console.error('Error deleting patient:', err);
                setError('Failed to delete patient. Please try again.');
            }
        }
    };

    const handleViewPatient = (patient) => {
        navigate(`/dashboard/patients/${patient.id}`);
    };

    const handlePredictForPatient = (patient) => {
        navigate('/dashboard/diabetes-prediction', { state: { patient } });
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Patients
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ borderRadius: 2 }}
                >
                    Add New Patient
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : patients.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                    <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No patients yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Add your first patient to get started
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        Add Patient
                    </Button>
                </Paper>
            ) : (
                <TableContainer component={Paper} elevation={2}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Phone</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Age</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Gender</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {patients.map((patient) => (
                                <TableRow
                                    key={patient.id}
                                    sx={{
                                        '&:hover': { backgroundColor: 'action.hover' },
                                        cursor: 'pointer'
                                    }}
                                >
                                    <TableCell onClick={() => handleViewPatient(patient)}>
                                        <Typography variant="body1" fontWeight="medium">
                                            {patient.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell onClick={() => handleViewPatient(patient)}>
                                        {patient.email || '-'}
                                    </TableCell>
                                    <TableCell onClick={() => handleViewPatient(patient)}>
                                        {patient.phone || '-'}
                                    </TableCell>
                                    <TableCell onClick={() => handleViewPatient(patient)}>
                                        {patient.age || '-'}
                                    </TableCell>
                                    <TableCell onClick={() => handleViewPatient(patient)}>
                                        {patient.gender ? (
                                            <Chip
                                                label={patient.gender}
                                                size="small"
                                                color={patient.gender === 'Male' ? 'primary' : 'secondary'}
                                            />
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="View Details">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleViewPatient(patient)}
                                                color="primary"
                                            >
                                                <ViewIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Make Prediction">
                                            <IconButton
                                                size="small"
                                                onClick={() => handlePredictForPatient(patient)}
                                                color="success"
                                            >
                                                <AddIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Edit">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenDialog(patient)}
                                                color="info"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(patient.id)}
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Add/Edit Patient Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {selectedPatient ? 'Edit Patient' : 'Add New Patient'}
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Full Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    autoFocus
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Age"
                                    name="age"
                                    type="number"
                                    value={formData.age}
                                    onChange={handleChange}
                                    inputProps={{ min: 0, max: 120 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Gender"
                                    name="gender"
                                    select
                                    value={formData.gender}
                                    onChange={handleChange}
                                    SelectProps={{ native: true }}
                                >
                                    <option value="">Select...</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={handleCloseDialog}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained">
                            {selectedPatient ? 'Update' : 'Add'} Patient
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default Patients;
