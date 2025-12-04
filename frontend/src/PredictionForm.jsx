import React, { useState } from "react";

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/predictions/`;
const defaultForm = {
  gender: "Male",
  age: 30,
  hypertension: 0,
  heart_disease: 0,
  bmi: 25.0,
  HbA1c_level: 5.5,
  blood_glucose_level: 120,
  smoking_history: "never",
};

function PredictionForm() {
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: parseFloat(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error("Please log in to make predictions");
      }
      
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      
      if (res.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error("Session expired. Please log in again.");
      }
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `API error: ${res.statusText}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError("Prediction failed. Please check your backend and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>🩺 Diabetes Prediction</h1>
      <FormControl fullWidth margin="normal">
        <InputLabel id="patient-select-label">
          Select Patient (Optional)
        </InputLabel>
        <Select
          labelId="patient-select-label"
          id="patient-select"
          value={selectedPatient?.id || ""}
          onChange={(e) => {
            const patient = patients.find((p) => p.id === e.target.value);
            setSelectedPatient(patient || null);
          }}
          label="Select Patient"
        >
          <MenuItem value="">
            <em>New Patient</em>
          </MenuItem>
          {patients.map((patient) => (
            <MenuItem key={patient.id} value={patient.id}>
              {patient.name} ({patient.email})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <form onSubmit={handleSubmit} className="input-form">
        <label>
          Gender:
          <select name="gender" value={form.gender} onChange={handleChange}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label>
          Age:
          <input
            type="number"
            name="age"
            min="1"
            max="120"
            value={form.age}
            onChange={handleNumberChange}
            required
          />
        </label>
        <label>
          Hypertension:
          <select
            name="hypertension"
            value={form.hypertension}
            onChange={handleChange}
          >
            <option value={0}>No</option>
            <option value={1}>Yes</option>
          </select>
        </label>
        <label>
          Heart Disease:
          <select
            name="heart_disease"
            value={form.heart_disease}
            onChange={handleChange}
          >
            <option value={0}>No</option>
            <option value={1}>Yes</option>
          </select>
        </label>
        <label>
          BMI:
          <input
            type="number"
            name="bmi"
            min="10"
            max="60"
            step="0.1"
            value={form.bmi}
            onChange={handleNumberChange}
            required
          />
        </label>
        <label>
          HbA1c Level:
          <input
            type="number"
            name="HbA1c_level"
            min="3"
            max="15"
            step="0.1"
            value={form.HbA1c_level}
            onChange={handleNumberChange}
            required
          />
        </label>
        <label>
          Blood Glucose Level:
          <input
            type="number"
            name="blood_glucose_level"
            min="50"
            max="300"
            value={form.blood_glucose_level}
            onChange={handleNumberChange}
            required
          />
        </label>
        <label>
          Smoking History:
          <select
            name="smoking_history"
            value={form.smoking_history}
            onChange={handleChange}
          >
            <option value="never">Never</option>
            <option value="former">Former</option>
            <option value="current">Current</option>
            <option value="ever">Ever</option>
            <option value="not current">Not Current</option>
          </select>
        </label>
        <button type="submit" className="predict-button" disabled={loading}>
          {loading ? (
            <span className="button-loading">
              <span className="spinner"></span> Predicting...
            </span>
          ) : (
            <span className="button-content">
              <span className="button-text">Get Prediction</span>
              <svg
                className="button-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </span>
          )}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="result">
          <h2>Prediction Result:</h2>
          <p>
            <b>{result.prediction === 1 ? "🩸 Diabetic" : "✅ Non-Diabetic"}</b>
          </p>
          {result.probabilities && (
            <div>
              <b>Class Probabilities:</b>
              <pre>{JSON.stringify(result.probabilities, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
      <footer>Powered by a machine learning model 🧠</footer>
    </div>
  );
}

export default PredictionForm;
