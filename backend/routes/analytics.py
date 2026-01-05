"""
Advanced Analytics API Routes
Provides comprehensive analytics and insights for diabetes management
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from database import get_database

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/patient/{patient_id}/overview", response_model=dict)
def get_patient_overview(patient_id: str, days: int = 30):
    """Get comprehensive patient overview with all metrics"""
    try:
        db = get_database()
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Glucose statistics
        glucose_readings = []
        for reading in db.glucose_readings.find({
            "patient_id": patient_id,
            "reading_datetime": {"$gte": start_date}
        }):
            glucose_readings.append(reading["glucose_value"])
        
        avg_glucose = sum(glucose_readings) / len(glucose_readings) if glucose_readings else 0
        
        # HbA1c latest
        latest_hba1c = db.hba1c_readings.find_one(
            {"patient_id": patient_id},
            sort=[("test_date", -1)]
        )
        
        # Medication adherence
        total_scheduled = db.medication_adherence.count_documents({
            "patient_id": patient_id,
            "scheduled_datetime": {"$gte": start_date}
        })
        total_taken = db.medication_adherence.count_documents({
            "patient_id": patient_id,
            "scheduled_datetime": {"$gte": start_date},
            "taken": True
        })
        adherence_rate = (total_taken / total_scheduled * 100) if total_scheduled > 0 else 0
        
        # Activity summary
        total_activity_minutes = 0
        for activity in db.activity_logs.find({
            "patient_id": patient_id,
            "activity_datetime": {"$gte": start_date}
        }):
            total_activity_minutes += activity.get("duration_minutes", 0)
        
        # Alerts count
        critical_alerts = db.alerts.count_documents({
            "patient_id": patient_id,
            "severity": "critical",
            "acknowledged": False
        })
        
        return {
            "patient_id": patient_id,
            "period_days": days,
            "glucose": {
                "average": round(avg_glucose, 2),
                "total_readings": len(glucose_readings)
            },
            "hba1c": {
                "latest_value": latest_hba1c["hba1c_value"] if latest_hba1c else None,
                "test_date": latest_hba1c["test_date"] if latest_hba1c else None
            },
            "medication_adherence": {
                "rate": round(adherence_rate, 2),
                "total_scheduled": total_scheduled,
                "total_taken": total_taken
            },
            "activity": {
                "total_minutes": total_activity_minutes,
                "average_daily_minutes": round(total_activity_minutes / days, 2) if days > 0 else 0
            },
            "alerts": {
                "critical_unacknowledged": critical_alerts
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating patient overview: {str(e)}")

@router.get("/doctor/{doctor_id}/population-health", response_model=dict)
def get_population_health(doctor_id: str):
    """Get population health metrics for all patients under a doctor"""
    try:
        db = get_database()
        # Get all patients for this doctor
        patients = []
        for patient in db.patients.find({"doctor_id": doctor_id}):
            patients.append(str(patient["_id"]))
        
        total_patients = len(patients)
        
        # Calculate average HbA1c across all patients
        hba1c_values = []
        patients_at_goal = 0  # HbA1c < 7%
        
        for patient_id in patients:
            latest_hba1c = db.hba1c_readings.find_one(
                {"patient_id": patient_id},
                sort=[("test_date", -1)]
            )
            if latest_hba1c:
                hba1c_value = latest_hba1c["hba1c_value"]
                hba1c_values.append(hba1c_value)
                if hba1c_value < 7.0:
                    patients_at_goal += 1
        
        avg_hba1c = sum(hba1c_values) / len(hba1c_values) if hba1c_values else 0
        percent_at_goal = (patients_at_goal / total_patients * 100) if total_patients > 0 else 0
        
        # High risk patients (HbA1c > 9%)
        high_risk_count = sum(1 for v in hba1c_values if v > 9.0)
        
        # Critical alerts across all patients
        critical_alerts = db.alerts.count_documents({
            "doctor_id": doctor_id,
            "severity": "critical",
            "acknowledged": False
        })
        
        # Enhanced Risk Assessment across population
        risk_counts = {"high": 0, "moderate": 0, "low": 0}
        overdue_screenings = 0
        current_date = datetime.utcnow()
        
        for patient_id in patients:
            # 1. Count overdue screenings
            overdue_screenings += db.complication_screenings.count_documents({
                "patient_id": patient_id,
                "next_screening_date": {"$lt": current_date}
            })

            # 2. Re-use logic from single patient stratification for consistency
            patient_risk_score = 0
            
            # Check HbA1c
            lh = db.hba1c_readings.find_one({"patient_id": patient_id}, sort=[("test_date", -1)])
            if lh:
                val = lh["hba1c_value"]
                if val > 9.0: patient_risk_score += 3
                elif val > 7.5: patient_risk_score += 2
                elif val > 7.0: patient_risk_score += 1
            
            # Check latest AI prediction
            lp = db.predictions.find_one({"patient_id": patient_id}, sort=[("created_at", -1)])
            if lp and lp.get("prediction") == 1:
                patient_risk_score += 4
                
            # Determine Level
            if patient_risk_score >= 7: risk_counts["high"] += 1
            elif patient_risk_score >= 4: risk_counts["moderate"] += 1
            else: risk_counts["low"] += 1

        # Calculate population percentages
        pop_high_risk_percent = (risk_counts["high"] / total_patients * 100) if total_patients > 0 else 0
                
        # AI Prediction Statistics
        total_predictions = db.predictions.count_documents({"doctor_id": doctor_id})
        high_risk_predictions = db.predictions.count_documents({
            "doctor_id": doctor_id, 
            "prediction": 1
        })
        ai_risk_percentage = (high_risk_predictions / total_predictions * 100) if total_predictions > 0 else 0
        
        return {
            "doctor_id": doctor_id,
            "total_patients": total_patients,
            "hba1c_metrics": {
                "average": round(avg_hba1c, 2),
                "patients_at_goal": patients_at_goal,
                "percent_at_goal": round(percent_at_goal, 2),
                "high_risk_count": high_risk_count
            },
            "risk_stratification": {
                "high": risk_counts["high"],
                "moderate": risk_counts["moderate"],
                "low": risk_counts["low"],
                "high_risk_percentage": round(pop_high_risk_percent, 2)
            },
            "alerts": {
                "critical_unacknowledged": critical_alerts
            },
            "screenings": {
                "overdue_count": overdue_screenings
            },
            "ai_metrics": {
                "total_predictions": total_predictions,
                "high_risk_count": high_risk_predictions,
                "high_risk_percentage": round(ai_risk_percentage, 2)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating population health metrics: {str(e)}")

@router.get("/patient/{patient_id}/risk-stratification", response_model=dict)
def get_risk_stratification(patient_id: str):
    """Calculate risk stratification for a patient"""
    try:
        db = get_database()
        risk_score = 0
        risk_factors = []
        
        # Get patient data
        patient = db.patients.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Check HbA1c
        latest_hba1c = db.hba1c_readings.find_one(
            {"patient_id": patient_id},
            sort=[("test_date", -1)]
        )
        if latest_hba1c:
            hba1c = latest_hba1c["hba1c_value"]
            if hba1c > 9.0:
                risk_score += 3
                risk_factors.append("Very high HbA1c (>9%)")
            elif hba1c > 7.5:
                risk_score += 2
                risk_factors.append("High HbA1c (>7.5%)")
            elif hba1c > 7.0:
                risk_score += 1
                risk_factors.append("Above target HbA1c (>7%)")
        
        # Check glucose variability
        start_date = datetime.utcnow() - timedelta(days=30)
        glucose_readings = []
        for reading in db.glucose_readings.find({
            "patient_id": patient_id,
            "reading_datetime": {"$gte": start_date}
        }):
            glucose_readings.append(reading["glucose_value"])
        
        if glucose_readings:
            hypoglycemia_count = sum(1 for g in glucose_readings if g < 70)
            hyperglycemia_count = sum(1 for g in glucose_readings if g > 250)
            
            if hypoglycemia_count > 5:
                risk_score += 2
                risk_factors.append("Frequent hypoglycemia")
            if hyperglycemia_count > 10:
                risk_score += 2
                risk_factors.append("Frequent hyperglycemia")
        
        # Check medication adherence
        total_scheduled = db.medication_adherence.count_documents({
            "patient_id": patient_id,
            "scheduled_datetime": {"$gte": start_date}
        })
        total_taken = db.medication_adherence.count_documents({
            "patient_id": patient_id,
            "scheduled_datetime": {"$gte": start_date},
            "taken": True
        })
        
        if total_scheduled > 0:
            adherence_rate = (total_taken / total_scheduled * 100)
            if adherence_rate < 50:
                risk_score += 3
                risk_factors.append("Poor medication adherence (<50%)")
            elif adherence_rate < 80:
                risk_score += 1
                risk_factors.append("Suboptimal medication adherence (<80%)")
        
        # Check for complications
        abnormal_screenings = db.complication_screenings.count_documents({
            "patient_id": patient_id,
            "abnormal": True
        })
        if abnormal_screenings > 0:
            risk_score += 2
            risk_factors.append(f"{abnormal_screenings} abnormal complication screening(s)")
            
        # Check latest AI Prediction
        latest_prediction = db.predictions.find_one(
            {"patient_id": patient_id},
            sort=[("created_at", -1)]
        )
        if latest_prediction:
            if latest_prediction.get("prediction") == 1:
                risk_score += 4 # AI detected high risk is a major factor
                risk_factors.append(f"AI Model: High diabetes risk detected (confidence: {latest_prediction.get('confidence', 0)*100:.0f}%)")
            elif latest_prediction.get("prediction") == 0 and latest_prediction.get("confidence", 0) > 0.9:
                # If AI is very confident it's low risk, we could potentially lower the score
                # but for safety in medical apps, we usually only add risk
                pass
        
        # Determine risk level
        if risk_score >= 7:
            risk_level = "high"
        elif risk_score >= 4:
            risk_level = "moderate"
        else:
            risk_level = "low"
        
        return {
            "patient_id": patient_id,
            "risk_level": risk_level,
            "risk_score": risk_score,
            "risk_factors": risk_factors,
            "recommendations": get_recommendations(risk_level, risk_factors)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating risk stratification: {str(e)}")

def get_recommendations(risk_level: str, risk_factors: List[str]) -> List[str]:
    """Generate recommendations based on risk level and factors"""
    recommendations = []
    
    if risk_level == "high":
        recommendations.append("Schedule urgent follow-up appointment")
        recommendations.append("Consider intensifying treatment regimen")
        recommendations.append("Increase monitoring frequency")
    
    if any("HbA1c" in factor for factor in risk_factors):
        recommendations.append("Review and adjust diabetes medications")
        recommendations.append("Refer to diabetes educator for lifestyle counseling")
    
    if any("hypoglycemia" in factor for factor in risk_factors):
        recommendations.append("Review hypoglycemia awareness and management")
        recommendations.append("Consider adjusting insulin or medication doses")
    
    if any("adherence" in factor for factor in risk_factors):
        recommendations.append("Discuss barriers to medication adherence")
        recommendations.append("Consider simplifying medication regimen")
    
    if any("complication" in factor for factor in risk_factors):
        recommendations.append("Refer to appropriate specialist")
        recommendations.append("Increase complication screening frequency")
    
    if not recommendations:
        recommendations.append("Continue current management plan")
        recommendations.append("Maintain regular follow-up schedule")
    
    return recommendations

@router.get("/patient/{patient_id}/trends", response_model=dict)
def get_patient_trends(patient_id: str, days: int = 90):
    """Get comprehensive trend data for visualizations"""
    try:
        db = get_database()
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Glucose trend
        glucose_trend = []
        for reading in db.glucose_readings.find({
            "patient_id": patient_id,
            "reading_datetime": {"$gte": start_date}
        }).sort("reading_datetime", 1):
            glucose_trend.append({
                "date": reading["reading_datetime"].isoformat(),
                "value": reading["glucose_value"],
                "type": reading["reading_type"]
            })
        
        # HbA1c trend
        hba1c_trend = []
        for reading in db.hba1c_readings.find({
            "patient_id": patient_id,
            "test_date": {"$gte": start_date}
        }).sort("test_date", 1):
            hba1c_trend.append({
                "date": reading["test_date"].isoformat(),
                "value": reading["hba1c_value"]
            })
        
        # Weight trend (from patient updates)
        # This would come from patient records or a separate weight tracking collection
        
        return {
            "patient_id": patient_id,
            "period_days": days,
            "glucose_trend": glucose_trend,
            "hba1c_trend": hba1c_trend
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating trends: {str(e)}")
