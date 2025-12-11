@echo off
echo ========================================
echo Testing Backend Startup
echo ========================================
echo.

echo Step 1: Checking Python...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python not found!
    pause
    exit /b 1
)
echo.

echo Step 2: Checking if venv exists...
if not exist "venv\Scripts\activate.bat" (
    echo ERROR: Virtual environment not found!
    echo Please create it with: python -m venv venv
    pause
    exit /b 1
)
echo Virtual environment found!
echo.

echo Step 3: Activating virtual environment...
call venv\Scripts\activate.bat
echo.

echo Step 4: Checking FastAPI installation...
python -c "import fastapi; print('FastAPI version:', fastapi.__version__)" 2>nul
if %errorlevel% neq 0 (
    echo ERROR: FastAPI not installed!
    echo Installing dependencies...
    pip install -r requirements.txt
)
echo.

echo Step 5: Checking uvicorn installation...
python -c "import uvicorn; print('Uvicorn installed')" 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Uvicorn not installed!
    echo Installing dependencies...
    pip install -r requirements.txt
)
echo.

echo Step 6: Navigating to backend directory...
cd backend
echo Current directory: %CD%
echo.

echo Step 7: Checking if main.py exists...
if not exist "main.py" (
    echo ERROR: main.py not found in backend directory!
    pause
    exit /b 1
)
echo main.py found!
echo.

echo Step 8: Starting backend server...
echo ========================================
echo If you see errors below, please copy them
echo ========================================
echo.
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause
