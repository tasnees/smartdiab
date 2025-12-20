# 🔔 Creating Alerts - Quick Guide

## Why Alerts Are Empty

The alerts system doesn't automatically create alerts from predictions. Alerts need to be created either:
1. Manually via the API
2. By running a script
3. By implementing automatic alert triggers (future feature)

---

## Quick Solution: Create Sample Alerts

### Option 1: Run the Alert Creation Script (Easiest)

```bash
cd backend
python create_sample_alerts.py
```

This will:
- Find all high-risk patients
- Create critical alerts for them
- Show you the results

### Option 2: Use the API Docs

1. Go to http://localhost:8000/docs
2. Find the `POST /api/alerts` endpoint
3. Click "Try it out"
4. Use this sample data:

```json
{
  "patient_id": "YOUR_PATIENT_ID",
  "doctor_id": "YOUR_DOCTOR_ID",
  "alert_type": "high_risk_prediction",
  "severity": "critical",
  "title": "High Diabetes Risk Detected",
  "message": "Patient has been identified as HIGH RISK for diabetes. Immediate attention recommended.",
  "acknowledged": false
}
```

5. Click "Execute"

---

## Finding Patient and Doctor IDs

### Get Patient ID:
1. Go to a patient in the dashboard
2. Look at the URL: `http://localhost:3000/patients/PATIENT_ID_HERE`
3. Copy the ID from the URL

### Get Doctor ID:
1. Open browser console (F12)
2. Type: `localStorage.getItem('userBadgeId')`
3. Copy the doctor ID

---

## Alert Types You Can Create

### Critical Alerts (Red)
```json
{
  "alert_type": "critical_glucose",
  "severity": "critical",
  "title": "Critical Glucose Level",
  "message": "Patient glucose level is critically high (350 mg/dL)"
}
```

### Warning Alerts (Orange)
```json
{
  "alert_type": "medication_due",
  "severity": "warning",
  "title": "Medication Reminder",
  "message": "Patient has missed 2 consecutive medication doses"
}
```

### Info Alerts (Blue)
```json
{
  "alert_type": "appointment_reminder",
  "severity": "info",
  "title": "Upcoming Appointment",
  "message": "Patient has an appointment scheduled for tomorrow"
}
```

---

## Alert Types Available

- `critical_glucose` - Dangerous glucose levels
- `high_risk_prediction` - High diabetes risk
- `medication_due` - Medication reminders
- `appointment_reminder` - Appointment notifications
- `lab_result_ready` - Lab results available
- `abnormal_lab_value` - Abnormal lab results
- `system_notification` - General notifications

---

## Testing the Alerts

### 1. Create an Alert
Run the script or use the API

### 2. View in Patient Tab
1. Go to the patient
2. Click "Alerts" tab
3. You should see the alert

### 3. View in Doctor Dashboard
1. Go to doctor dashboard
2. Scroll to bottom
3. See all alerts with summary

### 4. Test Filtering
- Click "Critical" - shows only critical alerts
- Click "Unacknowledged" - shows only new alerts
- Click "All" - shows everything

### 5. Test Acknowledgment
1. Click "Acknowledge" button
2. Alert should show green checkmark
3. Summary counts should update

---

## Automatic Alert Creation (Future Feature)

In a production system, alerts would be automatically created when:
- Glucose readings are out of range
- Predictions show high risk
- Medications are missed
- Lab results are abnormal
- Appointments are upcoming

This requires implementing triggers/webhooks, which can be added later.

---

## Quick Start

**Run this now to create alerts:**

```bash
cd backend
python create_sample_alerts.py
```

Then refresh your browser and check the Alerts tab!

---

## Troubleshooting

### Script Says "No high-risk predictions found"
- Make a prediction first
- Go to a patient → Make Prediction
- Set values that result in "High Risk"
- Then run the script again

### Alerts Still Not Showing
1. Check browser console for errors
2. Verify backend is running
3. Check Network tab for API responses
4. Try hard refresh (Ctrl + Shift + R)

---

**Run the script and you'll see alerts!** 🎉
