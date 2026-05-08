const Contact = require("../models/ContactModel");
const { sendEmail } = require("../services/emailService");
const config = require("../config/config");

const ADMIN_EMAIL = config.EMAIL_USERNAME;
const CLIENT_URL = config.FRONTEND_URL;

// Submit contact form
const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message, phone, subscribe } = req.body;
    const contact = await Contact.create({
      name,
      email,
      subject,
      message,
      phone: phone || "",
      subscribe: subscribe || false,
    });

    // Send email to admin
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `New Contact: ${subject}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Contact Submission</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background-color: #111111; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%); padding: 32px 24px; }
    .header h1 { color: #000; font-size: 24px; font-weight: 800; margin: 0; }
    .body { padding: 32px 28px; color: #e5e5e5; }
    .field { margin-bottom: 20px; }
    .label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #84cc16; margin-bottom: 4px; }
    .value { font-size: 15px; color: #ffffff; }
    .value.email { color: #84cc16; }
    .message { background: #1a1a1a; padding: 16px; border-radius: 8px; border-left: 3px solid #84cc16; margin-top: 16px; }
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
            <h1>New Contact Submission</h1>
          </div>
          <div class="body">
            <div class="field">
              <div class="label">From</div>
              <div class="value">${name}</div>
            </div>
            <div class="field">
              <div class="label">Email</div>
              <div class="value email">${email}</div>
            </div>
            ${phone ? `
            <div class="field">
              <div class="label">Phone</div>
              <div class="value">${phone}</div>
            </div>
            ` : ""}
            <div class="field">
              <div class="label">Subject</div>
              <div class="value">${subject}</div>
            </div>
            <div class="field">
              <div class="label">Subscribe to Newsletter</div>
              <div class="value">${subscribe ? "Yes" : "No"}</div>
            </div>
            <div class="message">
              <div class="label">Message</div>
              <div class="value" style="white-space: pre-wrap; line-height: 1.6;">${message}</div>
            </div>
          </div>
          <div class="footer">
            <p>Qode Technologies</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    return res.status(201).json({ success: true, message: "Message sent successfully", data: contact });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all contacts (admin)
const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get single contact
const getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }
    return res.status(200).json({ success: true, data: contact });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update contact status/reply
const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reply } = req.body;
    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    if (status) contact.status = status;
    if (reply) {
      contact.reply = reply;
      contact.repliedAt = new Date();
    }
    await contact.save();

    // Send reply email to user if reply provided
    if (reply && contact.email) {
      await sendEmail({
        to: contact.email,
        subject: `Re: ${contact.subject}`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reply from Qode</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background-color: #111111; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%); padding: 32px 24px; }
    .header h1 { color: #000; font-size: 24px; font-weight: 800; margin: 0; }
    .body { padding: 32px 28px; color: #e5e5e5; }
    .label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #84cc16; margin-bottom: 4px; }
    .value { font-size: 15px; color: #ffffff; }
    .message { background: #1a1a1a; padding: 16px; border-radius: 8px; border-left: 3px solid #84cc16; margin: 16px 0; white-space: pre-wrap; line-height: 1.6; }
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
            <h1>Reply from Qode</h1>
          </div>
          <div class="body">
            <div class="field">
              <div class="label">Your Original Message</div>
              <div class="value" style="font-style: italic; color: #a3a3a3;">${contact.message}</div>
            </div>
            <div class="message">
              <div class="label">Our Reply</div>
              <div class="value">${reply}</div>
            </div>
          </div>
          <div class="footer">
            <p>Qode Technologies</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });
    }

    return res.status(200).json({ success: true, message: "Contact updated", data: contact });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete contact
const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findByIdAndDelete(id);
    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }
    return res.status(200).json({ success: true, message: "Contact deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
};
