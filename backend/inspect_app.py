import sys
import os

# Add current directory to path so we can import app
sys.path.append(os.getcwd())

from app import app

print("Registered Routes:")
for route in app.routes:
    print(f"{route.path} [{route.methods}]")
