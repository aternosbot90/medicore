const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  items: [{
    description: { type: String, required: true },
    amount: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' },
  paymentMethod: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Billing', billingSchema);
