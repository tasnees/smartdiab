// frontend/src/utils/pdfExport.js
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const exportToPDF = (prediction, patient) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Diabetes Risk Assessment Report', 20, 20);
  
  // Patient Information
  doc.setFontSize(12);
  doc.text('Patient Information', 20, 40);
  
  const patientData = [
    ['Name:', patient?.name || 'Not specified'],
    ['Age:', prediction.age],
    ['Gender:', prediction.gender],
    ['BMI:', prediction.bmi],
    ['HbA1c Level:', prediction.HbA1c_level],
    ['Blood Glucose Level:', prediction.blood_glucose_level]
  ];
  
  doc.autoTable({
    startY: 50,
    head: [['Field', 'Value']],
    body: patientData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }
  });
  
  // Risk Assessment
  doc.text('Risk Assessment', 20, doc.lastAutoTable.finalY + 20);
  
  const risk = prediction.prediction === 1 ? 'High Risk' : 'Low Risk';
  const riskColor = prediction.prediction === 1 ? [231, 76, 60] : [39, 174, 96];
  
  doc.setFillColor(...riskColor);
  doc.rect(20, doc.lastAutoTable.finalY + 30, 40, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(risk, 25, doc.lastAutoTable.finalY + 37);
  doc.setTextColor(0, 0, 0);
  
  // Recommendations
  doc.text('Recommendations', 20, doc.lastAutoTable.finalY + 50);
  
  const recommendations = prediction.prediction === 1
    ? [
        'Schedule a follow-up appointment with your healthcare provider',
        'Consider lifestyle modifications including diet and exercise',
        'Monitor blood glucose levels regularly',
        'Consider medication if recommended by your doctor'
      ]
    : [
        'Maintain a healthy lifestyle',
        'Continue regular check-ups',
        'Monitor risk factors'
      ];
  
  recommendations.forEach((rec, i) => {
    doc.text(`• ${rec}`, 30, doc.lastAutoTable.finalY + 70 + (i * 7));
  });
  
  // Footer
  const date = new Date().toLocaleDateString();
  doc.setFontSize(10);
  doc.text(`Report generated on: ${date}`, 20, 280);
  
  // Save the PDF
  doc.save(`Diabetes_Risk_Assessment_${patient?.name || 'Patient'}_${date.replace(/\//g, '-')}.pdf`);
};