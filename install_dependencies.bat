@echo off
echo ========================================
echo Installing Backend Dependencies
echo ========================================
echo.

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Installing main dependencies...
pip install -r requirements.txt

echo.
echo Installing backend-specific dependencies...
cd backend
pip install -r requirements.txt

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo You can now run: start_backend.bat
echo.
pause
