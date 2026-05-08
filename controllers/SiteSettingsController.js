const SiteSettings = require('../models/SiteSettingsModel');
const logger = require('../utils/logger');

const getSettings = async (req, res) => {
  try {
    const settings = await SiteSettings.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    logger.error('Error fetching site settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const settings = await SiteSettings.getSettings();
    Object.assign(settings, req.body);
    await settings.save();
    logger.info('Site settings updated by admin:', req.admin?.email);
    res.json({ success: true, data: settings, message: 'Settings updated successfully' });
  } catch (error) {
    logger.error('Error updating site settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};

const toggleMaintenance = async (req, res) => {
  try {
    const { maintenanceMode, maintenanceMessage } = req.body;
    const settings = await SiteSettings.getSettings();
    settings.maintenanceMode = maintenanceMode !== undefined ? maintenanceMode : !settings.maintenanceMode;
    if (maintenanceMessage) settings.maintenanceMessage = maintenanceMessage;
    await settings.save();
    logger.info(`Maintenance mode ${settings.maintenanceMode ? 'enabled' : 'disabled'} by admin:`, req.admin?.email);
    res.json({ success: true, data: settings, message: `Maintenance mode ${settings.maintenanceMode ? 'enabled' : 'disabled'}` });
  } catch (error) {
    logger.error('Error toggling maintenance mode:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle maintenance mode' });
  }
};

module.exports = { getSettings, updateSettings, toggleMaintenance };
