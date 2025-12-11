# 🚨 BACKEND IS NOT RUNNING!

## The Problem
You're still seeing this error:
```
POST http://localhost:8000/api/auth/register net::ERR_CONNECTION_REFUSED
```

This means **the backend server is NOT running**.

---

## ✅ SOLUTION: Start the Backend (3 Easy Ways)

### **Method 1: Using Python Script (EASIEST)**

1. **Open Command Prompt** (Windows Key + R, type `cmd`, press Enter)

2. **Copy and paste these commands ONE BY ONE:**
   ```bash
   cd C:\Users\21625\Desktop\diabetes_prediction
   python start_server.py
   ```

3. **Wait** for this message:
   ```
   INFO:     Uvicorn running on http://0.0.0.0:8000
   INFO:     Application startup complete
   ```

4. **KEEP THIS WINDOW OPEN!** Don't close it!

---

### **Method 2: Using Batch File**

1. **Open File Explorer**

2. **Navigate to:**
   ```
   C:\Users\21625\Desktop\diabetes_prediction\backend
   ```

3. **Double-click:** `start.bat`

4. **A black window will open** - KEEP IT OPEN!

5. **Wait** for the "Application startup complete" message

---

### **Method 3: Manual Commands**

1. **Open Command Prompt**

2. **Run these commands:**
   ```bash
   cd C:\Users\21625\Desktop\diabetes_prediction
   venv\Scripts\activate
   cd backend
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Keep the window open!**

---

## 🧪 How to Know It's Working

### Test 1: Check the Terminal
You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using WatchFiles
INFO:     Started server process [67890]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Test 2: Open Browser
Go to: `http://localhost:8000`

You should see:
```json
{"message": "Diabetes Prediction API ready"}
```

### Test 3: Use curl
In a **NEW** Command Prompt:
```bash
curl http://localhost:8000
```

Should return:
```json
{"message":"Diabetes Prediction API ready"}
```

---

## ⚠️ IMPORTANT NOTES

1. **The backend window MUST stay open** while you use the app
2. **Don't close the terminal** where the backend is running
3. **You need TWO terminal windows:**
   - Window 1: Backend (running `start_server.py`)
   - Window 2: Frontend (running `npm run dev`)

---

## 📋 Complete Step-by-Step

### Step 1: Start Backend
```bash
cd C:\Users\21625\Desktop\diabetes_prediction
python start_server.py
```
**Wait for "Application startup complete"**
**KEEP THIS WINDOW OPEN!**

### Step 2: Test Backend
Open browser → `http://localhost:8000`
**Should see:** `{"message": "Diabetes Prediction API ready"}`

### Step 3: Start Frontend (NEW WINDOW!)
Open a **NEW** Command Prompt:
```bash
cd C:\Users\21625\Desktop\diabetes_prediction\frontend
npm run dev
```

### Step 4: Open Frontend
Open browser → `http://localhost:5173`
**The error should be GONE!**

---

## 🔍 Troubleshooting

### "python: command not found"
**Solution:** Use `python3` instead:
```bash
python3 start_server.py
```

### "ModuleNotFoundError: No module named 'uvicorn'"
**Solution:** Install dependencies:
```bash
cd C:\Users\21625\Desktop\diabetes_prediction
venv\Scripts\activate
pip install -r requirements.txt
cd backend
pip install -r requirements.txt
```

### "Address already in use"
**Solution:** Kill the process on port 8000:
```bash
netstat -ano | findstr :8000
taskkill /PID <NUMBER> /F
```

### Backend starts but immediately closes
**Possible causes:**
- Syntax error in code (check the error message)
- Missing dependencies (run `pip install -r requirements.txt`)
- Port already in use

---

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| Start Backend | `python start_server.py` |
| Test Backend | Open `http://localhost:8000` |
| Start Frontend | `cd frontend && npm run dev` |
| Stop Backend | Press `CTRL+C` in backend terminal |
| Stop Frontend | Press `CTRL+C` in frontend terminal |

---

## 🆘 Still Not Working?

Please tell me:
1. **Which method did you try?** (Method 1, 2, or 3)
2. **What did you see** in the terminal window?
3. **Did you see any error messages?** (copy them)
4. **Did the terminal window close immediately?**

I'll help you debug it!

---

## ✅ Success Checklist

- [ ] Opened Command Prompt
- [ ] Ran `python start_server.py`
- [ ] Saw "Application startup complete" message
- [ ] Terminal window is still open
- [ ] Opened `http://localhost:8000` in browser
- [ ] Saw the API ready message
- [ ] Started frontend in a NEW terminal
- [ ] Opened `http://localhost:5173`
- [ ] No more connection errors!

---

**TRY THIS NOW:**

1. Open Command Prompt
2. Type: `cd C:\Users\21625\Desktop\diabetes_prediction`
3. Press Enter
4. Type: `python start_server.py`
5. Press Enter
6. Tell me what you see!
