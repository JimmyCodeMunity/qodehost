const express = require('express');
const router = express.Router();
const {
  submitServiceRequest,
  getAllServiceRequests,
  getServiceRequestById,
  updateServiceRequest,
  deleteServiceRequest,
  getServiceRequestStats
} = require('../controllers/ServiceRequestController');
const { adminAuth } = require('../middleware/auth');

// Public route - submit service request
router.post('/submit', submitServiceRequest);

// Admin protected routes
router.get('/', adminAuth, getAllServiceRequests);
router.get('/stats', adminAuth, getServiceRequestStats);
router.get('/:id', adminAuth, getServiceRequestById);
router.put('/:id', adminAuth, updateServiceRequest);
router.delete('/:id', adminAuth, deleteServiceRequest);

module.exports = router;
