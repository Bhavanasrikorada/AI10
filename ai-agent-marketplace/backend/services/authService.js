const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate signed JWT Token
 */
function generateToken(user) {
  const secret = process.env.JWT_SECRET || 'beckn_ai_marketplace_super_secret_jwt_key_2026';
  const expiresIn = process.env.JWT_EXPIRE || '7d';
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    secret,
    { expiresIn }
  );
}

/**
 * Register a new user
 */
async function registerUser({ name, email, password, role, organization }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    const error = new Error('User already exists with this email');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: role || 'consumer',
    organization: organization || ''
  });

  const token = generateToken(user);
  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization
    },
    token
  };
}

/**
 * Authenticate user login
 */
async function loginUser(email, password) {
  if (!email || !password) {
    const error = new Error('Please provide email and password');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);
  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization
    },
    token
  };
}

module.exports = {
  generateToken,
  registerUser,
  loginUser
};
