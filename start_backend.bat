@echo off
echo ========================================
echo Starting Diabetes Prediction Backend
echo ========================================
echo.

cd backend

echo Activating virtual environment...
call ..\venv\Scripts\activate.bat

echo.
echo Starting Uvicorn server on http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
