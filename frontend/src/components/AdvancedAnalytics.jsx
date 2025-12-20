import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    CircularProgress,
    Alert,
    Chip,
    List,
    ListItem,
    ListItemText,
    LinearProgress,
    Divider
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    TrendingFlat as TrendingFlatIcon,
    CheckCircle as CheckIcon,
    Warning as WarningIcon,
    Error as ErrorIcon
} from '@mui/icons-material';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { analyticsService } from '../services/enhancedApi';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,  // Required for Doughnut charts
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const AdvancedAnalytics = ({ patientId, doctorId, mode = 'patient' }) => {
    const [overview, setOverview] = useState(null);
    const [populationHealth, setPopulationHealth] = useState(null);
    const [riskStratification, setRiskStratification] = useState(null);
    const [trends, setTrends] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadAnalytics();
    }, [patientId, doctorId, mode]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            setError('');

            if (mode === 'patient' && patientId) {
                // Load patient-specific analytics
                const [overviewData, riskData, trendsData] = await Promise.all([
                    analyticsService.getPatientOverview(patientId, 30),
                    analyticsService.getRiskStratification(patientId),
                    analyticsService.getPatientTrends(patientId, 90)
                ]);

                setOverview(overviewData);
                setRiskStratification(riskData);
                setTrends(trendsData);
            } else if (mode === 'population' && doctorId) {
                // Load population health analytics
                const popHealthData = await analyticsService.getPopulationHealth(doctorId);
                setPopulationHealth(popHealthData);
            }
        } catch (err) {
            setError(err.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'high':
                return 'error';
            case 'moderate':
                return 'warning';
            default:
                return 'success';
        }
    };

    const getRiskIcon = (level) => {
        switch (level) {
            case 'high':
                return <ErrorIcon />;
            case 'moderate':
                return <WarningIcon />;
            default:
                return <CheckIcon />;
        }
    };

    // Prepare glucose trend chart
    const glucoseTrendData = trends?.glucose_trend ? {
        labels: trends.glucose_trend.map(t => new Date(t.date).toLocaleDateString()),
        datasets: [{
            label: 'Glucose Level (mg/dL)',
            data: trends.glucose_trend.map(t => t.value),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
            tension: 0.4
        }]
    } : null;

    // Prepare HbA1c trend chart
    const hba1cTrendData = trends?.hba1c_trend ? {
        labels: trends.hba1c_trend.map(t => new Date(t.date).toLocaleDateString()),
        datasets: [{
            label: 'HbA1c (%)',
            data: trends.hba1c_trend.map(t => t.value),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: true,
            tension: 0.4
        }]
    } : null;

    // Prepare time in range doughnut
    const timeInRangeData = overview ? {
        labels: ['In Range', 'Above Range', 'Below Range'],
        datasets: [{
            data: [
                overview.glucose.time_in_range || 0,
                overview.glucose.time_above_range || 0,
                overview.glucose.time_below_range || 0
            ],
            backgroundColor: [
                'rgba(75, 192, 192, 0.8)',
                'rgba(255, 159, 64, 0.8)',
                'rgba(255, 99, 132, 0.8)'
            ]
        }]
    } : null;

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

            {mode === 'patient' && overview && (
                <>
                    {/* Patient Overview */}
                    <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                        Patient Analytics Dashboard
                    </Typography>

                    {/* Risk Stratification Card */}
                    {riskStratification && (
                        <Card sx={{ mb: 3, borderLeft: 6, borderColor: `${getRiskColor(riskStratification.risk_level)}.main` }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={2} mb={2}>
                                    {getRiskIcon(riskStratification.risk_level)}
                                    <Typography variant="h6">Risk Stratification</Typography>
                                    <Chip
                                        label={`${riskStratification.risk_level.toUpperCase()} RISK`}
                                        color={getRiskColor(riskStratification.risk_level)}
                                        icon={getRiskIcon(riskStratification.risk_level)}
                                    />
                                    <Typography variant="h6" color={`${getRiskColor(riskStratification.risk_level)}.main`}>
                                        Score: {riskStratification.risk_score}
                                    </Typography>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" gutterBottom>Risk Factors:</Typography>
                                        <List dense>
                                            {riskStratification.risk_factors.map((factor, index) => (
                                                <ListItem key={index}>
                                                    <ListItemText primary={`• ${factor}`} />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" gutterBottom>Recommendations:</Typography>
                                        <List dense>
                                            {riskStratification.recommendations.map((rec, index) => (
                                                <ListItem key={index}>
                                                    <ListItemText
                                                        primary={`${index + 1}. ${rec}`}
                                                        primaryTypographyProps={{ color: 'primary' }}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}

                    {/* Key Metrics */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" variant="body2">Avg Glucose</Typography>
                                    <Typography variant="h4">{overview.glucose.average} mg/dL</Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {overview.glucose.total_readings} readings
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" variant="body2">Latest HbA1c</Typography>
                                    <Typography variant="h4" color={overview.hba1c.latest_value < 7 ? 'success.main' : 'warning.main'}>
                                        {overview.hba1c.latest_value || 'N/A'}%
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {overview.hba1c.test_date ? new Date(overview.hba1c.test_date).toLocaleDateString() : 'No data'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" variant="body2">Med Adherence</Typography>
                                    <Typography variant="h4" color={overview.medication_adherence.rate >= 80 ? 'success.main' : 'warning.main'}>
                                        {overview.medication_adherence.rate}%
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={overview.medication_adherence.rate}
                                        color={overview.medication_adherence.rate >= 80 ? 'success' : 'warning'}
                                        sx={{ mt: 1 }}
                                    />
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" variant="body2">Activity</Typography>
                                    <Typography variant="h4">{overview.activity.total_minutes} min</Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {overview.activity.average_daily_minutes} min/day avg
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Charts */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        {glucoseTrendData && (
                            <Grid item xs={12} md={8}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>Glucose Trend (90 days)</Typography>
                                        <Line
                                            key={`glucose-trend-${patientId}`}
                                            data={glucoseTrendData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: true,
                                                plugins: {
                                                    legend: { display: true }
                                                }
                                            }}
                                            redraw={true}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                        )}
                        {timeInRangeData && (
                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>Time in Range</Typography>
                                        <Doughnut
                                            key={`time-in-range-${patientId}`}
                                            data={timeInRangeData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: true,
                                                plugins: {
                                                    legend: { display: true }
                                                }
                                            }}
                                            redraw={true}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                        )}
                    </Grid>

                    {hba1cTrendData && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>HbA1c Trend</Typography>
                                <Line
                                    key={`hba1c-trend-${patientId}`}
                                    data={hba1cTrendData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: true,
                                        plugins: {
                                            legend: { display: true }
                                        }
                                    }}
                                    redraw={true}
                                />
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {mode === 'population' && populationHealth && (
                <>
                    {/* Population Health Dashboard */}
                    <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                        Population Health Analytics
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" variant="body2">Total Patients</Typography>
                                    <Typography variant="h3">{populationHealth.total_patients}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" variant="body2">Avg HbA1c</Typography>
                                    <Typography variant="h3" color={populationHealth.hba1c_metrics.average < 7 ? 'success.main' : 'warning.main'}>
                                        {populationHealth.hba1c_metrics.average}%
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" variant="body2">At Goal</Typography>
                                    <Typography variant="h3" color="success.main">
                                        {populationHealth.hba1c_metrics.percent_at_goal}%
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {populationHealth.hba1c_metrics.patients_at_goal} patients
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" variant="body2">High Risk</Typography>
                                    <Typography variant="h3" color="error.main">
                                        {populationHealth.hba1c_metrics.high_risk_count}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        HbA1c &gt; 9%
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Critical Alerts</Typography>
                                    <Typography variant="h2" color="error.main">
                                        {populationHealth.alerts.critical_unacknowledged}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Unacknowledged critical alerts requiring attention
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Overdue Screenings</Typography>
                                    <Typography variant="h2" color="warning.main">
                                        {populationHealth.screenings.overdue_count}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Patients with overdue complication screenings
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </>
            )}
        </Box>
    );
};

export default AdvancedAnalytics;
