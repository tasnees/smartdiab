# Quick Setup Guide

## Install Required Dependencies

The Glucose Monitoring component requires Chart.js. Install it:

```bash
cd frontend
npm install chart.js react-chartjs-2
```

## File Structure

```
diabetes_prediction/
├── backend/
│   ├── models.py (original)
│   ├── models_enhanced.py (NEW - all enhanced models)
│   ├── main.py (UPDATED - with new routes)
│   └── routes/
│       ├── patients.py (original)
│       ├── predictions.py (original)
│       ├── appointments.py (original)
│       ├── glucose.py (NEW)
│       ├── medications.py (NEW)
│       ├── lab_results.py (NEW)
│       ├── complications.py (NEW)
│       ├── nutrition.py (NEW)
│       ├── activity.py (NEW)
│       ├── messages.py (NEW)
│       ├── alerts.py (NEW)
│       └── analytics.py (NEW)
│
└── frontend/
    └── src/
        ├── services/
        │   ├── api.js (original)
        │   └── enhancedApi.js (NEW)
        └── components/
            ├── DoctorDashboard.jsx (original)
            ├── PatientDetail.jsx (original)
            ├── GlucoseMonitoring.jsx (NEW)
            └── ... (more components to create)
```

## Quick Start

### 1. Start Backend
```bash
cd backend
python main.py
```

### 2. Start Frontend
```bash
cd frontend
npm install  # if not done
npm install chart.js react-chartjs-2  # for charts
npm run dev
```

### 3. Test API
Visit: http://localhost:8000/docs

### 4. View App
Visit: http://localhost:3000 or http://localhost:5173

## Integration Steps

### Add Glucose Monitoring to Patient Detail

Edit `frontend/src/components/PatientDetail.jsx`:

```javascript
import GlucoseMonitoring from './GlucoseMonitoring';

// Inside your component, add a new tab or section:
<Box sx={{ mt: 3 }}>
  <Typography variant="h6" gutterBottom>Glucose Monitoring</Typography>
  <GlucoseMonitoring patientId={patient.id} />
</Box>
```

### Or Create a New Route

Edit `frontend/src/App.jsx`:

```javascript
import GlucoseMonitoring from './components/GlucoseMonitoring.jsx';

// Add inside your Routes:
<Route
  path="dashboard/patients/:id/glucose"
  element={
    <PrivateRoute>
      <GlucoseMonitoring patientId={id} />
    </PrivateRoute>
  }
/>
```

## Testing the Features

### 1. Test Glucose API
```bash
# Get patient glucose statistics
curl -X GET "http://localhost:8000/api/glucose/readings/patient/PATIENT_ID/statistics?days=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test in Swagger UI
1. Go to http://localhost:8000/docs
2. Click on any endpoint
3. Click "Try it out"
4. Fill in the parameters
5. Click "Execute"

### 3. Test in Frontend
1. Log in to the app
2. Navigate to a patient
3. View the Glucose Monitoring section
4. Add a glucose reading
5. See the chart update

## Common Issues

### Chart.js Not Found
```bash
npm install chart.js react-chartjs-2
```

### CORS Error
Make sure backend is running and CORS is configured in `main.py`

### MongoDB Connection Error
Check your MongoDB connection string in `database.py`

### Import Errors
Make sure all route files are in `backend/routes/` directory

## Next Steps

1. ✅ Backend is running
2. ✅ Frontend is running
3. ✅ Glucose monitoring works
4. 🔄 Create more components (medication, lab results, etc.)
5. 🔄 Integrate into existing UI
6. 🔄 Add navigation
7. 🔄 Polish and test

## Need More Components?

Use `GlucoseMonitoring.jsx` as a template to create:
- MedicationTracker.jsx
- LabResults.jsx
- ComplicationScreening.jsx
- NutritionTracker.jsx
- ActivityLogger.jsx
- MessagingHub.jsx
- AlertsPanel.jsx

Just copy the structure and replace the service calls!
