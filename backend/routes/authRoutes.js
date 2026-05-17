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

// Patient registration public endpoint
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, contact, password, age, gender, bloodGroup, allergies, history } = req.body;

  if (!firstName || !lastName || !email || !contact || !password || !age || !gender || !bloodGroup) {
    return res.status(400).json({ error: 'All fields are required (Name, Email, Mobile, Password, Age, Gender, Blood Group)' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ staff_id: contact });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this mobile/contact number already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const name = `${firstName} ${lastName}`;

    // Create User record for authentication
    await User.create({
      staff_id: contact,
      password_hash,
      role: 'patient',
      name,
      isSetupComplete: true
    });

    // Create linked Patient record for clinical data
    const newPatient = await Patient.create({
      name,
      age: parseInt(age) || 30,
      gender: gender || 'Male',
      contact,
      address: '',
      bloodGroup: bloodGroup || 'O+',
      allergies: allergies || 'None',
      medicalHistory: history ? [history] : []
    });

    // Generate JWT
    const token = jwt.sign(
      { id: newPatient._id, role: 'patient', name },
      process.env.JWT_SECRET || 'medicore_secret_key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newPatient._id,
        staff_id: contact,
        role: 'patient',
        name
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

module.exports = router;
