const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  maintenanceMode: {
    type: Boolean,
    default: false,
  },
  maintenanceMessage: {
    type: String,
    default: "Site is under maintenance. We'll be back soon.",
  },
  siteName: {
    type: String,
    default: "Qode Technologies",
  },
  contactEmail: {
    type: String,
    default: "info@qodetechnologies.com",
  },
  socialLinks: {
    twitter: String,
    linkedin: String,
    github: String,
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
  },
}, {
  timestamps: true,
});

// Singleton pattern - only one document should exist
siteSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
