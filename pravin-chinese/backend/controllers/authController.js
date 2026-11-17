const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const generateJWT = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'pravin_chinese_jwt_secret_key_2026', {
    expiresIn: '7d',
  });
};

// @desc    Admin login
// @route   POST /api/auth/login
// @access  Public
const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateJWT(admin._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in admin
// @route   GET /api/auth/me
// @access  Private (Admin)
const getAdminProfile = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');
    res.json({
      success: true,
      admin,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginAdmin,
  getAdminProfile,
};
