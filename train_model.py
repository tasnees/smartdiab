import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from imblearn.over_sampling import SMOTE
import joblib

# Load dataset
df = pd.read_csv("diabetes_prediction_dataset.csv")

# Preprocessing
df['gender'] = df['gender'].replace({'Male': 1, 'Female': 0, 'Other': 2})
df = pd.get_dummies(df, columns=['smoking_history'], drop_first=False) # Keep all categories

# Define features and target
X = df.drop('diabetes', axis=1)
y = df['diabetes']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

# Handle class imbalance with SMOTE
smote = SMOTE(random_state=42)
X_train_res, y_train_res = smote.fit_resample(X_train, y_train)

# Feature Scaling
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train_res)

# Train Random Forest model
rf = RandomForestClassifier(random_state=42)
rf.fit(X_train_scaled, y_train_res)

# Save the model and scaler
joblib.dump(rf, 'diabetes_model.pkl')
joblib.dump(scaler, 'scaler.save')

print("Model and scaler have been saved successfully.")
