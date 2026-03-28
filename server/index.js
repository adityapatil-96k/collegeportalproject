require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const resourceRoutes = require('./routes/resourceRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const corsOrigins = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);
const frontendBaseUrl = String(process.env.FRONTEND_BASE_URL || '').trim().replace(/\/$/, '');

// Trust proxy if behind HTTPS terminator in production
app.set('trust proxy', 1);

app.use(
  cors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const frontendRedirectMap = {
  '/': '/auth',
  '/auth.html': '/auth',
  '/student-dashboard.html': '/student',
  '/teacher-dashboard.html': '/teacher',
};

app.get(Object.keys(frontendRedirectMap), (req, res, next) => {
  if (!frontendBaseUrl) return next();
  const destinationPath = frontendRedirectMap[req.path] || '/';
  return res.redirect(302, `${frontendBaseUrl}${destinationPath}`);
});

// Static frontend (register, login, dashboards)
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(authRoutes);
app.use('/api/admin', adminRoutes);
app.use(userRoutes);
app.use(resourceRoutes);

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
