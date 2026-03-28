const jwt = require('jsonwebtoken');

const JWT_SECRET = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set');
  return s;
};

/**
 * @param {{ userId: string, role: 'student' | 'teacher' }} payload
 */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET(), { expiresIn: '7d' });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET());
}

module.exports = { signToken, verifyToken };
