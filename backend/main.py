import os
import sys
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
import numpy as np
import pandas as pd
import joblib
from typing import List, Optional
from datetime import timedelta

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import routers
from routes import patients, predictions, appointments
import auth

app = FastAPI(title="Diabetes Prediction API")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(patients.router, prefix="/api/patients", tags=["patients"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["appointments"])

# Allow CORS for local frontend dev (change origins in prod)
origins = [
    "http://localhost:3000",
    "http://localhost:5173",  # Vite default port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
