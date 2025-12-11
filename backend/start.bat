@echo off
echo ========================================
echo Starting Backend Server
echo ========================================
echo.

cd /d "%~dp0"
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
echo Press CTRL+C to stop the server
echo.
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
