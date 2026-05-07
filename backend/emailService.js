// INPUT: { to, subject, html }
// OUTPUT: sends email via Resend
// EFFECT: noop with warning log if RESEND_API_KEY env is not set
function isEmailConfigured() {
  return Boolean(String(process.env.RESEND_API_KEY ?? '').trim());
}

async function sendEmail({ to, subject, html }) {
  if (!isEmailConfigured()) {
    console.warn('Email not configured: RESEND_API_KEY is not set');
    return false;
  }

  let Resend;
  try {
    ({ Resend } = require('resend'));
  } catch {
    console.warn('Email not configured: resend package is unavailable');
    return false;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM || 'TaskTide <noreply@yourdomain.com>';

  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) {
    console.error('Resend error:', error);
    return false;
  }
  return true;
}

module.exports = { isEmailConfigured, sendEmail };
