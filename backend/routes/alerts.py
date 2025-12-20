"""
Alerts & Notifications API Routes
Handles system alerts and notifications
"""

from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from models_enhanced import AlertCreate, AlertInDB, AlertType, AlertSeverity
from database import get_database

router = APIRouter(prefix="/alerts", tags=["Alerts & Notifications"])

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_alert(alert: AlertCreate):
    """Create a new alert"""
    try:
        db = get_database()
        alert_dict = alert.dict(by_alias=True, exclude={"id"})
        alert_dict["created_at"] = datetime.utcnow()
        
        result = db.alerts.insert_one(alert_dict)
        
        created_alert = db.alerts.find_one({"_id": result.inserted_id})
        created_alert["id"] = str(created_alert.pop("_id"))
        
        return {"message": "Alert created successfully", "alert": created_alert}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating alert: {str(e)}")

@router.get("/patient/{patient_id}", response_model=List[dict])
def get_patient_alerts(
    patient_id: str,
    acknowledged: Optional[bool] = None,
    severity: Optional[AlertSeverity] = None
):
    """Get alerts for a patient"""
    try:
        db = get_database()
        query = {"patient_id": patient_id}
        
        if acknowledged is not None:
            query["acknowledged"] = acknowledged
        
        if severity:
            query["severity"] = severity
        
        alerts = []
        for alert in db.alerts.find(query).sort("created_at", -1):
            alert["id"] = str(alert.pop("_id"))
            alerts.append(alert)
        
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching patient alerts: {str(e)}")

@router.get("/doctor/{doctor_id}", response_model=List[dict])
def get_doctor_alerts(
    doctor_id: str,
    acknowledged: Optional[bool] = None,
    severity: Optional[AlertSeverity] = None
):
    """Get alerts for a doctor"""
    try:
        db = get_database()
        query = {"doctor_id": doctor_id}
        
        if acknowledged is not None:
            query["acknowledged"] = acknowledged
        
        if severity:
            query["severity"] = severity
        
        alerts = []
        for alert in db.alerts.find(query).sort("created_at", -1):
            alert["id"] = str(alert.pop("_id"))
            alerts.append(alert)
        
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching doctor alerts: {str(e)}")

@router.get("/{alert_id}", response_model=dict)
def get_alert(alert_id: str):
    """Get a specific alert by ID"""
    try:
        db = get_database()
        if not ObjectId.is_valid(alert_id):
            raise HTTPException(status_code=400, detail="Invalid alert ID")
        
        alert = db.alerts.find_one({"_id": ObjectId(alert_id)})
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        alert["id"] = str(alert.pop("_id"))
        return alert
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alert: {str(e)}")

@router.put("/{alert_id}/acknowledge", response_model=dict)
def acknowledge_alert(alert_id: str, acknowledged_by: str, action_taken: Optional[str] = None):
    """Acknowledge an alert"""
    try:
        db = get_database()
        if not ObjectId.is_valid(alert_id):
            raise HTTPException(status_code=400, detail="Invalid alert ID")
        
        update_data = {
            "acknowledged": True,
            "acknowledged_at": datetime.utcnow(),
            "acknowledged_by": acknowledged_by
        }
        
        if action_taken:
            update_data["action_taken"] = action_taken
        
        result = db.alerts.update_one(
            {"_id": ObjectId(alert_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        updated_alert = db.alerts.find_one({"_id": ObjectId(alert_id)})
        updated_alert["id"] = str(updated_alert.pop("_id"))
        
        return {"message": "Alert acknowledged successfully", "alert": updated_alert}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error acknowledging alert: {str(e)}")

@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(alert_id: str):
    """Delete an alert"""
    try:
        db = get_database()
        if not ObjectId.is_valid(alert_id):
            raise HTTPException(status_code=400, detail="Invalid alert ID")
        
        result = db.alerts.delete_one({"_id": ObjectId(alert_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting alert: {str(e)}")

@router.get("/patient/{patient_id}/critical", response_model=List[dict])
def get_critical_alerts(patient_id: str):
    """Get critical unacknowledged alerts for a patient"""
    try:
        db = get_database()
        alerts = []
        for alert in db.alerts.find({
            "patient_id": patient_id,
            "severity": "critical",
            "acknowledged": False
        }).sort("created_at", -1):
            alert["id"] = str(alert.pop("_id"))
            alerts.append(alert)
        
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching critical alerts: {str(e)}")

@router.get("/doctor/{doctor_id}/summary", response_model=dict)
def get_alerts_summary(doctor_id: str):
    """Get summary of alerts for a doctor"""
    try:
        db = get_database()
        total_alerts = db.alerts.count_documents({"doctor_id": doctor_id})
        unacknowledged = db.alerts.count_documents({"doctor_id": doctor_id, "acknowledged": False})
        critical = db.alerts.count_documents({"doctor_id": doctor_id, "severity": "critical", "acknowledged": False})
        warning = db.alerts.count_documents({"doctor_id": doctor_id, "severity": "warning", "acknowledged": False})
        
        return {
            "doctor_id": doctor_id,
            "total_alerts": total_alerts,
            "unacknowledged": unacknowledged,
            "critical_unacknowledged": critical,
            "warning_unacknowledged": warning
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alerts summary: {str(e)}")
