import os
from typing import List
from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status, Query

# Import from parent directory
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from auth import get_current_doctor
from models import AppointmentCreate, AppointmentUpdate, AppointmentInDB, DoctorBase
from database import get_database

router = APIRouter()
db = get_database()

@router.post("/")
async def create_appointment(
    appointment: AppointmentCreate,
    current_doctor: DoctorBase = Depends(get_current_doctor)
):
    try:
        appointment_data = appointment.dict()
        
        # Ensure doctor_id matches current doctor
        appointment_data["doctor_id"] = current_doctor.badge_id
        
        # Convert datetime to ISO format for MongoDB
        if isinstance(appointment_data.get("appointment_date"), datetime):
            appointment_data["appointment_date"] = appointment_data["appointment_date"].isoformat()
        
        appointment_data["created_at"] = datetime.utcnow().isoformat()
        appointment_data["updated_at"] = datetime.utcnow().isoformat()
        
        print(f"Creating appointment for patient: {appointment_data.get('patient_id')}")
        
        result = db.appointments.insert_one(appointment_data)
        print(f"Appointment created with ID: {result.inserted_id}")
        
        # Return clean dict
        return {
            "id": str(result.inserted_id),
            "patient_id": appointment_data.get("patient_id"),
            "doctor_id": appointment_data.get("doctor_id"),
            "appointment_date": appointment_data.get("appointment_date"),
            "appointment_time": appointment_data.get("appointment_time"),
            "duration": appointment_data.get("duration"),
            "reason": appointment_data.get("reason"),
            "status": appointment_data.get("status"),
            "notes": appointment_data.get("notes"),
            "reminder_sent": appointment_data.get("reminder_sent", False)
        }
    except Exception as e:
        print(f"Error creating appointment: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating appointment: {str(e)}"
        )

@router.get("/")
async def list_appointments(
    current_doctor: DoctorBase = Depends(get_current_doctor),
    date: str = Query(None, description="Filter by date (YYYY-MM-DD)"),
    status_filter: str = Query(None, description="Filter by status")
):
    try:
        print(f"Listing appointments for doctor: {current_doctor.badge_id}")
        
        # Build query
        query = {"doctor_id": current_doctor.badge_id}
        
        if date:
            # Filter by specific date
            query["appointment_date"] = {"$regex": f"^{date}"}
        
        if status_filter:
            query["status"] = status_filter
        
        appointments = list(db.appointments.find(query).sort("appointment_date", 1))
        
        # Convert MongoDB documents to clean dicts
        result = []
        for apt in appointments:
            # Get patient info
            patient = db.patients.find_one({"_id": ObjectId(apt["patient_id"])})
            patient_name = patient.get("name", "Unknown") if patient else "Unknown"
            
            result.append({
                "id": str(apt["_id"]),
                "patient_id": apt.get("patient_id"),
                "patient_name": patient_name,
                "doctor_id": apt.get("doctor_id"),
                "appointment_date": apt.get("appointment_date"),
                "appointment_time": apt.get("appointment_time"),
                "duration": apt.get("duration"),
                "reason": apt.get("reason"),
                "status": apt.get("status"),
                "notes": apt.get("notes"),
                "reminder_sent": apt.get("reminder_sent", False)
            })
        
        return result
    except Exception as e:
        print(f"Error listing appointments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving appointments: {str(e)}"
        )

@router.get("/today")
async def get_today_appointments(
    current_doctor: DoctorBase = Depends(get_current_doctor)
):
    try:
        today = datetime.utcnow().date().isoformat()
        print(f"Getting today's appointments for doctor: {current_doctor.badge_id}, date: {today}")
        
        appointments = list(db.appointments.find({
            "doctor_id": current_doctor.badge_id,
            "appointment_date": {"$regex": f"^{today}"}
        }).sort("appointment_time", 1))
        
        result = []
        for apt in appointments:
            patient = db.patients.find_one({"_id": ObjectId(apt["patient_id"])})
            patient_name = patient.get("name", "Unknown") if patient else "Unknown"
            patient_age = patient.get("age") if patient else None
            patient_phone = patient.get("phone") if patient else None
            
            result.append({
                "id": str(apt["_id"]),
                "patient_id": apt.get("patient_id"),
                "patient_name": patient_name,
                "patient_age": patient_age,
                "patient_phone": patient_phone,
                "appointment_time": apt.get("appointment_time"),
                "duration": apt.get("duration"),
                "reason": apt.get("reason"),
                "status": apt.get("status"),
                "notes": apt.get("notes")
            })
        
        return result
    except Exception as e:
        print(f"Error getting today's appointments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving today's appointments: {str(e)}"
        )

@router.get("/{appointment_id}")
async def get_appointment(
    appointment_id: str,
    current_doctor: DoctorBase = Depends(get_current_doctor)
):
    try:
        appointment = db.appointments.find_one({
            "_id": ObjectId(appointment_id),
            "doctor_id": current_doctor.badge_id
        })
        
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Get patient info
        patient = db.patients.find_one({"_id": ObjectId(appointment["patient_id"])})
        patient_name = patient.get("name", "Unknown") if patient else "Unknown"
        
        return {
            "id": str(appointment["_id"]),
            "patient_id": appointment.get("patient_id"),
            "patient_name": patient_name,
            "doctor_id": appointment.get("doctor_id"),
            "appointment_date": appointment.get("appointment_date"),
            "appointment_time": appointment.get("appointment_time"),
            "duration": appointment.get("duration"),
            "reason": appointment.get("reason"),
            "status": appointment.get("status"),
            "notes": appointment.get("notes"),
            "reminder_sent": appointment.get("reminder_sent", False)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting appointment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving appointment: {str(e)}"
        )

@router.put("/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    appointment: AppointmentUpdate,
    current_doctor: DoctorBase = Depends(get_current_doctor)
):
    try:
        existing = db.appointments.find_one({
            "_id": ObjectId(appointment_id),
            "doctor_id": current_doctor.badge_id
        })
        
        if not existing:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        update_data = appointment.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Convert datetime if present
        if "appointment_date" in update_data and isinstance(update_data["appointment_date"], datetime):
            update_data["appointment_date"] = update_data["appointment_date"].isoformat()
        
        result = db.appointments.update_one(
            {"_id": ObjectId(appointment_id)},
            {"$set": update_data}
        )
        
        updated = db.appointments.find_one({"_id": ObjectId(appointment_id)})
        patient = db.patients.find_one({"_id": ObjectId(updated["patient_id"])})
        patient_name = patient.get("name", "Unknown") if patient else "Unknown"
        
        return {
            "id": str(updated["_id"]),
            "patient_id": updated.get("patient_id"),
            "patient_name": patient_name,
            "doctor_id": updated.get("doctor_id"),
            "appointment_date": updated.get("appointment_date"),
            "appointment_time": updated.get("appointment_time"),
            "duration": updated.get("duration"),
            "reason": updated.get("reason"),
            "status": updated.get("status"),
            "notes": updated.get("notes"),
            "reminder_sent": updated.get("reminder_sent", False)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating appointment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating appointment: {str(e)}"
        )

@router.delete("/{appointment_id}")
async def delete_appointment(
    appointment_id: str,
    current_doctor: DoctorBase = Depends(get_current_doctor)
):
    try:
        existing = db.appointments.find_one({
            "_id": ObjectId(appointment_id),
            "doctor_id": current_doctor.badge_id
        })
        
        if not existing:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        result = db.appointments.delete_one({"_id": ObjectId(appointment_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        return {"message": "Appointment deleted successfully", "id": appointment_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting appointment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting appointment: {str(e)}"
        )
