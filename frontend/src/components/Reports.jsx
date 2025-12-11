import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    Typography,
    Alert,
    Paper,
    Divider,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    People as PeopleIcon,
    Assessment as AssessmentIcon,
    Event as EventIcon,
    LocalHospital as HospitalIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [timeRange, setTimeRange] = useState('all');
    const [stats, setStats] = useState({
        totalPatients: 0,
        totalPredictions: 0,
        highRiskPatients: 0,
        lowRiskPatients: 0,
        totalAppointments: 0,
        completedAppointments: 0,
        averageAge: 0,
        genderDistribution: { Male: 0, Female: 0, Other: 0 },
        riskTrend: []
    });
    const [recentPredictions, setRecentPredictions] = useState([]);

    useEffect(() => {
        loadReportsData();
    }, [timeRange]);

    const loadReportsData = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('authToken');
            const headers = { Authorization: `Bearer ${token}` };

            // Load all data in parallel
            const [patientsRes, predictionsRes, appointmentsRes] = await Promise.all([
                axios.get(`${API_URL}/api/patients/`, { headers }),
                axios.get(`${API_URL}/api/predictions/`, { headers }).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/api/appointments/`, { headers }).catch(() => ({ data: [] }))
            ]);

            const patients = patientsRes.data || [];
            const predictions = predictionsRes.data || [];
            const appointments = appointmentsRes.data || [];

            // Calculate statistics
            const totalPatients = patients.length;

            // Gender distribution
            const genderDist = patients.reduce((acc, p) => {
                const gender = p.gender || 'Other';
                acc[gender] = (acc[gender] || 0) + 1;
                return acc;
            }, { Male: 0, Female: 0, Other: 0 });

            // Average age
            const agesSum = patients.reduce((sum, p) => sum + (p.age || 0), 0);
            const averageAge = totalPatients > 0 ? Math.round(agesSum / totalPatients) : 0;

            // Predictions analysis
            const highRisk = predictions.filter(p => p.prediction === 1 || p.prediction === true).length;
            const lowRisk = predictions.filter(p => p.prediction === 0 || p.prediction === false).length;

            // Appointments analysis
            const completed = appointments.filter(a => a.status === 'Completed').length;

            // Recent predictions (last 10)
            const recent = predictions
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 10);

            setStats({
                totalPatients,
                totalPredictions: predictions.length,
                highRiskPatients: highRisk,
                lowRiskPatients: lowRisk,
                totalAppointments: appointments.length,
                completedAppointments: completed,
                averageAge,
                genderDistribution: genderDist,
                riskTrend: []
            });

            setRecentPredictions(recent);
        } catch (err) {
            console.error('Error loading reports:', err);
            setError('Failed to load reports data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
        <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h3" component="div" sx={{ color: color || 'primary.main', fontWeight: 'bold' }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            backgroundColor: color ? `${color}15` : 'primary.light',
                            borderRadius: 2,
                            p: 1.5
                        }}
                    >
                        <Icon sx={{ fontSize: 40, color: color || 'primary.main' }} />
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    const getRiskPercentage = () => {
        const total = stats.highRiskPatients + stats.lowRiskPatients;
        if (total === 0) return 0;
        return Math.round((stats.highRiskPatients / total) * 100);
    };

    const getCompletionRate = () => {
        if (stats.totalAppointments === 0) return 0;
        return Math.round((stats.completedAppointments / stats.totalAppointments) * 100);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Reports & Analytics
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Overview of your practice statistics
                    </Typography>
                </Box>
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Time Range</InputLabel>
                    <Select
                        value={timeRange}
                        label="Time Range"
                        onChange={(e) => setTimeRange(e.target.value)}
                    >
                        <MenuItem value="all">All Time</MenuItem>
                        <MenuItem value="month">This Month</MenuItem>
                        <MenuItem value="week">This Week</MenuItem>
                        <MenuItem value="today">Today</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Key Metrics */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Patients"
                        value={stats.totalPatients}
                        icon={PeopleIcon}
                        color="#1976d2"
                        subtitle="Registered patients"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Predictions Made"
                        value={stats.totalPredictions}
                        icon={AssessmentIcon}
                        color="#9c27b0"
                        subtitle="Total assessments"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="High Risk"
                        value={stats.highRiskPatients}
                        icon={WarningIcon}
                        color="#d32f2f"
                        subtitle={`${getRiskPercentage()}% of predictions`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Appointments"
                        value={stats.totalAppointments}
                        icon={EventIcon}
                        color="#2e7d32"
                        subtitle={`${getCompletionRate()}% completed`}
                    />
                </Grid>
            </Grid>

            {/* Detailed Analytics */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Risk Distribution */}
                <Grid item xs={12} md={6}>
                    <Card elevation={3}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom color="primary">
                                Risk Distribution
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Box sx={{ py: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                                        <Typography variant="h2" color="error.main" fontWeight="bold">
                                            {stats.highRiskPatients}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            High Risk
                                        </Typography>
                                        <Chip
                                            label={`${getRiskPercentage()}%`}
                                            color="error"
                                            size="small"
                                            sx={{ mt: 1 }}
                                        />
                                    </Box>
                                    <Divider orientation="vertical" flexItem />
                                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                                        <Typography variant="h2" color="success.main" fontWeight="bold">
                                            {stats.lowRiskPatients}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Low Risk
                                        </Typography>
                                        <Chip
                                            label={`${100 - getRiskPercentage()}%`}
                                            color="success"
                                            size="small"
                                            sx={{ mt: 1 }}
                                        />
                                    </Box>
                                </Box>
                                <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Total Predictions:</strong> {stats.totalPredictions}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Risk Ratio:</strong> {stats.highRiskPatients}:{stats.lowRiskPatients}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Gender Distribution */}
                <Grid item xs={12} md={6}>
                    <Card elevation={3}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom color="primary">
                                Patient Demographics
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Box sx={{ py: 2 }}>
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Average Age
                                    </Typography>
                                    <Typography variant="h2" color="primary.main" fontWeight="bold">
                                        {stats.averageAge} years
                                    </Typography>
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Gender Distribution
                                </Typography>
                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                    <Grid item xs={4}>
                                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                                            <Typography variant="h4" color="primary.main" fontWeight="bold">
                                                {stats.genderDistribution.Male}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Male
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'secondary.light', borderRadius: 1 }}>
                                            <Typography variant="h4" color="secondary.main" fontWeight="bold">
                                                {stats.genderDistribution.Female}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Female
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                                            <Typography variant="h4" fontWeight="bold">
                                                {stats.genderDistribution.Other || 0}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Other
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Recent Predictions */}
            <Card elevation={3}>
                <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                        Recent Predictions
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {recentPredictions.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="body1" color="text.secondary">
                                No predictions yet
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Date</strong></TableCell>
                                        <TableCell><strong>Patient ID</strong></TableCell>
                                        <TableCell><strong>Risk Level</strong></TableCell>
                                        <TableCell><strong>Confidence</strong></TableCell>
                                        <TableCell><strong>BMI</strong></TableCell>
                                        <TableCell><strong>Blood Glucose</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {recentPredictions.map((pred, index) => (
                                        <TableRow key={pred.id || index}>
                                            <TableCell>
                                                {pred.created_at ? new Date(pred.created_at).toLocaleDateString() : 'N/A'}
                                            </TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                                {pred.patient_id?.substring(0, 8)}...
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={pred.prediction === 1 || pred.prediction === true ? 'High Risk' : 'Low Risk'}
                                                    color={pred.prediction === 1 || pred.prediction === true ? 'error' : 'success'}
                                                    size="small"
                                                    icon={pred.prediction === 1 || pred.prediction === true ? <TrendingUpIcon /> : <TrendingDownIcon />}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {pred.confidence ? `${(pred.confidence * 100).toFixed(1)}%` : 'N/A'}
                                            </TableCell>
                                            <TableCell>{pred.input_data?.bmi || 'N/A'}</TableCell>
                                            <TableCell>{pred.input_data?.blood_glucose_level || 'N/A'} mg/dL</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* Insights */}
            <Card elevation={3} sx={{ mt: 3, bgcolor: 'info.light' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <HospitalIcon color="info" />
                        <Typography variant="h6" color="info.dark">
                            Key Insights
                        </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <Typography variant="body2" color="text.secondary">
                                • {stats.totalPatients} patients registered in your practice
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="body2" color="text.secondary">
                                • {getRiskPercentage()}% of predictions indicate high diabetes risk
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="body2" color="text.secondary">
                                • {getCompletionRate()}% appointment completion rate
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Reports;
