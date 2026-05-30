const express = require('express');
const Billing = require('../models/Billing');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(verifyToken);

// Get bills (scoped to tenant)
router.get('/', async (req, res) => {
  try {
    const query = { tenantId: req.tenantId };
    if (req.query.patientId) query.patientId = req.query.patientId;

    const bills = await Billing.find(query)
      .populate('patientId', 'name contact')
      .sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create bill (scoped to tenant)
router.post('/', async (req, res) => {
  try {
    req.body.tenantId = req.tenantId;
    const bill = await Billing.create(req.body);
    res.status(201).json(bill);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update bill (scoped to tenant)
router.put('/:id', async (req, res) => {
  try {
    const bill = await Billing.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId }, 
      req.body, 
      { returnDocument: 'after' }
    );
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json(bill);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
