import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Chip,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Badge
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    CheckCircle as CheckIcon,
    Medication as MedicationIcon,
    Event as EventIcon,
    Science as ScienceIcon,
    LocalHospital as HospitalIcon
} from '@mui/icons-material';
import { alertsService } from '../services/enhancedApi';

const AlertsPanel = ({ doctorId, patientId = null }) => {
    const [alerts, setAlerts] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // all, critical, warning, unacknowledged

    useEffect(() => {
        loadAlerts();
    }, [doctorId, patientId, filter]);

    const loadAlerts = async () => {
        try {
            setLoading(true);
            setError('');

            let alertsData;
            if (patientId) {
                // Get alerts for specific patient
                const params = filter === 'unacknowledged' ? { acknowledged: false } : {};
                if (filter === 'critical') params.severity = 'critical';
                if (filter === 'warning') params.severity = 'warning';

                alertsData = await alertsService.getPatientAlerts(patientId, params);
            } else if (doctorId) {
                // Get alerts for doctor
                const params = filter === 'unacknowledged' ? { acknowledged: false } : {};
                if (filter === 'critical') params.severity = 'critical';
                if (filter === 'warning') params.severity = 'warning';

                alertsData = await alertsService.getDoctorAlerts(doctorId, params);

                // Get summary
                const summaryData = await alertsService.getAlertsSummary(doctorId);
                setSummary(summaryData);
            }

            setAlerts(alertsData || []);
        } catch (err) {
            setError(err.message || 'Failed to load alerts');
        } finally {
            setLoading(false);
        }
    };

    const handleAcknowledge = async (alertId) => {
        try {
            await alertsService.acknowledgeAlert(
                alertId,
                localStorage.getItem('userBadgeId') || 'doctor',
                'Acknowledged by doctor'
            );
            loadAlerts();
        } catch (err) {
            setError(err.message || 'Failed to acknowledge alert');
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'critical':
                return <ErrorIcon color="error" />;
            case 'warning':
                return <WarningIcon color="warning" />;
            default:
                return <InfoIcon color="info" />;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical':
                return 'error';
            case 'warning':
                return 'warning';
            default:
                return 'info';
        }
    };

    const getAlertTypeIcon = (alertType) => {
        switch (alertType) {
            case 'critical_glucose':
                return <HospitalIcon />;
            case 'medication_due':
                return <MedicationIcon />;
            case 'appointment_reminder':
                return <EventIcon />;
            case 'lab_result_ready':
            case 'abnormal_lab_value':
                return <ScienceIcon />;
            default:
                return <NotificationsIcon />;
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            {/* Summary Cards */}
            {summary && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" variant="body2">Total Alerts</Typography>
                                <Typography variant="h5">{summary.total_alerts}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" variant="body2">Unacknowledged</Typography>
                                <Typography variant="h5" color="warning.main">{summary.unacknowledged}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" variant="body2">Critical</Typography>
                                <Typography variant="h5" color="error.main">{summary.critical_unacknowledged}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" variant="body2">Warnings</Typography>
                                <Typography variant="h5" color="warning.main">{summary.warning_unacknowledged}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Filter Buttons */}
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                    variant={filter === 'all' ? 'contained' : 'outlined'}
                    onClick={() => setFilter('all')}
                    size="small"
                >
                    All
                </Button>
                <Button
                    variant={filter === 'unacknowledged' ? 'contained' : 'outlined'}
                    onClick={() => setFilter('unacknowledged')}
                    size="small"
                >
                    Unacknowledged
                </Button>
                <Button
                    variant={filter === 'critical' ? 'contained' : 'outlined'}
                    onClick={() => setFilter('critical')}
                    size="small"
                    color="error"
                >
                    Critical
                </Button>
                <Button
                    variant={filter === 'warning' ? 'contained' : 'outlined'}
                    onClick={() => setFilter('warning')}
                    size="small"
                    color="warning"
                >
                    Warnings
                </Button>
            </Box>

            {/* Alerts List */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        <Badge badgeContent={alerts.filter(a => !a.acknowledged).length} color="error">
                            Alerts & Notifications
                        </Badge>
                    </Typography>

                    {alerts.length === 0 ? (
                        <Box textAlign="center" py={4}>
                            <CheckIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                            <Typography color="textSecondary">
                                No alerts to display. All clear!
                            </Typography>
                        </Box>
                    ) : (
                        <List>
                            {alerts.map((alert, index) => (
                                <React.Fragment key={alert.id}>
                                    <ListItem
                                        sx={{
                                            bgcolor: !alert.acknowledged ? 'action.hover' : 'transparent',
                                            borderLeft: 4,
                                            borderColor: `${getSeverityColor(alert.severity)}.main`,
                                            mb: 1,
                                            borderRadius: 1
                                        }}
                                    >
                                        <ListItemIcon>
                                            {getSeverityIcon(alert.severity)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {getAlertTypeIcon(alert.alert_type)}
                                                    <Typography component="span" variant="subtitle1" fontWeight="bold">
                                                        {alert.title}
                                                    </Typography>
                                                    <Chip
                                                        label={alert.severity}
                                                        color={getSeverityColor(alert.severity)}
                                                        size="small"
                                                    />
                                                    {!alert.acknowledged && (
                                                        <Chip label="New" color="primary" size="small" />
                                                    )}
                                                </span>
                                            }
                                            secondary={
                                                <React.Fragment>
                                                    <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                                        {alert.message}
                                                    </Typography>
                                                    <Typography component="span" variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                        {new Date(alert.created_at).toLocaleString()}
                                                    </Typography>
                                                    {alert.acknowledged && (
                                                        <Typography component="span" variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>
                                                            ✓ Acknowledged by {alert.acknowledged_by} on {new Date(alert.acknowledged_at).toLocaleString()}
                                                        </Typography>
                                                    )}
                                                </React.Fragment>
                                            }
                                        />
                                        {!alert.acknowledged && (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => handleAcknowledge(alert.id)}
                                            >
                                                Acknowledge
                                            </Button>
                                        )}
                                    </ListItem>
                                    {index < alerts.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default AlertsPanel;
