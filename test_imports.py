"""
Test script to diagnose import errors
"""
import sys
import os

# Change to backend directory
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
os.chdir(backend_dir)
sys.path.insert(0, backend_dir)

print("Testing imports...")
print(f"Current directory: {os.getcwd()}")
print(f"Python path: {sys.path[:3]}")
print()

try:
    print("1. Testing 'import auth'...")
    import auth
    print("   ✓ auth imported successfully")
except Exception as e:
    print(f"   ✗ Error importing auth: {e}")
    import traceback
    traceback.print_exc()

print()

try:
    print("2. Testing 'import models'...")
    import models
    print("   ✓ models imported successfully")
except Exception as e:
    print(f"   ✗ Error importing models: {e}")
    import traceback
    traceback.print_exc()

print()

try:
    print("3. Testing 'from routes import patients'...")
    from routes import patients
    print("   ✓ routes.patients imported successfully")
except Exception as e:
    print(f"   ✗ Error importing routes.patients: {e}")
    import traceback
    traceback.print_exc()

print()

try:
    print("4. Testing 'from routes import predictions'...")
    from routes import predictions
    print("   ✓ routes.predictions imported successfully")
except Exception as e:
    print(f"   ✗ Error importing routes.predictions: {e}")
    import traceback
    traceback.print_exc()

print()

try:
    print("5. Testing 'import main'...")
    import main
    print("   ✓ main imported successfully")
    print(f"   ✓ FastAPI app found: {main.app}")
except Exception as e:
    print(f"   ✗ Error importing main: {e}")
    import traceback
    traceback.print_exc()

print()
print("=" * 50)
print("Diagnosis complete!")
