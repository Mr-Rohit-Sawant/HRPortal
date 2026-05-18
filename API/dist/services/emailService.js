"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = sendWelcomeEmail;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
exports.sendInvoiceEmail = sendInvoiceEmail;
exports.verifyEmailConfig = verifyEmailConfig;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = require("../utils/logger");
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const from = `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`;
async function sendWelcomeEmail(email, name, password, loginUrl) {
    await transporter.sendMail({
        from,
        to: email,
        subject: 'Welcome to HR Recruitment System',
        html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:#1E40AF;padding:30px;text-align:center;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;">HR Recruitment System</h1>
        </div>
        <div style="background:#f9fafb;padding:30px;border-radius:0 0 8px 8px;">
          <h2 style="color:#0F172A;">Welcome, ${name}!</h2>
          <p style="color:#374151;">Your account has been created. Here are your login credentials:</p>
          <div style="background:white;padding:20px;border-radius:8px;border:1px solid #e5e7eb;margin:20px 0;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> <code style="background:#f3f4f6;padding:4px 8px;border-radius:4px;">${password}</code></p>
          </div>
          <a href="${loginUrl}" style="background:#1E40AF;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Login Now</a>
          <p style="color:#6b7280;margin-top:20px;font-size:12px;">Please change your password after first login.</p>
        </div>
      </div>`,
    });
}
async function sendPasswordResetEmail(email, name, resetLink) {
    await transporter.sendMail({
        from,
        to: email,
        subject: 'Password Reset Request',
        html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2>Password Reset</h2>
        <p>Hi ${name},</p>
        <p>You requested a password reset. Click the link below (valid for 1 hour):</p>
        <a href="${resetLink}" style="background:#1E40AF;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Reset Password</a>
        <p style="color:#6b7280;margin-top:20px;font-size:12px;">If you didn't request this, ignore this email.</p>
      </div>`,
    });
}
async function sendInvoiceEmail(email, clientName, invoiceNumber, amount, pdfPath) {
    await transporter.sendMail({
        from,
        to: email,
        subject: `Invoice ${invoiceNumber} from HR Recruitment System`,
        html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2>Invoice ${invoiceNumber}</h2>
        <p>Dear ${clientName},</p>
        <p>Please find attached your invoice for <strong>${amount}</strong>.</p>
        <p>Thank you for your business.</p>
      </div>`,
        attachments: [{ filename: `${invoiceNumber}.pdf`, path: pdfPath }],
    });
}
async function verifyEmailConfig() {
    try {
        await transporter.verify();
        return true;
    }
    catch (err) {
        logger_1.logger.warn('Email configuration invalid:', err);
        return false;
    }
}
//# sourceMappingURL=emailService.js.map