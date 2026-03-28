const { Resend } = require('resend');

function envTrim(key) {
  const value = process.env[key];
  if (value == null) return '';
  return String(value).replace(/\r/g, '').trim();
}

function getResendClient() {
  const apiKey = envTrim('RESEND_API_KEY');
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set');
  }
  return new Resend(apiKey);
}

async function sendEmail(to, subject, html) {
  const resend = getResendClient();
  try {
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject,
      html,
    });
    if (result?.error) {
      throw new Error(result.error.message || 'Resend API returned an error');
    }
    return result;
  } catch (error) {
    console.error('[email:resend-send-failed]', error.message);
    if (error?.name) console.error('[email] name:', error.name);
    if (error?.statusCode) console.error('[email] statusCode:', error.statusCode);
    if (error?.response) console.error('[email] response:', error.response);
    throw error;
  }
}

module.exports = {
  sendEmail,
};
