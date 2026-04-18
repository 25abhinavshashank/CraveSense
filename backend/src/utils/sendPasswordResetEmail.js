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
      console.warn(
        '[CraveSense] SMTP not configured; password reset email was not sent. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS.'
      );
    }
    return;
  }

  const smtpPort = Number(SMTP_PORT) || 587;
  const secure = smtpPort === 465;
  const debugEnabled = String(process.env.SMTP_DEBUG || '').toLowerCase() === 'true';

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: smtpPort,
    secure,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    ...(debugEnabled ? { logger: true, debug: true } : null)
  });

  // Fail fast with a clearer server log if SMTP creds/host/port are wrong.
  try {
    await transporter.verify();
  } catch (error) {
    console.error('[CraveSense] SMTP verify failed:', error?.message || error);
    throw error;
  }

  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #333;">Reset Your Password</h2>
      <p style="color: #555; line-height: 1.6;">
        We received a request to reset your CraveSense password. Click the button below to choose a new one. This link is valid for 1 hour.
      </p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #888; font-size: 12px;">
        If you didn't request this, you can safely ignore this email.
      </p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #aaa; font-size: 10px;">
        If the button above doesn't work, copy and paste this link into your browser:<br>
        <span style="color: #6366f1;">${resetUrl}</span>
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: EMAIL_FROM || SMTP_USER,
    to,
    subject: 'Reset your CraveSense password',
    text: `Reset your password (valid for 1 hour):\n${resetUrl}\n`,
    html: emailHtml
  });
}

module.exports = { sendPasswordResetEmail };
