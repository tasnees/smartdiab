"""
Simple script to start the backend server
Run this with: python start_server.py
"""
import os
import sys

if __name__ == '__main__':
    # Change to backend directory
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    os.chdir(backend_dir)

    print("=" * 50)
    print("Starting Diabetes Prediction Backend Server")
    print("=" * 50)
    print(f"Working directory: {os.getcwd()}")
    print()

    # Check if main.py exists
    if not os.path.exists('main.py'):
        print("ERROR: main.py not found!")
        print(f"Current directory: {os.getcwd()}")
        sys.exit(1)

    print("Starting Uvicorn server...")
    print("Press CTRL+C to stop")
    print()
    print("Once started, you should see:")
    print("  INFO: Uvicorn running on http://0.0.0.0:8000")
    print("  INFO: Application startup complete")
    print()
    print("Then you can:")
    print("  1. Open http://localhost:8000 in your browser")
    print("  2. Start the frontend in a new terminal")
    print()
    print("-" * 50)
    print()

    # Start uvicorn
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
