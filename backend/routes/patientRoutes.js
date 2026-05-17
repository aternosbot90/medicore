const express = require('express');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(verifyToken);

// Get all patients
router.get('/', async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new patient
router.post('/', async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a single patient
router.get('/:id', async (req, res) => {
  try {
    let patient = null;
    try { patient = await Patient.findById(req.params.id); } catch(e) {}
    if (!patient) {
      try {
        const user = await User.findById(req.params.id);
        if (user && user.role === 'patient') {
          patient = await Patient.findOne({ contact: user.staff_id });
        }
      } catch(e) {}
    }
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update patient details (profile & settings)
router.put('/:id', async (req, res) => {
  const { name, age, gender, contact, address, bloodGroup, allergies, medicalHistory } = req.body;
  try {
    let patient = null;
    try { patient = await Patient.findById(req.params.id); } catch(e) {}
    if (!patient) {
      try {
        const userObj = await User.findById(req.params.id);
        if (userObj && userObj.role === 'patient') {
          patient = await Patient.findOne({ contact: userObj.staff_id });
        }
      } catch(e) {}
    }
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const oldContact = patient.contact;

    // Update Patient details
    patient.name = name || patient.name;
    patient.age = parseInt(age) || patient.age;
    patient.gender = gender || patient.gender;
    patient.contact = contact || patient.contact;
    patient.address = address !== undefined ? address : patient.address;
    patient.bloodGroup = bloodGroup || patient.bloodGroup;
    patient.allergies = allergies !== undefined ? allergies : patient.allergies;
    patient.medicalHistory = medicalHistory || patient.medicalHistory;

    await patient.save();

    // Sync with User authentication table
    const user = await User.findOne({ staff_id: oldContact });
    if (user) {
      user.name = patient.name;
      user.staff_id = patient.contact;
      await user.save();
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update patient password
router.put('/:id/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const bcrypt = require('bcrypt');

  try {
    let patient = null;
    try { patient = await Patient.findById(req.params.id); } catch(e) {}
    if (!patient) {
      try {
        const userObj = await User.findById(req.params.id);
        if (userObj && userObj.role === 'patient') {
          patient = await Patient.findOne({ contact: userObj.staff_id });
        }
      } catch(e) {}
    }
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const user = await User.findOne({ staff_id: patient.contact });
    if (!user) return res.status(404).json({ error: 'Authentication user not found' });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash and update new password
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
