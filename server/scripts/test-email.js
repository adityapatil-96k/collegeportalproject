/**
 * Quick SMTP check: sends one test message to ADMIN_EMAIL.
 * Run from project root: npm run test-email
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const nodemailer = require('nodemailer');

function envTrim(key) {
  const v = process.env[key];
  if (v == null) return '';
  return String(v).replace(/\r/g, '').trim();
}

async function main() {
  const host = envTrim('SMTP_HOST') || 'smtp.gmail.com';
  const port = Number(envTrim('SMTP_PORT')) || 465;
  const secure =
    envTrim('SMTP_SECURE').toLowerCase() === 'true' || port === 465;
  const user = envTrim('SMTP_USER');
  const pass = envTrim('SMTP_PASS');
  const admin = envTrim('ADMIN_EMAIL');
  const from = envTrim('MAIL_FROM') || `"Test" <${user}>`;

  if (!user || !pass) {
    console.error('Missing SMTP_USER or SMTP_PASS in .env');
    process.exit(1);
  }
  if (!admin) {
    console.error('Missing ADMIN_EMAIL in .env');
    process.exit(1);
  }

  console.log('Using:', { host, port, secure, user, admin, from });

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
  });

  try {
    await transporter.verify();
    console.log('SMTP verify: OK');
  } catch (e) {
    console.error('SMTP verify failed:', e.message);
    if (e.response) console.error('Response:', e.response);
    process.exit(1);
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: admin,
      subject: 'College portal — SMTP test',
      text: 'If you see this, Nodemailer + Gmail SMTP are configured correctly.',
    });
    console.log('Sent. MessageId:', info.messageId);
  } catch (e) {
    console.error('Send failed:', e.message);
    if (e.response) console.error('Response:', e.response);
    if (e.responseCode) console.error('Code:', e.responseCode);
    process.exit(1);
  }
}

main();
