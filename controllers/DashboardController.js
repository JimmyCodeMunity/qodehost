const User = require('../models/UserModel');
const Lead = require('../models/LeadModel');
const Project = require('../models/ProjectModel');
const ServiceRequest = require('../models/ServiceRequestModel');
const Contact = require('../models/ContactModel');
const logger = require('../utils/logger');

const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalLeads,
      totalProjects,
      totalServiceRequests,
      totalContacts,
      newLeadsThisMonth,
      newRequestsThisMonth,
    ] = await Promise.all([
      User.countDocuments(),
      Lead.countDocuments(),
      Project.countDocuments(),
      ServiceRequest.countDocuments(),
      Contact.countDocuments(),
      Lead.countDocuments({
        createdAt: { $gte: new Date(new Date().setDate(1)) }
      }),
      ServiceRequest.countDocuments({
        createdAt: { $gte: new Date(new Date().setDate(1)) }
      }),
    ]);

    const leadStatusCounts = await Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const requestStatusCounts = await ServiceRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const leadStatusMap = {};
    leadStatusCounts.forEach(item => {
      leadStatusMap[item._id] = item.count;
    });

    const requestStatusMap = {};
    requestStatusCounts.forEach(item => {
      requestStatusMap[item._id] = item.count;
    });

    res.json({
      success: true,
      data: {
        overview: {
          users: totalUsers,
          leads: totalLeads,
          projects: totalProjects,
          serviceRequests: totalServiceRequests,
          contacts: totalContacts,
          newLeadsThisMonth,
          newRequestsThisMonth,
        },
        leadStatus: leadStatusMap,
        requestStatus: requestStatusMap,
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};

const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const [recentLeads, recentRequests, recentContacts, recentUsers] = await Promise.all([
      Lead.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('firstName lastName company status createdAt')
        .lean(),
      ServiceRequest.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('firstName lastName serviceType status createdAt')
        .lean(),
      Contact.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('name email subject status createdAt')
        .lean(),
      User.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('firstName lastName email role createdAt')
        .lean(),
    ]);

    const activities = [
      ...recentLeads.map(l => ({
        type: 'lead',
        title: `New lead: ${l.firstName} ${l.lastName}`,
        subtitle: l.company || 'No company',
        status: l.status,
        date: l.createdAt,
        id: l._id,
      })),
      ...recentRequests.map(r => ({
        type: 'service_request',
        title: `Service request: ${r.firstName} ${r.lastName}`,
        subtitle: r.serviceType,
        status: r.status,
        date: r.createdAt,
        id: r._id,
      })),
      ...recentContacts.map(c => ({
        type: 'contact',
        title: `Contact form: ${c.name}`,
        subtitle: c.subject,
        status: c.status,
        date: c.createdAt,
        id: c._id,
      })),
      ...recentUsers.map(u => ({
        type: 'user',
        title: `New user: ${u.firstName} ${u.lastName}`,
        subtitle: u.email,
        status: u.role,
        date: u.createdAt,
        id: u._id,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);

    res.json({ success: true, data: activities });
  } catch (error) {
    logger.error('Error fetching recent activities:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recent activities' });
  }
};

module.exports = { getDashboardStats, getRecentActivities };
