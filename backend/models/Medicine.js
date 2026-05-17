const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  stock: { type: Number, required: true, default: 0 },
  unit: { type: String, required: true },
  mrp: { type: Number, required: true },
  status: { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock'], default: 'In Stock' },
  expiry: { type: String, default: '--' }
}, { timestamps: true });

module.exports = mongoose.model('Medicine', medicineSchema);
