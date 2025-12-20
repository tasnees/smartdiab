"""
Activity Tracking API Routes
Handles physical activity logging
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from models_enhanced import ActivityLogCreate, ActivityLogInDB, ActivityType, ActivityIntensity
from database import get_database

router = APIRouter(prefix="/activity", tags=["Activity Tracking"])

@router.post("/logs", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_activity_log(log: ActivityLogCreate, db=Depends(get_database)):
    """Create a new activity log entry"""
    try:
        log_dict = log.dict(by_alias=True, exclude={"id"})
        log_dict["created_at"] = datetime.utcnow()
        
        result = db.activity_logs.insert_one(log_dict)
        
        created_log = db.activity_logs.find_one({"_id": result.inserted_id})
        created_log["id"] = str(created_log.pop("_id"))
        
        return {"message": "Activity log created successfully", "log": created_log}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating activity log: {str(e)}")

@router.get("/logs/patient/{patient_id}", response_model=List[dict])
def get_patient_activity_logs(
    patient_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    activity_type: Optional[ActivityType] = None,
    db=Depends(get_database)
):
    """Get activity logs for a patient"""
    try:
        query = {"patient_id": patient_id}
        
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = datetime.fromisoformat(start_date)
            if end_date:
                date_filter["$lte"] = datetime.fromisoformat(end_date)
            query["activity_datetime"] = date_filter
        
        if activity_type:
            query["activity_type"] = activity_type
        
        logs = []
        for log in db.activity_logs.find(query).sort("activity_datetime", -1):
            log["id"] = str(log.pop("_id"))
            logs.append(log)
        
        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching activity logs: {str(e)}")

@router.get("/logs/{log_id}", response_model=dict)
def get_activity_log(log_id: str, db=Depends(get_database)):
    """Get a specific activity log by ID"""
    try:
        if not ObjectId.is_valid(log_id):
            raise HTTPException(status_code=400, detail="Invalid log ID")
        
        log = db.activity_logs.find_one({"_id": ObjectId(log_id)})
        if not log:
            raise HTTPException(status_code=404, detail="Activity log not found")
        
        log["id"] = str(log.pop("_id"))
        return log
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching activity log: {str(e)}")

@router.put("/logs/{log_id}", response_model=dict)
def update_activity_log(log_id: str, log_update: dict, db=Depends(get_database)):
    """Update an activity log"""
    try:
        if not ObjectId.is_valid(log_id):
            raise HTTPException(status_code=400, detail="Invalid log ID")
        
        result = db.activity_logs.update_one(
            {"_id": ObjectId(log_id)},
            {"$set": log_update}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Activity log not found")
        
        updated_log = db.activity_logs.find_one({"_id": ObjectId(log_id)})
        updated_log["id"] = str(updated_log.pop("_id"))
        
        return {"message": "Activity log updated successfully", "log": updated_log}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating activity log: {str(e)}")

@router.delete("/logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity_log(log_id: str, db=Depends(get_database)):
    """Delete an activity log"""
    try:
        if not ObjectId.is_valid(log_id):
            raise HTTPException(status_code=400, detail="Invalid log ID")
        
        result = db.activity_logs.delete_one({"_id": ObjectId(log_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Activity log not found")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting activity log: {str(e)}")

@router.get("/logs/patient/{patient_id}/summary", response_model=dict)
def get_activity_summary(patient_id: str, days: int = 7, db=Depends(get_database)):
    """Get activity summary for a patient over a period"""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        total_duration = 0
        total_calories = 0
        activity_count = 0
        activities_by_type = {}
        
        for log in db.activity_logs.find({
            "patient_id": patient_id,
            "activity_datetime": {"$gte": start_date}
        }):
            activity_count += 1
            total_duration += log.get("duration_minutes", 0)
            total_calories += log.get("calories_burned", 0) or 0
            
            activity_type = log.get("activity_type", "other")
            activities_by_type[activity_type] = activities_by_type.get(activity_type, 0) + 1
        
        return {
            "patient_id": patient_id,
            "period_days": days,
            "total_activities": activity_count,
            "total_duration_minutes": total_duration,
            "total_calories_burned": total_calories,
            "average_daily_duration": round(total_duration / days, 2) if days > 0 else 0,
            "average_daily_calories": round(total_calories / days, 2) if days > 0 else 0,
            "activities_by_type": activities_by_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating activity summary: {str(e)}")

@router.get("/logs/patient/{patient_id}/glucose-impact", response_model=dict)
def get_activity_glucose_impact(patient_id: str, days: int = 30, db=Depends(get_database)):
    """Analyze the impact of activity on glucose levels"""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        activities_with_glucose = []
        
        for log in db.activity_logs.find({
            "patient_id": patient_id,
            "activity_datetime": {"$gte": start_date},
            "glucose_before": {"$exists": True},
            "glucose_after": {"$exists": True}
        }):
            glucose_change = log["glucose_after"] - log["glucose_before"]
            activities_with_glucose.append({
                "activity_type": log["activity_type"],
                "intensity": log["intensity"],
                "duration_minutes": log["duration_minutes"],
                "glucose_before": log["glucose_before"],
                "glucose_after": log["glucose_after"],
                "glucose_change": glucose_change
            })
        
        if not activities_with_glucose:
            return {
                "patient_id": patient_id,
                "period_days": days,
                "total_activities_with_glucose": 0,
                "average_glucose_change": 0,
                "activities": []
            }
        
        average_change = sum(a["glucose_change"] for a in activities_with_glucose) / len(activities_with_glucose)
        
        return {
            "patient_id": patient_id,
            "period_days": days,
            "total_activities_with_glucose": len(activities_with_glucose),
            "average_glucose_change": round(average_change, 2),
            "activities": activities_with_glucose
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing glucose impact: {str(e)}")
