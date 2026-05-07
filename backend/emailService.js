// INPUT: { to, subject, html }
// OUTPUT: sends email via SMTP transporter
// EFFECT: noop with warning log if EMAIL_HOST env is not set
function isEmailConfigured() {
  return Boolean(String(process.env.EMAIL_HOST ?? '').trim());
}

function createTransporter() {
  if (!isEmailConfigured()) return null;

  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch {
    console.warn('Email not configured: nodemailer package is unavailable');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    auth: process.env.EMAIL_USER
      ? {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        }
      : undefined,
  });
}

async function sendEmail({ to, subject, html }) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('Email not configured');
    return false;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
  return true;
}

module.exports = { isEmailConfigured, sendEmail };
