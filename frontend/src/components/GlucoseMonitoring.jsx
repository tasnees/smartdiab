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
    Paper,
    Chip,
    Alert,
    CircularProgress,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    ShowChart as ChartIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip as ChartTooltip,
    Legend,
    Filler
} from 'chart.js';
import { glucoseService } from '../services/enhancedApi';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    ChartTooltip,
    Legend,
    Filler
);

const GlucoseMonitoring = ({ patientId }) => {
    const [readings, setReadings] = useState([]);
    const [hba1cReadings, setHba1cReadings] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [hba1cTrend, setHba1cTrend] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Dialog states
    const [glucoseDialogOpen, setGlucoseDialogOpen] = useState(false);
    const [hba1cDialogOpen, setHba1cDialogOpen] = useState(false);

    // Form states
    const [glucoseForm, setGlucoseForm] = useState({
        reading_type: 'fasting',
        glucose_value: '',
        reading_datetime: new Date().toISOString().slice(0, 16),
        notes: '',
        meal_context: '',
        symptoms: []
    });

    const [hba1cForm, setHba1cForm] = useState({
        hba1c_value: '',
        test_date: new Date().toISOString().slice(0, 10),
        lab_name: '',
        notes: ''
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

            // Load glucose readings (last 30 days)
            const readingsData = await glucoseService.getPatientReadings(patientId, {
                start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
            });
            setReadings(readingsData);

            // Load HbA1c readings
            const hba1cData = await glucoseService.getPatientHbA1c(patientId);
            setHba1cReadings(hba1cData);

            // Load statistics
            const stats = await glucoseService.getStatistics(patientId, 30);
            setStatistics(stats);

            // Load HbA1c trend
            const trend = await glucoseService.getHbA1cTrend(patientId);
            setHba1cTrend(trend);

        } catch (err) {
            setError(err.message || 'Failed to load glucose data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddGlucoseReading = async () => {
        try {
            setError('');
            setSuccess('');

            await glucoseService.createReading({
                patient_id: patientId,
                ...glucoseForm,
                glucose_value: parseFloat(glucoseForm.glucose_value),
                reading_datetime: new Date(glucoseForm.reading_datetime).toISOString()
            });

            setSuccess('Glucose reading added successfully');
            setGlucoseDialogOpen(false);
            setGlucoseForm({
                reading_type: 'fasting',
                glucose_value: '',
                reading_datetime: new Date().toISOString().slice(0, 16),
                notes: '',
                meal_context: '',
                symptoms: []
            });
            loadData();
        } catch (err) {
            setError(err.message || 'Failed to add glucose reading');
        }
    };

    const handleAddHbA1c = async () => {
        try {
            setError('');
            setSuccess('');

            await glucoseService.createHbA1c({
                patient_id: patientId,
                ...hba1cForm,
                hba1c_value: parseFloat(hba1cForm.hba1c_value),
                test_date: new Date(hba1cForm.test_date).toISOString()
            });

            setSuccess('HbA1c reading added successfully');
            setHba1cDialogOpen(false);
            setHba1cForm({
                hba1c_value: '',
                test_date: new Date().toISOString().slice(0, 10),
                lab_name: '',
                notes: ''
            });
            loadData();
        } catch (err) {
            setError(err.message || 'Failed to add HbA1c reading');
        }
    };

    const handleDeleteReading = async (readingId) => {
        if (!window.confirm('Are you sure you want to delete this reading?')) return;

        try {
            await glucoseService.deleteReading(readingId);
            setSuccess('Reading deleted successfully');
            loadData();
        } catch (err) {
            setError(err.message || 'Failed to delete reading');
        }
    };

    const getGlucoseColor = (value) => {
        if (value < 70) return 'error';
        if (value > 180) return 'warning';
        return 'success';
    };

    const getHbA1cColor = (value) => {
        if (value < 7) return 'success';
        if (value < 8) return 'warning';
        return 'error';
    };

    // Prepare chart data
    const chartData = {
        labels: readings.map(r => new Date(r.reading_datetime).toLocaleDateString()),
        datasets: [
            {
                label: 'Glucose Level (mg/dL)',
                data: readings.map(r => r.glucose_value),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Target Range (70-180)',
                data: readings.map(() => 125),
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Glucose Readings - Last 30 Days'
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                min: 50,
                max: 300
            }
        }
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
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>Average Glucose</Typography>
                            <Typography variant="h4">{statistics?.average || 0} mg/dL</Typography>
                            <Typography variant="body2" color="textSecondary">
                                Last 30 days
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>Time in Range</Typography>
                            <Typography variant="h4" color="success.main">
                                {statistics?.time_in_range || 0}%
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                70-180 mg/dL
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>Latest HbA1c</Typography>
                            <Typography variant="h4" color={getHbA1cColor(hba1cTrend?.latest_value || 0)}>
                                {hba1cTrend?.latest_value || 'N/A'}%
                            </Typography>
                            {hba1cTrend?.trend && (
                                <Chip
                                    label={hba1cTrend.trend}
                                    size="small"
                                    color={hba1cTrend.trend === 'improving' ? 'success' : hba1cTrend.trend === 'worsening' ? 'error' : 'default'}
                                    icon={hba1cTrend.trend === 'improving' ? <TrendingDownIcon /> : <TrendingUpIcon />}
                                />
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>Total Readings</Typography>
                            <Typography variant="h4">{statistics?.total_readings || 0}</Typography>
                            <Typography variant="body2" color="textSecondary">
                                Last 30 days
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Chart */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">Glucose Trend</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setGlucoseDialogOpen(true)}
                        >
                            Add Reading
                        </Button>
                    </Box>
                    {readings.length > 0 ? (
                        <Line data={chartData} options={chartOptions} />
                    ) : (
                        <Typography color="textSecondary" align="center" py={4}>
                            No glucose readings yet. Add your first reading to see the trend.
                        </Typography>
                    )}
                </CardContent>
            </Card>

            {/* Glucose Readings Table */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Recent Readings</Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date & Time</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Value (mg/dL)</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Notes</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {readings.slice(0, 10).map((reading) => (
                                    <TableRow key={reading.id}>
                                        <TableCell>
                                            {new Date(reading.reading_datetime).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={reading.reading_type} size="small" />
                                        </TableCell>
                                        <TableCell>
                                            <Typography color={`${getGlucoseColor(reading.glucose_value)}.main`} fontWeight="bold">
                                                {reading.glucose_value}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={
                                                    reading.glucose_value < 70 ? 'Low' :
                                                        reading.glucose_value > 180 ? 'High' : 'Normal'
                                                }
                                                color={getGlucoseColor(reading.glucose_value)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{reading.notes || '-'}</TableCell>
                                        <TableCell>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteReading(reading.id)}
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
                </CardContent>
            </Card>

            {/* HbA1c Section */}
            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">HbA1c History</Typography>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => setHba1cDialogOpen(true)}
                        >
                            Add HbA1c
                        </Button>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Test Date</TableCell>
                                    <TableCell>HbA1c (%)</TableCell>
                                    <TableCell>Lab</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Notes</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {hba1cReadings.map((reading) => (
                                    <TableRow key={reading.id}>
                                        <TableCell>{new Date(reading.test_date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Typography color={`${getHbA1cColor(reading.hba1c_value)}.main`} fontWeight="bold">
                                                {reading.hba1c_value}%
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{reading.lab_name || '-'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={
                                                    reading.hba1c_value < 7 ? 'At Goal' :
                                                        reading.hba1c_value < 8 ? 'Above Goal' : 'High'
                                                }
                                                color={getHbA1cColor(reading.hba1c_value)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{reading.notes || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Add Glucose Reading Dialog */}
            <Dialog open={glucoseDialogOpen} onClose={() => setGlucoseDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Glucose Reading</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                select
                                fullWidth
                                label="Reading Type"
                                value={glucoseForm.reading_type}
                                onChange={(e) => setGlucoseForm({ ...glucoseForm, reading_type: e.target.value })}
                            >
                                <MenuItem value="fasting">Fasting</MenuItem>
                                <MenuItem value="pre_meal">Pre-Meal</MenuItem>
                                <MenuItem value="post_meal">Post-Meal</MenuItem>
                                <MenuItem value="bedtime">Bedtime</MenuItem>
                                <MenuItem value="random">Random</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Glucose Value (mg/dL)"
                                value={glucoseForm.glucose_value}
                                onChange={(e) => setGlucoseForm({ ...glucoseForm, glucose_value: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                type="datetime-local"
                                label="Date & Time"
                                value={glucoseForm.reading_datetime}
                                onChange={(e) => setGlucoseForm({ ...glucoseForm, reading_datetime: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Notes"
                                value={glucoseForm.notes}
                                onChange={(e) => setGlucoseForm({ ...glucoseForm, notes: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setGlucoseDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddGlucoseReading} variant="contained" disabled={!glucoseForm.glucose_value}>
                        Add Reading
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add HbA1c Dialog */}
            <Dialog open={hba1cDialogOpen} onClose={() => setHba1cDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add HbA1c Reading</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                type="number"
                                label="HbA1c Value (%)"
                                value={hba1cForm.hba1c_value}
                                onChange={(e) => setHba1cForm({ ...hba1cForm, hba1c_value: e.target.value })}
                                required
                                inputProps={{ step: 0.1, min: 0, max: 20 }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Test Date"
                                value={hba1cForm.test_date}
                                onChange={(e) => setHba1cForm({ ...hba1cForm, test_date: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Lab Name"
                                value={hba1cForm.lab_name}
                                onChange={(e) => setHba1cForm({ ...hba1cForm, lab_name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Notes"
                                value={hba1cForm.notes}
                                onChange={(e) => setHba1cForm({ ...hba1cForm, notes: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHba1cDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddHbA1c} variant="contained" disabled={!hba1cForm.hba1c_value}>
                        Add HbA1c
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default GlucoseMonitoring;
