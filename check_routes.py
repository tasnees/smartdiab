import sys
import os
import asyncio

# Ensure we can import from backend
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.app import app

print("\n=== Registered Routes ===")
for route in app.routes:
    methods = ", ".join(route.methods) if hasattr(route, "methods") else "None"
    print(f"{methods} {route.path}")
print("=========================\n")
