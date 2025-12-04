// Email validation
export const validateEmail = (email) => {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

// Phone number validation (basic)
export const validatePhone = (phone) => {
  if (!phone) return false;
  const re = /^[+\d\s-()]{10,}$/;
  return re.test(phone);
};

// Patient form validation
export const validatePatientForm = (formData) => {
  const errors = {};
  
  // Name validation
  if (!formData.name?.trim()) {
    errors.name = 'Name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }
  
  // Email validation
  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email';
  }
  
  // Phone validation
  if (formData.phone && !validatePhone(formData.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }
  
  // Date of birth validation
  if (formData.dateOfBirth) {
    const dob = new Date(formData.dateOfBirth);
    const today = new Date();
    
    if (dob > today) {
      errors.dateOfBirth = 'Date of birth cannot be in the future';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Prediction form validation
export const validatePredictionForm = (formData) => {
  const errors = {};
  const numberFields = [
    'age', 'bmi', 'HbA1c_level', 'blood_glucose_level',
    'hypertension', 'heart_disease'
  ];

  // Check required numeric fields
  numberFields.forEach(field => {
    const value = formData[field];
    if (value === undefined || value === null || value === '') {
      errors[field] = 'This field is required';
    } else if (isNaN(Number(value))) {
      errors[field] = 'Must be a valid number';
    }
  });

  // Additional validation for specific fields
  if (formData.age && (formData.age < 0 || formData.age > 120)) {
    errors.age = 'Age must be between 0 and 120';
  }

  if (formData.bmi && (formData.bmi < 10 || formData.bmi > 60)) {
    errors.bmi = 'BMI must be between 10 and 60';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  email: validateEmail,
  phone: validatePhone,
  patient: validatePatientForm,
  prediction: validatePredictionForm
};
