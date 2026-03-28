const cloudinary = require('cloudinary').v2;

function envTrim(key) {
  const v = process.env[key];
  if (v == null) return '';
  return String(v).replace(/\r/g, '').trim();
}

const cloudName = envTrim('CLOUDINARY_CLOUD_NAME');
const apiKey = envTrim('CLOUDINARY_API_KEY');
const apiSecret = envTrim('CLOUDINARY_API_SECRET');

if (!cloudName || !apiKey || !apiSecret) {
  // Fail fast when someone tries to upload resources without Cloudinary setup.
  throw new Error(
    'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env'
  );
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

module.exports = { cloudinary };

