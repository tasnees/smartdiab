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

# Password hashing - using SHA-256 with salt as a workaround for bcrypt issues
import hashlib
import secrets

def hash_password_simple(password: str) -> str:
    """Simple password hashing using SHA-256 with salt"""
    # Generate a random salt
    salt = secrets.token_hex(16)
    # Combine password and salt, then hash
    password_salt = f"{password}{salt}"
    hashed = hashlib.sha256(password_salt.encode()).hexdigest()
    # Return salt:hash format
    return f"{salt}:{hashed}"

def verify_password_simple(plain_password: str, stored_hash: str) -> bool:
    """Verify password against stored hash"""
    try:
        if ':' not in stored_hash:
            # Old bcrypt format, can't verify
            return False
        salt, hashed = stored_hash.split(':', 1)
        # Hash the provided password with the same salt
        password_salt = f"{plain_password}{salt}"
        computed_hash = hashlib.sha256(password_salt.encode()).hexdigest()
        return computed_hash == hashed
    except Exception as e:
        print(f"Error verifying password: {e}")
        return False

# Fallback to bcrypt if available, otherwise use simple hashing
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    USE_BCRYPT = True
except Exception as e:
    print(f"⚠️ Bcrypt not available, using SHA-256 hashing: {e}")
    USE_BCRYPT = False

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Models
class DoctorBase(BaseModel):
    badge_id: str
    name: str
    hashed_password: str
    email: Optional[EmailStr] = None

class DoctorCreate(BaseModel):
    badge_id: str = Field(..., min_length=3, max_length=50, alias='badgeId')
    name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8, max_length=72, 
                         description="Password must be 8-72 characters")
    email: Optional[EmailStr] = Field(default=None, description="Optional doctor email")
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if len(v) > 72:
            raise ValueError('Password must be 72 characters or less')
        # Check for common weak passwords
        weak_passwords = ['password', '12345678', 'qwerty', 'letmein']
        if v.lower() in weak_passwords:
            raise ValueError('Password is too common or weak')
        return v
    
    class Config:
        allow_population_by_field_name = True
        extra = 'forbid'  # Prevent extra fields
        
    def __init__(self, **data):
        # Handle both badge_id and badgeId for frontend compatibility
        if 'badgeId' in data and 'badge_id' not in data:
            data['badge_id'] = data.pop('badgeId')
        super().__init__(**data)
        
        # Clean name field
        if hasattr(self, 'name'):
            self.name = self.name.strip()
        if hasattr(self, 'email') and self.email:
            self.email = self.email.strip()

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
        if not USE_BCRYPT:
            return verify_password_simple(plain_password, hashed_password)
        return pwd_context.verify(plain_password, hashed_password)
    except (ValueError, TypeError) as e:
        print(f"Password verification error: {e}")
        # Try simple verification as fallback
        return verify_password_simple(plain_password, hashed_password)

def get_password_hash(password: str):
    try:
        # Convert to string if bytes
        if isinstance(password, bytes):
            password = password.decode('utf-8')
            
        # Validate password length
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        # Ensure password is not empty
        if not password:
            raise ValueError("Password cannot be empty")
        
        # Use simple hashing if bcrypt is not available
        if not USE_BCRYPT:
            print("Using SHA-256 hashing (bcrypt not available)")
            return hash_password_simple(password)
        
        # Bcrypt has a 72 byte limit. Encode to bytes first to check actual byte length
        password_bytes = password.encode('utf-8')
        
        # If password is too long in bytes, hash it first with SHA-256
        if len(password_bytes) > 72:
            import hashlib
            password = hashlib.sha256(password_bytes).hexdigest()
            password_bytes = password.encode('utf-8')
        
        # Truncate to 72 bytes if still too long (shouldn't happen after SHA-256, but just in case)
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
            password = password_bytes.decode('utf-8', errors='ignore')
        
        # Try to hash the password using bcrypt
        try:
            hashed = pwd_context.hash(password)
            if not hashed:
                raise ValueError("Failed to hash password")
            return hashed
        except Exception as bcrypt_error:
            # Fallback to simple hashing if bcrypt fails
            print(f"⚠️ Bcrypt hashing failed, using SHA-256: {bcrypt_error}")
            return hash_password_simple(password)
        
    except ValueError as ve:
        print(f"❌ Password validation error: {str(ve)}")
        raise
    except Exception as e:
        print(f"❌ Error hashing password: {str(e)}")
        raise ValueError(f"Password hashing failed: {str(e)}")

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

@router.post("/test-register", status_code=status.HTTP_200_OK)
async def test_register(doctor: dict):
    """Validate incoming registration payload without persisting."""
    try:
        doctor_model = DoctorCreate(**doctor)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc)
        ) from exc

    sanitized = doctor_model.dict(exclude={"password"}, by_alias=True)
    sanitized["password"] = "***redacted***"

    return {
        "status": "success",
        "message": "Registration data is valid",
        "data": sanitized
    }


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=dict)
async def register_doctor(doctor: DoctorCreate):
    print("\n=== Registration Debug ===")
    print(f"Incoming registration data: {doctor.dict(exclude={'password'})}")

    try:
        # Get database connection
        db = get_db()
        print("✅ Successfully connected to database")
        
        # Test the connection by pinging the database
        db.command('ping')
        print("✅ Database ping successful")
        
        # Check for existing doctor with same badge_id
        existing_doctor = db[DOCTORS_COLLECTION].find_one({"badge_id": doctor.badge_id})
        if existing_doctor:
            error_msg = f"A doctor with badge ID '{doctor.badge_id}' already exists"
            print(f"❌ {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
        
        print("✅ No duplicate badge_id found")
        
        # Hash the password
        print("Hashing password...")
        hashed_password = get_password_hash(doctor.password)
        print("✅ Password hashed successfully")
        
        # Prepare doctor document
        doctor_dict = {
            "badge_id": doctor.badge_id,
            "name": doctor.name.strip(),
            "hashed_password": hashed_password,
            "email": doctor.email,
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        
        print(f"✅ Prepared doctor document")
        print(f"   Name: {doctor_dict['name']}")
        print(f"   Badge ID: {doctor_dict['badge_id']}")
        
        # Try to use transactions if supported (replica set), otherwise use simple insert
        try:
            # Attempt transaction-based insert (requires replica set)
            with db.client.start_session() as session:
                with session.start_transaction():
                    # Insert the new doctor
                    result = db[DOCTORS_COLLECTION].insert_one(
                        doctor_dict,
                        session=session
                    )
                    
                    if not result.inserted_id:
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Failed to create doctor account"
                        )
                    
                    # Verify the insertion
                    inserted = db[DOCTORS_COLLECTION].find_one(
                        {"_id": result.inserted_id},
                        session=session
                    )
                    
                    if not inserted:
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Failed to verify doctor creation"
                        )
                    
                    print(f"✅ Doctor successfully created with ID: {result.inserted_id}")
                    
                    # Commit the transaction
                    session.commit_transaction()
                    
        except (mongo_errors.OperationFailure, mongo_errors.InvalidOperation) as tx_err:
            # Transactions not supported (standalone MongoDB), use simple insert
            print(f"⚠️ Transactions not supported, using simple insert: {str(tx_err)}")
            
            try:
                result = db[DOCTORS_COLLECTION].insert_one(doctor_dict)
                
                if not result.inserted_id:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to create doctor account"
                    )
                
                # Verify the insertion
                inserted = db[DOCTORS_COLLECTION].find_one({"_id": result.inserted_id})
                
                if not inserted:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to verify doctor creation"
                    )
                
                print(f"✅ Doctor successfully created with ID: {result.inserted_id}")
                
            except mongo_errors.DuplicateKeyError:
                error_msg = f"A doctor with this badge ID already exists"
                print(f"❌ {error_msg}")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=error_msg
                )
        
        # Generate access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": doctor.badge_id},
            expires_delta=access_token_expires
        )
        
        # Prepare the response
        return {
            "status": "success",
            "message": "Doctor registered successfully",
            "data": {
                "id": str(inserted["_id"]),
                "name": inserted["name"],
                "badge_id": inserted["badge_id"],
                "email": inserted.get("email"),
                "created_at": inserted.get("created_at", datetime.utcnow()).isoformat()
            },
            "access_token": access_token,
            "token_type": "bearer"
        }
    
    except HTTPException as http_exc:
        print(f"❌ HTTP Exception during registration: {http_exc.detail}")
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
