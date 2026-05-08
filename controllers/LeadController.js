const Lead = require("../models/LeadModel");

// Create lead (called internally from service request)
const createLeadFromServiceRequest = async (serviceRequest) => {
  try {
    const existing = await Lead.findOne({ email: serviceRequest.email });
    if (existing) {
      // Update existing lead with latest info
      existing.serviceType = serviceRequest.serviceType;
      existing.projectTitle = serviceRequest.projectTitle || existing.projectTitle;
      existing.projectDescription = serviceRequest.projectDescription || existing.projectDescription;
      existing.budget = serviceRequest.budget || existing.budget;
      existing.timeline = serviceRequest.timeline || existing.timeline;
      existing.priority = serviceRequest.priority || existing.priority;
      existing.serviceRequestId = serviceRequest._id;
      existing.updatedAt = new Date();
      await existing.save();
      return { success: true, data: existing, isNew: false };
    }

    const lead = await Lead.create({
      firstName: serviceRequest.firstName,
      lastName: serviceRequest.lastName,
      email: serviceRequest.email,
      phone: serviceRequest.phone || "",
      company: serviceRequest.company || "",
      serviceType: serviceRequest.serviceType,
      projectTitle: serviceRequest.projectTitle || "",
      projectDescription: serviceRequest.projectDescription || "",
      budget: serviceRequest.budget || "",
      timeline: serviceRequest.timeline || "",
      priority: serviceRequest.priority || "Medium",
      status: "new",
      source: serviceRequest.source || "website",
      serviceRequestId: serviceRequest._id,
    });
    return { success: true, data: lead, isNew: true };
  } catch (error) {
    console.error("Lead creation error:", error.message);
    return { success: false, error: error.message };
  }
};

// Admin: get all leads
const getAllLeads = async (req, res) => {
  try {
    const { status, serviceType, search } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (serviceType && serviceType !== "all") filter.serviceType = serviceType;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { projectTitle: { $regex: search, $options: "i" } },
      ];
    }
    const leads = await Lead.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: leads });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: get lead stats
const getLeadStats = async (req, res) => {
  try {
    const total = await Lead.countDocuments();
    const newCount = await Lead.countDocuments({ status: "new" });
    const contacted = await Lead.countDocuments({ status: "contacted" });
    const converted = await Lead.countDocuments({ status: "converted" });
    const qualified = await Lead.countDocuments({ status: "qualified" });
    const lost = await Lead.countDocuments({ status: "lost" });
    return res.status(200).json({
      success: true,
      data: { overview: { total, new: newCount, contacted, converted, qualified, lost } },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: update lead
const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.status === "contacted" && !updates.lastContactedAt) {
      updates.lastContactedAt = new Date();
    }
    const lead = await Lead.findByIdAndUpdate(id, updates, { new: true });
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }
    return res.status(200).json({ success: true, message: "Lead updated.", data: lead });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: delete lead
const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findByIdAndDelete(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }
    return res.status(200).json({ success: true, message: "Lead deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createLeadFromServiceRequest,
  getAllLeads,
  getLeadStats,
  updateLead,
  deleteLead,
};
