const express = require('express');
const router = express.Router();
const {
  getAllDonors,
  searchDonors,
  getDonorById,
  updateDonor,
  updateAvailability,
} = require('../controllers/donorController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getAllDonors);
router.get('/search', searchDonors);
router.get('/:id', getDonorById);
router.put('/:id', protect, updateDonor);
router.put('/:id/availability', protect, updateAvailability);

module.exports = router;
