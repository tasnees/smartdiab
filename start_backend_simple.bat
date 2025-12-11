@echo off
echo ========================================
echo Starting Backend Server (Simple Mode)
echo ========================================
echo.

cd /d "%~dp0"
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Changing to backend directory...
cd backend

echo.
echo Starting server on http://localhost:8000
echo Press CTRL+C to stop
echo.

REM Start without reload to avoid multiprocessing issues
python -m uvicorn main:app --host 0.0.0.0 --port 8000

pause
