const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_expense_tracker_2026_xyz';
    const decoded = jwt.verify(token, secret);

    // Attach minimal user info to request
    req.user = {
      id: decoded.id
    };

    // Optionally check if user still exists in DB
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user no longer exists'
      });
    }

    req.user.name = user.name;
    req.user.email = user.email;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token invalid or expired'
    });
  }
};

module.exports = { protect };
