const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');

// @desc    Create a new emergency blood request
// @route   POST /api/requests
// @access  Public (or Authenticated)
exports.createRequest = async (req, res) => {
  try {
    const {
      patientName,
      bloodGroup,
      hospitalName,
      city,
      requiredUnits,
      emergencyLevel = 'High',
      contactNumber,
      notes,
    } = req.body;

    if (
      !patientName ||
      !bloodGroup ||
      !hospitalName ||
      !city ||
      !requiredUnits ||
      !contactNumber
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (Patient Name, Blood Group, Hospital Name, City, Units, Contact Number)',
      });
    }

    const bloodRequest = await BloodRequest.create({
      patientName: patientName.trim(),
      bloodGroup,
      hospitalName: hospitalName.trim(),
      city: city.trim(),
      requiredUnits: Number(requiredUnits),
      emergencyLevel,
      contactNumber: contactNumber.trim(),
      notes: notes ? notes.trim() : '',
      status: 'Active',
      requestedBy: req.user ? req.user._id : null,
    });

    // Check matching available donors in the same city or blood group for instant stats
    const matchingDonors = await User.countDocuments({
      role: 'donor',
      bloodGroup,
      city: { $regex: city.trim(), $options: 'i' },
      availability: 'Available',
      status: 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Emergency blood request created successfully',
      request: bloodRequest,
      matchingAvailableDonors: matchingDonors,
    });
  } catch (error) {
    console.error('Error creating blood request:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating blood request',
    });
  }
};

// @desc    Get all blood requests with optional filters
// @route   GET /api/requests
// @access  Public
exports.getAllRequests = async (req, res) => {
  try {
    const { status, emergencyLevel, bloodGroup, city } = req.query;

    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (emergencyLevel && emergencyLevel !== 'All') {
      query.emergencyLevel = emergencyLevel;
    }

    if (bloodGroup && bloodGroup !== 'All') {
      query.bloodGroup = bloodGroup;
    }

    if (city && city.trim() !== '') {
      query.city = { $regex: city.trim(), $options: 'i' };
    }

    // Sort so Critical emergency levels and newest appear first
    const requests = await BloodRequest.find(query)
      .populate('requestedBy', 'name email phone hospitalName role')
      .sort({
        // Sort active requests first, then by emergency priority, then createdAt descending
        status: 1,
        createdAt: -1,
      });

    // Custom sorting to ensure Critical comes first
    const emergencyPriority = { Critical: 1, High: 2, Medium: 3, Low: 4 };
    requests.sort((a, b) => {
      if (a.status === 'Active' && b.status !== 'Active') return -1;
      if (a.status !== 'Active' && b.status === 'Active') return 1;
      const prioA = emergencyPriority[a.emergencyLevel] || 99;
      const prioB = emergencyPriority[b.emergencyLevel] || 99;
      if (prioA !== prioB) return prioA - prioB;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error('Error fetching blood requests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching blood requests',
      error: error.message,
    });
  }
};

// @desc    Get single blood request by ID
// @route   GET /api/requests/:id
// @access  Public
exports.getRequestById = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id).populate(
      'requestedBy',
      'name email phone hospitalName'
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found',
      });
    }

    res.status(200).json({
      success: true,
      request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving request details',
      error: error.message,
    });
  }
};

// @desc    Update blood request (status: Active, Fulfilled, Cancelled)
// @route   PUT /api/requests/:id
// @access  Private / Hospital / Admin
exports.updateRequest = async (req, res) => {
  try {
    const { status, requiredUnits, emergencyLevel, notes } = req.body;

    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found',
      });
    }

    if (status) {
      if (!['Active', 'Fulfilled', 'Cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be Active, Fulfilled, or Cancelled',
        });
      }
      request.status = status;
    }

    if (requiredUnits !== undefined) request.requiredUnits = Number(requiredUnits);
    if (emergencyLevel) request.emergencyLevel = emergencyLevel;
    if (notes !== undefined) request.notes = notes;

    await request.save();

    res.status(200).json({
      success: true,
      message: `Request status updated to ${request.status}`,
      request,
    });
  } catch (error) {
    console.error('Error updating blood request:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating request',
    });
  }
};
