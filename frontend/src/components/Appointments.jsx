import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    IconButton,
    Paper,
    TextField,
    Typography,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    MenuItem
} from '@mui/material';
import {
    Add as AddIcon,
    Event as EventIcon,
    Person as PersonIcon,
    AccessTime as TimeIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Appointments = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [formData, setFormData] = useState({
        patient_id: '',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '09:00',
        duration: 30,
        reason: '',
        notes: ''
    });

    useEffect(() => {
        loadAppointments();
        loadPatients();
    }, [selectedDate]);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('authToken');
            const response = await axios.get(`${API_URL}/api/appointments/`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { date: selectedDate }
            });

            setAppointments(response.data);
        } catch (err) {
            console.error('Error loading appointments:', err);
            setError('Failed to load appointments. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadPatients = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`${API_URL}/api/patients/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPatients(response.data);
        } catch (err) {
            console.error('Error loading patients:', err);
        }
    };

    const handleOpenDialog = () => {
        setFormData({
            patient_id: '',
            appointment_date: selectedDate,
            appointment_time: '09:00',
            duration: 30,
            reason: '',
            notes: ''
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
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

            const token = localStorage.getItem('authToken');
            await axios.post(`${API_URL}/api/appointments/`, {
                ...formData,
                appointment_date: `${formData.appointment_date}T00:00:00`,
                doctor_id: 'current'  // Will be set by backend
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            handleCloseDialog();
            loadAppointments();
        } catch (err) {
            console.error('Error creating appointment:', err);
            setError(err.response?.data?.detail || 'Failed to create appointment. Please try again.');
        }
    };

    const handleStatusChange = async (appointmentId, newStatus) => {
        try {
            const token = localStorage.getItem('authToken');
            await axios.put(`${API_URL}/api/appointments/${appointmentId}`, {
                status: newStatus
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            loadAppointments();
        } catch (err) {
            console.error('Error updating appointment:', err);
            setError('Failed to update appointment status.');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'Scheduled': 'primary',
            'Completed': 'success',
            'Cancelled': 'error',
            'No-Show': 'warning'
        };
        return colors[status] || 'default';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Completed':
                return <CheckIcon />;
            case 'Cancelled':
            case 'No-Show':
                return <CancelIcon />;
            default:
                return <ScheduleIcon />;
        }
    };

    const formatTime = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getTodayStats = () => {
        const total = appointments.length;
        const completed = appointments.filter(a => a.status === 'Completed').length;
        const scheduled = appointments.filter(a => a.status === 'Scheduled').length;
        const cancelled = appointments.filter(a => a.status === 'Cancelled' || a.status === 'No-Show').length;

        return { total, completed, scheduled, cancelled };
    };

    const stats = getTodayStats();

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Appointments
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage your daily schedule
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenDialog}
                    sx={{ borderRadius: 2 }}
                >
                    New Appointment
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Date Selector & Stats */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={8}>
                    <TextField
                        type="date"
                        label="Select Date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card elevation={2}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Today's Summary
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Total</Typography>
                                    <Typography variant="h5">{stats.total}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Completed</Typography>
                                    <Typography variant="h5" color="success.main">{stats.completed}</Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Appointments List */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : appointments.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                    <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No appointments scheduled
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Add your first appointment for {new Date(selectedDate).toLocaleDateString()}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenDialog}
                    >
                        Schedule Appointment
                    </Button>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {appointments.map((appointment) => (
                        <Grid item xs={12} key={appointment.id}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} sm={2}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <TimeIcon color="primary" />
                                                <Typography variant="h6">
                                                    {formatTime(appointment.appointment_time)}
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {appointment.duration} minutes
                                            </Typography>
                                        </Grid>

                                        <Grid item xs={12} sm={3}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <PersonIcon color="action" />
                                                <Box>
                                                    <Typography variant="body1" fontWeight="medium">
                                                        {appointment.patient_name}
                                                    </Typography>
                                                    {appointment.patient_age && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Age: {appointment.patient_age}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Grid>

                                        <Grid item xs={12} sm={3}>
                                            <Typography variant="body2" color="text.secondary">
                                                Reason
                                            </Typography>
                                            <Typography variant="body1">
                                                {appointment.reason}
                                            </Typography>
                                        </Grid>

                                        <Grid item xs={12} sm={2}>
                                            <Chip
                                                label={appointment.status}
                                                color={getStatusColor(appointment.status)}
                                                icon={getStatusIcon(appointment.status)}
                                                size="small"
                                            />
                                        </Grid>

                                        <Grid item xs={12} sm={2}>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                {appointment.status === 'Scheduled' && (
                                                    <>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="success"
                                                            onClick={() => handleStatusChange(appointment.id, 'Completed')}
                                                        >
                                                            Complete
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="error"
                                                            onClick={() => handleStatusChange(appointment.id, 'Cancelled')}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </>
                                                )}
                                                <Button
                                                    size="small"
                                                    variant="text"
                                                    onClick={() => navigate(`/dashboard/patients/${appointment.patient_id}`)}
                                                >
                                                    View Patient
                                                </Button>
                                            </Box>
                                        </Grid>
                                    </Grid>

                                    {appointment.notes && (
                                        <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Notes:
                                            </Typography>
                                            <Typography variant="body2">
                                                {appointment.notes}
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Add Appointment Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EventIcon color="primary" />
                        Schedule New Appointment
                    </Box>
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Patient"
                                    name="patient_id"
                                    value={formData.patient_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <MenuItem value="">Select a patient...</MenuItem>
                                    {patients.map((patient) => (
                                        <MenuItem key={patient.id} value={patient.id}>
                                            {patient.name} - {patient.email}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Date"
                                    name="appointment_date"
                                    value={formData.appointment_date}
                                    onChange={handleChange}
                                    required
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="time"
                                    label="Time"
                                    name="appointment_time"
                                    value={formData.appointment_time}
                                    onChange={handleChange}
                                    required
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Duration"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleChange}
                                    SelectProps={{ native: true }}
                                >
                                    <option value={15}>15 minutes</option>
                                    <option value={30}>30 minutes</option>
                                    <option value={45}>45 minutes</option>
                                    <option value={60}>1 hour</option>
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Reason for Visit"
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., Diabetes checkup, Follow-up consultation"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Notes"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    multiline
                                    rows={2}
                                    placeholder="Additional notes..."
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={handleCloseDialog}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained">
                            Schedule Appointment
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default Appointments;
