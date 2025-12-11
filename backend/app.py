from fastapi import FastAPI, Depends, HTTPException, status, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from fastapi.middleware import Middleware
from pydantic import BaseModel
import numpy as np
import pandas as pd
import joblib
import os
import sys
import logging
import pymongo
from typing import List, Optional, Any, Dict
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get MongoDB connection info
mongo_uri = os.getenv("MONGODB_URI")
db_name = os.getenv("DB_NAME", "smartdiab")

if not mongo_uri:
    raise ValueError("MONGODB_URI environment variable is not set. Please check your .env file.")

logger.info(f"Connecting to MongoDB with database '{db_name}'")

def get_database():
    """Initialize and return a MongoDB database connection."""
    try:
        # Create MongoDB client with retryWrites enabled
        client = pymongo.MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=5000,  # 5 second timeout
            connectTimeoutMS=30000,  # 30 second connection timeout
            socketTimeoutMS=30000,  # 30 second socket timeout
            retryWrites=True,       # Enable retryable writes
            w='majority'            # Write concern: wait for write to be written to majority of nodes
        )
        
        # Test the connection
        client.server_info()
        logger.info("Successfully connected to MongoDB")
        
        # Get the database
        db = client.get_database(db_name)

        # Test database access
        db.command('ping')
        logger.info(f"Successfully accessed database: {db_name}")
        
        # List collections (for debugging)
        collections = db.list_collection_names()
        logger.info(f"Available collections: {collections}")
        
        return db
        
    except pymongo.errors.ServerSelectionTimeoutError as err:
        logger.error(f"MongoDB server selection timeout: {err}")
        logger.error("Please check if your MongoDB Atlas cluster is running and accessible")
        logger.error(f"Connection string: {mongo_uri}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not connect to MongoDB: Server selection timeout"
        )
    except pymongo.errors.ConnectionFailure as err:
        logger.error(f"MongoDB connection failure: {err}")
        logger.error("Please check your MongoDB connection string and network connectivity")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not connect to MongoDB: {str(err)}"
        )
    except pymongo.errors.OperationFailure as err:
        logger.error(f"MongoDB operation failure: {err}")
        logger.error("Please check your MongoDB user permissions and database name")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"MongoDB operation failed: {str(err)}"
        )
    except Exception as e:
        logger.error(f"Unexpected MongoDB error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

# Initialize the database connection
def init_database():
    try:
        db = get_database()
        logger.info("Database connection initialized successfully")
        return db
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        return None

# Initialize the database connection
mongo_db = init_database()

# Add the backend directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(current_dir)
sys.path.append(parent_dir)

# Import routes after db is initialized
if mongo_db is None:
    logger.error("Warning: Database connection failed. The application will start but database operations will fail.")
    # Don't raise an exception here to allow the app to start
    # The actual database operations will fail gracefully

# Import routes
try:
    from routes import patients, predictions
    import auth
    
    logger.info("Successfully imported routes modules")
    logger.info(f"Auth router defined: {auth.router}")
except Exception as e:
    logger.error(f"Error importing routes: {str(e)}", exc_info=True)
    raise

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ALLOWED_ORIGINS = {
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
}

# Create middleware for CORS
async def cors_middleware(request: Request, call_next):
    origin = request.headers.get("origin")
    allow_origin = origin if origin in ALLOWED_ORIGINS else None

    # Handle preflight requests
    if request.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Cache-Control, X-Requested-With",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
            "Vary": "Origin",
        }
        if allow_origin:
            headers["Access-Control-Allow-Origin"] = allow_origin
        else:
            headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
        response = Response(
            status_code=200,
            headers=headers
        )
        return response
    
    try:
        response = await call_next(request)
        
        # Add CORS headers to all responses
        if allow_origin:
            response.headers["Access-Control-Allow-Origin"] = allow_origin
        else:
            response.headers.setdefault("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Cache-Control, X-Requested-With"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Expose-Headers"] = "*"
        response.headers["Vary"] = "Origin"
        
        return response
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
            headers={
                "Access-Control-Allow-Origin": allow_origin or "http://localhost:3000",
                "Access-Control-Allow-Credentials": "true",
                "Vary": "Origin",
            }
        )

# Create the FastAPI app with middleware
app = FastAPI(
    title="Diabetes Prediction API",
    middleware=[
        Middleware(
            CORSMiddleware,
            allow_origins=[
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173",
            ],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
            expose_headers=["*"],
        )
    ]
)

# Add our custom middleware
app.middleware("http")(cors_middleware)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(patients.router, prefix="/api/patients", tags=["patients"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])

# Add logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    body_bytes = await request.body()
    # Allow downstream handlers to read the body again
    request._body = body_bytes  # type: ignore[attr-defined]

    logger.info("Incoming request", extra={
        "method": request.method,
        "url": str(request.url),
        "headers": dict(request.headers),
        "query_params": dict(request.query_params),
        "path_params": request.path_params,
        "body": body_bytes.decode("utf-8", errors="replace") if body_bytes else "<empty>"
    })

    try:
        response = await call_next(request)
    except Exception as exc:
        logger.exception("Unhandled exception during request processing")
        raise exc

    logger.info(
        "Outgoing response",
        extra={
            "status_code": response.status_code,
            "headers": dict(response.headers)
        }
    )

    return response

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to the Diabetes Prediction API"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
