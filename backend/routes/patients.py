import os
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import MongoClient
from typing import List

# Import from parent directory
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from auth import get_current_doctor
from models import PatientCreate, PatientInDB, DoctorBase

router = APIRouter()
client = MongoClient(os.getenv("MONGODB_URI"))
db = client[os.getenv("DB_NAME", "smartdiab")]

@router.post("/", response_model=PatientInDB)
async def create_patient(
    patient: PatientCreate,
    current_doctor: DoctorBase = Depends(get_current_doctor)
):
    patient_data = patient.dict()
    patient_data["doctor_id"] = current_doctor.badge_id
    
    # Check if patient already exists
    if db.patients.find_one({
        "email": patient.email,
        "doctor_id": current_doctor.badge_id
    }):
        raise HTTPException(status_code=400, detail="Patient already exists")
    
    result = db.patients.insert_one(patient_data)
    return {**patient_data, "id": str(result.inserted_id)}

@router.get("/", response_model=List[PatientInDB])
async def list_patients(
    current_doctor: DoctorBase = Depends(get_current_doctor)
):
    try:
        print(f"Listing patients for doctor: {current_doctor.badge_id}")
        patients = list(db.patients.find({
            "doctor_id": current_doctor.badge_id
        }))
        return [{"id": str(p["_id"])} | p for p in patients]
    except Exception as e:
        print(f"Error in list_patients: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving patients: {str(e)}"
        )