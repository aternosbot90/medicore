const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    default: 'city_hospital',
    index: true
  },
  staff_id: {
    type: String,
    required: true
  },
  password_hash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  specialty: {
    type: String,
    default: 'General Physician'
  },
  isSetupComplete: {
    type: Boolean,
    default: false
  },
  max_slots: {
    type: Number,
    default: 10
  }
}, { timestamps: true });

// Compound unique index for local uniqueness within each tenant
userSchema.index({ tenantId: 1, staff_id: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
