"""
Automatic fix for all route files - converts async to sync for MongoDB
Run this from the backend directory: python fix_all_routes_sync.py
"""

import os
import re

# List of route files to fix
route_files = [
    'routes/alerts.py',
    'routes/analytics.py',
    'routes/medications.py',
    'routes/lab_results.py',
    'routes/complications.py',
    'routes/nutrition.py',
    'routes/activity.py',
    'routes/messages.py'
]

def fix_route_file(filepath):
    """Fix a route file by removing async/await and converting async for to regular for"""
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Remove 'async ' from function definitions
    content = re.sub(r'\basync def ', 'def ', content)
    
    # 2. Replace 'async for' with 'for'
    content = re.sub(r'\basync for ', 'for ', content)
    
    # 3. Replace 'await ' with '' (remove await keyword)
    content = re.sub(r'\bawait ', '', content)
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Fixed: {filepath}")

# Fix all route files
print("🔧 Fixing all route files to work with synchronous MongoDB...\n")

for route_file in route_files:
    if os.path.exists(route_file):
        try:
            fix_route_file(route_file)
        except Exception as e:
            print(f"❌ Error fixing {route_file}: {e}")
    else:
        print(f"⚠️  File not found: {route_file}")

print("\n🎉 All route files have been fixed!")
print("\n⚠️  IMPORTANT: Restart your backend server for changes to take effect:")
print("   1. Stop the server (Ctrl+C)")
print("   2. Run: python main.py")
