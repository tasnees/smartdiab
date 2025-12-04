import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Shield, TrendingUp, Zap } from 'lucide-react';

function Introduction() {
  const features = [
    {
      icon: <Activity size={32} className="feature-icon" />,
      title: "Advanced AI Model",
      description: "Powered by a Random Forest Classifier trained on comprehensive health data to provide accurate predictions."
    },
    {
      icon: <Shield size={32} className="feature-icon" />,
      title: "Privacy Focused",
      description: "Your data stays on your device. We don't store any personal health information."
    },
    {
      icon: <TrendingUp size={32} className="feature-icon" />,
      title: "Health Insights",
      description: "Understand how different health factors contribute to diabetes risk with our detailed analysis."
    },
    {
      icon: <Zap size={32} className="feature-icon" />,
      title: "Instant Results",
      description: "Get your prediction instantly with our optimized machine learning model."
    }
  ];

  return (
    <div className="container">
      <div className="intro-container">
        <h1>Predict Diabetes Risk with AI</h1>
        
        <div className="intro-content">
          <p>
            Our advanced machine learning model analyzes key health indicators to assess your risk of diabetes. 
            By evaluating factors such as blood glucose levels, BMI, and medical history, we provide you with 
            valuable insights into your health status.
          </p>
          
          <div className="features">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="feature-card"
                style={{ '--delay': index + 1 }}
              >
                <div className="feature-icon-container">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
          
          <p className="disclaimer">
            <strong>Important:</strong> This tool is for informational purposes only and is not 
            intended to be a substitute for professional medical advice, diagnosis, or treatment. 
            Always seek the advice of your physician or other qualified health provider with any 
            questions you may have regarding a medical condition.
          </p>
          
          <div className="cta-container">
            <Link to="/predict" className="button">
              Try the Prediction Tool
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Introduction;
