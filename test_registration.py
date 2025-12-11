"""
Test script to verify registration endpoint
Run this after starting the backend server
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_registration():
    """Test the registration endpoint"""
    print("=" * 60)
    print("Testing Registration Endpoint")
    print("=" * 60)
    
    # Test data
    test_user = {
        "name": "Test Doctor",
        "badgeId": "TEST123",
        "password": "testpassword123",
        "email": "test@example.com"
    }
    
    print(f"\n1. Testing registration with data:")
    print(json.dumps({**test_user, "password": "***"}, indent=2))
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=test_user,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\n2. Response Status: {response.status_code}")
        print(f"3. Response Headers: {dict(response.headers)}")
        
        if response.status_code == 201:
            print("\n✅ Registration successful!")
            data = response.json()
            print(json.dumps(data, indent=2))
            return True
        else:
            print(f"\n❌ Registration failed with status {response.status_code}")
            print("Response body:")
            try:
                print(json.dumps(response.json(), indent=2))
            except:
                print(response.text)
            return False
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Could not connect to backend server")
        print("Make sure the backend is running on http://localhost:8000")
        return False
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False

def test_db_connection():
    """Test database connection"""
    print("\n" + "=" * 60)
    print("Testing Database Connection")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/api/auth/test-db")
        
        if response.status_code == 200:
            print("\n✅ Database connection successful!")
            print(json.dumps(response.json(), indent=2))
            return True
        else:
            print(f"\n❌ Database connection failed with status {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False

def test_validation():
    """Test registration validation"""
    print("\n" + "=" * 60)
    print("Testing Registration Validation")
    print("=" * 60)
    
    test_user = {
        "name": "Test Doctor",
        "badgeId": "TEST456",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/test-register",
            json=test_user,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print("\n✅ Validation successful!")
            print(json.dumps(response.json(), indent=2))
            return True
        else:
            print(f"\n❌ Validation failed with status {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("\n🔍 Starting Backend Tests\n")
    
    # Test 1: Database connection
    db_ok = test_db_connection()
    
    # Test 2: Validation endpoint
    if db_ok:
        validation_ok = test_validation()
    
    # Test 3: Registration
    if db_ok:
        registration_ok = test_registration()
    
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    print(f"Database Connection: {'✅ PASS' if db_ok else '❌ FAIL'}")
    if db_ok:
        print(f"Validation: {'✅ PASS' if validation_ok else '❌ FAIL'}")
        print(f"Registration: {'✅ PASS' if registration_ok else '❌ FAIL'}")
    print("=" * 60)
