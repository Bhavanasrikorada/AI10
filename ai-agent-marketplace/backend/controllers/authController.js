const { registerUser, loginUser } = require('../services/authService');
const User = require('../models/User');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role, organization } = req.body;
    const result = await registerUser({ name, email, password, role, organization });
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      ...result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      ...result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Logout user / invalidate session
 * @route   POST /api/auth/logout
 * @access  Public
 */
async function logout(req, res) {
  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
}

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        dpiIdentity: user.dpiIdentity,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.organization) user.organization = req.body.organization;
    if (req.body.dpiIdentity) user.dpiIdentity = req.body.dpiIdentity;
    if (req.body.password) user.password = req.body.password;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        dpiIdentity: user.dpiIdentity
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile
};
