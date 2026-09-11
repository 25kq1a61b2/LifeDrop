const User = require('../models/User');

// @desc    Get all donors
// @route   GET /api/donors
// @access  Public
exports.getAllDonors = async (req, res) => {
  try {
    const donors = await User.find({ role: 'donor', status: 'active' })
      .select('-password')
      .sort({ availability: 1, updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: donors.length,
      donors,
    });
  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching donors',
      error: error.message,
    });
  }
};

// @desc    Search donors with filters (bloodGroup, city, availability)
// @route   GET /api/donors/search
// @access  Public
exports.searchDonors = async (req, res) => {
  try {
    const { bloodGroup, city, availability } = req.query;

    const query = {
      role: 'donor',
      status: 'active',
    };

    if (bloodGroup && bloodGroup.trim() !== '') {
      query.bloodGroup = bloodGroup.trim();
    }

    if (city && city.trim() !== '') {
      // Case-insensitive regex match for city
      query.city = { $regex: city.trim(), $options: 'i' };
    }

    if (availability && availability.trim() !== '' && availability !== 'All') {
      query.availability = availability.trim();
    }

    const donors = await User.find(query)
      .select('-password')
      .sort({ availability: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: donors.length,
      donors,
    });
  } catch (error) {
    console.error('Error searching donors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during donor search',
      error: error.message,
    });
  }
};

// @desc    Get single donor details
// @route   GET /api/donors/:id
// @access  Public
exports.getDonorById = async (req, res) => {
  try {
    const donor = await User.findOne({
      _id: req.params.id,
      role: 'donor',
    }).select('-password');

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found',
      });
    }

    res.status(200).json({
      success: true,
      donor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving donor details',
      error: error.message,
    });
  }
};

// @desc    Update donor profile
// @route   PUT /api/donors/:id
// @access  Private (Donor themselves or Admin)
exports.updateDonor = async (req, res) => {
  try {
    const donorId = req.params.id;

    // Check authorization: must be the donor or an admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== donorId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this donor profile',
      });
    }

    const allowedFields = [
      'name',
      'phone',
      'bloodGroup',
      'age',
      'gender',
      'city',
      'state',
      'availability',
      'lastDonationDate',
    ];

    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updatedDonor = await User.findOneAndUpdate(
      { _id: donorId, role: 'donor' },
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedDonor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Donor profile updated successfully',
      donor: updatedDonor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating donor',
    });
  }
};

// @desc    Change donor availability status
// @route   PUT /api/donors/:id/availability
// @access  Private (Donor themselves or Admin)
exports.updateAvailability = async (req, res) => {
  try {
    const donorId = req.params.id;
    const { availability } = req.body;

    if (!availability || !['Available', 'Not Available'].includes(availability)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid availability ("Available" or "Not Available")',
      });
    }

    // Check authorization: must be the donor or an admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== donorId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to change this availability',
      });
    }

    const updatedDonor = await User.findOneAndUpdate(
      { _id: donorId, role: 'donor' },
      { availability },
      { new: true }
    ).select('-password');

    if (!updatedDonor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Availability updated to ${availability}`,
      donor: updatedDonor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating availability',
      error: error.message,
    });
  }
};
