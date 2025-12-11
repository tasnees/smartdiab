"""
Quick script to check and clear patients from the database
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DB_NAME = "smartdiab"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

print("=== Current Patients in Database ===")
patients = list(db.patients.find())

if not patients:
    print("No patients found in database")
else:
    for i, patient in enumerate(patients, 1):
        print(f"\n{i}. Patient:")
        print(f"   ID: {patient.get('_id')}")
        print(f"   Name: {patient.get('name')}")
        print(f"   Email: {patient.get('email')}")
        print(f"   Doctor ID: {patient.get('doctor_id')}")

print(f"\nTotal patients: {len(patients)}")

# Ask if user wants to clear
print("\n" + "="*50)
response = input("Do you want to DELETE ALL patients? (yes/no): ")

if response.lower() == 'yes':
    result = db.patients.delete_many({})
    print(f"\n✅ Deleted {result.deleted_count} patients")
else:
    print("\n❌ No patients deleted")
