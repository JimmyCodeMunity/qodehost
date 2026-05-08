const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, toggleMaintenance } = require('../controllers/SiteSettingsController');
const { adminAuth } = require('../middleware/auth');

// Public route - get settings (needed for maintenance check)
router.get('/', getSettings);

// Admin only routes
router.put('/', adminAuth, updateSettings);
router.post('/maintenance', adminAuth, toggleMaintenance);

module.exports = router;
