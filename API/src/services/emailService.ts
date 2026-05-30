import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const from = `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`;
const appName = process.env.SMTP_FROM_NAME || 'HR Recruitment System';

export function buildWelcomeEmailHtml(name: string, email: string, password: string, loginUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Welcome</title></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <!-- Header -->
      <tr><td style="background:#1E3A8A;border-radius:12px 12px 0 0;padding:40px 48px;text-align:center;">
        <p style="margin:0 0 20px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:3px;">${appName}</p>
        <h1 style="color:#FFFFFF;margin:0 0 8px;font-size:26px;font-weight:700;line-height:1.3;">Account Created Successfully</h1>
        <p style="color:rgba(255,255,255,0.65);margin:0;font-size:14px;">Your access to the HR Portal is ready.</p>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#FFFFFF;padding:40px 48px;">
        <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 8px;">Dear <strong>${name}</strong>,</p>
        <p style="color:#64748B;font-size:14px;line-height:1.7;margin:0 0 32px;">
          Your HR Portal account has been created by your administrator. Please use the credentials below to sign in. You will be required to set a new password upon first login.
        </p>

        <!-- Credentials card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
          <tr><td style="background:#F8FAFC;padding:10px 24px;">
            <p style="margin:0;font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:1.5px;">Login Credentials</p>
          </td></tr>
          <tr><td style="padding:20px 24px 0;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;">Email Address</p>
            <p style="margin:0;font-size:15px;color:#1E293B;font-weight:600;">${email}</p>
          </td></tr>
          <tr><td style="padding:16px 24px 20px;">
            <div style="height:1px;background:#F1F5F9;margin-bottom:16px;"></div>
            <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;">Temporary Password</p>
            <div style="display:inline-block;background:#1E293B;border-radius:6px;padding:10px 18px;">
              <code style="color:#E2E8F0;font-size:17px;font-weight:700;letter-spacing:3px;font-family:'Courier New',Courier,monospace;">${password}</code>
            </div>
          </td></tr>
        </table>

        <!-- Notice -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;border:1px solid #FED7AA;border-radius:8px;margin-bottom:32px;">
          <tr><td style="padding:14px 18px;">
            <p style="margin:0;color:#92400E;font-size:13px;line-height:1.6;"><strong>Important:</strong> This is a temporary password for first-time access only. You will be prompted to create a new password after logging in. Do not share these credentials with anyone.</p>
          </td></tr>
        </table>

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center">
            <a href="${loginUrl}" style="display:inline-block;background:#1E40AF;color:#FFFFFF;padding:14px 44px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;letter-spacing:0.2px;">Sign In to HR Portal</a>
          </td></tr>
          <tr><td align="center">
            <p style="margin:14px 0 0;font-size:12px;color:#94A3B8;">If the button above does not work, copy and paste this URL into your browser:<br><a href="${loginUrl}" style="color:#3B82F6;text-decoration:none;">${loginUrl}</a></p>
          </td></tr>
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#F8FAFC;border-top:1px solid #E2E8F0;border-radius:0 0 12px 12px;padding:20px 48px;text-align:center;">
        <p style="margin:0 0 4px;color:#94A3B8;font-size:12px;">If you did not expect this email, please contact your HR administrator immediately.</p>
        <p style="margin:0;color:#CBD5E1;font-size:11px;">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export async function sendWelcomeEmail(email: string, name: string, password: string, loginUrl: string) {
  await transporter.sendMail({
    from,
    to: email,
    subject: `Welcome to ${appName} — Your Account is Ready`,
    html: buildWelcomeEmailHtml(name, email, password, loginUrl),
  });
}

export async function sendPasswordResetEmail(email: string, name: string, resetLink: string) {
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

export async function sendInvoiceEmail(
  email: string,
  clientName: string,
  invoiceNumber: string,
  amount: string,
  pdfPath: string
) {
  await transporter.sendMail({
    from,
    to: email,
    subject: `Invoice ${invoiceNumber} from ${appName}`,
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

export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (err) {
    logger.warn('Email configuration invalid:', err);
    return false;
  }
}
