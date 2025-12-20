# 🔍 Debugging the 500 Error

## The Issue

You're getting a 500 error on `/api/glucose/readings` even when viewing a patient page.

## What to Check

### 1. Backend Terminal Output

**Look at the terminal where the backend is running.**

When the 500 error occurs, you should see an error message like:

```
ERROR: [error details]
Traceback (most recent call last):
  File "...", line X, in ...
    ...
[Error Type]: [Error Message]
```

**Please share this error message!**

---

### 2. Check the Exact URL Being Called

In browser:
1. Press `F12` (DevTools)
2. Go to "Network" tab
3. Refresh the page
4. Find the red (failed) request: `glucose/readings`
5. Click on it
6. Look at:
   - **Request URL** - What's the full URL?
   - **Response** tab - What's the error message?

---

### 3. Test API Directly

Go to: `http://localhost:8000/docs`

1. Find: `GET /api/glucose/readings/patient/{patient_id}`
2. Click "Try it out"
3. Enter a patient_id (from the URL when viewing a patient)
4. Click "Execute"
5. See what error it returns

---

## Possible Causes

### Cause 1: Missing Dependency

**Error**: `No module named 'Depends'` or similar

**Fix**:
```bash
cd backend
pip install fastapi
```

### Cause 2: Database Issue

**Error**: `Connection refused` or `MongoDB error`

**Fix**: Check if MongoDB is running

### Cause 3: Data Format Issue

**Error**: `Invalid date format` or `TypeError`

**Fix**: The date parsing might be failing

### Cause 4: Missing Patient

**Error**: `Patient not found` or `None has no attribute`

**Fix**: The patient might not exist in database

---

## Quick Test

### Test if Backend is Working at All

Open browser to: `http://localhost:8000/docs`

If you see the Swagger docs → Backend is running  
If you don't → Backend crashed

---

## Most Likely Issue

Based on the code, the most likely issue is:

**Date parsing error** in line 118:
```python
datetime.fromisoformat(start_date.replace('Z', '+00:00'))
```

If the frontend is sending a date in a different format, this will fail.

---

## Temporary Fix: Disable Date Filtering

If you want to quickly test, I can modify the code to skip date filtering temporarily.

---

## What I Need From You

**Please share:**

1. **Backend terminal error message** (the full error with traceback)
2. **Or** the error from browser Network tab → Response

This will tell me exactly what's wrong!

---

## In the Meantime

Try these other features that might work:
- **Medications tab** - See if this loads
- **Alerts tab** - Check if alerts work
- **Analytics tab** - See if this loads

If those work, it's specifically a glucose endpoint issue.  
If those also fail, it's a broader backend problem.

---

**Share the backend terminal error and I can fix it immediately!** 🔧
