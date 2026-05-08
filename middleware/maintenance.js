const SiteSettings = require('../models/SiteSettingsModel');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../utils/logger');

const checkMaintenance = async (req, res, next) => {
  try {
    // Skip maintenance check for admin routes
    if (req.path.startsWith('/admin') || req.path.startsWith('/api/v1/admin')) {
      return next();
    }

    const settings = await SiteSettings.getSettings();

    if (settings.maintenanceMode) {
      // Allow access to health check endpoint
      if (req.path === '/health') {
        return next();
      }

      // Check if user is authenticated as admin
      const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
      if (token) {
        try {
          const decoded = jwt.verify(token, config.JWT_SECRET);
          if (decoded && decoded.id) {
            // User is authenticated, allow access
            req.user = decoded;
            return next();
          }
        } catch {
          // Invalid token, continue to maintenance block
        }
      }

      return res.status(503).json({
        success: false,
        maintenance: true,
        message: settings.maintenanceMessage || 'Site is under maintenance. We\'ll be back soon.'
      });
    }

    next();
  } catch (error) {
    logger.error('Error checking maintenance mode:', error);
    next(); // Proceed if error occurs to avoid blocking the site
  }
};

module.exports = { checkMaintenance };
