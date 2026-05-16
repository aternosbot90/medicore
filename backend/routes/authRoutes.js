const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { staff_id, password } = req.body;

  if (!staff_id || !password) {
    return res.status(400).json({ error: 'Please provide ID/Contact and password' });
  }

  try {
    let user = await User.findOne({ staff_id });
    
    // If not a staff member, check if it's a Patient using their contact number as ID
    if (!user) {
      const patient = await Patient.findOne({ contact: staff_id });
      if (patient) {
        // For patients, we'll bypass password check for now, or assume 'password'
        const token = jwt.sign(
          { id: patient._id, role: 'patient', name: patient.name },
          process.env.JWT_SECRET || 'medicore_secret_key',
          { expiresIn: '24h' }
        );
        return res.json({
          message: 'Login successful',
          token,
          user: { id: patient._id, role: 'patient', name: patient.name }
        });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, staff_id: user.staff_id, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'medicore_secret_key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        staff_id: user.staff_id,
        role: user.role,
        name: user.name,
        specialty: user.specialty,
        isSetupComplete: user.isSetupComplete
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all doctors (publicly accessible to authenticated staff)
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }, 'name specialty available');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile (e.g. for first time setup)
router.put('/profile/:id', async (req, res) => {
  try {
    const { name, specialty, isSetupComplete } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, 
      { name, specialty, isSetupComplete }, 
      { returnDocument: 'after' }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user._id,
      staff_id: user.staff_id,
      role: user.role,
      name: user.name,
      specialty: user.specialty,
      isSetupComplete: user.isSetupComplete
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
