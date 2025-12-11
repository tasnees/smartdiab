import os
from datetime import datetime
from typing import List
import pymongo
from dotenv import load_dotenv

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status, Request
import logging

# Load environment variables
load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)

# Get MongoDB connection
def get_db():
    """Get database connection"""
    try:
        mongo_uri = os.getenv("MONGODB_URI")
        if not mongo_uri:
            logger.warning("MONGODB_URI not set, database operations will fail")
            return None
            
        client = pymongo.MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            retryWrites=True,
            w='majority'
        )
        db_name = os.getenv("DB_NAME", "smartdiab")
        db = client.get_database(db_name)
        # Test connection
        db.command('ping')
        return db
    except Exception as e:
        logger.error(f"Failed to connect to database: {str(e)}")
        return None

# Get the database connection
db = get_db()

# Function to check database connection
def check_db_connection():
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not available"
        )
    try:
        # Test the connection
        db.command('ping')
        return True
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}"
        )
from typing import List, Optional
from datetime import datetime

# Import from parent directory
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from auth import get_current_doctor
from models import PredictionCreate, PredictionInDB, DoctorBase

router = APIRouter()

# Ensure the predictions collection exists and has the correct indexes
def ensure_prediction_collection():
    try:
        # Test the database connection by pinging it
        db.command('ping')
        
        # Get collection names with error handling
        try:
            collection_names = db.list_collection_names()
        except Exception as e:
            print(f"Warning: Could not list collections: {str(e)}")
            collection_names = []
            
        # Create collection if it doesn't exist
        if 'predictions' not in collection_names:
            try:
                db.create_collection('predictions')
                print("Created 'predictions' collection")
            except Exception as e:
                if 'already exists' not in str(e):
                    raise
                print("'predictions' collection already exists")
        
        # Create indexes if they don't exist
        try:
            db.predictions.create_index([("patient_id", 1)])
            db.predictions.create_index([("doctor_id", 1)])
            db.predictions.create_index([("created_at", -1)])
            print("Ensured indexes on 'predictions' collection")
        except Exception as e:
            print(f"Warning: Could not create indexes: {str(e)}")
            
    except Exception as e:
        error_msg = f"Error ensuring prediction collection: {str(e)}"
        print(error_msg)
        # Don't raise the exception to prevent the app from failing to start
        # The actual database operations will fail gracefully later if needed

# Call the function when the module is imported
ensure_prediction_collection()

import traceback

@router.post("/")
async def create_prediction(
    prediction: PredictionCreate,
    current_doctor: DoctorBase = Depends(lambda: None),
    request: Request = None
):
    # Check database connection first
    check_db_connection()
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
        
        # Validate the database connection
        if db is None:
            error_msg = "Database connection is not available"
            logger.error(error_msg)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=error_msg
            )
        
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
        
        # Calculate prediction based on input data
        # Simple rule-based model (can be replaced with ML model later)
        risk_score = 0
        confidence_score = 0.0
        
        # Age risk (higher age = higher risk)
        age = input_data.get('age', 0)
        if age > 60:
            risk_score += 3
        elif age > 45:
            risk_score += 2
        elif age > 30:
            risk_score += 1
            
        # BMI risk
        bmi = input_data.get('bmi', 0)
        if bmi > 30:
            risk_score += 3
        elif bmi > 25:
            risk_score += 2
        elif bmi > 23:
            risk_score += 1
            
        # HbA1c risk (diabetes indicator)
        hba1c = input_data.get('HbA1c_level', 0)
        if hba1c >= 6.5:
            risk_score += 4  # Very high risk
        elif hba1c >= 5.7:
            risk_score += 3  # Pre-diabetic range
        elif hba1c >= 5.0:
            risk_score += 1
            
        # Blood glucose risk
        glucose = input_data.get('blood_glucose_level', 0)
        if glucose >= 200:
            risk_score += 4
        elif glucose >= 140:
            risk_score += 3
        elif glucose >= 100:
            risk_score += 2
            
        # Hypertension
        if input_data.get('hypertension', 0) == 1:
            risk_score += 2
            
        # Heart disease
        if input_data.get('heart_disease', 0) == 1:
            risk_score += 2
            
        # Smoking history
        if input_data.get('smoking_history', 0) == 1:
            risk_score += 1
            
        # Determine prediction (0 = low risk, 1 = high risk)
        # Threshold: if risk_score >= 8, high risk
        prediction_result = 1 if risk_score >= 8 else 0
        
        # Calculate confidence (0.0 to 1.0)
        # Higher risk score = higher confidence
        max_possible_score = 19  # Maximum possible risk score
        confidence_score = min(0.95, max(0.55, (risk_score / max_possible_score) + 0.5))
        
        print(f"Risk score: {risk_score}, Prediction: {prediction_result}, Confidence: {confidence_score:.2f}")
        
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