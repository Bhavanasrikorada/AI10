const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes: requires valid JWT bearer token
 */
async function protect(req, res, next) {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this resource: No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'beckn_ai_marketplace_super_secret_jwt_key_2026');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User associated with this token no longer exists'
      });
    }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this resource: Invalid token'
    });
  }
}

/**
 * Optional authentication: attaches user if token is present, does not block if absent
 */
async function optionalAuth(req, res, next) {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'beckn_ai_marketplace_super_secret_jwt_key_2026');
    req.user = await User.findById(decoded.id).select('-password');
  } catch (err) {
    // ignore invalid token in optional auth
  }
  next();
}

/**
 * Role-based authorization guard
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user?.role}' is not authorized to access this route`
      });
    }
    next();
  };
}

module.exports = {
  protect,
  optionalAuth,
  authorize
};
