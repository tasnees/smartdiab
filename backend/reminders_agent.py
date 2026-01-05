import asyncio
import logging
from datetime import datetime, timedelta
from bson import ObjectId
from database import get_database
from whatsapp_service import whatsapp_service

logger = logging.getLogger(__name__)

async def run_reminders_agent():
    """
    Background worker that checks for upcoming appointments and sends WhatsApp reminders.
    """
    logger.info("Starting WhatsApp Reminders Agent...")
    db = get_database()
    
    while True:
        try:
            # 1. Get current time and threshold
            # Send reminders for appointments in the next 24 hours
            now = datetime.utcnow()
            tomorrow = now + timedelta(days=1)
            
            # 2. Query for appointments:
            # - reminder_sent is NOT True (False or missing)
            # - appointment_date is within next 24 hours
            # - status is 'Scheduled'
            
            # Appointments are stored with appointment_date as ISO string
            search_start = now.date().isoformat()
            search_end = tomorrow.date().isoformat()
            
            upcoming_appointments = list(db.appointments.find({
                "reminder_sent": {"$ne": True},
                "status": "Scheduled",
                "appointment_date": {"$gte": search_start, "$lte": search_end}
            }))
            
            if upcoming_appointments:
                logger.info(f"Reminders Agent: Found {len(upcoming_appointments)} upcoming appointments to process.")
            
            for apt in upcoming_appointments:
                patient_id = apt.get("patient_id")
                patient = db.patients.find_one({"_id": ObjectId(patient_id)})
                
                if patient and patient.get("phone"):
                    success = whatsapp_service.send_reminder(
                        to_number=patient["phone"],
                        patient_name=patient["name"],
                        appointment_date=apt["appointment_date"],
                        appointment_time=apt.get("appointment_time", "N/A")
                    )
                    
                    if success:
                        # Update database so we don't send it again
                        db.appointments.update_one(
                            {"_id": apt["_id"]},
                            {"$set": {"reminder_sent": True, "reminder_at": datetime.utcnow().isoformat()}}
                        )
                else:
                    logger.warning(f"No phone number found for patient {patient_id}. Skipping reminder.")
                    # Mark as "skipped" so we don't keep trying to find a phone number every loop
                    db.appointments.update_one(
                        {"_id": apt["_id"]},
                        {"$set": {"reminder_sent": "skipped"}}
                    )

        except Exception as e:
            logger.error(f"Error in Reminders Agent loop: {e}")
            import traceback
            traceback.print_exc()
            
        # Wait for 1 hour before checking again
        await asyncio.sleep(36) 

def start_agent_in_background():
    """Helper to run the async agent loop in a background thread or task"""
    loop = asyncio.get_event_loop()
    loop.create_task(run_reminders_agent())
