const nodemailer = require('nodemailer');

/**
 * Sends reset email when SMTP_* env vars are set; otherwise logs the link in non-production.
 */
async function sendPasswordResetEmail({ to, resetUrl }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[CraveSense] Password reset for ${to}:\n${resetUrl}\n`);
    } else {
      console.warn('[CraveSense] SMTP not configured; password reset email was not sent.');
    }
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  await transporter.sendMail({
    from: EMAIL_FROM || SMTP_USER,
    to,
    subject: 'Reset your CraveSense password',
    text: `Reset your password (valid for 1 hour):\n${resetUrl}\n`,
    html: `<p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 1 hour.</p>`
  });
}

module.exports = { sendPasswordResetEmail };
