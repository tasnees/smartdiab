"""
Complication Screening API Routes
Handles diabetes complication screenings
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from models_enhanced import ComplicationScreeningCreate, ComplicationScreeningInDB, ScreeningType
from database import get_database

router = APIRouter(prefix="/screenings", tags=["Complication Screening"])

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_screening(screening: ComplicationScreeningCreate, db=Depends(get_database)):
    """Create a new complication screening record"""
    try:
        screening_dict = screening.dict(by_alias=True, exclude={"id"})
        screening_dict["created_at"] = datetime.utcnow()
        
        result = db.complication_screenings.insert_one(screening_dict)
        
        created_screening = db.complication_screenings.find_one({"_id": result.inserted_id})
        created_screening["id"] = str(created_screening.pop("_id"))
        
        return {"message": "Screening created successfully", "screening": created_screening}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating screening: {str(e)}")

@router.get("/patient/{patient_id}", response_model=List[dict])
def get_patient_screenings(
    patient_id: str,
    screening_type: Optional[ScreeningType] = None,
    db=Depends(get_database)
):
    """Get all screenings for a patient"""
    try:
        query = {"patient_id": patient_id}
        if screening_type:
            query["screening_type"] = screening_type
        
        screenings = []
        for screening in db.complication_screenings.find(query).sort("screening_date", -1):
            screening["id"] = str(screening.pop("_id"))
            screenings.append(screening)
        
        return screenings
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching screenings: {str(e)}")

@router.get("/{screening_id}", response_model=dict)
def get_screening(screening_id: str, db=Depends(get_database)):
    """Get a specific screening by ID"""
    try:
        if not ObjectId.is_valid(screening_id):
            raise HTTPException(status_code=400, detail="Invalid screening ID")
        
        screening = db.complication_screenings.find_one({"_id": ObjectId(screening_id)})
        if not screening:
            raise HTTPException(status_code=404, detail="Screening not found")
        
        screening["id"] = str(screening.pop("_id"))
        return screening
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching screening: {str(e)}")

@router.put("/{screening_id}", response_model=dict)
def update_screening(screening_id: str, screening_update: dict, db=Depends(get_database)):
    """Update a screening record"""
    try:
        if not ObjectId.is_valid(screening_id):
            raise HTTPException(status_code=400, detail="Invalid screening ID")
        
        result = db.complication_screenings.update_one(
            {"_id": ObjectId(screening_id)},
            {"$set": screening_update}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Screening not found")
        
        updated_screening = db.complication_screenings.find_one({"_id": ObjectId(screening_id)})
        updated_screening["id"] = str(updated_screening.pop("_id"))
        
        return {"message": "Screening updated successfully", "screening": updated_screening}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating screening: {str(e)}")

@router.delete("/{screening_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_screening(screening_id: str, db=Depends(get_database)):
    """Delete a screening record"""
    try:
        if not ObjectId.is_valid(screening_id):
            raise HTTPException(status_code=400, detail="Invalid screening ID")
        
        result = db.complication_screenings.delete_one({"_id": ObjectId(screening_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Screening not found")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting screening: {str(e)}")

@router.get("/patient/{patient_id}/due-screenings", response_model=dict)
def get_due_screenings(patient_id: str, db=Depends(get_database)):
    """Get screenings that are due or overdue for a patient"""
    try:
        current_date = datetime.utcnow()
        
        # Get the most recent screening of each type
        screening_types = [st.value for st in ScreeningType]
        due_screenings = []
        
        for screening_type in screening_types:
            latest_screening = db.complication_screenings.find_one(
                {"patient_id": patient_id, "screening_type": screening_type},
                sort=[("screening_date", -1)]
            )
            
            if latest_screening:
                next_due = latest_screening.get("next_screening_date")
                if next_due and next_due <= current_date:
                    due_screenings.append({
                        "screening_type": screening_type,
                        "last_screening_date": latest_screening["screening_date"],
                        "next_due_date": next_due,
                        "days_overdue": (current_date - next_due).days
                    })
            else:
                # Never had this screening
                due_screenings.append({
                    "screening_type": screening_type,
                    "last_screening_date": None,
                    "next_due_date": current_date,
                    "days_overdue": 0,
                    "status": "never_performed"
                })
        
        return {
            "patient_id": patient_id,
            "total_due": len(due_screenings),
            "due_screenings": due_screenings
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching due screenings: {str(e)}")
