const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
};

const emailBaseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EAMS Notification</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f2f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #5C6BC0, #26A69A); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.8); margin: 5px 0 0; font-size: 14px; }
    .body { padding: 30px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; border-top: 1px solid #e9ecef; }
    .btn { display: inline-block; padding: 12px 28px; background: #5C6BC0; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 15px 0; }
    .info-card { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 15px 0; border-left: 4px solid #5C6BC0; }
    .info-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
    .info-label { color: #6c757d; font-weight: 500; }
    .info-value { color: #212529; font-weight: 600; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-warning { background: #fff3cd; color: #856404; }
    .badge-danger { background: #f8d7da; color: #721c24; }
    .badge-success { background: #d1e7dd; color: #0f5132; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏢 EAMS</h1>
      <p>Enterprise Asset Management System</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>This is an automated notification from EAMS. Please do not reply to this email.</p>
      <p>© ${new Date().getFullYear()} EAMS - Enterprise Asset Management System</p>
    </div>
  </div>
</body>
</html>`;

const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.SMTP_HOST) {
    console.log(`📧 [EMAIL MOCK] To: ${to} | Subject: ${subject}`);
    return { messageId: 'mock-id' };
  }

  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: `"EAMS System" <${process.env.EMAIL_FROM || 'noreply@eams.com'}>`,
    to,
    subject,
    html: html || emailBaseTemplate(`<p>${text}</p>`),
    text,
  });
  return info;
};

const sendAssetAssignedEmail = async (employee, asset) => {
  const content = `
    <h2 style="color: #5C6BC0; margin-top: 0;">Asset Assigned to You</h2>
    <p>Hello <strong>${employee.name}</strong>,</p>
    <p>A new asset has been assigned to you. Please find the details below:</p>
    <div class="info-card">
      ${asset.imageUrl ? `<img src="${asset.imageUrl}" alt="${asset.name}" style="width:100%;max-height:200px;object-fit:cover;border-radius:6px;margin-bottom:15px;" />` : ''}
      <div class="info-row"><span class="info-label">Asset Name</span><span class="info-value">${asset.name}</span></div>
      <div class="info-row"><span class="info-label">Type</span><span class="info-value">${asset.type}</span></div>
      <div class="info-row"><span class="info-label">Serial Number</span><span class="info-value">${asset.serialNumber}</span></div>
      <div class="info-row"><span class="info-label">Vendor</span><span class="info-value">${asset.vendor || 'N/A'}</span></div>
      <div class="info-row"><span class="info-label">Warranty Expiry</span><span class="info-value">${asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : 'N/A'}</span></div>
    </div>
    <p>For any issues with this asset, please raise a maintenance request through the EAMS portal or contact IT support.</p>
    <p>📧 IT Support: <a href="mailto:${process.env.SMTP_USER}">${process.env.SMTP_USER || 'it-support@company.com'}</a></p>
  `;

  return sendEmail({
    to: employee.email,
    subject: `EAMS - Asset Assigned: ${asset.name}`,
    html: emailBaseTemplate(content),
  });
};

const sendLicenseExpiryEmail = async (user, license) => {
  const daysLeft = Math.ceil((new Date(license.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  const content = `
    <h2 style="color: #e65100; margin-top: 0;">License Expiry Reminder</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>The following software license is expiring soon:</p>
    <div class="info-card">
      <div class="info-row"><span class="info-label">Software</span><span class="info-value">${license.softwareName}</span></div>
      <div class="info-row"><span class="info-label">Vendor</span><span class="info-value">${license.vendor}</span></div>
      <div class="info-row"><span class="info-label">Expiry Date</span><span class="info-value">${new Date(license.expiryDate).toLocaleDateString()}</span></div>
      <div class="info-row"><span class="info-label">Days Remaining</span><span class="info-value"><span class="badge badge-warning">⚠ ${daysLeft} days</span></span></div>
      <div class="info-row"><span class="info-label">Cost</span><span class="info-value">$${license.cost?.toLocaleString() || 0}</span></div>
    </div>
    <p>Please take action to renew this license to avoid service interruption.</p>
  `;
  return sendEmail({
    to: user.email,
    subject: `EAMS - License Expiry Alert: ${license.softwareName} (${daysLeft} days left)`,
    html: emailBaseTemplate(content),
  });
};

const sendWarrantyExpiryEmail = async (user, asset) => {
  const daysLeft = Math.ceil((new Date(asset.warrantyExpiry) - new Date()) / (1000 * 60 * 60 * 24));
  const content = `
    <h2 style="color: #e65100; margin-top: 0;">Warranty Expiry Reminder</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>The warranty for the following asset is expiring soon:</p>
    <div class="info-card">
      <div class="info-row"><span class="info-label">Asset Name</span><span class="info-value">${asset.name}</span></div>
      <div class="info-row"><span class="info-label">Type</span><span class="info-value">${asset.type}</span></div>
      <div class="info-row"><span class="info-label">Serial Number</span><span class="info-value">${asset.serialNumber}</span></div>
      <div class="info-row"><span class="info-label">Warranty Expiry</span><span class="info-value">${new Date(asset.warrantyExpiry).toLocaleDateString()}</span></div>
      <div class="info-row"><span class="info-label">Days Remaining</span><span class="info-value"><span class="badge badge-warning">⚠ ${daysLeft} days</span></span></div>
      <div class="info-row"><span class="info-label">Vendor</span><span class="info-value">${asset.vendor || 'N/A'}</span></div>
    </div>
    <p>Please contact the vendor to arrange warranty extension or plan for replacement.</p>
  `;
  return sendEmail({
    to: user.email,
    subject: `EAMS - Warranty Expiry Alert: ${asset.name} (${daysLeft} days left)`,
    html: emailBaseTemplate(content),
  });
};

const sendMaintenanceUpdateEmail = async (user, request) => {
  const statusColors = { open: '#0dcaf0', 'in-progress': '#ffc107', resolved: '#198754', cancelled: '#6c757d' };
  const content = `
    <h2 style="color: #5C6BC0; margin-top: 0;">Maintenance Request Update</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>Your maintenance request has been updated:</p>
    <div class="info-card">
      <div class="info-row"><span class="info-label">Issue</span><span class="info-value">${request.issue}</span></div>
      <div class="info-row"><span class="info-label">Status</span><span class="info-value" style="color:${statusColors[request.status] || '#000'}">${request.status.toUpperCase()}</span></div>
      ${request.notes ? `<div class="info-row"><span class="info-label">Notes</span><span class="info-value">${request.notes}</span></div>` : ''}
      ${request.resolvedAt ? `<div class="info-row"><span class="info-label">Resolved At</span><span class="info-value">${new Date(request.resolvedAt).toLocaleString()}</span></div>` : ''}
    </div>
  `;
  return sendEmail({
    to: user.email,
    subject: `EAMS - Maintenance Update: ${request.status.toUpperCase()}`,
    html: emailBaseTemplate(content),
  });
};

module.exports = { sendEmail, sendAssetAssignedEmail, sendLicenseExpiryEmail, sendWarrantyExpiryEmail, sendMaintenanceUpdateEmail };
