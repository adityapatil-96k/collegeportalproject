const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');
const {
  sendTeacherPendingEmail,
  sendTeacherRegistrationReceipt,
  logMailError,
} = require('../utils/sendMail');

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

    let adminNotified = false;
    let emailErrorSummary = null;

    if (role === 'teacher') {
      const teacherPayload = {
        name: user.name,
        email: user.email,
        userId: user._id.toString(),
      };
      try {
        await sendTeacherPendingEmail(teacherPayload);
        adminNotified = true;
      } catch (mailErr) {
        logMailError('admin-notify', mailErr);
        emailErrorSummary =
          process.env.NODE_ENV === 'production'
            ? 'Could not send email to admin'
            : mailErr.message;
      }
      // Receipt to teacher helps confirm SMTP works and clarifies mail goes to admin first
      try {
        await sendTeacherRegistrationReceipt(teacherPayload);
      } catch (receiptErr) {
        logMailError('teacher-receipt', receiptErr);
      }
    }

    const baseTeacherMsg =
      'Registration successful. Your account is pending admin approval via email.';
    const teacherMsg =
      role === 'teacher' && !adminNotified
        ? `${baseTeacherMsg} We could not send the notification email — check server logs and SMTP settings, or ask an admin to approve your account manually.`
        : role === 'teacher'
          ? baseTeacherMsg
          : 'Registration successful. You can log in now.';

    return res.status(201).json({
      message: teacherMsg,
      adminNotified,
      ...(role === 'teacher' && !adminNotified && emailErrorSummary
        ? { emailDebug: emailErrorSummary }
        : {}),
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
