"""
Create sample alerts for high-risk patients
Run this from the backend directory: python create_sample_alerts.py
"""

from database import get_database
from datetime import datetime
from bson import ObjectId

def create_sample_alerts():
    """Create sample alerts for patients with high-risk predictions"""
    db = get_database()
    
    print("🔍 Finding high-risk patients...")
    
    # Find all patients with high-risk predictions
    high_risk_predictions = list(db.predictions.find({"risk_level": "High"}))
    
    if not high_risk_predictions:
        print("❌ No high-risk predictions found.")
        print("💡 Make a prediction first, then run this script.")
        return
    
    print(f"✅ Found {len(high_risk_predictions)} high-risk prediction(s)")
    
    alerts_created = 0
    
    for prediction in high_risk_predictions:
        patient_id = prediction.get("patient_id")
        doctor_id = prediction.get("doctor_id")
        
        if not patient_id or not doctor_id:
            continue
        
        # Check if alert already exists for this patient
        existing_alert = db.alerts.find_one({
            "patient_id": patient_id,
            "alert_type": "high_risk_prediction"
        })
        
        if existing_alert:
            print(f"⚠️  Alert already exists for patient {patient_id}")
            continue
        
        # Create alert
        alert = {
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "alert_type": "high_risk_prediction",
            "severity": "critical",
            "title": "High Diabetes Risk Detected",
            "message": f"Patient has been identified as HIGH RISK for diabetes (Risk Score: {prediction.get('risk_percentage', 0):.1f}%). Immediate attention recommended.",
            "acknowledged": False,
            "created_at": datetime.utcnow()
        }
        
        result = db.alerts.insert_one(alert)
        print(f"✅ Created alert for patient {patient_id} (Alert ID: {result.inserted_id})")
        alerts_created += 1
    
    print(f"\n🎉 Created {alerts_created} new alert(s)!")
    
    if alerts_created > 0:
        print("\n📋 Next steps:")
        print("1. Refresh your browser")
        print("2. Go to the patient's Alerts tab")
        print("3. You should see the new alert!")

if __name__ == "__main__":
    create_sample_alerts()
