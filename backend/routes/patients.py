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

@router.post("/")
async def create_patient(
    patient: PatientCreate,
    current_doctor: DoctorBase = Depends(get_current_doctor)
):
    try:
        patient_data = patient.dict()
        
        # Get doctor_id from authenticated user
        if current_doctor:
            patient_data["doctor_id"] = current_doctor.badge_id
        else:
            # Fallback if authentication fails
            patient_data["doctor_id"] = "unknown"
        
        print(f"Creating patient: {patient_data.get('name')} for doctor: {patient_data.get('doctor_id')}")
        
        # Check if patient already exists
        existing = db.patients.find_one({
            "email": patient.email,
            "doctor_id": patient_data["doctor_id"]
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="Patient already exists")
        
        result = db.patients.insert_one(patient_data)
        print(f"Patient created with ID: {result.inserted_id}")
        
        # Return a clean dict without MongoDB objects
        return {
            "id": str(result.inserted_id),
            "name": patient_data.get("name"),
            "email": patient_data.get("email"),
            "phone": patient_data.get("phone"),
            "age": patient_data.get("age"),
            "gender": patient_data.get("gender"),
            "address": patient_data.get("address"),
            "doctor_id": patient_data.get("doctor_id")
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating patient: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating patient: {str(e)}"
        )

@router.get("/")
async def list_patients(
    current_doctor: DoctorBase = Depends(get_current_doctor)
):
    try:
        print(f"Listing patients for doctor: {current_doctor.badge_id}")
        patients = list(db.patients.find({
            "doctor_id": current_doctor.badge_id
        }))
        
        # Convert MongoDB documents to clean dicts
        result = []
        for p in patients:
            result.append({
                "id": str(p["_id"]),
                "name": p.get("name"),
                "email": p.get("email"),
                "phone": p.get("phone"),
                "age": p.get("age"),
                "gender": p.get("gender"),
                "address": p.get("address"),
                "doctor_id": p.get("doctor_id")
            })
        
        return result
    except Exception as e:
        print(f"Error in list_patients: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving patients: {str(e)}"
        )

@router.get("/{patient_id}")
async def get_patient(
    patient_id: str,
    current_doctor: DoctorBase = Depends(get_current_doctor)
):
    try:
        patient = db.patients.find_one({
            "_id": ObjectId(patient_id),
            "doctor_id": current_doctor.badge_id
        })
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        return {
            "id": str(patient["_id"]),
            "name": patient.get("name"),
            "email": patient.get("email"),
            "phone": patient.get("phone"),
            "age": patient.get("age"),
            "gender": patient.get("gender"),
            "address": patient.get("address"),
            "doctor_id": patient.get("doctor_id")
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting patient: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving patient: {str(e)}"
        )

@router.put("/{patient_id}")
async def update_patient(
    patient_id: str,
    patient: PatientCreate,
    current_doctor: DoctorBase = Depends(get_current_doctor)
):
    try:
        # Check if patient exists and belongs to this doctor
        existing = db.patients.find_one({
            "_id": ObjectId(patient_id),
            "doctor_id": current_doctor.badge_id
        })
        
        if not existing:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Update patient data
        update_data = patient.dict()
        result = db.patients.update_one(
            {"_id": ObjectId(patient_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            print("No changes made to patient")
        
        # Get updated patient
        updated = db.patients.find_one({"_id": ObjectId(patient_id)})
        
        return {
            "id": str(updated["_id"]),
            "name": updated.get("name"),
            "email": updated.get("email"),
            "phone": updated.get("phone"),
            "age": updated.get("age"),
            "gender": updated.get("gender"),
            "address": updated.get("address"),
            "doctor_id": updated.get("doctor_id")
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating patient: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating patient: {str(e)}"
        )

@router.delete("/{patient_id}")
async def delete_patient(
    patient_id: str,
    current_doctor: DoctorBase = Depends(get_current_doctor)
):
    try:
        # Check if patient exists and belongs to this doctor
        existing = db.patients.find_one({
            "_id": ObjectId(patient_id),
            "doctor_id": current_doctor.badge_id
        })
        
        if not existing:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Delete the patient
        result = db.patients.delete_one({"_id": ObjectId(patient_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        return {"message": "Patient deleted successfully", "id": patient_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting patient: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting patient: {str(e)}"
        )