# 🔧 Backend Not Starting - Troubleshooting Guide

## Current Issue
The backend server is not starting, which is why you're getting:
```
curl: (7) Failed to connect to localhost port 8000
```

## 🚀 Quick Fix - Try These Steps in Order

### **Step 1: Install Dependencies First**

Before starting the backend, make sure all dependencies are installed:

1. **Double-click** `install_dependencies.bat`
2. Wait for it to complete
3. Look for any error messages

OR run manually:
```bash
cd c:\Users\21625\Desktop\diabetes_prediction
venv\Scripts\activate
pip install -r requirements.txt
cd backend
pip install -r requirements.txt
```

---

### **Step 2: Test Backend Startup**

1. **Double-click** `test_backend.bat`
2. This will show you detailed error messages if something is wrong
3. **Copy any error messages** you see and share them

---

### **Step 3: Manual Backend Start (If test_backend.bat works)**

Open a **Command Prompt** (not PowerShell) and run:

```bash
cd c:\Users\21625\Desktop\diabetes_prediction
venv\Scripts\activate
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**What you should see if it works:**
```
INFO:     Will watch for changes in these directories: ['c:\\Users\\21625\\Desktop\\diabetes_prediction\\backend']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [XXXXX] using WatchFiles
INFO:     Started server process [XXXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## 🔍 Common Issues & Solutions

### Issue 1: "ModuleNotFoundError: No module named 'fastapi'"

**Cause:** Dependencies not installed

**Solution:**
```bash
cd c:\Users\21625\Desktop\diabetes_prediction
venv\Scripts\activate
pip install fastapi uvicorn python-jose passlib pymongo python-dotenv pandas numpy scikit-learn joblib
```

---

### Issue 2: "ModuleNotFoundError: No module named 'routes'"

**Cause:** Missing routes module or wrong directory

**Solution:** Check that these files exist:
- `backend/routes/__init__.py`
- `backend/routes/patients.py`
- `backend/routes/predictions.py`

If missing, let me know and I'll create them.

---

### Issue 3: "ModuleNotFoundError: No module named 'auth'"

**Cause:** Missing auth.py file

**Solution:** Check that `backend/auth.py` exists. If not, let me know.

---

### Issue 4: Virtual environment not activating

**Cause:** venv might be corrupted or not created

**Solution:** Recreate the virtual environment:
```bash
cd c:\Users\21625\Desktop\diabetes_prediction
python -m venv venv --clear
venv\Scripts\activate
pip install -r requirements.txt
cd backend
pip install -r requirements.txt
```

---

### Issue 5: Port 8000 already in use

**Cause:** Another process is using port 8000

**Solution:** Find and kill the process:
```bash
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F
```

OR use a different port:
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
```
(Then update frontend to use port 8001)

---

### Issue 6: MongoDB connection error

**Cause:** MongoDB URI in .env might be incorrect or MongoDB is down

**Solution:** The app should still start even if MongoDB is unreachable. Check the error message.

---

## 📋 Diagnostic Checklist

Run through this checklist:

- [ ] Python is installed (run `python --version`)
- [ ] Virtual environment exists (`venv` folder is present)
- [ ] Virtual environment activates (`venv\Scripts\activate.bat` works)
- [ ] FastAPI is installed (run `pip list | findstr fastapi`)
- [ ] Uvicorn is installed (run `pip list | findstr uvicorn`)
- [ ] `backend/main.py` file exists
- [ ] `backend/auth.py` file exists
- [ ] `backend/routes` folder exists
- [ ] Port 8000 is not in use
- [ ] No firewall blocking port 8000

---

## 🆘 If Nothing Works

Please run `test_backend.bat` and share:

1. **The complete error message** from the terminal
2. **Which step failed** (Step 1, 2, 3, etc.)
3. **Screenshot** of the error if possible

Common error patterns to look for:
- `ModuleNotFoundError` → Missing dependency
- `ImportError` → Wrong Python version or corrupted install
- `Address already in use` → Port conflict
- `Permission denied` → Run as administrator
- `SyntaxError` → Python version mismatch

---

## 🎯 Alternative: Use Streamlit Instead

If the backend continues to have issues, you can use the simpler Streamlit version:

```bash
cd c:\Users\21625\Desktop\diabetes_prediction
venv\Scripts\activate
streamlit run app.py
```

This will give you a working diabetes prediction interface without needing the backend/frontend setup.

---

## 📞 Next Steps

1. Run `install_dependencies.bat`
2. Run `test_backend.bat`
3. Share any error messages you see
4. I'll help you fix the specific issue!
