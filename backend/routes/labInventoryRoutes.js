const express = require('express');
const LabInventory = require('../models/LabInventory');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(verifyToken);

// Seeding helper for default lab inventory items
const seedDefaultLabInventory = async () => {
  try {
    const count = await LabInventory.countDocuments();
    if (count === 0) {
      const defaults = [
        { name: 'Hematology Reagent', category: 'Reagents', stock: 12, unit: 'L', threshold: 20, lastRestock: '12 May', status: 'Low Stock' },
        { name: 'Vacuum Tubes (Red)', category: 'Consumables', stock: 240, unit: 'units', threshold: 1000, lastRestock: '05 May', status: 'Low Stock' },
        { name: 'Glucose Test Strips', category: 'Consumables', stock: 5000, unit: 'units', threshold: 2000, lastRestock: '10 May', status: 'Healthy' },
        { name: 'COVID-19 Swab Kits', category: 'Consumables', stock: 80, unit: 'units', threshold: 20, lastRestock: '14 May', status: 'Healthy' }
      ];
      // Save items sequentially to trigger pre-save middleware status calculation
      for (const item of defaults) {
        await LabInventory.create(item);
      }
      console.log('Default Laboratory inventory seeded successfully.');
    }
  } catch (err) {
    console.error('Failed to seed Lab Inventory', err);
  }
};

// Get all lab inventory items
router.get('/', async (req, res) => {
  try {
    await seedDefaultLabInventory();
    const inventory = await LabInventory.find().sort({ createdAt: -1 });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new lab inventory item
router.post('/', async (req, res) => {
  try {
    const { name, category, stock, unit, threshold } = req.body;
    const newItem = await LabInventory.create({
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

// Update a lab inventory item (Edit or Restock)
router.put('/:id', async (req, res) => {
  try {
    const { name, category, stock, unit, threshold, isRestock, addQty } = req.body;
    const item = await LabInventory.findById(req.params.id);
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

// Delete a lab inventory item
router.delete('/:id', async (req, res) => {
  try {
    const item = await LabInventory.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
