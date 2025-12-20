"""
Glucose Monitoring API Routes (FIXED for synchronous MongoDB)
Handles blood glucose readings and HbA1c tracking
"""

from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from models_enhanced import (
    GlucoseReadingCreate, GlucoseReadingInDB,
    HbA1cReadingCreate, HbA1cReadingInDB,
    GlucoseReadingType
)
from database import get_database

router = APIRouter(prefix="/glucose", tags=["Glucose Monitoring"])

# ============================================================================
# GLUCOSE READINGS
# ============================================================================

@router.post("/readings", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_glucose_reading(reading: GlucoseReadingCreate):
    """Create a new glucose reading"""
    try:
        db = get_database()
        # Use dict() for Pydantic v1 compatibility (model_dump() is Pydantic v2)
        reading_dict = reading.dict(by_alias=True, exclude={"id"})
        reading_dict["created_at"] = datetime.utcnow()
        
        result = db.glucose_readings.insert_one(reading_dict)
        
        created_reading = db.glucose_readings.find_one({"_id": result.inserted_id})
        created_reading["id"] = str(created_reading.pop("_id"))
        
        # Auto-create alerts for out-of-range glucose (wrapped in try-except to not break main flow)
        alert_created = False
        try:
            glucose_value = reading_dict["glucose_value"]
            patient_id = reading_dict["patient_id"]
            
            # Get patient's doctor_id (patient_id might be string or ObjectId)
            doctor_id = None
            try:
                if isinstance(patient_id, str) and ObjectId.is_valid(patient_id):
                    patient = db.patients.find_one({"_id": ObjectId(patient_id)})
                else:
                    patient = db.patients.find_one({"_id": patient_id})
                doctor_id = patient.get("doctor_id") if patient else None
            except Exception as e:
                print(f"Warning: Could not get doctor_id: {e}")
                doctor_id = None
            
            if glucose_value < 70:
                # Critical low glucose
                alert = {
                    "patient_id": patient_id,
                    "doctor_id": doctor_id,
                    "alert_type": "critical_glucose",
                    "severity": "critical",
                    "title": "Critical Low Glucose",
                    "message": f"Patient glucose level is critically low ({glucose_value} mg/dL). Immediate attention required.",
                    "acknowledged": False,
                    "created_at": datetime.utcnow()
                }
                db.alerts.insert_one(alert)
                alert_created = True
            elif glucose_value > 300:
                # Critical high glucose
                alert = {
                    "patient_id": patient_id,
                    "doctor_id": doctor_id,
                    "alert_type": "critical_glucose",
                    "severity": "critical",
                    "title": "Critical High Glucose",
                    "message": f"Patient glucose level is critically high ({glucose_value} mg/dL). Immediate attention required.",
                    "acknowledged": False,
                    "created_at": datetime.utcnow()
                }
                db.alerts.insert_one(alert)
                alert_created = True
            elif glucose_value > 250:
                # Warning high glucose
                alert = {
                    "patient_id": patient_id,
                    "doctor_id": doctor_id,
                    "alert_type": "critical_glucose",
                    "severity": "warning",
                    "title": "High Glucose Level",
                    "message": f"Patient glucose level is high ({glucose_value} mg/dL). Attention recommended.",
                    "acknowledged": False,
                    "created_at": datetime.utcnow()
                }
                db.alerts.insert_one(alert)
                alert_created = True
        except Exception as alert_error:
            # Log alert creation error but don't fail the whole request
            print(f"Warning: Failed to create alert: {alert_error}")
            import traceback
            traceback.print_exc()
        
        message = "Glucose reading created successfully"
        if alert_created:
            message += " and alert generated"
        
        return {"message": message, "reading": created_reading}
    except Exception as e:
        print(f"Error creating glucose reading: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error creating glucose reading: {str(e)}")

@router.get("/readings/patient/{patient_id}", response_model=List[dict])
def get_patient_glucose_readings(
    patient_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    reading_type: Optional[GlucoseReadingType] = None
):
    """Get all glucose readings for a patient with optional filters"""
    try:
        print(f"Getting glucose readings for patient: {patient_id}")
        db = get_database()
        query = {"patient_id": patient_id}
        
        # Add date range filter
        if start_date or end_date:
            date_filter = {}
            if start_date:
                try:
                    date_filter["$gte"] = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                except Exception as date_error:
                    print(f"Warning: Invalid start_date format: {start_date}, error: {date_error}")
            if end_date:
                try:
                    date_filter["$lte"] = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                except Exception as date_error:
                    print(f"Warning: Invalid end_date format: {end_date}, error: {date_error}")
            if date_filter:
                query["reading_datetime"] = date_filter
        
        # Add reading type filter
        if reading_type:
            query["reading_type"] = reading_type
        
        print(f"Query: {query}")
        readings = []
        for reading in db.glucose_readings.find(query).sort("reading_datetime", -1):
            reading["id"] = str(reading.pop("_id"))
            readings.append(reading)
        
        print(f"Found {len(readings)} glucose readings")
        return readings
    except Exception as e:
        print(f"Error fetching glucose readings: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching glucose readings: {str(e)}")

@router.get("/readings/{reading_id}", response_model=dict)
def get_glucose_reading(reading_id: str):
    """Get a specific glucose reading by ID"""
    try:
        db = get_database()
        if not ObjectId.is_valid(reading_id):
            raise HTTPException(status_code=400, detail="Invalid reading ID")
        
        reading = db.glucose_readings.find_one({"_id": ObjectId(reading_id)})
        if not reading:
            raise HTTPException(status_code=404, detail="Glucose reading not found")
        
        reading["id"] = str(reading.pop("_id"))
        return reading
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching glucose reading: {str(e)}")

@router.delete("/readings/{reading_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_glucose_reading(reading_id: str):
    """Delete a glucose reading"""
    try:
        db = get_database()
        if not ObjectId.is_valid(reading_id):
            raise HTTPException(status_code=400, detail="Invalid reading ID")
        
        result = db.glucose_readings.delete_one({"_id": ObjectId(reading_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Glucose reading not found")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting glucose reading: {str(e)}")

@router.get("/readings/patient/{patient_id}/statistics", response_model=dict)
def get_glucose_statistics(patient_id: str, days: int = 30):
    """Get glucose statistics for a patient over a specified period"""
    try:
        db = get_database()
        start_date = datetime.utcnow() - timedelta(days=days)
        
        readings = []
        for reading in db.glucose_readings.find({
            "patient_id": patient_id,
            "reading_datetime": {"$gte": start_date}
        }):
            readings.append(reading["glucose_value"])
        
        if not readings:
            return {
                "patient_id": patient_id,
                "period_days": days,
                "total_readings": 0,
                "average": 0,
                "min": 0,
                "max": 0,
                "time_in_range": 0,
                "time_above_range": 0,
                "time_below_range": 0
            }
        
        # Calculate statistics
        average = sum(readings) / len(readings)
        min_glucose = min(readings)
        max_glucose = max(readings)
        
        # Time in range (70-180 mg/dL is typical target)
        in_range = sum(1 for r in readings if 70 <= r <= 180)
        above_range = sum(1 for r in readings if r > 180)
        below_range = sum(1 for r in readings if r < 70)
        
        return {
            "patient_id": patient_id,
            "period_days": days,
            "total_readings": len(readings),
            "average": round(average, 2),
            "min": min_glucose,
            "max": max_glucose,
            "time_in_range": round((in_range / len(readings)) * 100, 2),
            "time_above_range": round((above_range / len(readings)) * 100, 2),
            "time_below_range": round((below_range / len(readings)) * 100, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating statistics: {str(e)}")

# ============================================================================
# HbA1c READINGS
# ============================================================================

@router.post("/hba1c", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_hba1c_reading(reading: HbA1cReadingCreate):
    """Create a new HbA1c reading"""
    try:
        db = get_database()
        reading_dict = reading.dict(by_alias=True, exclude={"id"})
        reading_dict["created_at"] = datetime.utcnow()
        
        result = db.hba1c_readings.insert_one(reading_dict)
        
        created_reading = db.hba1c_readings.find_one({"_id": result.inserted_id})
        created_reading["id"] = str(created_reading.pop("_id"))
        
        return {"message": "HbA1c reading created successfully", "reading": created_reading}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating HbA1c reading: {str(e)}")

@router.get("/hba1c/patient/{patient_id}", response_model=List[dict])
def get_patient_hba1c_readings(patient_id: str):
    """Get all HbA1c readings for a patient"""
    try:
        db = get_database()
        readings = []
        for reading in db.hba1c_readings.find({"patient_id": patient_id}).sort("test_date", -1):
            reading["id"] = str(reading.pop("_id"))
            readings.append(reading)
        
        return readings
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching HbA1c readings: {str(e)}")

@router.get("/hba1c/{reading_id}", response_model=dict)
def get_hba1c_reading(reading_id: str):
    """Get a specific HbA1c reading by ID"""
    try:
        db = get_database()
        if not ObjectId.is_valid(reading_id):
            raise HTTPException(status_code=400, detail="Invalid reading ID")
        
        reading = db.hba1c_readings.find_one({"_id": ObjectId(reading_id)})
        if not reading:
            raise HTTPException(status_code=404, detail="HbA1c reading not found")
        
        reading["id"] = str(reading.pop("_id"))
        return reading
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching HbA1c reading: {str(e)}")

@router.delete("/hba1c/{reading_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hba1c_reading(reading_id: str):
    """Delete an HbA1c reading"""
    try:
        db = get_database()
        if not ObjectId.is_valid(reading_id):
            raise HTTPException(status_code=400, detail="Invalid reading ID")
        
        result = db.hba1c_readings.delete_one({"_id": ObjectId(reading_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="HbA1c reading not found")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting HbA1c reading: {str(e)}")

@router.get("/hba1c/patient/{patient_id}/trend", response_model=dict)
def get_hba1c_trend(patient_id: str):
    """Get HbA1c trend analysis for a patient"""
    try:
        db = get_database()
        readings = []
        for reading in db.hba1c_readings.find({"patient_id": patient_id}).sort("test_date", 1):
            readings.append({
                "date": reading["test_date"],
                "value": reading["hba1c_value"]
            })
        
        if len(readings) < 2:
            return {
                "patient_id": patient_id,
                "total_readings": len(readings),
                "trend": "insufficient_data",
                "latest_value": readings[0]["value"] if readings else None,
                "change": 0
            }
        
        # Calculate trend
        latest = readings[-1]["value"]
        previous = readings[-2]["value"]
        change = latest - previous
        
        if change < -0.5:
            trend = "improving"
        elif change > 0.5:
            trend = "worsening"
        else:
            trend = "stable"
        
        return {
            "patient_id": patient_id,
            "total_readings": len(readings),
            "trend": trend,
            "latest_value": latest,
            "previous_value": previous,
            "change": round(change, 2),
            "readings": readings
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating HbA1c trend: {str(e)}")
