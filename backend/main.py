import os
import sys

# CRITICAL: Import DNS configuration FIRST before any MongoDB/PyMongo imports
# This configures DNS resolver timeouts to prevent 20+ second hangs
import dns_config

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
import numpy as np
import pandas as pd
import joblib
from typing import List, Optional
from datetime import timedelta
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import database utilities
from database import get_database, ensure_indexes, close_mongodb_connection

# Import routers
from routes import patients, predictions, appointments
from routes import glucose, medications, lab_results, complications
from routes import nutrition, activity, messages, alerts, analytics
import auth

app = FastAPI(title="Diabetes Prediction API")

# IMPORTANT: Add CORS middleware BEFORE including routers
# Allow CORS for local frontend dev (change origins in prod)
origins = [
    "http://localhost:3000",
    "http://localhost:5173",  # Vite default port
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to initialize database
@app.on_event("startup")
async def startup_event():
    """Initialize database connection and indexes on startup"""
    try:
        logger.info("Initializing database connection...")
        db = get_database()
        logger.info("Successfully connected to MongoDB")
        
        logger.info("Creating database indexes...")
        ensure_indexes()
        logger.info("Database initialization complete")
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        # Don't prevent startup - let individual routes handle connection errors
        
# Shutdown event to close database connection
@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    logger.info("Shutting down application...")
    close_mongodb_connection()
    logger.info("Database connection closed")

# Include routers - Original features
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(patients.router, prefix="/api/patients", tags=["patients"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["appointments"])

# Include routers - Enhanced features
app.include_router(glucose.router, prefix="/api", tags=["glucose"])
app.include_router(medications.router, prefix="/api", tags=["medications"])
app.include_router(lab_results.router, prefix="/api", tags=["lab_results"])
app.include_router(complications.router, prefix="/api", tags=["complications"])
app.include_router(nutrition.router, prefix="/api", tags=["nutrition"])
app.include_router(activity.router, prefix="/api", tags=["activity"])
app.include_router(messages.router, prefix="/api", tags=["messages"])
app.include_router(alerts.router, prefix="/api", tags=["alerts"])
app.include_router(analytics.router, prefix="/api", tags=["analytics"])

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'diabetes_model.pkl')
SCALER_PATH = os.path.join(os.path.dirname(__file__), '..', 'scaler.save')

# --- Load Model and Scaler (if available) ---
model = None
scaler = None

if os.path.exists(MODEL_PATH):
    try:
        model = joblib.load(MODEL_PATH)
    except Exception as e:
        model = None
else:
    print(f"Model file not found at: {MODEL_PATH}")

if os.path.exists(SCALER_PATH):
    try:
        scaler = joblib.load(SCALER_PATH)
    except Exception:
        scaler = None

# --- Features needed for prediction ---
MODEL_FEATURES = [
    'gender', 'age', 'hypertension', 'heart_disease',
    'bmi', 'HbA1c_level', 'blood_glucose_level',
    'smoking_history_current', 'smoking_history_ever',
    'smoking_history_former', 'smoking_history_never', 'smoking_history_not current', 'smoking_history_No Info'
]
SMOKING_CATS = ['current', 'ever', 'former', 'never', 'not current', 'No Info']

class PatientData(BaseModel):
    gender: str
    age: int
    hypertension: int
    heart_disease: int
    bmi: float
    HbA1c_level: float
    blood_glucose_level: float
    smoking_history: str

@app.post("/predict")
def predict(data: PatientData):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded on server.")
    # --- Input as DataFrame ---
    df = pd.DataFrame([data.dict()])

    # --- Encoding: gender ---
    df['gender'] = df['gender'].replace({'Male': 1, 'Female': 0, 'Other': 2})
    # --- Encoding: smoking history (one-hot/label) ---
    for cat in SMOKING_CATS:
        df[f'smoking_history_{cat}'] = 1 if data.smoking_history == cat else 0
    df.drop('smoking_history', axis=1, inplace=True)
    # --- Feature Alignment ---
    for col in MODEL_FEATURES:
        if col not in df.columns:
            df[col] = 0
    df = df[MODEL_FEATURES]
    # --- Scaling ---
    X = df.values
    if scaler:
        X = scaler.transform(X)
    # --- Prediction ---
    try:
        pred = int(model.predict(X)[0])
        proba = (model.predict_proba(X)[0] if hasattr(model, "predict_proba") else None)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"prediction": pred, "probabilities": proba.tolist() if proba is not None else None}

@app.get("/")
def root():
    return {"message": "Diabetes Prediction API ready"}
