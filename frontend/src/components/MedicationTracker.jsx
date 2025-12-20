import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    TextField,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Alert,
    CircularProgress,
    IconButton,
    Tooltip,
    LinearProgress,
    Switch,
    FormControlLabel
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { medicationService } from '../services/enhancedApi';

const MedicationTracker = ({ patientId }) => {
    const [medications, setMedications] = useState([]);
    const [adherenceStats, setAdherenceStats] = useState(null);
    const [interactions, setInteractions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Dialog states
    const [medicationDialogOpen, setMedicationDialogOpen] = useState(false);
    const [editingMedication, setEditingMedication] = useState(null);

    // Form state
    const [medicationForm, setMedicationForm] = useState({
        medication_name: '',
        dosage: '',
        frequency: 'once_daily',
        route: 'oral',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: '',
        instructions: '',
        purpose: '',
        active: true
    });

    useEffect(() => {
        if (patientId) {
            loadData();
        }
    }, [patientId]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            // Load medications
            const medsData = await medicationService.getPatientMedications(patientId, true);
            setMedications(medsData);

            // Load adherence statistics
            const stats = await medicationService.getAdherenceStatistics(patientId, 30);
            setAdherenceStats(stats);

            // Check for interactions
            const interactionsData = await medicationService.checkInteractions(patientId);
            setInteractions(interactionsData);

        } catch (err) {
            setError(err.message || 'Failed to load medication data');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (medication = null) => {
        if (medication) {
            setEditingMedication(medication);
            setMedicationForm({
                medication_name: medication.medication_name,
                dosage: medication.dosage,
                frequency: medication.frequency,
                route: medication.route,
                start_date: new Date(medication.start_date).toISOString().slice(0, 10),
                end_date: medication.end_date ? new Date(medication.end_date).toISOString().slice(0, 10) : '',
                instructions: medication.instructions || '',
                purpose: medication.purpose || '',
                active: medication.active
            });
        } else {
            setEditingMedication(null);
            setMedicationForm({
                medication_name: '',
                dosage: '',
                frequency: 'once_daily',
                route: 'oral',
                start_date: new Date().toISOString().slice(0, 10),
                end_date: '',
                instructions: '',
                purpose: '',
                active: true
            });
        }
        setMedicationDialogOpen(true);
    };

    const handleSaveMedication = async () => {
        try {
            setError('');
            setSuccess('');

            const medicationData = {
                patient_id: patientId,
                prescribing_doctor: localStorage.getItem('userBadgeId') || 'doctor',
                ...medicationForm,
                start_date: new Date(medicationForm.start_date).toISOString(),
                end_date: medicationForm.end_date ? new Date(medicationForm.end_date).toISOString() : null
            };

            if (editingMedication) {
                await medicationService.updateMedication(editingMedication.id, medicationData);
                setSuccess('Medication updated successfully');
            } else {
                await medicationService.createMedication(medicationData);
                setSuccess('Medication added successfully');
            }

            setMedicationDialogOpen(false);
            loadData();
        } catch (err) {
            setError(err.message || 'Failed to save medication');
        }
    };

    const handleDeleteMedication = async (medicationId) => {
        if (!window.confirm('Are you sure you want to discontinue this medication?')) return;

        try {
            await medicationService.deleteMedication(medicationId);
            setSuccess('Medication discontinued successfully');
            loadData();
        } catch (err) {
            setError(err.message || 'Failed to discontinue medication');
        }
    };

    const getFrequencyLabel = (frequency) => {
        const labels = {
            'once_daily': 'Once Daily',
            'twice_daily': 'Twice Daily',
            'three_times_daily': '3x Daily',
            'four_times_daily': '4x Daily',
            'as_needed': 'As Needed',
            'weekly': 'Weekly',
            'monthly': 'Monthly'
        };
        return labels[frequency] || frequency;
    };

    const getAdherenceColor = (rate) => {
        if (rate >= 80) return 'success';
        if (rate >= 50) return 'warning';
        return 'error';
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>Active Medications</Typography>
                            <Typography variant="h4">{medications.length}</Typography>
                            <Typography variant="body2" color="textSecondary">
                                Currently prescribed
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>Adherence Rate</Typography>
                            <Typography variant="h4" color={getAdherenceColor(adherenceStats?.adherence_rate || 0)}>
                                {adherenceStats?.adherence_rate || 0}%
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={adherenceStats?.adherence_rate || 0}
                                color={getAdherenceColor(adherenceStats?.adherence_rate || 0)}
                                sx={{ mt: 1 }}
                            />
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                Last 30 days
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>Doses Taken</Typography>
                            <Typography variant="h4">
                                {adherenceStats?.total_taken || 0}/{adherenceStats?.total_scheduled || 0}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {adherenceStats?.total_missed || 0} missed doses
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Interaction Warnings */}
            {interactions && interactions.warnings && interactions.warnings.length > 0 && (
                <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
                    <Typography variant="subtitle2" gutterBottom>Drug Interaction Warnings:</Typography>
                    {interactions.warnings.map((warning, index) => (
                        <Typography key={index} variant="body2">
                            • {warning.message}
                        </Typography>
                    ))}
                </Alert>
            )}

            {/* Medications List */}
            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">Current Medications</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog()}
                        >
                            Add Medication
                        </Button>
                    </Box>

                    {medications.length === 0 ? (
                        <Box textAlign="center" py={4}>
                            <Typography color="textSecondary">
                                No medications prescribed yet.
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpenDialog()}
                                sx={{ mt: 2 }}
                            >
                                Add First Medication
                            </Button>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Medication</TableCell>
                                        <TableCell>Dosage</TableCell>
                                        <TableCell>Frequency</TableCell>
                                        <TableCell>Route</TableCell>
                                        <TableCell>Purpose</TableCell>
                                        <TableCell>Start Date</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {medications.map((medication) => (
                                        <TableRow key={medication.id}>
                                            <TableCell>
                                                <Typography fontWeight="bold">{medication.medication_name}</Typography>
                                            </TableCell>
                                            <TableCell>{medication.dosage}</TableCell>
                                            <TableCell>
                                                <Chip label={getFrequencyLabel(medication.frequency)} size="small" />
                                            </TableCell>
                                            <TableCell>{medication.route}</TableCell>
                                            <TableCell>{medication.purpose || '-'}</TableCell>
                                            <TableCell>
                                                {new Date(medication.start_date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={medication.active ? 'Active' : 'Discontinued'}
                                                    color={medication.active ? 'success' : 'default'}
                                                    size="small"
                                                    icon={medication.active ? <CheckIcon /> : <CancelIcon />}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title="Edit">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleOpenDialog(medication)}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Discontinue">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDeleteMedication(medication.id)}
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
                </CardContent>
            </Card>

            {/* Add/Edit Medication Dialog */}
            <Dialog open={medicationDialogOpen} onClose={() => setMedicationDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>{editingMedication ? 'Edit Medication' : 'Add Medication'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Medication Name"
                                value={medicationForm.medication_name}
                                onChange={(e) => setMedicationForm({ ...medicationForm, medication_name: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Dosage"
                                value={medicationForm.dosage}
                                onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
                                placeholder="e.g., 500mg"
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                select
                                fullWidth
                                label="Frequency"
                                value={medicationForm.frequency}
                                onChange={(e) => setMedicationForm({ ...medicationForm, frequency: e.target.value })}
                            >
                                <MenuItem value="once_daily">Once Daily</MenuItem>
                                <MenuItem value="twice_daily">Twice Daily</MenuItem>
                                <MenuItem value="three_times_daily">Three Times Daily</MenuItem>
                                <MenuItem value="four_times_daily">Four Times Daily</MenuItem>
                                <MenuItem value="as_needed">As Needed</MenuItem>
                                <MenuItem value="weekly">Weekly</MenuItem>
                                <MenuItem value="monthly">Monthly</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                select
                                fullWidth
                                label="Route"
                                value={medicationForm.route}
                                onChange={(e) => setMedicationForm({ ...medicationForm, route: e.target.value })}
                            >
                                <MenuItem value="oral">Oral</MenuItem>
                                <MenuItem value="injection">Injection</MenuItem>
                                <MenuItem value="topical">Topical</MenuItem>
                                <MenuItem value="inhalation">Inhalation</MenuItem>
                                <MenuItem value="other">Other</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Start Date"
                                value={medicationForm.start_date}
                                onChange={(e) => setMedicationForm({ ...medicationForm, start_date: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="date"
                                label="End Date (Optional)"
                                value={medicationForm.end_date}
                                onChange={(e) => setMedicationForm({ ...medicationForm, end_date: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Purpose"
                                value={medicationForm.purpose}
                                onChange={(e) => setMedicationForm({ ...medicationForm, purpose: e.target.value })}
                                placeholder="e.g., Blood sugar control"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Instructions"
                                value={medicationForm.instructions}
                                onChange={(e) => setMedicationForm({ ...medicationForm, instructions: e.target.value })}
                                placeholder="e.g., Take with food, twice daily"
                            />
                        </Grid>
                        {editingMedication && (
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={medicationForm.active}
                                            onChange={(e) => setMedicationForm({ ...medicationForm, active: e.target.checked })}
                                        />
                                    }
                                    label="Active"
                                />
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMedicationDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleSaveMedication}
                        variant="contained"
                        disabled={!medicationForm.medication_name || !medicationForm.dosage}
                    >
                        {editingMedication ? 'Update' : 'Add'} Medication
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MedicationTracker;
