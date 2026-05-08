const nodemailer = require("nodemailer");
const config = require("../config/config");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.EMAIL_USERNAME,
    pass: config.EMAIL_PASSWORD,
  },
});

const sendEmail = async (options) => {
  if (!config.EMAIL_USERNAME || !config.EMAIL_PASSWORD) {
    throw new Error("Email credentials not configured");
  }

  const mailOptions = {
    from: config.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

const passwordResetTemplate = (name, resetUrl) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .container { max-width: 520px; margin: 0 auto; background-color: #111111; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: #000000; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
    .header p { color: #1a1a1a; font-size: 13px; margin: 8px 0 0; opacity: 0.8; }
    .body { padding: 32px 28px; color: #e5e5e5; }
    .body p { font-size: 15px; line-height: 1.7; margin: 0 0 20px; color: #a3a3a3; }
    .body strong { color: #ffffff; }
    .button-wrap { text-align: center; margin: 28px 0; }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
      color: #000000;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 36px;
      border-radius: 999px;
      letter-spacing: 0.3px;
    }
    .fallback { background: #1a1a1a; border-radius: 12px; padding: 16px; margin: 20px 0; word-break: break-all; }
    .fallback code { color: #84cc16; font-family: 'Courier New', monospace; font-size: 13px; }
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
            <h1>Qode</h1>
            <p>Secure Password Reset</p>
          </div>
          <div class="body">
            <p>Hi <strong>${name}</strong>,</p>
            <p>We received a request to reset your password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
            <div class="button-wrap">
              <a class="button" href="${resetUrl}" target="_blank">Reset Password</a>
            </div>
            <p>If the button does not work, copy and paste this link into your browser:</p>
            <div class="fallback">
              <code>${resetUrl}</code>
            </div>
            <p style="font-size: 13px; color: #525252; margin-top: 24px;">
              If you did not request this reset, you can safely ignore this email. Your password will not be changed.
            </p>
          </div>
          <div class="footer">
            <p>Qode Technologies &middot; Building the Future</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

module.exports = { sendEmail, passwordResetTemplate };
