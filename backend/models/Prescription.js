const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    medicine: { type: String, required: true },
    dosage: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String }
  }],
  status: { type: String, enum: ['Pending', 'Dispensed'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
