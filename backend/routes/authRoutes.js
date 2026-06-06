const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const router = express.Router();

// Lightweight ping endpoint to wake up Render backend from cold starts
router.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'MediCore Backend is awake' });
});

router.post('/login', tenantMiddleware, async (req, res) => {
  const { staff_id, password } = req.body;

  if (!staff_id || !password) {
    return res.status(400).json({ error: 'Please provide ID/Contact and password' });
  }

  try {
    let user = await User.findOne({ staff_id, tenantId: req.tenantId });
    
    // If not a staff member, check if it's a Patient using their contact number as ID
    if (!user) {
      const patient = await Patient.findOne({ contact: staff_id, tenantId: req.tenantId });
      if (patient) {
        // For patients, we'll bypass password check for now, or assume 'password'
        const token = jwt.sign(
          { id: patient._id, role: 'patient', name: patient.name, tenantId: req.tenantId },
          process.env.JWT_SECRET || 'medicore_secret_key',
          { expiresIn: '24h' }
        );
        return res.json({
          message: 'Login successful',
          token,
          user: { id: patient._id, role: 'patient', name: patient.name, tenantId: req.tenantId }
        });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Match JWT payload ID to Patient document ID if role is patient
    let tokenPayload = { 
      id: user._id, 
      staff_id: user.staff_id, 
      role: user.role, 
      name: user.name,
      tenantId: req.tenantId
    };
    if (user.role === 'patient') {
      const patient = await Patient.findOne({ contact: user.staff_id, tenantId: req.tenantId });
      if (patient) {
        tokenPayload.id = patient._id;
      }
    }

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'medicore_secret_key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: tokenPayload.id,
        staff_id: user.staff_id,
        role: user.role,
        name: user.name,
        specialty: user.specialty,
        isSetupComplete: user.isSetupComplete,
        tenantId: req.tenantId
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all doctors (publicly accessible to authenticated staff, scoped to tenant)
router.get('/doctors', tenantMiddleware, async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', tenantId: req.tenantId }, 'name specialty available');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile (e.g. for first time setup, scoped to tenant)
router.put('/profile/:id', tenantMiddleware, async (req, res) => {
  try {
    const { name, specialty, isSetupComplete } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId }, 
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
      isSetupComplete: user.isSetupComplete,
      tenantId: user.tenantId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Patient registration public endpoint
router.post('/register', tenantMiddleware, async (req, res) => {
  const { firstName, lastName, email, contact, password, age, gender, bloodGroup, allergies, history } = req.body;

  if (!firstName || !lastName || !email || !contact || !password || !age || !gender || !bloodGroup) {
    return res.status(400).json({ error: 'All fields are required (Name, Email, Mobile, Password, Age, Gender, Blood Group)' });
  }

  try {
    // Check if user already exists in this tenant
    const existingUser = await User.findOne({ staff_id: contact, tenantId: req.tenantId });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this mobile/contact number already exists at this hospital' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const name = `${firstName} ${lastName}`;

    // Create User record for authentication (scoped to tenant)
    await User.create({
      tenantId: req.tenantId,
      staff_id: contact,
      password_hash,
      role: 'patient',
      name,
      isSetupComplete: true
    });

    // Create linked Patient record for clinical data (scoped to tenant)
    const newPatient = await Patient.create({
      tenantId: req.tenantId,
      name,
      age: parseInt(age) || 30,
      gender: gender || 'Male',
      contact,
      email: email || 'N/A',
      address: '',
      bloodGroup: bloodGroup || 'O+',
      allergies: allergies || 'None',
      medicalHistory: history ? [history] : []
    });

    // Generate JWT including tenantId
    const token = jwt.sign(
      { id: newPatient._id, role: 'patient', name, tenantId: req.tenantId },
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
        name,
        tenantId: req.tenantId
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const RoleCoverage = require('../models/RoleCoverage');

// GET role coverage overrides (scoped to tenant, for any logged-in staff member)
router.get('/role-coverage', verifyToken, async (req, res) => {
  try {
    let coverage = await RoleCoverage.findOne({ tenantId: req.tenantId });
    if (!coverage) {
      return res.json({});
    }
    res.json(coverage.state || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST update role coverage overrides (scoped to tenant, admin only)
router.post('/role-coverage', verifyToken, isAdmin, async (req, res) => {
  try {
    const { state } = req.body;
    let coverage = await RoleCoverage.findOne({ tenantId: req.tenantId });
    if (!coverage) {
      coverage = new RoleCoverage({
        tenantId: req.tenantId,
        state: state || {}
      });
    } else {
      coverage.state = state || {};
      coverage.markModified('state');
    }
    await coverage.save();
    res.json({ message: 'Role coverage updated successfully', state: coverage.state });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
