const User = require('../models/User');

/**
 * Allow only listed roles (e.g. requireRole('student')).
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have access to this resource' });
    }
    next();
  };
}

/**
 * Teacher routes: must be approved in DB (handles stale JWT edge cases).
 */
async function requireApprovedTeacher(req, res, next) {
  if (!req.user || req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Teacher access only' });
  }
  try {
    const user = await User.findById(req.user.userId).select('isApproved role');
    if (!user || user.role !== 'teacher') {
      return res.status(403).json({ message: 'Teacher access only' });
    }
    if (!user.isApproved) {
      return res.status(403).json({
        message: 'Your account is pending approval via admin email',
      });
    }
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { requireRole, requireApprovedTeacher };
