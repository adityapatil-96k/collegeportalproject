const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { sendEmail } = require('../services/email.service');

function envTrim(key) {
  const v = process.env[key];
  if (v == null) return '';
  return String(v).replace(/\r/g, '').trim();
}

async function main() {
  const admin = envTrim('ADMIN_EMAIL');
  const appBaseUrl = envTrim('APP_BASE_URL') || 'http://localhost:5000';
  const resendKey = envTrim('RESEND_API_KEY');

  if (!resendKey) {
    console.error('Missing RESEND_API_KEY in .env');
    process.exit(1);
  }
  if (!admin) {
    console.error('Missing ADMIN_EMAIL in .env');
    process.exit(1);
  }

  console.log('Using:', { admin, appBaseUrl, hasResendApiKey: Boolean(resendKey) });

  try {
    const result = await sendEmail(
      admin,
      'College portal — Resend test',
      '<p>If you see this, Resend email integration is configured correctly.</p>'
    );
    console.log('Sent. Result:', result);
  } catch (e) {
    console.error('Send failed:', e.message);
    if (e.name) console.error('Name:', e.name);
    if (e.statusCode) console.error('StatusCode:', e.statusCode);
    if (e.response) console.error('Response:', e.response);
    process.exit(1);
  }
}

main();
