const nodemailer = require('nodemailer');

/**
 * Windows .env files often leave \r on values — breaks Gmail auth.
 */
function envTrim(key) {
  const v = process.env[key];
  if (v == null) return '';
  return String(v).replace(/\r/g, '').trim();
}

/**
 * Public URL for approval links (no trailing slash).
 */
function getAppBaseUrl() {
  const raw =
    envTrim('APP_BASE_URL') ||
    envTrim('BASE_URL') ||
    'http://localhost:5000';
  return String(raw).replace(/\/$/, '');
}

/**
 * Creates a Nodemailer transporter from env (SMTP_HOST, SMTP_PORT, etc.).
 */
function createTransporter(overrides = {}) {
  const defaultPort = Number(envTrim('SMTP_PORT') || envTrim('EMAIL_PORT')) || 465;
  const port = Number(overrides.port ?? defaultPort) || 465;
  const secureRaw = envTrim('SMTP_SECURE') || envTrim('EMAIL_SECURE');
  const defaultSecure = secureRaw.toLowerCase() === 'true' || defaultPort === 465;
  const secure = typeof overrides.secure === 'boolean' ? overrides.secure : defaultSecure;

  const host =
    envTrim('SMTP_HOST') ||
    envTrim('EMAIL_HOST') ||
    'smtp.gmail.com';
  const user = envTrim('SMTP_USER') || envTrim('EMAIL_USER');
  const pass = envTrim('SMTP_PASS') || envTrim('EMAIL_PASS');

  if (!user || !pass) {
    throw new Error('SMTP_USER and SMTP_PASS must be set to send email');
  }
  if (!host) {
    throw new Error('SMTP_HOST must be set to send email');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 20_000,
    tls: {
      minVersion: 'TLSv1.2',
    },
  });
}

function isConnectionIssue(err) {
  if (!err) return false;
  const msg = String(err.message || '').toLowerCase();
  return (
    err.code === 'ETIMEDOUT' ||
    err.code === 'ESOCKET' ||
    msg.includes('connection timeout') ||
    msg.includes('greeting never received')
  );
}

async function sendWithFallback(mailOptions) {
  const defaultPort = Number(envTrim('SMTP_PORT') || envTrim('EMAIL_PORT')) || 465;
  const secureRaw = envTrim('SMTP_SECURE') || envTrim('EMAIL_SECURE');
  const defaultSecure = secureRaw.toLowerCase() === 'true' || defaultPort === 465;

  const attempts = [
    { port: defaultPort, secure: defaultSecure },
    { port: 587, secure: false },
    { port: 465, secure: true },
  ].filter((cfg, index, arr) => arr.findIndex((x) => x.port === cfg.port && x.secure === cfg.secure) === index);

  let lastErr = null;
  for (const attempt of attempts) {
    try {
      const transporter = createTransporter(attempt);
      return await transporter.sendMail(mailOptions);
    } catch (err) {
      lastErr = err;
      if (!isConnectionIssue(err)) {
        throw err;
      }
    }
  }

  throw lastErr || new Error('Failed to send email');
}

/** From header: MAIL_FROM or SMTP_USER. */
function getMailFrom() {
  const custom = envTrim('MAIL_FROM');
  if (custom) return custom;
  const user = envTrim('SMTP_USER') || envTrim('EMAIL_USER');
  return user ? `"College Portal" <${user}>` : undefined;
}

/**
 * Sends HTML email to admin when a teacher registers.
 * @param {{ name: string, email: string, userId: string }} teacher
 */
async function sendTeacherPendingEmail(teacher) {
  const adminEmail = envTrim('ADMIN_EMAIL');
  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL is not set');
  }

  const baseUrl = getAppBaseUrl();
  const approveUrl = `${baseUrl}/api/admin/approve/${teacher.userId}`;
  const rejectUrl = `${baseUrl}/api/admin/reject/${teacher.userId}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #1a1a1a;">
  <h2 style="margin-bottom: 0.5rem;">New teacher registration</h2>
  <p style="margin-top: 0;">A teacher has registered and needs your approval.</p>
  <table style="margin: 1rem 0; border-collapse: collapse;">
    <tr><td style="padding: 0.25rem 1rem 0.25rem 0;"><strong>Name</strong></td><td>${escapeHtml(teacher.name)}</td></tr>
    <tr><td style="padding: 0.25rem 1rem 0.25rem 0;"><strong>Email</strong></td><td>${escapeHtml(teacher.email)}</td></tr>
  </table>
  <p style="margin-top: 1.5rem;">
    <a href="${approveUrl}" style="display: inline-block; padding: 10px 20px; background: #0d6efd; color: #fff; text-decoration: none; border-radius: 6px; margin-right: 8px;">Approve teacher</a>
    <a href="${rejectUrl}" style="display: inline-block; padding: 10px 20px; background: #dc3545; color: #fff; text-decoration: none; border-radius: 6px;">Reject teacher</a>
  </p>
  <p style="font-size: 0.875rem; color: #666; margin-top: 2rem;">If the buttons do not work, copy these links:</p>
  <p style="font-size: 0.8rem; word-break: break-all;"><strong>Approve:</strong> ${approveUrl}</p>
  <p style="font-size: 0.8rem; word-break: break-all;"><strong>Reject:</strong> ${rejectUrl}</p>
</body>
</html>`;

  const from = getMailFrom();
  if (!from) {
    throw new Error('MAIL_FROM or SMTP_USER must be set');
  }

  const smtpUser = envTrim('SMTP_USER') || envTrim('EMAIL_USER');
  const envelopeFrom = smtpUser || from.match(/<([^>]+)>/)?.[1] || from;

  await sendWithFallback({
    from,
    sender: envelopeFrom,
    replyTo: teacher.email,
    to: adminEmail,
    subject: `Teacher registration pending: ${teacher.name}`,
    html,
    text: `Teacher: ${teacher.name} (${teacher.email})\nApprove: ${approveUrl}\nReject: ${rejectUrl}`,
  });
}

/**
 * Lets the registering teacher know the request was received (separate from admin mail).
 */
async function sendTeacherRegistrationReceipt(teacher) {
  const from = getMailFrom();
  if (!from) {
    throw new Error('MAIL_FROM or SMTP_USER must be set');
  }
  const smtpUser = envTrim('SMTP_USER') || envTrim('EMAIL_USER');
  const envelopeFrom = smtpUser || from.match(/<([^>]+)>/)?.[1] || from;

  await sendWithFallback({
    from,
    sender: envelopeFrom,
    to: teacher.email,
    subject: 'Teacher registration received — pending approval',
    text: `Hi ${teacher.name},\n\nYour teacher account has been created and is waiting for admin approval.\n\nYou will be able to log in after the administrator approves your registration (you will receive a notification by email when that happens, if your college configures it).\n\nIf you did not register, you can ignore this message.\n`,
    html: `<p>Hi ${escapeHtml(teacher.name)},</p><p>Your teacher account is <strong>pending admin approval</strong>.</p><p>You can log in only after an administrator approves your registration.</p>`,
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Log full Nodemailer / SMTP error for debugging.
 */
function logMailError(context, err) {
  console.error(`[email:${context}]`, err.message);
  if (err.response) console.error('[email] SMTP response:', err.response);
  if (err.responseCode) console.error('[email] SMTP code:', err.responseCode);
  if (err.command) console.error('[email] SMTP command:', err.command);
}

module.exports = {
  sendTeacherPendingEmail,
  sendTeacherRegistrationReceipt,
  createTransporter,
  logMailError,
};
