import os
import joblib
import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

# Paths to model and scaler
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'diabetes_model.pkl')
SCALER_PATH = os.path.join(os.path.dirname(__file__), '..', 'scaler.save')

# Features needed for prediction (order matters!)
MODEL_FEATURES = [
    'gender', 'age', 'hypertension', 'heart_disease',
    'bmi', 'HbA1c_level', 'blood_glucose_level',
    'smoking_history_current', 'smoking_history_ever',
    'smoking_history_former', 'smoking_history_never', 'smoking_history_not current', 'smoking_history_No Info'
]

SMOKING_CATS = ['current', 'ever', 'former', 'never', 'not current', 'No Info']

_model = None
_scaler = None

def get_model():
    global _model
    if _model is None:
        if os.path.exists(MODEL_PATH):
            try:
                _model = joblib.load(MODEL_PATH)
                logger.info(f"Model loaded successfully from {MODEL_PATH}")
            except Exception as e:
                logger.error(f"Failed to load model: {e}")
        else:
            logger.warning(f"Model file not found at: {MODEL_PATH}")
    return _model

def get_scaler():
    global _scaler
    if _scaler is None:
        if os.path.exists(SCALER_PATH):
            try:
                _scaler = joblib.load(SCALER_PATH)
                logger.info(f"Scaler loaded successfully from {SCALER_PATH}")
            except Exception as e:
                logger.error(f"Failed to load scaler: {e}")
    return _scaler

def predict_diabetes(data: dict):
    """
    Predict diabetes risk using the ML model.
    data: dictionary containing gender, age, hypertension, heart_disease, bmi, HbA1c_level, blood_glucose_level, smoking_history
    """
    model = get_model()
    scaler = get_scaler()
    
    if model is None:
        return None, None, "Model not loaded"

    try:
        # Prepare DataFrame
        df = pd.DataFrame([data])

        # Encoding: gender
        if 'gender' in df.columns:
            df['gender'] = df['gender'].replace({'Male': 1, 'Female': 0, 'Other': 2})
        
        # Encoding: smoking history
        smoking_history = data.get('smoking_history', 'No Info')
        for cat in SMOKING_CATS:
            df[f'smoking_history_{cat}'] = 1 if smoking_history == cat else 0
        
        if 'smoking_history' in df.columns:
            df.drop('smoking_history', axis=1, inplace=True)

        # Feature Alignment
        for col in MODEL_FEATURES:
            if col not in df.columns:
                df[col] = 0
        df = df[MODEL_FEATURES]

        # Scaling
        X = df.values
        if scaler:
            X = scaler.transform(X)

        # Prediction
        pred = int(model.predict(X)[0])
        proba = model.predict_proba(X)[0] if hasattr(model, "predict_proba") else None
        
        # Confidence is the probability of the predicted class
        confidence = proba[pred] if proba is not None else 0.85 # Fallback confidence
        
        return pred, confidence, None
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return None, None, str(e)
