const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

// Apply middleware to all routes in this file
router.use(verifyToken, isAdmin);

// Get all staff users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, 'staff_id role name');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new staff user
router.post('/users', async (req, res) => {
  const { staff_id, password, role, name } = req.body;

  if (!staff_id || !password || !role || !name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ staff_id });
    if (existingUser) {
      return res.status(400).json({ error: 'Staff ID already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      staff_id,
      password_hash: hash,
      role,
      name
    });

    res.status(201).json({ id: newUser._id, staff_id, role, name });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a staff user
router.delete('/users/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
