"""
Test script to verify DNS configuration and MongoDB connection
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("Step 1: Importing DNS config...")
import dns_config
print("✅ DNS config imported successfully")

print("\nStep 2: Testing DNS resolver...")
try:
    import dns.resolver
    print(f"DNS Nameservers: {dns.resolver.default_resolver.nameservers}")
    print(f"DNS Timeout: {dns.resolver.default_resolver.timeout}s")
    print(f"DNS Lifetime: {dns.resolver.default_resolver.lifetime}s")
except Exception as e:
    print(f"❌ DNS resolver error: {e}")

print("\nStep 3: Loading environment variables...")
from dotenv import load_dotenv
load_dotenv()
MONGO_URI = os.getenv("MONGODB_URI")
print(f"MongoDB URI: {MONGO_URI[:50]}...")

print("\nStep 4: Attempting MongoDB connection...")
try:
    from pymongo import MongoClient
    import time
    
    start_time = time.time()
    print("Creating MongoDB client...")
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    
    print("Testing connection with ping...")
    client.admin.command('ping')
    
    elapsed = time.time() - start_time
    print(f"✅ MongoDB connection successful! (took {elapsed:.2f}s)")
    
    # List databases
    dbs = client.list_database_names()
    print(f"Available databases: {dbs}")
    
except Exception as e:
    elapsed = time.time() - start_time
    print(f"❌ MongoDB connection failed after {elapsed:.2f}s")
    print(f"Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
