const express = require('express');
const Medicine = require('../models/Medicine');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(verifyToken);

// Seed helper (scoped to tenant)
const seedDefaultMedicines = async (tenantId) => {
  try {
    const count = await Medicine.countDocuments({ tenantId });
    if (count === 0) {
      const defaults = [
        { tenantId, name: "Paracetamol 650mg", category: "Pain Relief", sku: "PAR-650", stock: 250, unit: "Strip", mrp: 25.00, status: "In Stock", expiry: "30/06/2025" },
        { tenantId, name: "Azithromycin 500mg", category: "Antibiotic", sku: "AZI-500", stock: 0, unit: "Strip", mrp: 55.00, status: "Out of Stock", expiry: "--" },
        { tenantId, name: "Cetirizine 10mg", category: "Anti-Allergic", sku: "CET-10", stock: 12, unit: "Strip", mrp: 18.00, status: "Low Stock", expiry: "15/08/2024" },
        { tenantId, name: "Pantoprazole 40mg", category: "Antacid", sku: "PAN-40", stock: 145, unit: "Strip", mrp: 45.00, status: "In Stock", expiry: "22/12/2025" },
        { tenantId, name: "Amoxicillin 250mg", category: "Antibiotic", sku: "AMX-250", stock: 50, unit: "Capsule", mrp: 35.00, status: "In Stock", expiry: "10/11/2024" }
      ];
      await Medicine.insertMany(defaults);
      console.log(`Default medicines seeded successfully for tenant: ${tenantId}`);
    }
  } catch (err) {
    console.error('Failed to seed medicines', err);
  }
};

// Get all medicines (scoped to tenant)
router.get('/', async (req, res) => {
  try {
    await seedDefaultMedicines(req.tenantId);
    const medicines = await Medicine.find({ tenantId: req.tenantId }).sort({ createdAt: -1 });
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new medicine (scoped to tenant)
router.post('/', async (req, res) => {
  try {
    // Determine status based on stock level
    let status = 'In Stock';
    const stock = Number(req.body.stock) || 0;
    if (stock === 0) {
      status = 'Out of Stock';
    } else if (stock <= 20) {
      status = 'Low Stock';
    }
    
    req.body.tenantId = req.tenantId;
    const medicine = await Medicine.create({
      ...req.body,
      status
    });
    res.status(201).json(medicine);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a medicine (Edit or Restock, scoped to tenant)
router.put('/:id', async (req, res) => {
  try {
    let updateData = { ...req.body };
    if (updateData.stock !== undefined) {
      const stock = Number(updateData.stock) || 0;
      if (stock === 0) {
        updateData.status = 'Out of Stock';
      } else if (stock <= 20) {
        updateData.status = 'Low Stock';
      } else {
        updateData.status = 'In Stock';
      }
    }
    
    const medicine = await Medicine.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId }, 
      updateData, 
      { returnDocument: 'after' }
    );
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
    res.json(medicine);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a medicine (scoped to tenant)
router.delete('/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get medicine by SKU / Barcode (scoped to tenant)
router.get('/barcode/:sku', async (req, res) => {
  try {
    const medicine = await Medicine.findOne({ tenantId: req.tenantId, sku: req.params.sku });
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found with this barcode' });
    }
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
