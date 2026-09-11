const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hospital = require('../models/Hospital');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'lifedrop_super_secret_jwt_key_2026_healthcare_system',
    { expiresIn: '7d' }
  );
};

// @desc    Register a new user (Donor, Patient, Hospital, Admin)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      phone,
      bloodGroup,
      age,
      gender,
      city,
      state,
      role = 'donor',
      availability = 'Available',
      lastDonationDate,
      hospitalName,
    } = req.body;

    // Basic validation
    if (!name || !email || !password || !phone || !city || !state) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (Name, Email, Password, Phone, City, State)',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    // Create user payload
    const normalizedRole = role.toLowerCase();
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone.trim(),
      bloodGroup: bloodGroup || 'O+',
      age: age ? parseInt(age, 10) : undefined,
      gender: gender || 'Male',
      city: city.trim(),
      state: state.trim(),
      role: normalizedRole,
      availability: normalizedRole === 'donor' ? availability : 'Not Available',
      lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : null,
      hospitalName: normalizedRole === 'hospital' ? (hospitalName || name).trim() : '',
    };

    const newUser = await User.create(userData);

    // If registered as a hospital, create hospital record too
    if (normalizedRole === 'hospital') {
      await Hospital.create({
        name: userData.hospitalName || userData.name,
        email: userData.email,
        phone: userData.phone,
        city: userData.city,
        state: userData.state,
        associatedUser: newUser._id,
      });
    }

    const token = generateToken(newUser._id, newUser.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to LifeDrop.',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        bloodGroup: newUser.bloodGroup,
        city: newUser.city,
        state: newUser.state,
        availability: newUser.availability,
        lastDonationDate: newUser.lastDonationDate,
        hospitalName: newUser.hospitalName,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    // Check for user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended by the administrator.',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        age: user.age,
        gender: user.gender,
        city: user.city,
        state: user.state,
        availability: user.availability,
        lastDonationDate: user.lastDonationDate,
        hospitalName: user.hospitalName,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// @desc    Get currently logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching user profile',
      error: error.message,
    });
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const allowedUpdates = [
      'name',
      'phone',
      'bloodGroup',
      'age',
      'gender',
      'city',
      'state',
      'availability',
      'lastDonationDate',
      'hospitalName',
    ];

    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile',
    });
  }
};
