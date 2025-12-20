"""
Nutrition Tracking API Routes
Handles meal logging and nutrition tracking
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from models_enhanced import NutritionLogCreate, NutritionLogInDB, MealType
from database import get_database

router = APIRouter(prefix="/nutrition", tags=["Nutrition Tracking"])

@router.post("/logs", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_nutrition_log(log: NutritionLogCreate, db=Depends(get_database)):
    """Create a new nutrition log entry"""
    try:
        log_dict = log.dict(by_alias=True, exclude={"id"})
        log_dict["created_at"] = datetime.utcnow()
        
        result = db.nutrition_logs.insert_one(log_dict)
        
        created_log = db.nutrition_logs.find_one({"_id": result.inserted_id})
        created_log["id"] = str(created_log.pop("_id"))
        
        return {"message": "Nutrition log created successfully", "log": created_log}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating nutrition log: {str(e)}")

@router.get("/logs/patient/{patient_id}", response_model=List[dict])
def get_patient_nutrition_logs(
    patient_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    meal_type: Optional[MealType] = None,
    db=Depends(get_database)
):
    """Get nutrition logs for a patient"""
    try:
        query = {"patient_id": patient_id}
        
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = datetime.fromisoformat(start_date)
            if end_date:
                date_filter["$lte"] = datetime.fromisoformat(end_date)
            query["meal_datetime"] = date_filter
        
        if meal_type:
            query["meal_type"] = meal_type
        
        logs = []
        for log in db.nutrition_logs.find(query).sort("meal_datetime", -1):
            log["id"] = str(log.pop("_id"))
            logs.append(log)
        
        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching nutrition logs: {str(e)}")

@router.get("/logs/{log_id}", response_model=dict)
def get_nutrition_log(log_id: str, db=Depends(get_database)):
    """Get a specific nutrition log by ID"""
    try:
        if not ObjectId.is_valid(log_id):
            raise HTTPException(status_code=400, detail="Invalid log ID")
        
        log = db.nutrition_logs.find_one({"_id": ObjectId(log_id)})
        if not log:
            raise HTTPException(status_code=404, detail="Nutrition log not found")
        
        log["id"] = str(log.pop("_id"))
        return log
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching nutrition log: {str(e)}")

@router.put("/logs/{log_id}", response_model=dict)
def update_nutrition_log(log_id: str, log_update: dict, db=Depends(get_database)):
    """Update a nutrition log"""
    try:
        if not ObjectId.is_valid(log_id):
            raise HTTPException(status_code=400, detail="Invalid log ID")
        
        result = db.nutrition_logs.update_one(
            {"_id": ObjectId(log_id)},
            {"$set": log_update}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Nutrition log not found")
        
        updated_log = db.nutrition_logs.find_one({"_id": ObjectId(log_id)})
        updated_log["id"] = str(updated_log.pop("_id"))
        
        return {"message": "Nutrition log updated successfully", "log": updated_log}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating nutrition log: {str(e)}")

@router.delete("/logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nutrition_log(log_id: str, db=Depends(get_database)):
    """Delete a nutrition log"""
    try:
        if not ObjectId.is_valid(log_id):
            raise HTTPException(status_code=400, detail="Invalid log ID")
        
        result = db.nutrition_logs.delete_one({"_id": ObjectId(log_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Nutrition log not found")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting nutrition log: {str(e)}")

@router.get("/logs/patient/{patient_id}/summary", response_model=dict)
def get_nutrition_summary(patient_id: str, days: int = 7, db=Depends(get_database)):
    """Get nutrition summary for a patient over a period"""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        total_carbs = 0
        total_calories = 0
        total_protein = 0
        total_fat = 0
        meal_count = 0
        
        for log in db.nutrition_logs.find({
            "patient_id": patient_id,
            "meal_datetime": {"$gte": start_date}
        }):
            meal_count += 1
            total_carbs += log.get("total_carbs", 0) or 0
            total_calories += log.get("total_calories", 0) or 0
            total_protein += log.get("total_protein", 0) or 0
            total_fat += log.get("total_fat", 0) or 0
        
        return {
            "patient_id": patient_id,
            "period_days": days,
            "total_meals_logged": meal_count,
            "average_daily_carbs": round(total_carbs / days, 2) if days > 0 else 0,
            "average_daily_calories": round(total_calories / days, 2) if days > 0 else 0,
            "average_daily_protein": round(total_protein / days, 2) if days > 0 else 0,
            "average_daily_fat": round(total_fat / days, 2) if days > 0 else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating nutrition summary: {str(e)}")
