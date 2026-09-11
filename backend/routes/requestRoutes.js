const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  createRequest,
  getAllRequests,
  getRequestById,
  updateRequest,
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

// Soft auth middleware that attaches req.user if Bearer token is provided
const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'lifedrop_super_secret_jwt_key_2026_healthcare_system'
      );
      req.user = await User.findById(decoded.id).select('-password');
    } catch (e) {
      // Ignore token failure for public routes
    }
  }
  next();
};

router.post('/', optionalAuth, createRequest);
router.get('/', getAllRequests);
router.get('/:id', getRequestById);
router.put('/:id', protect, updateRequest);

module.exports = router;
