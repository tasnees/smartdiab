"""
Quick fix script to update all route files to use get_database() directly
Run this from the backend directory: python fix_routes.py
"""

import os
import re

# List of route files to fix
route_files = [
    'routes/glucose.py',
    'routes/medications.py',
    'routes/lab_results.py',
    'routes/complications.py',
    'routes/nutrition.py',
    'routes/activity.py',
    'routes/messages.py',
    'routes/alerts.py'
]

def fix_route_file(filepath):
    """Fix a single route file by replacing db=Depends(get_database) with direct calls"""
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match function definitions with db=Depends(get_database)
    # This will match both with and without other parameters
    pattern = r'(async def \w+\([^)]*?)(,\s*db=Depends\(get_database\))(\s*\):)'
    
    def replacement(match):
        func_def = match.group(1)
        closing = match.group(3)
        # Return function definition without the db parameter
        return func_def + closing
    
    # Remove db=Depends(get_database) from function signatures
    new_content = re.sub(pattern, replacement, content)
    
    # Now add db = get_database() at the start of each try block
    # Pattern to match try: right after function definition
    pattern2 = r'(async def \w+\([^)]*\):\s+"""[^"]*"""\s+)(try:)'
    
    def replacement2(match):
        before_try = match.group(1)
        try_keyword = match.group(2)
        return before_try + try_keyword + '\n        db = get_database()'
    
    new_content = re.sub(pattern2, replacement2, new_content)
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"✅ Fixed: {filepath}")

# Fix all route files
for route_file in route_files:
    if os.path.exists(route_file):
        try:
            fix_route_file(route_file)
        except Exception as e:
            print(f"❌ Error fixing {route_file}: {e}")
    else:
        print(f"⚠️  File not found: {route_file}")

print("\n🎉 All route files have been fixed!")
print("Please restart your backend server for changes to take effect.")
