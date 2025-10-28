const jwt = require('jsonwebtoken');
const User = require('../models/User');

function requireAuth(req, res, next) {
  try {
    const DEBUG_AUTH = process.env.DEBUG_AUTH === 'true';
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      if (DEBUG_AUTH) console.warn(`[auth] Missing token on ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    if (process.env.DEBUG_AUTH === 'true') {
      console.warn(`[auth] Token verification failed: ${err.message}`);
    }
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Ensure the authenticated user is an admin
async function requireAdmin(req, res, next) {
  try {
    const DEBUG_AUTH = process.env.DEBUG_AUTH === 'true';
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      if (DEBUG_AUTH) console.warn(`[admin] Missing token on ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    const user = await User.findById(req.userId).select('role');
    if (!user || user.role !== 'admin') {
      if (DEBUG_AUTH) {
        console.warn(`[admin] Access denied for user ${req.userId || 'unknown'} on ${req.method} ${req.originalUrl} - ${!user ? 'user not found' : `role=${user.role}`}`);
      }
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  } catch (err) {
    if (process.env.DEBUG_AUTH === 'true') {
      console.warn(`[admin] Token verification error: ${err.message}`);
    }
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth, requireAdmin };


