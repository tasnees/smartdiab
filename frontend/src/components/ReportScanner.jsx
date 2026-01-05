import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Paper,
    Divider,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    LinearProgress
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Description as DescriptionIcon,
    Science as ScienceIcon,
    AutoGraph as AutoGraphIcon,
    Psychology as PsychologyIcon,
    CheckCircle as CheckIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import { Select, MenuItem } from '@mui/material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ReportScanner = () => {
    const [file, setFile] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [reportType, setReportType] = useState('comprehensive');
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState('');

    const reportTypes = [
        { id: 'comprehensive', name: 'Comprehensive Lab Report' },
        { id: 'glucose_fasting', name: 'Fasting Blood Sugar' },
        { id: 'hba1c', name: 'HbA1c (3-Month Average)' },
        { id: 'lipid_panel', name: 'Lipid / Cholesterol Panel' },
        { id: 'vital_signs', name: 'Vitals (BP/Weight/BMI)' }
    ];

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`${API_URL}/api/patients/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPatients(response.data);
        } catch (err) {
            console.error('Error fetching patients:', err);
        }
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError('');
            setResult(null);
        }
    };

    const handleScan = async () => {
        if (!file) {
            setError('Please select a file first.');
            return;
        }

        try {
            setScanning(true);
            setError('');

            const formData = new FormData();
            formData.append('document', file);
            formData.append('report_type', reportType);

            const token = localStorage.getItem('authToken');
            const response = await axios.post(`${API_URL}/api/scan-report`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            setResult(response.data);
        } catch (err) {
            console.error('Scan error:', err);
            setError('Failed to scan report. Please ensure the file is an image or PDF and try again.');
        } finally {
            setScanning(false);
        }
    };

    const handleSaveToProfile = async () => {
        if (!selectedPatientId) {
            setError('Please select a patient to save metrics.');
            return;
        }

        try {
            setSaving(true);
            setSaveSuccess('');
            setError('');

            const token = localStorage.getItem('authToken');
            await axios.post(`${API_URL}/api/save-extracted-metrics`, {
                patient_id: selectedPatientId,
                report_type: reportType,
                metrics: result.extracted_data
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSaveSuccess('Metrics saved to patient profile successfully!');
            setTimeout(() => setSaveSuccess(''), 3000);
        } catch (err) {
            console.error('Save error:', err);
            setError('Failed to save metrics to profile.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ p: 1 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                AI Report Scanner
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Upload lab results or medical reports. Our AI will extract key metrics and provide clinical insights.
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={5}>
                    <Card elevation={4} sx={{ borderRadius: 3, border: '2px dashed #1976d2', bgcolor: '#f8fbff' }}>
                        <CardContent sx={{ textAlign: 'center', py: 5 }}>
                            <UploadIcon sx={{ fontSize: 64, color: '#1976d2', mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                {file ? file.name : 'Select Medical Report'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Supported formats: PDF, JPG, PNG
                            </Typography>

                            <Box sx={{ mb: 3, textAlign: 'left' }}>
                                <Typography variant="caption" color="text.secondary" gutterBottom>
                                    Report Category
                                </Typography>
                                <Select
                                    fullWidth
                                    size="small"
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value)}
                                    sx={{ bgcolor: 'white' }}
                                >
                                    {reportTypes.map((type) => (
                                        <MenuItem key={type.id} value={type.id}>
                                            {type.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Box>

                            <input
                                accept=".pdf,image/*"
                                style={{ display: 'none' }}
                                id="report-upload"
                                type="file"
                                onChange={handleFileChange}
                            />
                            <label htmlFor="report-upload">
                                <Button variant="outlined" component="span" sx={{ mr: 1 }}>
                                    Browse Files
                                </Button>
                            </label>
                            <Button
                                variant="contained"
                                onClick={handleScan}
                                disabled={!file || scanning}
                                startIcon={scanning ? <CircularProgress size={20} color="inherit" /> : <PsychologyIcon />}
                            >
                                {scanning ? 'Analyzing...' : 'Scan & Extract'}
                            </Button>

                            {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
                        </CardContent>
                    </Card>

                    {scanning && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                AI Processing Pipeline Active...
                            </Typography>
                            <LinearProgress sx={{ borderRadius: 1, height: 8 }} />
                        </Box>
                    )}
                </Grid>

                <Grid item xs={12} md={7}>
                    {result ? (
                        <Card elevation={4} sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <CheckIcon color="success" sx={{ mr: 1 }} />
                                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Analysis Complete</Typography>
                                </Box>
                                <Divider sx={{ mb: 3 }} />

                                <Box sx={{ mb: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom color="primary">
                                        Save Results to Patient Profile
                                    </Typography>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} sm={7}>
                                            <Select
                                                fullWidth
                                                size="small"
                                                value={selectedPatientId}
                                                onChange={(e) => setSelectedPatientId(e.target.value)}
                                                displayEmpty
                                                sx={{ bgcolor: 'white' }}
                                            >
                                                <MenuItem value="" disabled>Select Patient...</MenuItem>
                                                {patients.map(p => (
                                                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </Grid>
                                        <Grid item xs={12} sm={5}>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                color="success"
                                                onClick={handleSaveToProfile}
                                                disabled={!selectedPatientId || saving}
                                                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
                                            >
                                                {saving ? 'Saving...' : 'Save to Profile'}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                    {saveSuccess && <Alert severity="success" sx={{ mt: 1 }}>{saveSuccess}</Alert>}
                                </Box>
                                <Divider sx={{ mb: 3 }} />

                                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                                    <ScienceIcon sx={{ mr: 1, color: '#1976d2' }} /> Extracted Metrics
                                </Typography>
                                <Grid container spacing={2} sx={{ mb: 4 }}>
                                    {Object.entries(result.extracted_data).map(([key, value]) => (
                                        <Grid item xs={6} sm={4} key={key}>
                                            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {key.replace(/_/g, ' ').toUpperCase()}
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                    {value || 'N/A'}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>

                                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                                    <AutoGraphIcon sx={{ mr: 1, color: '#9c27b0' }} /> AI Insight & Summary
                                </Typography>
                                <Paper sx={{ p: 3, bgcolor: '#f3e5f5', borderRadius: 2 }}>
                                    <Typography variant="body1" sx={{ fontStyle: 'italic', lineHeight: 1.6 }}>
                                        "{result.summary}"
                                    </Typography>
                                </Paper>

                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle2" gutterBottom>Clinical Recommendations:</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {result.recommendations.map((rec, i) => (
                                            <Chip key={i} label={rec} color="primary" variant="outlined" size="small" />
                                        ))}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    ) : (
                        <Paper
                            variant="outlined"
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                p: 5,
                                bgcolor: '#fafafa',
                                borderRadius: 3,
                                borderStyle: 'dotted'
                            }}
                        >
                            <DescriptionIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.disabled">
                                Scan results will appear here
                            </Typography>
                        </Paper>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default ReportScanner;
