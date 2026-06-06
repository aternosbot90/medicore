const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, default: 'city_hospital', index: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  contact: { type: String, required: true },
  email: { type: String, default: 'N/A' },
  address: { type: String },
  bloodGroup: { type: String },
  allergies: { type: String, default: 'None' },
  medicalHistory: [{ type: String }],
}, { timestamps: true });

// Compound index to speed up patient lookup on login by contact and tenantId
patientSchema.index({ tenantId: 1, contact: 1 });

module.exports = mongoose.model('Patient', patientSchema);
