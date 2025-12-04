import streamlit as st
import numpy as np
import pandas as pd
import joblib
import os
from sklearn.preprocessing import StandardScaler

# --- Load trained model ---
MODEL_PATH = 'diabetes_model.pkl'
model = None
if os.path.exists(MODEL_PATH):
    try:
        model = joblib.load(MODEL_PATH)
    except Exception as e:
        st.error(f'Failed to load model: {e}')
else:
    st.warning(f"Cannot find model file '{MODEL_PATH}' in this folder.")

# --- App Title and Layout ---
st.set_page_config(page_title='🩺 Diabetes Prediction App', layout='centered')
st.title('🩺 Diabetes Prediction App')
st.markdown('Predict diabetes risk using basic patient information!')

# --- Sidebar: User Input ---
st.sidebar.header('Patient Information')
gender = st.sidebar.selectbox('Gender', ['Male', 'Female', 'Other'])
age = st.sidebar.number_input('Age', 1, 120, 30)
hypertension = st.sidebar.selectbox('Hypertension', [0, 1])
heart_disease = st.sidebar.selectbox('Heart Disease', [0, 1])
bmi = st.sidebar.number_input('BMI', 10.0, 60.0, 25.0)
HbA1c_level = st.sidebar.number_input('HbA1c Level', 3.0, 15.0, 5.5)
blood_glucose_level = st.sidebar.number_input('Blood Glucose Level', 50, 300, 120)
smoking_history = st.sidebar.selectbox('Smoking History', ['never', 'former', 'current', 'ever', 'not current', 'No Info'])

# --- Prepare Input Data ---
input_dict = {
    'gender': gender,
    'age': age,
    'hypertension': hypertension,
    'heart_disease': heart_disease,
    'bmi': bmi,
    'HbA1c_level': HbA1c_level,
    'blood_glucose_level': blood_glucose_level,
    'smoking_history': smoking_history
}
input_df = pd.DataFrame([input_dict])

# --- Encoding Logic Matching Training ---
# Convert gender to numeric (as per model's training)
input_df['gender'] = input_df['gender'].map({'Male': 1, 'Female': 0, 'Other': 2})

# Create all smoking history columns with 0
smoke_columns = [
    'smoking_history_No Info', 'smoking_history_current',
    'smoking_history_ever', 'smoking_history_former',
    'smoking_history_never', 'smoking_history_not current'
]

# Set the selected smoking history to 1 and others to 0
for col in smoke_columns:
    input_df[col] = 0

# Set the selected smoking history to 1
selected_smoking = f'smoking_history_{smoking_history}'.replace(' ', '_')
if selected_smoking in smoke_columns:
    input_df[selected_smoking] = 1

# Ensure all required columns exist and are in the correct order
required_columns = [
    'gender', 'age', 'hypertension', 'heart_disease',
    'bmi', 'HbA1c_level', 'blood_glucose_level',
    'smoking_history_No Info', 'smoking_history_current',
    'smoking_history_ever', 'smoking_history_former',
    'smoking_history_never', 'smoking_history_not current'
]

# Create a new DataFrame with all required columns in the correct order
input_df = input_df.reindex(columns=required_columns, fill_value=0)

# --- Feature Scaling (fit with mean/std from training data) ---
# Inference scaling: we cannot fit-transform! Let's load scaler if available
scaler = None
if os.path.exists('scaler.save'):
    try:
        scaler = joblib.load('scaler.save')
    except Exception:
        scaler = None
if scaler:
    X_scaled = scaler.transform(input_df)
else:
    # If scaler missing, warn: but continue with raw values
    st.warning('Scaler file missing; using raw values for prediction.')
    X_scaled = input_df.values

# --- Prediction Button and Logic ---
if st.button('Predict Diabetes Risk'):
    if model is None:
        st.warning('No trained model loaded.')
    else:
        try:
            pred = model.predict(X_scaled)[0]
            if hasattr(model, 'predict_proba'):
                proba = model.predict_proba(X_scaled)[0]
                st.info(f'Probability [Non-diabetic, Diabetic]: {proba}')
            label = '🩸 Diabetic' if int(pred) == 1 else '✅ Non-Diabetic'
            st.success(f'Prediction: {label}')
        except Exception as e:
            st.error(f'Prediction failed: {e}')

st.markdown('---')
st.caption('This is a demo app based on your uploaded machine learning model.')
