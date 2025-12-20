"""
Centralized database connection management for MongoDB.
This module provides a single MongoDB client instance to be shared across the application.
"""
import os
import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)

# Global MongoDB client and database instances
_client = None
_db = None

def get_mongodb_client():
    """
    Get or create a MongoDB client instance.
    Uses connection pooling and appropriate timeout settings.
    """
    global _client
    
    if _client is not None:
        return _client
    
    try:
        mongo_uri = os.getenv("MONGODB_URI")
        if not mongo_uri:
            logger.error("MONGODB_URI environment variable is not set")
            raise ValueError("MONGODB_URI is required")
        
        logger.info("Connecting to MongoDB...")
        
        # Set DNS timeout for mongodb+srv:// connections
        # This helps prevent long hangs when DNS servers are slow/unreachable
        dns_timeout = int(os.getenv("MONGODB_DNS_TIMEOUT", "5"))  # 5 seconds default
        
        # Create MongoDB client with optimized settings
        # Note: connect=False means the client won't connect until first operation
        # Added DNS resolution timeout to handle mongodb+srv:// connection issues
        _client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=10000,  # 10 seconds
            connectTimeoutMS=10000,  # 10 seconds
            socketTimeoutMS=20000,  # 20 seconds
            retryWrites=True,
            w='majority',
            maxPoolSize=50,  # Connection pool size
            minPoolSize=5,
            maxIdleTimeMS=45000,
            connect=False,  # Lazy connection - don't connect until first operation
            # DNS resolution timeout for mongodb+srv:// URIs (in seconds)
            srvServiceName='mongodb',
            srvMaxHosts=0,  # Use all hosts from SRV record
        )
        
        logger.info("MongoDB client created (lazy connection mode)")
        
        return _client
        
    except Exception as e:
        logger.error(f"Failed to create MongoDB client: {str(e)}")
        raise

def get_database():
    """
    Get the database instance.
    Creates the client connection if it doesn't exist.
    """
    global _db
    
    if _db is not None:
        return _db
    
    try:
        client = get_mongodb_client()
        db_name = os.getenv("DB_NAME", "smartdiab")
        _db = client[db_name]
        
        logger.info(f"Using database: {db_name}")
        return _db
        
    except Exception as e:
        logger.error(f"Failed to get database: {str(e)}")
        raise

def close_mongodb_connection():
    """
    Close the MongoDB connection.
    Should be called when the application shuts down.
    """
    global _client, _db
    
    if _client is not None:
        logger.info("Closing MongoDB connection...")
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed")

def ensure_indexes():
    """
    Ensure all required indexes exist in the database.
    This should be called during application startup.
    """
    try:
        db = get_database()
        
        # Predictions collection indexes
        db.predictions.create_index([("patient_id", 1)])
        db.predictions.create_index([("doctor_id", 1)])
        db.predictions.create_index([("created_at", -1)])
        logger.info("Ensured indexes on 'predictions' collection")
        
        # Patients collection indexes
        db.patients.create_index([("doctor_id", 1)])
        db.patients.create_index([("email", 1), ("doctor_id", 1)], unique=True)
        logger.info("Ensured indexes on 'patients' collection")
        
        # Appointments collection indexes
        db.appointments.create_index([("doctor_id", 1)])
        db.appointments.create_index([("patient_id", 1)])
        db.appointments.create_index([("appointment_date", 1)])
        logger.info("Ensured indexes on 'appointments' collection")
        
    except Exception as e:
        logger.warning(f"Could not create indexes: {str(e)}")
        # Don't raise - indexes are nice to have but not critical for startup
