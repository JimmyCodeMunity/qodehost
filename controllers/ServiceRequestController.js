const ServiceRequest = require("../models/ServiceRequestModel");
const { sendEmail } = require("../services/emailService");
const config = require("../config/config");
const { createLeadFromServiceRequest } = require("../controllers/LeadController");

// Submit service request
const submitServiceRequest = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      serviceType,
      projectTitle,
      projectDescription,
      budget,
      timeline,
      priority,
      technicalRequirements,
      preferredTechnologies,
      additionalNotes,
      preferredContactMethod,
      source
    } = req.body;

    const serviceRequest = await ServiceRequest.create({
      firstName,
      lastName,
      email,
      phone: phone || "",
      company: company || "",
      serviceType,
      projectTitle,
      projectDescription,
      budget: budget || "To be discussed",
      timeline: timeline || "To be discussed",
      priority: priority || "Medium",
      technicalRequirements: technicalRequirements || "",
      preferredTechnologies: preferredTechnologies || "",
      additionalNotes: additionalNotes || "",
      preferredContactMethod: preferredContactMethod || "email",
      source: source || "website"
    });

    // Send email notification to admin
    try {
      const adminEmailContent = generateAdminEmailTemplate(serviceRequest);
      await sendEmail({
        to: config.EMAIL_USERNAME,
        subject: `New Service Request: ${projectTitle}`,
        html: adminEmailContent
      });
    } catch (emailError) {
      console.error("Failed to send admin email:", emailError);
      // Don't fail the request if email fails
    }

    // Send confirmation email to client
    try {
      const clientEmailContent = generateClientEmailTemplate(serviceRequest);
      await sendEmail({
        to: email,
        subject: "Service Request Received - Qode Technologies",
        html: clientEmailContent
      });
    } catch (emailError) {
      console.error("Failed to send client email:", emailError);
      // Don't fail the request if email fails
    }

    // Auto-create lead from service request
    try {
      await createLeadFromServiceRequest(serviceRequest);
    } catch (leadError) {
      console.error("Failed to create lead:", leadError);
      // Don't fail the request if lead creation fails
    }

    res.status(201).json({
      success: true,
      message: "Service request submitted successfully. We'll contact you within 24 hours.",
      data: {
        id: serviceRequest._id,
        projectTitle: serviceRequest.projectTitle,
        status: serviceRequest.status
      }
    });

  } catch (error) {
    console.error("Service request submission error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit service request. Please try again."
    });
  }
};

// Get all service requests (admin only)
const getAllServiceRequests = async (req, res) => {
  try {
    const { status, serviceType, priority, page = 1, limit = 20 } = req.query;

    // Build filter
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (serviceType && serviceType !== 'all') filter.serviceType = serviceType;
    if (priority && priority !== 'all') filter.priority = priority;

    const skip = (page - 1) * limit;

    const serviceRequests = await ServiceRequest.find(filter)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ServiceRequest.countDocuments(filter);

    res.json({
      success: true,
      data: serviceRequests,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });

  } catch (error) {
    console.error("Get service requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service requests"
    });
  }
};

// Get service request by ID (admin only)
const getServiceRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const serviceRequest = await ServiceRequest.findById(id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: "Service request not found"
      });
    }

    res.json({
      success: true,
      data: serviceRequest
    });

  } catch (error) {
    console.error("Get service request by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service request"
    });
  }
};

// Update service request (admin only)
const updateServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const serviceRequest = await ServiceRequest.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: "Service request not found"
      });
    }

    res.json({
      success: true,
      message: "Service request updated successfully",
      data: serviceRequest
    });

  } catch (error) {
    console.error("Update service request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update service request"
    });
  }
};

// Delete service request (admin only)
const deleteServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const serviceRequest = await ServiceRequest.findByIdAndDelete(id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: "Service request not found"
      });
    }

    res.json({
      success: true,
      message: "Service request deleted successfully"
    });

  } catch (error) {
    console.error("Delete service request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete service request"
    });
  }
};

// Get service request statistics (admin only)
const getServiceRequestStats = async (req, res) => {
  try {
    const stats = await ServiceRequest.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          new: { $sum: { $cond: [{ $eq: ["$status", "new"] }, 1, 0] } },
          reviewing: { $sum: { $cond: [{ $eq: ["$status", "reviewing"] }, 1, 0] } },
          contacted: { $sum: { $cond: [{ $eq: ["$status", "contacted"] }, 1, 0] } },
          quoted: { $sum: { $cond: [{ $eq: ["$status", "quoted"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } }
        }
      }
    ]);

    const serviceTypeStats = await ServiceRequest.aggregate([
      {
        $group: {
          _id: "$serviceType",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          total: 0,
          new: 0,
          reviewing: 0,
          contacted: 0,
          quoted: 0,
          inProgress: 0,
          completed: 0,
          cancelled: 0
        },
        serviceTypes: serviceTypeStats
      }
    });

  } catch (error) {
    console.error("Get service request stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics"
    });
  }
};

// Email templates
const generateAdminEmailTemplate = (request) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Service Request - ${request.projectTitle}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background-color: #111111; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: #000000; font-size: 24px; font-weight: 800; margin: 0; }
    .header p { color: #1a1a1a; font-size: 13px; margin: 8px 0 0; opacity: 0.8; }
    .body { padding: 32px 28px; color: #e5e5e5; }
    .section { margin-bottom: 24px; }
    .section h3 { color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 12px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-item { background: #1a1a1a; padding: 12px; border-radius: 8px; }
    .info-label { font-size: 12px; color: #84cc16; font-weight: 600; margin-bottom: 4px; }
    .info-value { font-size: 14px; color: #ffffff; }
    .description { background: #1a1a1a; padding: 16px; border-radius: 8px; margin-top: 12px; }
    .priority { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .priority.High { background: #dc2626; color: white; }
    .priority.medium { background: #f59e0b; color: white; }
    .priority.low { background: #10b981; color: white; }
    .priority.urgent { background: #7c3aed; color: white; }
    .footer { padding: 24px 28px; border-top: 1px solid #262626; text-align: center; }
    .footer p { font-size: 12px; color: #525252; margin: 0; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 40px 16px;">
    <tr>
      <td align="center">
        <div class="container">
          <div class="header">
            <h1>New Service Request</h1>
            <p>${request.projectTitle} • ${request.serviceType}</p>
          </div>
          <div class="body">
            <div class="section">
              <h3>Client Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Name</div>
                  <div class="info-value">${request.fullName}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Email</div>
                  <div class="info-value">${request.email}</div>
                </div>
                ${request.phone ? `
                <div class="info-item">
                  <div class="info-label">Phone</div>
                  <div class="info-value">${request.phone}</div>
                </div>` : ''}
                ${request.company ? `
                <div class="info-item">
                  <div class="info-label">Company</div>
                  <div class="info-value">${request.company}</div>
                </div>` : ''}
              </div>
            </div>
            
            <div class="section">
              <h3>Project Details</h3>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Service Type</div>
                  <div class="info-value">${request.serviceType}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Priority</div>
                  <div class="info-value"><span class="priority ${request.priority.toLowerCase()}">${request.priority}</span></div>
                </div>
                <div class="info-item">
                  <div class="info-label">Budget</div>
                  <div class="info-value">${request.budget}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Timeline</div>
                  <div class="info-value">${request.timeline}</div>
                </div>
              </div>
              <div class="description">
                <div class="info-label">Project Description</div>
                <div class="info-value" style="white-space: pre-wrap;">${request.projectDescription}</div>
              </div>
            </div>
            
            ${request.technicalRequirements ? `
            <div class="section">
              <h3>Technical Requirements</h3>
              <div class="description">
                <div class="info-value" style="white-space: pre-wrap;">${request.technicalRequirements}</div>
              </div>
            </div>` : ''}
            
            <div class="section">
              <h3>Submission Details</h3>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Submitted</div>
                  <div class="info-value">${new Date(request.submittedAt).toLocaleString()}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Preferred Contact</div>
                  <div class="info-value">${request.preferredContactMethod}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>This service request was submitted via the Qode Technologies website.</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const generateClientEmailTemplate = (request) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Service Request Received - Qode Technologies</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .container { max-width: 520px; margin: 0 auto; background-color: #111111; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: #000000; font-size: 24px; font-weight: 800; margin: 0; }
    .header p { color: #1a1a1a; font-size: 13px; margin: 8px 0 0; opacity: 0.8; }
    .body { padding: 32px 28px; color: #e5e5e5; }
    .body p { font-size: 15px; line-height: 1.7; margin: 0 0 20px; color: #a3a3a3; }
    .body strong { color: #ffffff; }
    .info-box { background: #1a1a1a; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { font-size: 13px; color: #84cc16; font-weight: 600; }
    .info-value { font-size: 14px; color: #ffffff; text-align: right; }
    .next-steps { background: linear-gradient(135deg, #1a1a1a 0%, #262626 100%); border-radius: 12px; padding: 20px; margin: 24px 0; }
    .next-steps h3 { color: #84cc16; font-size: 16px; font-weight: 600; margin: 0 0 12px; }
    .next-steps ul { margin: 0; padding-left: 20px; color: #a3a3a3; font-size: 14px; line-height: 1.6; }
    .footer { padding: 24px 28px; border-top: 1px solid #262626; text-align: center; }
    .footer p { font-size: 12px; color: #525252; margin: 0; }
    .footer a { color: #84cc16; text-decoration: none; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 40px 16px;">
    <tr>
      <td align="center">
        <div class="container">
          <div class="header">
            <h1>Request Received!</h1>
            <p>Thank you for your interest in Qode Technologies</p>
          </div>
          <div class="body">
            <p>Hi <strong>${request.fullName}</strong>,</p>
            <p>We've successfully received your service request for <strong>${request.projectTitle}</strong>. Our team is excited to learn more about your project and will review your requirements carefully.</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Project Title</span>
                <span class="info-value">${request.projectTitle}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Service Type</span>
                <span class="info-value">${request.serviceType}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Request ID</span>
                <span class="info-value">#${request._id.toString().slice(-8).toUpperCase()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Submitted</span>
                <span class="info-value">${new Date(request.submittedAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div class="next-steps">
              <h3>What Happens Next?</h3>
              <ul>
                <li>Our team will review your request within 24 hours</li>
                <li>We'll contact you to discuss project details and clarify any questions</li>
                <li>You'll receive a detailed proposal with timeline and pricing</li>
                <li>Upon approval, we'll begin the development process</li>
              </ul>
            </div>
            
            <p>If you have any questions or need to provide additional information, please don't hesitate to reach out to us at <a href="mailto:${config.EMAIL_USERNAME}">${config.EMAIL_USERNAME}</a>.</p>
            
            <p style="font-size: 13px; color: #525252; margin-top: 24px;">
              Best regards,<br>
              The Qode Technologies Team
            </p>
          </div>
          <div class="footer">
            <p>Qode Technologies • Building Digital Solutions</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

module.exports = {
  submitServiceRequest,
  getAllServiceRequests,
  getServiceRequestById,
  updateServiceRequest,
  deleteServiceRequest,
  getServiceRequestStats
};
