const express = require('express');
const router = express.Router();
const {
  getStatistics,
  getAllUsers,
  deleteUser,
  updateUserStatus,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes require authentication and 'admin' role
router.use(protect);
router.use(authorize('admin'));

router.get('/statistics', getStatistics);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/status', updateUserStatus);

module.exports = router;
