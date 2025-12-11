# Diabetes Prediction App

This project consists of two parts:
1.  **Streamlit Demo**: A simple standalone web app for quick predictions.
2.  **Full Stack Web App**: A more complex application with a FastAPI backend and React frontend.

## 1. Quick Start: Streamlit Demo
This is the easiest way to run the prediction model.

1.  **Install dependencies** (if you haven't already):
    ```bash
    pip install -r requirements.txt
    ```
2.  **Run the app**:
    ```bash
    streamlit run app.py
    ```
3.  Open your browser at the URL shown (usually `http://localhost:8501`).

---

## 2. Full Stack Application
If you want to run the full client-server application:

### Backend (FastAPI)
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Run the server:
    ```bash
    python run.py
    ```
    The API will be available at `http://localhost:8000`.

### Frontend (React + Vite)
1.  Navigate to the frontend directory (in a new terminal):
    ```bash
    cd frontend
    ```
2.  Install Node.js dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm start
    ```
    The frontend will launch at `http://localhost:5173` (or similar).
