const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

// Apply middleware to all routes in this file
router.use(verifyToken, isAdmin);

// Get all staff users (scoped to tenant)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ tenantId: req.tenantId }, 'staff_id role name max_slots');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new staff user (scoped to tenant)
router.post('/users', async (req, res) => {
  const { staff_id, password, role, name, max_slots } = req.body;

  if (!staff_id || !password || !role || !name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ staff_id, tenantId: req.tenantId });
    if (existingUser) {
      return res.status(400).json({ error: 'Staff ID already exists at this hospital' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      tenantId: req.tenantId,
      staff_id,
      password_hash: hash,
      role,
      name,
      max_slots: role === 'doctor' ? (max_slots ? Number(max_slots) : 10) : undefined
    });

    res.status(201).json({ id: newUser._id, staff_id, role, name, max_slots: newUser.max_slots, tenantId: req.tenantId });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a staff user (scoped to tenant)
router.delete('/users/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const deletedUser = await User.findOneAndDelete({ _id: id, tenantId: req.tenantId });
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all low-stock inventory alerts from both Pharmacy (Medicine) and Laboratory (LabInventory) (scoped to tenant)
router.get('/inventory-alerts', async (req, res) => {
  try {
    const Medicine = require('../models/Medicine');
    const LabInventory = require('../models/LabInventory');

    const lowMedicines = await Medicine.find({ status: { $in: ['Low Stock', 'Out of Stock'] }, tenantId: req.tenantId });
    const lowLabReagents = await LabInventory.find({ status: { $in: ['Low Stock', 'Out of Stock'] }, tenantId: req.tenantId });

    // Format them with a consistent structure for the Admin Dashboard
    const alerts = [
      ...lowMedicines.map(m => ({
        _id: m._id,
        name: m.name,
        category: m.category,
        stock: `${m.stock} ${m.unit}`,
        status: m.status === 'Out of Stock' ? 'Out of Stock' : 'Low Stock',
        department: 'Pharmacy',
        rawItem: m
      })),
      ...lowLabReagents.map(l => ({
        _id: l._id,
        name: l.name,
        category: l.category,
        stock: `${l.stock} ${l.unit}`,
        status: l.status === 'Out of Stock' ? 'Out of Stock' : 'Low Stock',
        department: 'Laboratory',
        rawItem: l
      }))
    ];

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
