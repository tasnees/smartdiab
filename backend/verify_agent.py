import os
import sys
from datetime import datetime, timedelta
from bson import ObjectId
from database import get_database

def verify_agent():
    print("=== WhatsApp Reminders Agent Verification Tool ===")
    db = get_database()
    
    # 1. Create a Test Patient if not exists
    test_patient = {
        "name": "Test Patient",
        "phone": "+1234567890", # Change this to your number for real tests
        "email": "test@example.com",
        "doctor_id": "test_doc"
    }
    
    patient_id = db.patients.insert_one(test_patient).inserted_id
    print(f"✅ Created test patient with ID: {patient_id}")
    
    # 2. Create a Test Appointment for tomorrow
    tomorrow = (datetime.utcnow() + timedelta(days=1)).date().isoformat()
    test_appointment = {
        "patient_id": str(patient_id),
        "doctor_id": "test_doc",
        "appointment_date": tomorrow,
        "appointment_time": "14:30",
        "reason": "Agent Verification Test",
        "status": "Scheduled",
        "reminder_sent": False,
        "created_at": datetime.utcnow().isoformat()
    }
    
    apt_id = db.appointments.insert_one(test_appointment).inserted_id
    print(f"✅ Created test appointment for {tomorrow} with ID: {apt_id}")
    
    print("\n--- INSTRUCTIONS ---")
    print("1. Ensure your backend server is running (main.py).")
    print("2. Current agent check interval is 1 hour (set in reminders_agent.py).")
    print("3. Check your backend console logs for a message like:")
    print(f"   'MOCK WHATSAPP to +1234567890: Hello Test Patient...'")
    print("\n4. After the agent processes it, check the appointment status in MongoDB.")
    print("   'reminder_sent' should become 'True'.")

if __name__ == "__main__":
    verify_agent()
