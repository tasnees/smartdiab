# 💊 Prescription Feature - Implementation Guide

## ✅ What Needs to Be Done:

The DoctorDashboard.jsx file has syntax errors. I'll create a clean implementation document for you to manually apply the changes.

### **Changes Needed:**

#### **1. Add Imports (at the top of DoctorDashboard.jsx):**

Add these to the Material-UI imports:
```jsx
Dialog,
DialogTitle,
DialogContent,
DialogActions,
TextField,
MenuItem,
Alert
```

Add to the API imports:
```jsx
import { authAPI, patientService } from '../services/api';
```

#### **2. Add State Variables (after line 38):**

```jsx
const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
const [patients, setPatients] = useState([]);
const [selectedPatientId, setSelectedPatientId] = useState('');
const [medication, setMedication] = useState('');
const [prescriptionError, setPrescriptionError] = useState('');
const [prescriptionSuccess, setPrescriptionSuccess] = useState('');
```

#### **3. Add Handler Functions (after handleLogout function):**

```jsx
const loadPatients = async () => {
  try {
    const data = await patientService.listPatients();
    setPatients(data);
  } catch (error) {
    console.error('Error loading patients:', error);
  }
};

const handleOpenPrescriptionDialog = () => {
  loadPatients();
  setPrescriptionDialogOpen(true);
  setPrescriptionError('');
  setPrescriptionSuccess('');
};

const handleClosePrescriptionDialog = () => {
  setPrescriptionDialogOpen(false);
  setSelectedPatientId('');
  setMedication('');
  setPrescriptionError('');
  setPrescriptionSuccess('');
};

const handlePrescribe = async () => {
  try {
    setPrescriptionError('');
    setPrescriptionSuccess('');

    if (!selectedPatientId || !medication.trim()) {
      setPrescriptionError('Please select a patient and enter medication');
      return;
    }

    // Get current patient data
    const patient = await patientService.getPatient(selectedPatientId);
    
    // Add new medication to current medications
    const currentMeds = patient.current_medications || [];
    const updatedMeds = [...currentMeds, medication.trim()];

    // Update patient with new medication
    await patientService.updatePatient(selectedPatientId, {
      ...patient,
      current_medications: updatedMeds
    });

    setPrescriptionSuccess('Prescription added successfully!');
    setTimeout(() => {
      handleClosePrescriptionDialog();
    }, 1500);
  } catch (error) {
    console.error('Error adding prescription:', error);
    setPrescriptionError('Failed to add prescription. Please try again.');
  }
};
```

#### **4. Update "Write Prescription" Button (around line 324):**

Change:
```jsx
onClick={() => navigate('/dashboard/patients')}
```

To:
```jsx
onClick={handleOpenPrescriptionDialog}
```

#### **5. Add Prescription Dialog (before the closing `</Box>` at the end):**

```jsx
{/* Prescription Dialog */}
<Dialog
  open={prescriptionDialogOpen}
  onClose={handleClosePrescriptionDialog}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle>Write Prescription</DialogTitle>
  <DialogContent>
    {prescriptionError && (
      <Alert severity="error" sx={{ mb: 2 }}>
        {prescriptionError}
      </Alert>
    )}
    {prescriptionSuccess && (
      <Alert severity="success" sx={{ mb: 2 }}>
        {prescriptionSuccess}
      </Alert>
    )}
    
    <TextField
      select
      fullWidth
      label="Select Patient"
      value={selectedPatientId}
      onChange={(e) => setSelectedPatientId(e.target.value)}
      margin="normal"
      required
    >
      <MenuItem value="">Select a patient...</MenuItem>
      {patients.map((patient) => (
        <MenuItem key={patient.id} value={patient.id}>
          {patient.name} - {patient.email}
        </MenuItem>
      ))}
    </TextField>

    {selectedPatientId && (
      <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Patient:</strong> {patients.find(p => p.id === selectedPatientId)?.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Current Medications:</strong>
        </Typography>
        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
          {(patients.find(p => p.id === selectedPatientId)?.current_medications || []).length > 0 ? (
            patients.find(p => p.id === selectedPatientId)?.current_medications.map((med, idx) => (
              <li key={idx}>
                <Typography variant="body2">{med}</Typography>
              </li>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">No current medications</Typography>
          )}
        </Box>
      </Box>
    )}

    <TextField
      fullWidth
      label="Medication"
      value={medication}
      onChange={(e) => setMedication(e.target.value)}
      margin="normal"
      placeholder="e.g., Metformin 500mg - Take twice daily"
      required
      multiline
      rows={2}
      helperText="Enter medication name, dosage, and instructions"
    />
  </DialogContent>
  <DialogActions sx={{ px: 3, pb: 2 }}>
    <Button onClick={handleClosePrescriptionDialog}>Cancel</Button>
    <Button 
      onClick={handlePrescribe} 
      variant="contained"
      disabled={!selectedPatientId || !medication.trim()}
    >
      Add Prescription
    </Button>
  </DialogActions>
</Dialog>
```

---

## 🔧 **Quick Fix:**

Due to file corruption, please:

1. **Restart the frontend dev server**
2. **Check if the page loads**
3. **If errors persist, let me know and I'll provide a complete clean file**

---

## 💡 **How It Works:**

1. Click "Write Prescription" button
2. Dialog opens with patient dropdown
3. Select a patient
4. See their current medications
5. Enter new medication
6. Click "Add Prescription"
7. Medication is added to patient's current_medications array

---

**Would you like me to provide a complete clean DoctorDashboard.jsx file?**
