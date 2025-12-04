import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Response
from pydantic import validator
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from pymongo import MongoClient, errors as mongo_errors
from typing import Optional
from datetime import datetime

# Load environment variables
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DB_NAME = "smartdiab"
DOCTORS_COLLECTION = "doctors"

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Initialize FastAPI router
router = APIRouter()

# MongoDB client setup
client = MongoClient(MONGO_URI)
print("Successfully connected to MongoDB")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Models
class DoctorBase(BaseModel):
    badge_id: str
    name: str
    hashed_password: str

class DoctorCreate(BaseModel):
    badge_id: str = Field(None, min_length=3, max_length=50, alias='badgeId')
    badgeId: str = Field(None, min_length=3, max_length=50, exclude=True)  # For frontend compatibility
    name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=4, max_length=72, description="Password (4-72 characters)")
    
    @validator('password')
    def validate_password_length(cls, v):
        if len(v) < 4 or len(v) > 72:
            raise ValueError('Password must be between 4 and 72 characters')
        return v
    
    class Config:
        allow_population_by_field_name = True
        
    def __init__(self, **data):
        # Handle both badge_id and badgeId
        if 'badgeId' in data and 'badge_id' not in data:
            data['badge_id'] = data['badgeId']
        super().__init__(**data)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    badge_id: Optional[str] = None

# Helper Functions
def get_db():
    try:
        db = client[DB_NAME]
        return db
    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}"
        )

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except (ValueError, TypeError) as e:
        print(f"Password verification error: {e}")
        return False

def get_password_hash(password: str):
    try:
        # Convert to string if bytes
        if isinstance(password, bytes):
            password = password.decode('utf-8')
        # Hash using SHA-256 first to handle long passwords
        import hashlib
        if len(password) > 72:
            password = hashlib.sha256(password.encode('utf-8')).hexdigest()
        return pwd_context.hash(password)
    except Exception as e:
        print(f"Error hashing password: {str(e)}")
        raise

def get_doctor(db, badge_id: str):
    doctor = db[DOCTORS_COLLECTION].find_one({"badge_id": badge_id})
    if doctor:
        # Convert ObjectId to string and remove _id to avoid serialization issues
        doctor['id'] = str(doctor.pop('_id'))
        return DoctorBase(**doctor)
    return None

def authenticate_doctor(db, badge_id: str, password: str):
    print(f"\n=== Authentication Debug ===")
    print(f"Looking up doctor with badge_id: {badge_id}")
    
    try:
        # Try to find the doctor in the database
        doctor_doc = db[DOCTORS_COLLECTION].find_one({"badge_id": badge_id})
        
        if not doctor_doc:
            print(f"❌ No doctor found with badge_id: {badge_id}")
            print("Available badge_ids in database:")
            # List all badge_ids for debugging
            all_doctors = list(db[DOCTORS_COLLECTION].find({}, {"badge_id": 1, "_id": 0}))
            print([doc.get('badge_id') for doc in all_doctors])
            return False
            
        print(f"✅ Found doctor: {doctor_doc.get('name')} (ID: {doctor_doc.get('_id')})")
        
        # Debug: Print the stored hash and input password (don't do this in production!)
        stored_hash = doctor_doc.get("hashed_password", "")
        print(f"Stored hash: {stored_hash[:10]}...")
        print(f"Verifying password...")
        
        # Verify the password
        is_valid = verify_password(password, stored_hash)
        
        if not is_valid:
            print("❌ Password verification failed")
            print(f"Password provided: {'*' * len(password) if password else 'None'}")
            print(f"Stored hash type: {type(stored_hash)}")
            print(f"Password type: {type(password)}")
            return False
            
        print("✅ Password verified successfully")
        
        # Convert ObjectId to string and remove _id to avoid serialization issues
        doctor_doc['id'] = str(doctor_doc.pop('_id'))
        return DoctorBase(**doctor_doc)
        
    except Exception as e:
        print(f"❌ Error in authenticate_doctor: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_doctor(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        badge_id: str = payload.get("sub")
        if badge_id is None:
            print("No badge_id in token")
            raise credentials_exception
        token_data = TokenData(badge_id=badge_id)
    except JWTError as e:
        print(f"JWT Error: {str(e)}")
        raise credentials_exception
    
    doctor = get_doctor(db, badge_id=token_data.badge_id)
    if doctor is None:
        print(f"No doctor found for badge_id: {token_data.badge_id}")
        raise credentials_exception
    return doctor

# Routes
@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db = Depends(get_db)
):
    try:
        print(f"Login attempt for badge_id: {form_data.username}")
        print(f"Database connection status: {db is not None}")
        
        # Check if user exists
        doctor_data = db[DOCTORS_COLLECTION].find_one({"badge_id": form_data.username})
        print(f"User found in database: {doctor_data is not None}")
        
        doctor = authenticate_doctor(db, form_data.username, form_data.password)
        if not doctor:
            print("Authentication failed - invalid credentials")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect badge ID or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        print(f"User authenticated successfully: {doctor.badge_id}")
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": doctor.badge_id}, expires_delta=access_token_expires
        )
        print("Access token generated successfully")
        
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user": {
                "badge_id": doctor.badge_id,
                "name": doctor.name
            }
        }
    except HTTPException as http_exc:
        # Re-raise HTTP exceptions as they are
        print(f"HTTP Exception: {str(http_exc)}")
        raise http_exc
    except JWTError as jwt_err:
        print(f"JWT Error: {str(jwt_err)}")
        raise HTTPException(status_code=500, detail=f"Token generation error: {str(jwt_err)}")
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Unexpected error during login: {str(e)}\n{error_details}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during login: {str(e)}"
        )

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_doctor(doctor: DoctorCreate):
    print("\n=== Registration Debug ===")
    print(f"Registration attempt for: {doctor.dict()}")
    
    try:
        print(f"Received registration request for badge_id: {doctor.badge_id}")
        print(f"Doctor data: {doctor.dict()}")
        
        # Get database connection
        try:
            db = get_db()
            print("✅ Successfully connected to database")
            
            # Test the connection by pinging the database
            db.command('ping')
            print("✅ Database ping successful")
            
        except Exception as db_err:
            error_msg = f"Database connection error: {str(db_err)}"
            print(f"❌ {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=error_msg
            )
        
        # Check for existing doctor with same badge_id
        try:
            existing_doctor = db[DOCTORS_COLLECTION].find_one({
                "badge_id": doctor.badge_id
            })
            
            if existing_doctor:
                error_msg = f"A doctor with badge ID '{doctor.badge_id}' already exists"
                    
                print(f"❌ {error_msg}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_msg
                )
                
            print("✅ No duplicate badge_id found")
        except Exception as check_err:
            print(f"❌ Error checking for existing doctor: {str(check_err)}")
            raise
            
        # Hash the password
        try:
            print("Hashing password...")
            hashed_password = get_password_hash(doctor.password)
            print("✅ Password hashed successfully")
        except Exception as hash_err:
            error_msg = f"Password hashing failed: {str(hash_err)}"
            print(f"❌ {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_msg
            )
        
        # Prepare doctor document
        try:
            doctor_dict = doctor.dict()
            # Clean and format data
            doctor_dict["name"] = doctor_dict["name"].strip()
            
            # Add additional fields
            doctor_dict["hashed_password"] = hashed_password
            doctor_dict["created_at"] = datetime.utcnow()
            doctor_dict["is_active"] = True
            
            # Remove the plain password from the document
            doctor_dict.pop("password", None)
            
            print(f"✅ Prepared doctor document")
            print(f"   Name: {doctor_dict['name']}")
            print(f"   Badge ID: {doctor_dict['badge_id']}")
            
        except Exception as prep_err:
            error_msg = f"Error preparing doctor document: {str(prep_err)}"
            print(f"❌ {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=error_msg
            )
        
        # Insert the new doctor
        try:
            print("Inserting new doctor into database...")
            
            # Start a session for transaction support
            with db.client.start_session() as session:
                with session.start_transaction():
                    # Insert the new doctor
                    result = db[DOCTORS_COLLECTION].insert_one(
                        doctor_dict,
                        session=session
                    )
                    
                    if not result.inserted_id:
                        raise Exception("No document was inserted")
                    
                    # Get the inserted document to verify
                    inserted = db[DOCTORS_COLLECTION].find_one(
                        {"_id": result.inserted_id},
                        session=session
                    )
                    
                    if not inserted:
                        raise Exception("Failed to verify document insertion")
                    
                    print(f"✅ Doctor successfully created with ID: {result.inserted_id}")
                    
                    # Commit the transaction
                    session.commit_transaction()
                    
                    # Prepare the response
                    return {
                        "status": "success",
                        "doctor_id": str(result.inserted_id),
                        "message": "Doctor registered successfully",
                        "data": {
                            "name": inserted.get("name"),
                            "badge_id": inserted.get("badge_id"),
                            "created_at": inserted.get("created_at", datetime.utcnow()).isoformat()
                        }
                    }
                    
        except mongo_errors.DuplicateKeyError as dup_err:
            error_msg = f"A doctor with this badge ID already exists: {str(dup_err)}"
            print(f"❌ {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=error_msg
            )
            
        except Exception as insert_err:
            error_msg = f"Error inserting doctor: {str(insert_err)}"
            print(f"❌ {error_msg}")
            
            # Rollback any open transactions
            if 'session' in locals():
                session.abort_transaction()
                
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_msg
            )
        
        # Get the inserted doctor to return
        try:
            new_doctor = db[DOCTORS_COLLECTION].find_one({"_id": result.inserted_id})
            if not new_doctor:
                raise Exception("Failed to retrieve created doctor")
            new_doctor["id"] = str(new_doctor.pop("_id"))
            print(f"✅ Successfully retrieved created doctor")
        except Exception as fetch_err:
            print(f"❌ Error fetching created doctor: {str(fetch_err)}")
            # Don't fail the request if we can't return the created doctor
            pass
        
        print(f"✅ Registration successful for badge_id: {doctor.badge_id}")
        return {
            "status": "success", 
            "doctor_id": str(result.inserted_id),
            "message": "Doctor registered successfully"
        }
        
    except HTTPException as http_exc:
        # Re-raise HTTP exceptions as they are
        print(f"❌ HTTP Exception during registration: {str(http_exc.detail)}")
        raise http_exc
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"❌ Unexpected error during registration: {str(e)}\n{error_details}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.get("/me", response_model=DoctorBase)
async def read_doctors_me(current_doctor: DoctorBase = Depends(get_current_doctor)):
    return current_doctor

# Debug endpoint to list all doctors (remove in production!)
@router.get("/debug/doctors", response_model=dict)
async def debug_list_doctors(limit: int = 10, skip: int = 0, db = Depends(get_db)):
    """
    Temporary endpoint to list all doctors (for debugging only)
    
    Parameters:
    - limit: Number of doctors to return (default: 10, max: 100)
    - skip: Number of doctors to skip (for pagination)
    """
    try:
        # Ensure reasonable limits
        limit = min(max(1, limit), 100)
        skip = max(0, skip)
        
        # Get total count
        total = db[DOCTORS_COLLECTION].count_documents({})
        
        # Get paginated doctors
        cursor = db[DOCTORS_COLLECTION].find(
            {},
            {
                "name": 1,
                "badge_id": 1,
                "is_active": 1,
                "created_at": 1,
                "_id": 0
            }
        ).sort("created_at", -1).skip(skip).limit(limit)
        
        doctors = list(cursor)
        
        # Format dates for JSON serialization
        for doc in doctors:
            if 'created_at' in doc and isinstance(doc['created_at'], datetime):
                doc['created_at'] = doc['created_at'].isoformat()
        
        return {
            "status": "success",
            "count": len(doctors),
            "total": total,
            "pagination": {
                "limit": limit,
                "skip": skip,
                "has_more": (skip + len(doctors)) < total
            },
            "doctors": doctors
        }
        
    except Exception as e:
        error_msg = f"Error retrieving doctors: {str(e)}"
        print(f"❌ {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )

@router.get("/test-db")
async def test_db_connection():
    """Test endpoint to verify MongoDB connection and list collections"""
    try:
        # Test MongoDB connection
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        # List all collections
        collections = db.list_collection_names()
        
        return {
            "status": "success",
            "database": DB_NAME,
            "collections": collections,
            "connection_string": MONGO_URI.split('@')[-1] if '@' in MONGO_URI else MONGO_URI
        }
    except mongo_errors.ConnectionFailure as e:
        raise HTTPException(
            status_code=500,
            detail=f"MongoDB connection failed: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error testing database: {str(e)}"
        )
