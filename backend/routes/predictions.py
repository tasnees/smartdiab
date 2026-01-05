import os
from datetime import datetime
from typing import List, Optional
import logging
from dotenv import load_dotenv

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status, Request

# Load environment variables
load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)

# Import from parent directory
from auth import get_current_doctor
from models import PredictionCreate, PredictionInDB, DoctorBase
from database import get_database
from ml_utils import predict_diabetes

router = APIRouter()

# Get the database connection
db = get_database()

import traceback

@router.post("/")
async def create_prediction(
    prediction: PredictionCreate,
    current_doctor: DoctorBase = Depends(get_current_doctor),
    request: Request = None
):
    """
    Create a new prediction record.
    
    This endpoint accepts prediction data, validates it, and stores it in the database.
    It requires either a valid doctor token or a doctor_id in the request body.
    """
    try:
        # Log the incoming request
        print("\n=== New Prediction Request ===")
        print(f"Request Headers: {dict(request.headers) if request else 'No request object'}")
        print(f"Received prediction data: {prediction.dict()}")
        
        # Convert prediction model to dict
        prediction_data = prediction.dict()
        
        # Log doctor information
        print(f"Current doctor from token: {current_doctor}")
        print(f"Doctor ID in request: {prediction_data.get('doctor_id')}")
        
        # Determine the doctor ID to use
        doctor_id = None
        if current_doctor and hasattr(current_doctor, 'badge_id'):
            doctor_id = current_doctor.badge_id
            print(f"Using doctor ID from token: {doctor_id}")
        elif 'doctor_id' in prediction_data and prediction_data['doctor_id']:
            doctor_id = prediction_data['doctor_id']
            print(f"Using doctor ID from request: {doctor_id}")
        
        # Ensure we have a valid doctor ID
        if not doctor_id:
            error_msg = "Doctor ID is required. Please provide a valid doctor ID or use a valid authentication token."
            logger.error(error_msg)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
            
        # Validate patient_id is present
        if not prediction_data.get('patient_id'):
            error_msg = "Patient ID is required"
            logger.error(error_msg)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
            
        # Update the doctor_id in the prediction data
        prediction_data["doctor_id"] = doctor_id
            
        # Add timestamps
        now = datetime.utcnow()
        prediction_data["created_at"] = now
        prediction_data["updated_at"] = now
        
        # Validate input_data
        input_data = prediction_data.get('input_data', {})
        if not isinstance(input_data, dict):
            error_msg = f"input_data must be a dictionary, got {type(input_data).__name__}"
            logger.error(error_msg)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
            
        # Validate required input fields
        # Updated to match the new diabetes dataset fields
        required_fields = ['gender', 'age', 'hypertension', 'heart_disease',
                         'bmi', 'HbA1c_level', 'blood_glucose_level', 'smoking_history']
        missing_fields = [field for field in required_fields if field not in input_data]
        
        if missing_fields:
            error_msg = f"Missing required fields in input_data: {', '.join(missing_fields)}"
            logger.error(error_msg)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
        
        # Try to use ML model for prediction
        ml_pred, ml_conf, ml_error = predict_diabetes(input_data)
        
        if ml_pred is not None:
            prediction_result = ml_pred
            confidence_score = ml_conf
            print(f"ML Prediction: {prediction_result}, Confidence: {confidence_score:.2f}")
        else:
            print(f"ML Prediction failed ({ml_error}), falling back to rule-based")
            # Fallback to rule-based model
            risk_score_internal = 0
            
            # Age risk
            age = input_data.get('age', 0)
            if age > 60: risk_score_internal += 3
            elif age > 45: risk_score_internal += 2
            elif age > 30: risk_score_internal += 1
                
            # BMI risk
            bmi = input_data.get('bmi', 0)
            if bmi > 30: risk_score_internal += 3
            elif bmi > 25: risk_score_internal += 2
            elif bmi > 23: risk_score_internal += 1
                
            # HbA1c risk
            hba1c = input_data.get('HbA1c_level', 0)
            if hba1c >= 6.5: risk_score_internal += 4
            elif hba1c >= 5.7: risk_score_internal += 3
            elif hba1c >= 5.0: risk_score_internal += 1
                
            # Blood glucose risk
            glucose = input_data.get('blood_glucose_level', 0)
            if glucose >= 200: risk_score_internal += 4
            elif glucose >= 140: risk_score_internal += 3
            elif glucose >= 100: risk_score_internal += 2
                
            if input_data.get('hypertension', 0) == 1: risk_score_internal += 2
            if input_data.get('heart_disease', 0) == 1: risk_score_internal += 2
            if input_data.get('smoking_history', 'never') != 'never': risk_score_internal += 1
                
            prediction_result = 1 if risk_score_internal >= 8 else 0
            max_possible_score = 19
            confidence_score = min(0.95, max(0.55, (risk_score_internal / max_possible_score) + 0.5))
            risk_score = risk_score_internal # Use for alerts
        
        # Ensure risk_score is defined for alerts even if using ML
        if ml_pred is not None:
            # Recompute a rough risk score for alerts title if we used ML
            risk_score = 12 if prediction_result == 1 else 4
        
        print(f"Final Prediction: {prediction_result}, Confidence: {confidence_score:.2f}")
        
        # Prepare the document to insert
        prediction_doc = {
            "patient_id": prediction_data['patient_id'],
            "doctor_id": doctor_id,
            "input_data": input_data,
            "prediction": prediction_result,  # Use calculated prediction
            "confidence": round(confidence_score, 2),  # Use calculated confidence
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Log the data being inserted (without sensitive info)
        log_doc = prediction_doc.copy()
        log_doc['input_data'] = {k: v for k, v in log_doc['input_data'].items() if k in required_fields}
        print(f"Attempting to insert prediction with data: {log_doc}")
        
        try:
            # Insert the prediction
            result = db.predictions.insert_one(prediction_doc)
            print(f"Insert successful, document ID: {result.inserted_id}")
            
            # Get the inserted document
            inserted = db.predictions.find_one({"_id": result.inserted_id})
            
            if not inserted:
                error_msg = "Failed to retrieve created prediction after insertion"
                logger.error(error_msg)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=error_msg
                )
                
            # Convert ObjectId to string for the response
            inserted["id"] = str(inserted.pop("_id"))
            
            # Convert datetime objects to ISO format strings for JSON serialization
            if "created_at" in inserted:
                inserted["created_at"] = inserted["created_at"].isoformat() if inserted["created_at"] else None
            if "updated_at" in inserted:
                inserted["updated_at"] = inserted["updated_at"].isoformat() if inserted["updated_at"] else None
            
            print("Successfully created prediction:", inserted)
            
            # Auto-create alert for high-risk predictions
            if prediction_result == 1:  # High risk
                # Determine risk level based on score
                if risk_score >= 12:
                    severity = "critical"
                    risk_level = "VERY HIGH"
                else:
                    severity = "warning"
                    risk_level = "HIGH"
                
                # Calculate risk percentage
                risk_percentage = min(99, max(60, (risk_score / max_possible_score) * 100))
                
                alert = {
                    "patient_id": prediction_data['patient_id'],
                    "doctor_id": doctor_id,
                    "alert_type": "high_risk_prediction",
                    "severity": severity,
                    "title": f"{risk_level} Diabetes Risk Detected",
                    "message": f"Patient has been identified as {risk_level} RISK for diabetes (Risk Score: {risk_score}/19, {risk_percentage:.1f}%). Immediate attention recommended.",
                    "acknowledged": False,
                    "created_at": datetime.utcnow()
                }
                db.alerts.insert_one(alert)
                print(f"Auto-created {severity} alert for high-risk prediction")
            
            # Return a clean dict without any MongoDB-specific objects
            return {
                "id": inserted["id"],
                "patient_id": inserted["patient_id"],
                "doctor_id": inserted["doctor_id"],
                "input_data": dict(inserted["input_data"]),  # Ensure it's a plain dict
                "prediction": inserted.get("prediction"),
                "confidence": inserted.get("confidence"),
                "created_at": inserted.get("created_at"),
                "updated_at": inserted.get("updated_at")
            }
            
        except Exception as db_error:
            error_trace = traceback.format_exc()
            print(f"Database error: {str(db_error)}\n{error_trace}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(db_error)}"
            )
        
    except HTTPException as he:
        print(f"HTTP Exception ({he.status_code}): {he.detail}")
        raise he
        
    except Exception as e:
        # Log the full traceback for debugging
        error_trace = traceback.format_exc()
        error_msg = f"Unexpected error creating prediction: {str(e)}"
        print(f"{error_msg}\n{error_trace}")
        
        # Return a more detailed error message
        error_detail = error_msg
        if any(err in str(e).lower() for err in ["duplicate key", "duplicatekey"]):
            error_detail = "A prediction with this ID already exists"
        elif any(err in str(e).lower() for err in ["validation", "invalid"]):
            error_detail = f"Validation error: {str(e)}"
            
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail
        )
@router.get("/")
async def list_predictions(
    current_doctor: DoctorBase = Depends(get_current_doctor)
):
    """
    Get all predictions made by the current doctor.
    """
    try:
        print(f"Listing all predictions for doctor: {current_doctor.badge_id}")
        
        # Find all predictions made by this doctor
        predictions = list(db.predictions.find({
            "doctor_id": current_doctor.badge_id
        }).sort("created_at", -1))
        
        # Convert to clean dicts
        result = []
        for pred in predictions:
            pred_dict = {
                "id": str(pred["_id"]),
                "patient_id": pred.get("patient_id"),
                "doctor_id": pred.get("doctor_id"),
                "prediction": pred.get("prediction"),
                "confidence": pred.get("confidence"),
                "input_data": pred.get("input_data", {}),
                "created_at": pred.get("created_at").isoformat() if pred.get("created_at") else None,
                "updated_at": pred.get("updated_at").isoformat() if pred.get("updated_at") else None
            }
            result.append(pred_dict)
            
        return result
        
    except Exception as e:
        print(f"Error listing all predictions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving predictions: {str(e)}"
        )

@router.get("/patients/{patient_id}/")
async def get_patient_predictions(
    patient_id: str,
    current_doctor: DoctorBase = Depends(get_current_doctor)
):
    """
    Get all predictions for a specific patient.
    """
    try:
        print(f"Fetching predictions for patient: {patient_id}")
        
        # Find all predictions for this patient
        predictions = list(db.predictions.find({
            "patient_id": patient_id
        }).sort("created_at", -1))  # Sort by newest first
        
        print(f"Found {len(predictions)} predictions for patient {patient_id}")
        
        # Convert MongoDB documents to JSON-serializable dicts
        result = []
        for pred in predictions:
            pred_dict = {
                "id": str(pred["_id"]),
                "patient_id": pred.get("patient_id"),
                "doctor_id": pred.get("doctor_id"),
                "prediction": pred.get("prediction"),
                "confidence": pred.get("confidence"),
                "input_data": pred.get("input_data", {}),
                "created_at": pred.get("created_at").isoformat() if pred.get("created_at") else None,
                "updated_at": pred.get("updated_at").isoformat() if pred.get("updated_at") else None
            }
            result.append(pred_dict)
        
        return result
        
    except Exception as e:
        print(f"Error getting predictions: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving predictions: {str(e)}"
        )