"""
Medication Management API Routes
Handles medications and adherence tracking
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from models_enhanced import (
    MedicationCreate, MedicationInDB,
    MedicationAdherenceCreate, MedicationAdherenceInDB
)
from database import get_database

router = APIRouter(prefix="/medications", tags=["Medication Management"])

# ============================================================================
# MEDICATIONS
# ============================================================================

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_medication(medication: MedicationCreate, db=Depends(get_database)):
    """Create a new medication prescription"""
    try:
        medication_dict = medication.dict(by_alias=True, exclude={"id"})
        medication_dict["created_at"] = datetime.utcnow()
        medication_dict["updated_at"] = datetime.utcnow()
        
        result = db.medications.insert_one(medication_dict)
        
        created_medication = db.medications.find_one({"_id": result.inserted_id})
        created_medication["id"] = str(created_medication.pop("_id"))
        
        return {"message": "Medication created successfully", "medication": created_medication}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating medication: {str(e)}")

@router.get("/patient/{patient_id}", response_model=List[dict])
def get_patient_medications(
    patient_id: str,
    active_only: bool = True,
    db=Depends(get_database)
):
    """Get all medications for a patient"""
    try:
        query = {"patient_id": patient_id}
        if active_only:
            query["active"] = True
        
        medications = []
        for medication in db.medications.find(query).sort("created_at", -1):
            medication["id"] = str(medication.pop("_id"))
            medications.append(medication)
        
        return medications
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching medications: {str(e)}")

@router.get("/{medication_id}", response_model=dict)
def get_medication(medication_id: str, db=Depends(get_database)):
    """Get a specific medication by ID"""
    try:
        if not ObjectId.is_valid(medication_id):
            raise HTTPException(status_code=400, detail="Invalid medication ID")
        
        medication = db.medications.find_one({"_id": ObjectId(medication_id)})
        if not medication:
            raise HTTPException(status_code=404, detail="Medication not found")
        
        medication["id"] = str(medication.pop("_id"))
        return medication
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching medication: {str(e)}")

@router.put("/{medication_id}", response_model=dict)
def update_medication(
    medication_id: str,
    medication_update: dict,
    db=Depends(get_database)
):
    """Update a medication"""
    try:
        if not ObjectId.is_valid(medication_id):
            raise HTTPException(status_code=400, detail="Invalid medication ID")
        
        medication_update["updated_at"] = datetime.utcnow()
        
        result = db.medications.update_one(
            {"_id": ObjectId(medication_id)},
            {"$set": medication_update}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Medication not found")
        
        updated_medication = db.medications.find_one({"_id": ObjectId(medication_id)})
        updated_medication["id"] = str(updated_medication.pop("_id"))
        
        return {"message": "Medication updated successfully", "medication": updated_medication}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating medication: {str(e)}")

@router.delete("/{medication_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medication(medication_id: str, db=Depends(get_database)):
    """Delete (deactivate) a medication"""
    try:
        if not ObjectId.is_valid(medication_id):
            raise HTTPException(status_code=400, detail="Invalid medication ID")
        
        # Soft delete - just mark as inactive
        result = db.medications.update_one(
            {"_id": ObjectId(medication_id)},
            {"$set": {"active": False, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Medication not found")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting medication: {str(e)}")

# ============================================================================
# MEDICATION ADHERENCE
# ============================================================================

@router.post("/adherence", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_adherence_record(adherence: MedicationAdherenceCreate, db=Depends(get_database)):
    """Record medication adherence"""
    try:
        adherence_dict = adherence.dict(by_alias=True, exclude={"id"})
        adherence_dict["created_at"] = datetime.utcnow()
        
        result = db.medication_adherence.insert_one(adherence_dict)
        
        created_adherence = db.medication_adherence.find_one({"_id": result.inserted_id})
        created_adherence["id"] = str(created_adherence.pop("_id"))
        
        return {"message": "Adherence record created successfully", "adherence": created_adherence}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating adherence record: {str(e)}")

@router.get("/adherence/patient/{patient_id}", response_model=List[dict])
def get_patient_adherence(
    patient_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db=Depends(get_database)
):
    """Get medication adherence records for a patient"""
    try:
        query = {"patient_id": patient_id}
        
        # Add date range filter
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = datetime.fromisoformat(start_date)
            if end_date:
                date_filter["$lte"] = datetime.fromisoformat(end_date)
            query["scheduled_datetime"] = date_filter
        
        adherence_records = []
        for record in db.medication_adherence.find(query).sort("scheduled_datetime", -1):
            record["id"] = str(record.pop("_id"))
            adherence_records.append(record)
        
        return adherence_records
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching adherence records: {str(e)}")

@router.get("/adherence/medication/{medication_id}", response_model=List[dict])
def get_medication_adherence(medication_id: str, db=Depends(get_database)):
    """Get adherence records for a specific medication"""
    try:
        adherence_records = []
        for record in db.medication_adherence.find({"medication_id": medication_id}).sort("scheduled_datetime", -1):
            record["id"] = str(record.pop("_id"))
            adherence_records.append(record)
        
        return adherence_records
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching adherence records: {str(e)}")

@router.get("/adherence/patient/{patient_id}/statistics", response_model=dict)
def get_adherence_statistics(
    patient_id: str,
    days: int = 30,
    db=Depends(get_database)
):
    """Get medication adherence statistics for a patient"""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        total_scheduled = 0
        total_taken = 0
        
        for record in db.medication_adherence.find({
            "patient_id": patient_id,
            "scheduled_datetime": {"$gte": start_date}
        }):
            total_scheduled += 1
            if record.get("taken", False):
                total_taken += 1
        
        adherence_rate = (total_taken / total_scheduled * 100) if total_scheduled > 0 else 0
        
        return {
            "patient_id": patient_id,
            "period_days": days,
            "total_scheduled": total_scheduled,
            "total_taken": total_taken,
            "total_missed": total_scheduled - total_taken,
            "adherence_rate": round(adherence_rate, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating adherence statistics: {str(e)}")

@router.put("/adherence/{adherence_id}", response_model=dict)
def update_adherence_record(
    adherence_id: str,
    adherence_update: dict,
    db=Depends(get_database)
):
    """Update an adherence record"""
    try:
        if not ObjectId.is_valid(adherence_id):
            raise HTTPException(status_code=400, detail="Invalid adherence ID")
        
        result = db.medication_adherence.update_one(
            {"_id": ObjectId(adherence_id)},
            {"$set": adherence_update}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Adherence record not found")
        
        updated_adherence = db.medication_adherence.find_one({"_id": ObjectId(adherence_id)})
        updated_adherence["id"] = str(updated_adherence.pop("_id"))
        
        return {"message": "Adherence record updated successfully", "adherence": updated_adherence}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating adherence record: {str(e)}")

# ============================================================================
# MEDICATION INTERACTIONS & WARNINGS
# ============================================================================

@router.get("/patient/{patient_id}/check-interactions", response_model=dict)
def check_medication_interactions(patient_id: str, db=Depends(get_database)):
    """Check for potential medication interactions (simplified version)"""
    try:
        # Get all active medications for the patient
        medications = []
        for med in db.medications.find({"patient_id": patient_id, "active": True}):
            medications.append(med["medication_name"])
        
        # This is a simplified version - in production, you'd integrate with a drug interaction database
        interactions = []
        warnings = []
        
        # Example: Check for common diabetes medication interactions
        if "Metformin" in medications and "Insulin" in medications:
            warnings.append({
                "severity": "moderate",
                "message": "Monitor blood glucose closely when using Metformin with Insulin",
                "medications": ["Metformin", "Insulin"]
            })
        
        return {
            "patient_id": patient_id,
            "total_medications": len(medications),
            "medications": medications,
            "interactions": interactions,
            "warnings": warnings
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking interactions: {str(e)}")
