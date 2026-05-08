const express = require('express');
const router = express.Router();
const { getDashboardStats, getRecentActivities } = require('../controllers/DashboardController');
const { adminAuth } = require('../middleware/auth');

// Admin only routes
router.get('/stats', adminAuth, getDashboardStats);
router.get('/activities', adminAuth, getRecentActivities);

module.exports = router;
