# 🚀 Diabetes Prediction Project - Startup Guide

## ⚠️ Current Issue: Backend Connection Error

You're seeing this error because the **backend server is not running**:
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
:8000/api/auth/register
```

## ✅ Solution: Start Backend & Frontend in Correct Order

---

## **Step 1: Start the Backend Server** (MUST DO FIRST!)

### Option A: Using the Batch File (Easiest)
1. **Double-click** `start_backend.bat`
2. Wait for the message: `Application startup complete`
3. You should see: `Uvicorn running on http://0.0.0.0:8000`

### Option B: Manual Start
Open a terminal and run:
```bash
cd c:\Users\21625\Desktop\diabetes_prediction
venv\Scripts\activate
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### ✅ Backend is Ready When You See:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 🧪 Test Backend is Working:
Open your browser and go to: `http://localhost:8000`
You should see: `{"message": "Diabetes Prediction API ready"}`

---

## **Step 2: Start the Frontend** (After Backend is Running)

### Option A: Using the Batch File
1. **Open a NEW terminal** (keep backend running!)
2. **Double-click** `start_frontend.bat`
3. Wait for the Vite dev server to start

### Option B: Manual Start
Open a **NEW terminal** and run:
```bash
cd c:\Users\21625\Desktop\diabetes_prediction\frontend
npm run dev
```

### ✅ Frontend is Ready When You See:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## **Step 3: Access the Application**

1. **Open your browser**
2. Go to: `http://localhost:5173`
3. You should now see the frontend without errors!

---

## 🔧 Troubleshooting

### Problem: "Module not found" errors in backend
**Solution:** Install backend dependencies
```bash
cd c:\Users\21625\Desktop\diabetes_prediction
venv\Scripts\activate
pip install -r requirements.txt
cd backend
pip install -r requirements.txt
```

### Problem: Frontend shows "Cannot find module"
**Solution:** Install frontend dependencies
```bash
cd c:\Users\21625\Desktop\diabetes_prediction\frontend
npm install
```

### Problem: Port 8000 already in use
**Solution:** Kill the process using port 8000
```bash
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F
```

### Problem: Port 5173 already in use
**Solution:** Kill the process or use a different port
```bash
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F
```

---

## 📋 Quick Checklist

- [ ] Backend server is running on port 8000
- [ ] Backend test URL works: `http://localhost:8000`
- [ ] Frontend server is running on port 5173
- [ ] Frontend loads without errors: `http://localhost:5173`
- [ ] No console errors about connection refused

---

## 🎯 Project Architecture

```
Frontend (React + Vite)          Backend (FastAPI)
http://localhost:5173      →     http://localhost:8000
        │                               │
        │                               │
        ├─ Login/Register UI            ├─ /api/auth/register
        ├─ Patient Dashboard            ├─ /api/auth/login
        └─ Prediction Form              ├─ /api/patients
                                        ├─ /api/predictions
                                        └─ MongoDB Database
```

---

## 🔑 Important Files

- **Backend Entry Point:** `backend/main.py`
- **Frontend Entry Point:** `frontend/src/main.jsx`
- **Environment Variables:** `.env` (MongoDB connection, JWT secret)
- **ML Model:** `diabetes_model.pkl`
- **Feature Scaler:** `scaler.save`

---

## 💡 Development Tips

1. **Always start backend BEFORE frontend**
2. **Keep both terminals open** while developing
3. **Check backend logs** if API calls fail
4. **Use browser DevTools** to inspect network requests
5. **MongoDB must be accessible** for auth to work

---

## 🆘 Still Having Issues?

If you're still seeing errors:

1. **Check if backend is running:**
   - Open `http://localhost:8000` in browser
   - Should see: `{"message": "Diabetes Prediction API ready"}`

2. **Check browser console:**
   - Press F12 in browser
   - Look for red errors
   - Check Network tab for failed requests

3. **Check backend terminal:**
   - Look for error messages
   - Check if MongoDB connection succeeded

4. **Restart both servers:**
   - Stop backend (Ctrl+C)
   - Stop frontend (Ctrl+C)
   - Start backend first
   - Then start frontend

---

## 📞 Need Help?

If you encounter any errors, please share:
- Error message from browser console
- Error message from backend terminal
- What step you're stuck on
