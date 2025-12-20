"""
Enhanced Models for Comprehensive Diabetes Management Platform
Includes all new features: glucose monitoring, medications, lab results, 
complications screening, nutrition, activity, messaging, and alerts
"""

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

# ============================================================================
# GLUCOSE MONITORING MODELS
# ============================================================================

class GlucoseReadingType(str, Enum):
    FASTING = "fasting"
    POST_MEAL = "post_meal"
    BEDTIME = "bedtime"
    RANDOM = "random"
    PRE_MEAL = "pre_meal"

class GlucoseReadingBase(BaseModel):
    patient_id: str
    reading_type: GlucoseReadingType
    glucose_value: float  # mg/dL
    reading_datetime: datetime
    notes: Optional[str] = None
    meal_context: Optional[str] = None  # What they ate
    symptoms: Optional[List[str]] = Field(default_factory=list)  # e.g., ["dizzy", "shaky"]
    
    @validator('glucose_value')
    def validate_glucose(cls, v):
        if v < 0 or v > 600:
            raise ValueError('Glucose value must be between 0 and 600 mg/dL')
        return v

class GlucoseReadingCreate(GlucoseReadingBase):
    pass

class GlucoseReadingInDB(GlucoseReadingBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

class HbA1cReadingBase(BaseModel):
    patient_id: str
    hba1c_value: float  # Percentage
    test_date: datetime
    lab_name: Optional[str] = None
    notes: Optional[str] = None
    
    @validator('hba1c_value')
    def validate_hba1c(cls, v):
        if v < 0 or v > 20:
            raise ValueError('HbA1c value must be between 0 and 20%')
        return v

class HbA1cReadingCreate(HbA1cReadingBase):
    pass

class HbA1cReadingInDB(HbA1cReadingBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

# ============================================================================
# MEDICATION MANAGEMENT MODELS
# ============================================================================

class MedicationFrequency(str, Enum):
    ONCE_DAILY = "once_daily"
    TWICE_DAILY = "twice_daily"
    THREE_TIMES_DAILY = "three_times_daily"
    FOUR_TIMES_DAILY = "four_times_daily"
    AS_NEEDED = "as_needed"
    WEEKLY = "weekly"
    MONTHLY = "monthly"

class MedicationBase(BaseModel):
    patient_id: str
    medication_name: str
    dosage: str  # e.g., "500mg"
    frequency: MedicationFrequency
    route: str = "oral"  # oral, injection, topical, etc.
    start_date: datetime
    end_date: Optional[datetime] = None
    prescribing_doctor: str  # doctor_id
    instructions: Optional[str] = None
    purpose: Optional[str] = None  # e.g., "Blood sugar control"
    active: bool = True
    side_effects: Optional[List[str]] = Field(default_factory=list)

class MedicationCreate(MedicationBase):
    pass

class MedicationInDB(MedicationBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

class MedicationAdherenceBase(BaseModel):
    patient_id: str
    medication_id: str
    scheduled_datetime: datetime
    taken: bool
    taken_datetime: Optional[datetime] = None
    missed_reason: Optional[str] = None
    notes: Optional[str] = None

class MedicationAdherenceCreate(MedicationAdherenceBase):
    pass

class MedicationAdherenceInDB(MedicationAdherenceBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

# ============================================================================
# LAB RESULTS MODELS
# ============================================================================

class LabTestType(str, Enum):
    HBA1C = "hba1c"
    LIPID_PANEL = "lipid_panel"
    KIDNEY_FUNCTION = "kidney_function"
    LIVER_FUNCTION = "liver_function"
    THYROID = "thyroid"
    URINALYSIS = "urinalysis"
    COMPLETE_BLOOD_COUNT = "complete_blood_count"
    OTHER = "other"

class LabResultBase(BaseModel):
    patient_id: str
    test_type: LabTestType
    test_name: str
    test_date: datetime
    results: Dict[str, Any]  # Flexible structure for different test types
    reference_ranges: Optional[Dict[str, str]] = None
    abnormal_flags: Optional[List[str]] = Field(default_factory=list)
    ordering_doctor: str  # doctor_id
    lab_name: Optional[str] = None
    notes: Optional[str] = None
    pdf_url: Optional[str] = None  # Link to uploaded PDF

class LabResultCreate(LabResultBase):
    pass

class LabResultInDB(LabResultBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

# ============================================================================
# COMPLICATION SCREENING MODELS
# ============================================================================

class ScreeningType(str, Enum):
    RETINOPATHY = "retinopathy"
    NEUROPATHY = "neuropathy"
    NEPHROPATHY = "nephropathy"
    FOOT_EXAM = "foot_exam"
    CARDIOVASCULAR = "cardiovascular"
    DENTAL = "dental"

class ComplicationScreeningBase(BaseModel):
    patient_id: str
    screening_type: ScreeningType
    screening_date: datetime
    performed_by: str  # doctor_id or specialist name
    results: Dict[str, Any]  # Flexible structure for different screening types
    findings: Optional[str] = None
    recommendations: Optional[str] = None
    next_screening_date: Optional[datetime] = None
    abnormal: bool = False
    follow_up_required: bool = False

class ComplicationScreeningCreate(ComplicationScreeningBase):
    pass

class ComplicationScreeningInDB(ComplicationScreeningBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

# ============================================================================
# NUTRITION TRACKING MODELS
# ============================================================================

class MealType(str, Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"

class NutritionLogBase(BaseModel):
    patient_id: str
    meal_type: MealType
    meal_datetime: datetime
    foods: List[str]  # List of food items
    total_carbs: Optional[float] = None  # grams
    total_calories: Optional[int] = None
    total_protein: Optional[float] = None  # grams
    total_fat: Optional[float] = None  # grams
    notes: Optional[str] = None
    photo_url: Optional[str] = None  # Optional meal photo

class NutritionLogCreate(NutritionLogBase):
    pass

class NutritionLogInDB(NutritionLogBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

# ============================================================================
# ACTIVITY TRACKING MODELS
# ============================================================================

class ActivityType(str, Enum):
    WALKING = "walking"
    RUNNING = "running"
    CYCLING = "cycling"
    SWIMMING = "swimming"
    STRENGTH_TRAINING = "strength_training"
    YOGA = "yoga"
    SPORTS = "sports"
    OTHER = "other"

class ActivityIntensity(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"

class ActivityLogBase(BaseModel):
    patient_id: str
    activity_type: ActivityType
    activity_datetime: datetime
    duration_minutes: int
    intensity: ActivityIntensity
    calories_burned: Optional[int] = None
    notes: Optional[str] = None
    glucose_before: Optional[float] = None  # mg/dL
    glucose_after: Optional[float] = None  # mg/dL

class ActivityLogCreate(ActivityLogBase):
    pass

class ActivityLogInDB(ActivityLogBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

# ============================================================================
# MESSAGING MODELS
# ============================================================================

class MessageType(str, Enum):
    DOCTOR_TO_PATIENT = "doctor_to_patient"
    PATIENT_TO_DOCTOR = "patient_to_doctor"
    SYSTEM = "system"

class MessageBase(BaseModel):
    sender_id: str  # doctor_id or patient_id
    recipient_id: str  # doctor_id or patient_id
    message_type: MessageType
    subject: Optional[str] = None
    content: str
    read: bool = False
    read_at: Optional[datetime] = None
    priority: str = "normal"  # normal, high, urgent
    attachments: Optional[List[str]] = Field(default_factory=list)  # URLs to attachments

class MessageCreate(MessageBase):
    pass

class MessageInDB(MessageBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

# ============================================================================
# ALERTS & NOTIFICATIONS MODELS
# ============================================================================

class AlertType(str, Enum):
    CRITICAL_GLUCOSE = "critical_glucose"
    MEDICATION_DUE = "medication_due"
    APPOINTMENT_REMINDER = "appointment_reminder"
    LAB_RESULT_READY = "lab_result_ready"
    SCREENING_OVERDUE = "screening_overdue"
    ABNORMAL_LAB_VALUE = "abnormal_lab_value"
    PATIENT_DETERIORATION = "patient_deterioration"
    MEDICATION_INTERACTION = "medication_interaction"

class AlertSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

class AlertBase(BaseModel):
    patient_id: str
    doctor_id: Optional[str] = None
    alert_type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    acknowledged: bool = False
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
    action_required: bool = False
    action_taken: Optional[str] = None
    related_data: Optional[Dict[str, Any]] = None  # Context data

class AlertCreate(AlertBase):
    pass

class AlertInDB(AlertBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

# ============================================================================
# CLINICAL DECISION SUPPORT MODELS
# ============================================================================

class TreatmentPlanBase(BaseModel):
    patient_id: str
    doctor_id: str
    plan_name: str
    goals: List[str]  # e.g., ["HbA1c < 7%", "Weight loss 10 lbs"]
    interventions: List[str]  # e.g., ["Start Metformin", "Diet counseling"]
    target_hba1c: Optional[float] = None
    target_weight: Optional[float] = None
    target_blood_pressure: Optional[str] = None
    review_date: Optional[datetime] = None
    active: bool = True
    notes: Optional[str] = None

class TreatmentPlanCreate(TreatmentPlanBase):
    pass

class TreatmentPlanInDB(TreatmentPlanBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

# ============================================================================
# AUDIT LOG MODELS (for HIPAA compliance)
# ============================================================================

class AuditActionType(str, Enum):
    VIEW_PATIENT = "view_patient"
    EDIT_PATIENT = "edit_patient"
    CREATE_PATIENT = "create_patient"
    DELETE_PATIENT = "delete_patient"
    VIEW_LAB_RESULT = "view_lab_result"
    PRESCRIBE_MEDICATION = "prescribe_medication"
    SEND_MESSAGE = "send_message"
    EXPORT_DATA = "export_data"

class AuditLogBase(BaseModel):
    user_id: str  # doctor_id
    action_type: AuditActionType
    resource_type: str  # e.g., "patient", "lab_result"
    resource_id: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogInDB(AuditLogBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }
