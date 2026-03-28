const { verifyToken } = require('../utils/jwt');

/**
 * Reads JWT from Authorization: Bearer <token> or cookie "token".
 * Sets req.user = { userId, role }.
 */
function authenticate(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded.userId || !decoded.role) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { authenticate };
