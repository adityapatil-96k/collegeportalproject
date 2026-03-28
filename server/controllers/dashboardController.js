const User = require('../models/User');

/**
 * GET /student-dashboard — protected; returns user info for UI.
 */
async function studentDashboard(req, res) {
  const user = await User.findById(req.user.userId).select('-password');
  if (!user || user.role !== 'student') {
    return res.status(403).json({ message: 'Student access only' });
  }
  return res.json({
    message: 'Welcome to the student dashboard',
    user,
  });
}

/**
 * GET /teacher-dashboard — approved teachers only.
 */
async function teacherDashboard(req, res) {
  const user = await User.findById(req.user.userId).select('-password');
  if (!user || user.role !== 'teacher') {
    return res.status(403).json({ message: 'Teacher access only' });
  }
  if (!user.isApproved) {
    return res.status(403).json({
      message: 'Your account is pending approval via admin email',
    });
  }
  return res.json({
    message: 'Welcome to the teacher dashboard',
    user,
  });
}

module.exports = { studentDashboard, teacherDashboard };
