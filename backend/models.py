from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from enum import Enum

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)
        
    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

class DoctorBase(BaseModel):
    name: str
    badge_id: str
    email: Optional[EmailStr] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "name": "Dr. Smith",
                "badge_id": "dr_smith_123",
                "email": "dr.smith@example.com"
            }
        }

class PatientBase(BaseModel):
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    
    # Medical Information
    blood_type: Optional[str] = None
    allergies: Optional[List[str]] = Field(default_factory=list)
    current_medications: Optional[List[str]] = Field(default_factory=list)
    medical_history: Optional[str] = None
    family_history: Optional[str] = None
    general_state: Optional[str] = None  # e.g., "Stable", "Critical", "Under Observation"
    
    # Vital Signs (latest)
    height: Optional[float] = None  # in cm
    weight: Optional[float] = None  # in kg
    blood_pressure: Optional[str] = None  # e.g., "120/80"
    
    # Notes
    notes: Optional[str] = None
    doctor_id: Optional[str] = None  # Reference to the doctor's badge_id

class PatientCreate(PatientBase):
    pass

class PatientInDB(PatientBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    doctor_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "json_schema_extra": {
            "example": {
                "name": "John Doe",
                "age": 45,
                "gender": "Male",
                "email": "johndoe@example.com",
                "phone": "+1234567890",
                "address": "123 Main St, City, Country",
                "notes": "Patient has a family history of diabetes.",
                "doctor_id": "doc123"
            }
        }
    }

class PredictionBase(BaseModel):
    patient_id: str
    doctor_id: str  # Add doctor_id to track which doctor made the prediction
    prediction: float
    confidence: float
    input_data: Dict[str, Any]
    notes: Optional[str] = None
    
    @validator('confidence')
    def validate_confidence(cls, v):
        if not 0 <= v <= 1:
            raise ValueError('Confidence must be between 0 and 1')
        return v

class PredictionCreate(PredictionBase):
    pass

class PredictionInDB(PredictionBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "json_schema_extra": {
            "example": {
                "patient_id": "507f1f77bcf86cd799439011",
                "prediction": 0.85,
                "confidence": 0.92,
                "input_data": {
                    "age": 45,
                    "gender": "Male",
                    "bmi": 28.5,
                    "blood_glucose_level": 140,
                    "HbA1c_level": 6.5,
                    "hypertension": 1,
                    "heart_disease": 0,
                    "smoking_history": "former"
                },
                "notes": "High risk patient, recommend lifestyle changes"
            }
        }
    }

class AppointmentBase(BaseModel):
    patient_id: str
    doctor_id: str
    appointment_date: datetime
    appointment_time: str  # Format: "HH:MM"
    duration: int = 30  # Duration in minutes
    reason: str
    status: str = "Scheduled"  # Scheduled, Completed, Cancelled, No-Show
    notes: Optional[str] = None
    reminder_sent: bool = False

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    appointment_date: Optional[datetime] = None
    appointment_time: Optional[str] = None
    duration: Optional[int] = None
    reason: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    reminder_sent: Optional[bool] = None

class AppointmentInDB(AppointmentBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "json_schema_extra": {
            "example": {
                "patient_id": "507f1f77bcf86cd799439011",
                "doctor_id": "doc123",
                "appointment_date": "2024-01-15T00:00:00",
                "appointment_time": "14:30",
                "duration": 30,
                "reason": "Diabetes checkup",
                "status": "Scheduled",
                "notes": "Follow-up appointment",
                "reminder_sent": False
            }
        }
    }
