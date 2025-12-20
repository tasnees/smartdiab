"""
Lab Results API Routes
Handles lab test results and tracking
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from models_enhanced import LabResultCreate, LabResultInDB, LabTestType
from database import get_database

router = APIRouter(prefix="/lab-results", tags=["Lab Results"])

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_lab_result(lab_result: LabResultCreate, db=Depends(get_database)):
    """Create a new lab result"""
    try:
        lab_result_dict = lab_result.dict(by_alias=True, exclude={"id"})
        lab_result_dict["created_at"] = datetime.utcnow()
        
        result = db.lab_results.insert_one(lab_result_dict)
        
        created_result = db.lab_results.find_one({"_id": result.inserted_id})
        created_result["id"] = str(created_result.pop("_id"))
        
        return {"message": "Lab result created successfully", "lab_result": created_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating lab result: {str(e)}")

@router.get("/patient/{patient_id}", response_model=List[dict])
def get_patient_lab_results(
    patient_id: str,
    test_type: Optional[LabTestType] = None,
    db=Depends(get_database)
):
    """Get all lab results for a patient"""
    try:
        query = {"patient_id": patient_id}
        if test_type:
            query["test_type"] = test_type
        
        lab_results = []
        for result in db.lab_results.find(query).sort("test_date", -1):
            result["id"] = str(result.pop("_id"))
            lab_results.append(result)
        
        return lab_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching lab results: {str(e)}")

@router.get("/{result_id}", response_model=dict)
def get_lab_result(result_id: str, db=Depends(get_database)):
    """Get a specific lab result by ID"""
    try:
        if not ObjectId.is_valid(result_id):
            raise HTTPException(status_code=400, detail="Invalid result ID")
        
        result = db.lab_results.find_one({"_id": ObjectId(result_id)})
        if not result:
            raise HTTPException(status_code=404, detail="Lab result not found")
        
        result["id"] = str(result.pop("_id"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching lab result: {str(e)}")

@router.put("/{result_id}", response_model=dict)
def update_lab_result(result_id: str, result_update: dict, db=Depends(get_database)):
    """Update a lab result"""
    try:
        if not ObjectId.is_valid(result_id):
            raise HTTPException(status_code=400, detail="Invalid result ID")
        
        update_result = db.lab_results.update_one(
            {"_id": ObjectId(result_id)},
            {"$set": result_update}
        )
        
        if update_result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Lab result not found")
        
        updated_result = db.lab_results.find_one({"_id": ObjectId(result_id)})
        updated_result["id"] = str(updated_result.pop("_id"))
        
        return {"message": "Lab result updated successfully", "lab_result": updated_result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating lab result: {str(e)}")

@router.delete("/{result_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lab_result(result_id: str, db=Depends(get_database)):
    """Delete a lab result"""
    try:
        if not ObjectId.is_valid(result_id):
            raise HTTPException(status_code=400, detail="Invalid result ID")
        
        result = db.lab_results.delete_one({"_id": ObjectId(result_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Lab result not found")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting lab result: {str(e)}")

@router.get("/patient/{patient_id}/trends/{test_type}", response_model=dict)
def get_lab_result_trends(patient_id: str, test_type: LabTestType, db=Depends(get_database)):
    """Get trends for a specific lab test type"""
    try:
        results = []
        for result in db.lab_results.find({
            "patient_id": patient_id,
            "test_type": test_type
        }).sort("test_date", 1):
            results.append({
                "date": result["test_date"],
                "results": result["results"],
                "abnormal_flags": result.get("abnormal_flags", [])
            })
        
        return {
            "patient_id": patient_id,
            "test_type": test_type,
            "total_tests": len(results),
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching lab result trends: {str(e)}")
