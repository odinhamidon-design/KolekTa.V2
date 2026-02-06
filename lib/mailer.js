/**
 * Email service for Kolek-Ta.
 *
 * Uses nodemailer with SMTP. Configure via environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * Falls back to console logging in development when SMTP is not configured.
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter = null;

function isConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (transporter) return transporter;

  if (!isConfigured()) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Send a password reset email.
 * @param {string} to - Recipient email address
 * @param {string} resetLink - Full URL to the reset page with token
 * @returns {Promise<boolean>} true if sent, false if not configured
 */
async function sendPasswordResetEmail(to, resetLink) {
  const transport = getTransporter();

  if (!transport) {
    logger.warn(`SMTP not configured — password reset link for ${to}: ${resetLink}`);
    return false;
  }

  const from = process.env.SMTP_FROM || `Kolek-Ta <${process.env.SMTP_USER}>`;

  await transport.sendMail({
    from,
    to,
    subject: 'Kolek-Ta — Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Kolek-Ta Password Reset</h2>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p style="margin: 24px 0;">
          <a href="${resetLink}"
             style="background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          This link expires in 1 hour. If you did not request this, ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Kolek-Ta Waste Collection Management</p>
      </div>
    `,
    text: `Kolek-Ta Password Reset\n\nClick the link to reset your password:\n${resetLink}\n\nThis link expires in 1 hour.`,
  });

  logger.info(`Password reset email sent to ${to}`);
  return true;
}

module.exports = { sendPasswordResetEmail, isConfigured };
