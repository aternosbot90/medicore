const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, default: 'city_hospital', index: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  sku: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  unit: { type: String, required: true },
  mrp: { type: Number, required: true },
  status: { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock'], default: 'In Stock' },
  expiry: { type: String, default: '--' }
}, { timestamps: true });

// Compound index to ensure uniqueness of SKU within each tenant
medicineSchema.index({ tenantId: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model('Medicine', medicineSchema);
