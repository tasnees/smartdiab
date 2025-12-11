@echo off
echo ========================================
echo Starting Backend Server
echo ========================================
echo.

REM Change to the backend directory
cd /d "%~dp0backend"

echo Current directory: %CD%
echo.

echo Activating virtual environment...
call ..\venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

echo.
echo Starting Uvicorn server...
echo Server will be available at: http://localhost:8000
echo Press CTRL+C to stop the server
echo.
echo ========================================
echo.

REM Run uvicorn from the backend directory
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

pause
