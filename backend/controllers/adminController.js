const User = require('../models/User');
const BloodRequest = require('../models/BloodRequest');
const Hospital = require('../models/Hospital');

// @desc    Get system-wide statistics for Admin Dashboard
// @route   GET /api/admin/statistics
// @access  Private / Admin
exports.getStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const availableDonors = await User.countDocuments({
      role: 'donor',
      availability: 'Available',
      status: 'active',
    });
    const totalHospitals = await User.countDocuments({ role: 'hospital' });
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const emergencyRequests = await BloodRequest.countDocuments();
    const activeRequests = await BloodRequest.countDocuments({ status: 'Active' });
    const fulfilledRequests = await BloodRequest.countDocuments({ status: 'Fulfilled' });
    const criticalRequests = await BloodRequest.countDocuments({
      status: 'Active',
      emergencyLevel: 'Critical',
    });

    // Blood group availability breakdown
    const bloodGroupDistribution = await User.aggregate([
      { $match: { role: 'donor', availability: 'Available', status: 'active' } },
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      statistics: {
        totalUsers,
        totalDonors,
        availableDonors,
        totalHospitals,
        totalPatients,
        emergencyRequests,
        activeRequests,
        fulfilledRequests,
        criticalRequests,
        bloodGroupDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics',
      error: error.message,
    });
  }
};

// @desc    Get all users with optional role filter and search
// @route   GET /api/admin/users
// @access  Private / Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { role, search, status } = req.query;
    const query = {};

    if (role && role !== 'All') {
      query.role = role.toLowerCase();
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search && search.trim() !== '') {
      const regex = { $regex: search.trim(), $options: 'i' };
      query.$or = [{ name: regex }, { email: regex }, { city: regex }, { phone: regex }];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving users',
      error: error.message,
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/admin/users/:id
// @access  Private / Admin
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Administrator cannot delete their own account',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // If hospital, remove linked hospital profile
    if (user.role === 'hospital') {
      await Hospital.deleteMany({ associatedUser: user._id });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: `User account '${user.name}' (${user.email}) deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user',
      error: error.message,
    });
  }
};

// @desc    Update user status or role
// @route   PUT /api/admin/users/:id/status
// @access  Private / Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { status, role } = req.body;
    const updates = {};

    if (status && ['active', 'inactive', 'suspended'].includes(status)) {
      updates.status = status;
    }
    if (role && ['donor', 'patient', 'hospital', 'admin'].includes(role)) {
      updates.role = role;
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating user status',
    });
  }
};
