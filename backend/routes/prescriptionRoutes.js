const express = require('express');
const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(verifyToken);

// Get all prescriptions (filter by status or patientId, scoped to tenant)
router.get('/', async (req, res) => {
  try {
    const query = { tenantId: req.tenantId };
    if (req.query.status) query.status = req.query.status;
    if (req.query.patientId) query.patientId = req.query.patientId;

    const prescriptions = await Prescription.find(query)
      .populate('patientId', 'name age contact')
      .populate('doctorId', 'name')
      .sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a prescription (scoped to tenant)
router.post('/', async (req, res) => {
  try {
    req.body.tenantId = req.tenantId;
    const prescription = await Prescription.create(req.body);
    res.status(201).json(prescription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update status (e.g. Dispensed) and decrement stock (scoped to tenant)
router.put('/:id', async (req, res) => {
  try {
    const rxId = req.params.id;
    const existingRx = await Prescription.findOne({ _id: rxId, tenantId: req.tenantId });
    if (!existingRx) return res.status(404).json({ error: 'Prescription not found' });

    // Transitioning from Pending to Dispensed
    if (req.body.status === 'Dispensed' && existingRx.status !== 'Dispensed') {
      for (const item of existingRx.items) {
        if (item.medicine) {
          // Extract base medicine name (e.g., matching "Paracetamol" or "Cetirizine")
          const cleanName = item.medicine.split(' ')[0].trim();
          const med = await Medicine.findOne({
            name: { $regex: new RegExp(cleanName, 'i') },
            tenantId: req.tenantId
          });

          if (med) {
            // Deduct a fixed quantity of 10 units for a standard prescription dispense
            med.stock = Math.max(0, med.stock - 10);
            if (med.stock === 0) {
              med.status = 'Out of Stock';
            } else if (med.stock <= 20) {
              med.status = 'Low Stock';
            } else {
              med.status = 'In Stock';
            }
            await med.save();
          }
        }
      }
    }

    const prescription = await Prescription.findOneAndUpdate(
      { _id: rxId, tenantId: req.tenantId }, 
      req.body, 
      { returnDocument: 'after' }
    );
    res.json(prescription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
