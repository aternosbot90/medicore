const express = require('express');
const Appointment = require('../models/Appointment');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(verifyToken);

// Get all appointments (optionally filter by doctorId or patientId)
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.doctorId) query.doctorId = req.query.doctorId;
    if (req.query.patientId) query.patientId = req.query.patientId;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name contact age gender')
      .populate('doctorId', 'name role')
      .sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create an appointment
router.post('/', async (req, res) => {
  try {
    const appointment = await Appointment.create(req.body);
    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update appointment status or add notes/diagnosis
router.put('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete all appointments (for debugging/cleaning bad data)
router.delete('/clear-all', async (req, res) => {
  try {
    await Appointment.deleteMany({});
    res.json({ message: 'All appointments cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an appointment
router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ message: 'Appointment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
