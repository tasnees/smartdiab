import joblib
import pandas as pd

# Load the model
model = joblib.load('diabetes_model.pkl')

# Try to get feature names if available
if hasattr(model, 'feature_names_in_'):
    print("Model expects these features in this exact order:")
    for i, name in enumerate(model.feature_names_in_):
        print(f"{i+1}. {name}")
else:
    print("Model doesn't have feature names. Here's the expected order from app.py:")
    expected_features = [
        'gender', 'age', 'hypertension', 'heart_disease',
        'bmi', 'HbA1c_level', 'blood_glucose_level',
        'smoking_history_No Info', 'smoking_history_current',
        'smoking_history_ever', 'smoking_history_former',
        'smoking_history_never', 'smoking_history_not current'
    ]
    for i, feat in enumerate(expected_features):
        print(f"{i+1}. {feat}")
