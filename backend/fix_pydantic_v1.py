"""
Fix Pydantic v1 compatibility - Replace model_dump() with dict()
Run from backend directory: python fix_pydantic_v1.py
"""

import os
import re

def fix_model_dump_in_file(filepath):
    """Replace model_dump() with dict() in a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace model_dump with dict
        original_content = content
        content = content.replace('.model_dump(', '.dict(')
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed: {filepath}")
            return True
        else:
            print(f"⏭️  Skipped (no changes): {filepath}")
            return False
    except Exception as e:
        print(f"❌ Error fixing {filepath}: {e}")
        return False

def main():
    """Fix all route files"""
    routes_dir = "routes"
    
    if not os.path.exists(routes_dir):
        print("❌ routes directory not found. Run this from the backend directory!")
        return
    
    print("🔧 Fixing Pydantic v1 compatibility (model_dump → dict)...\n")
    
    files_to_fix = [
        "routes/alerts.py",
        "routes/activity.py",
        "routes/lab_results.py",
        "routes/nutrition.py",
        "routes/messages.py",
        "routes/glucose.py",
        "routes/medications.py",
        "routes/complications.py"
    ]
    
    fixed_count = 0
    for filepath in files_to_fix:
        if os.path.exists(filepath):
            if fix_model_dump_in_file(filepath):
                fixed_count += 1
        else:
            print(f"⚠️  File not found: {filepath}")
    
    print(f"\n🎉 Fixed {fixed_count} file(s)!")
    print("\n📋 Next steps:")
    print("1. Restart the backend (Ctrl+C, then: python main.py)")
    print("2. Refresh the browser")
    print("3. Try adding glucose readings again!")

if __name__ == "__main__":
    main()
