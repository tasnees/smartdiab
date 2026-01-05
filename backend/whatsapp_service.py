import os
import logging
from typing import Optional
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Twilio Configuration
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886") # Default Twilio Sandbox number

class WhatsAppService:
    def __init__(self):
        self.enabled = False
        if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
            try:
                self.client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
                self.enabled = True
                logger.info("WhatsApp Service (Twilio) initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Twilio client: {e}")
        else:
            logger.warning("WhatsApp Service: Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN. SMS/WhatsApp will be MOCKED.")

    def send_reminder(self, to_number: str, patient_name: str, appointment_date: str, appointment_time: str) -> bool:
        """
        Send a WhatsApp reminder message.
        to_number: The patient's phone number (format: +123456789)
        """
        # Formulate message
        message_body = (
            f"Hello {patient_name}, this is a reminder from SmartDiab Platform. "
            f"You have an upcoming appointment on {appointment_date} at {appointment_time}. "
            f"Please let us know if you need to reschedule. Stay healthy!"
        )

        if not self.enabled:
            logger.info(f"MOCK WHATSAPP to {to_number}: {message_body}")
            # Simulate a successful send in dev mode
            return True

        try:
            # Twilio requires numbers in "whatsapp:+12345678" format
            if not to_number.startswith("whatsapp:"):
                formatted_to = f"whatsapp:{to_number}"
            else:
                formatted_to = to_number

            message = self.client.messages.create(
                body=message_body,
                from_=TWILIO_WHATSAPP_NUMBER,
                to=formatted_to
            )
            logger.info(f"WhatsApp reminder sent to {to_number}. SID: {message.sid}")
            return True
        except Exception as e:
            logger.error(f"Error sending WhatsApp message to {to_number}: {e}")
            return False

# Singleton instance
whatsapp_service = WhatsAppService()
