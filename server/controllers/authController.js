const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');
const { sendEmail } = require('../services/email.service');

function envTrim(key) {
  const value = process.env[key];
  if (value == null) return '';
  return String(value).replace(/\r/g, '').trim();
}

function getAppBaseUrl() {
  const raw = envTrim('APP_BASE_URL') || envTrim('BASE_URL') || 'http://localhost:5000';
  return raw.replace(/\/$/, '');
}

function escapeHtml(value) {
  if (!value) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * POST /register — create student (approved) or teacher (pending approval).
 */
async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ message: 'Role must be student or teacher' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const isApproved = role === 'student';

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      role,
      isApproved,
    });

    if (role === 'teacher') {
      const adminEmail = envTrim('ADMIN_EMAIL');
      if (!adminEmail) {
        await User.deleteOne({ _id: user._id });
        return res.status(503).json({
          message: 'Registration could not be completed because ADMIN_EMAIL is not configured.',
        });
      }

      const appBaseUrl = getAppBaseUrl();
      const teacherPayload = {
        name: user.name,
        email: user.email,
        userId: user._id.toString(),
      };
      const approveUrl = `${appBaseUrl}/api/admin/approve/${teacherPayload.userId}`;
      const rejectUrl = `${appBaseUrl}/api/admin/reject/${teacherPayload.userId}`;
      const subject = `Teacher registration pending: ${teacherPayload.name}`;
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #1a1a1a;">
  <h2 style="margin-bottom: 0.5rem;">New teacher registration</h2>
  <p style="margin-top: 0;">A teacher has registered and needs your approval.</p>
  <table style="margin: 1rem 0; border-collapse: collapse;">
    <tr><td style="padding: 0.25rem 1rem 0.25rem 0;"><strong>Name</strong></td><td>${escapeHtml(teacherPayload.name)}</td></tr>
    <tr><td style="padding: 0.25rem 1rem 0.25rem 0;"><strong>Email</strong></td><td>${escapeHtml(teacherPayload.email)}</td></tr>
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
      try {
        await sendEmail(adminEmail, subject, html);
      } catch (mailErr) {
        console.error('[email:admin-approval-send-failed]', mailErr.message);
        await User.deleteOne({ _id: user._id });
        return res.status(503).json({
          message:
            'Registration could not be completed because admin approval email could not be sent. Please try again shortly.',
          ...(process.env.NODE_ENV === 'production' ? {} : { emailDebug: mailErr.message }),
        });
      }
    }

    const baseTeacherMsg =
      'Registration successful. Your account is pending admin approval via email.';
    const teacherMsg =
      role === 'teacher'
        ? baseTeacherMsg
        : 'Registration successful. You can log in now.';

    return res.status(201).json({
      message: teacherMsg,
      adminNotified: role === 'teacher',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error during registration' });
  }
}

/**
 * POST /login — JWT; teachers must be approved.
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.password || typeof user.password !== 'string') {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.role === 'teacher' && !user.isApproved) {
      return res.status(403).json({
        message: 'Your account is pending approval via admin email',
      });
    }

    const token = signToken({ userId: user._id.toString(), role: user.role });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    res.cookie('token', token, cookieOptions);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error during login' });
  }
}

/**
 * POST /logout — clear auth cookie.
 */
function logout(req, res) {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  return res.json({ message: 'Logged out' });
}

module.exports = { register, login, logout };
