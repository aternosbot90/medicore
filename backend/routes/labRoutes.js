const express = require('express');
const LabRequest = require('../models/LabRequest');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(verifyToken);

// Get lab requests (scoped to tenant)
router.get('/', async (req, res) => {
  try {
    const query = { tenantId: req.tenantId };
    if (req.query.status) query.status = req.query.status;
    if (req.query.patientId) query.patientId = req.query.patientId;

    const requests = await LabRequest.find(query)
      .populate('patientId', 'name age contact')
      .populate('doctorId', 'name')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create lab request (scoped to tenant)
router.post('/', async (req, res) => {
  try {
    req.body.tenantId = req.tenantId;
    const request = await LabRequest.create(req.body);
    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update lab request (add results, change status, scoped to tenant)
router.put('/:id', async (req, res) => {
  try {
    const request = await LabRequest.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId }, 
      req.body, 
      { returnDocument: 'after' }
    );
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json(request);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
