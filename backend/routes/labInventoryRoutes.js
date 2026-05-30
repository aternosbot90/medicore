const express = require('express');
const LabInventory = require('../models/LabInventory');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(verifyToken);

// Seeding helper for default lab inventory items (scoped to tenant)
const seedDefaultLabInventory = async (tenantId) => {
  try {
    const count = await LabInventory.countDocuments({ tenantId });
    if (count === 0) {
      const defaults = [
        { tenantId, name: 'Hematology Reagent', category: 'Reagents', stock: 12, unit: 'L', threshold: 20, lastRestock: '12 May', status: 'Low Stock' },
        { tenantId, name: 'Vacuum Tubes (Red)', category: 'Consumables', stock: 240, unit: 'units', threshold: 1000, lastRestock: '05 May', status: 'Low Stock' },
        { tenantId, name: 'Glucose Test Strips', category: 'Consumables', stock: 5000, unit: 'units', threshold: 2000, lastRestock: '10 May', status: 'Healthy' },
        { tenantId, name: 'COVID-19 Swab Kits', category: 'Consumables', stock: 80, unit: 'units', threshold: 20, lastRestock: '14 May', status: 'Healthy' }
      ];
      // Save items sequentially to trigger pre-save middleware status calculation
      for (const item of defaults) {
        await LabInventory.create(item);
      }
      console.log(`Default Laboratory inventory seeded successfully for tenant: ${tenantId}`);
    }
  } catch (err) {
    console.error('Failed to seed Lab Inventory', err);
  }
};

// Get all lab inventory items (scoped to tenant)
router.get('/', async (req, res) => {
  try {
    await seedDefaultLabInventory(req.tenantId);
    const inventory = await LabInventory.find({ tenantId: req.tenantId }).sort({ createdAt: -1 });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new lab inventory item (scoped to tenant)
router.post('/', async (req, res) => {
  try {
    const { name, category, stock, unit, threshold } = req.body;
    const newItem = await LabInventory.create({
      tenantId: req.tenantId,
      name,
      category,
      stock: Number(stock) || 0,
      unit,
      threshold: Number(threshold) || 20,
      lastRestock: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a lab inventory item (Edit or Restock, scoped to tenant)
router.put('/:id', async (req, res) => {
  try {
    const { name, category, stock, unit, threshold, isRestock, addQty } = req.body;
    const item = await LabInventory.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (name !== undefined) item.name = name;
    if (category !== undefined) item.category = category;
    if (unit !== undefined) item.unit = unit;
    if (threshold !== undefined) item.threshold = Number(threshold);

    if (isRestock && addQty !== undefined) {
      item.stock += Number(addQty);
      item.lastRestock = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } else if (stock !== undefined) {
      item.stock = Number(stock);
    }

    await item.save(); // Triggers status recalculation middleware
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a lab inventory item (scoped to tenant)
router.delete('/:id', async (req, res) => {
  try {
    const item = await LabInventory.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
