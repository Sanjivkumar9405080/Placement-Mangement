const bcrypt = require('bcryptjs');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const CompanyProfile = require('../models/CompanyProfile');
const generateToken = require('../utils/generateToken');

// @desc    Register a new student or company user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      // Student specific fields
      rollNumber,
      branch,
      cgpa,
      tenthPercentage,
      twelfthPercentage,
      activeBacklogs,
      skills,
      phone,
      // Company specific fields
      companyName,
      website,
      industry,
      hrName,
      hrEmail,
      hrPhone,
    } = req.body;

    // 1. Block public admin registration
    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot be created through public registration',
      });
    }

    // 2. Validate common required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, and role',
      });
    }

    // 3. Validate role
    if (!['student', 'company'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified. Must be either 'student' or 'company'",
      });
    }

    // 4. Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // 5. Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // 6. Role-specific validation & creation
    let createdUser = null;
    let createdProfile = null;

    if (role === 'student') {
      if (!rollNumber || !branch || cgpa === undefined || cgpa === null) {
        return res.status(400).json({
          success: false,
          message: 'Student registration requires: rollNumber, branch, and cgpa',
        });
      }

      const numericCgpa = Number(cgpa);
      if (isNaN(numericCgpa) || numericCgpa < 0 || numericCgpa > 10) {
        return res.status(400).json({
          success: false,
          message: 'CGPA must be a valid number between 0 and 10',
        });
      }

      // Check duplicate roll number
      const existingRoll = await StudentProfile.findOne({
        rollNumber: rollNumber.trim().toUpperCase(),
      });
      if (existingRoll) {
        return res.status(400).json({
          success: false,
          message: 'A student profile with this roll number already exists',
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create base User
      createdUser = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'student',
      });

      try {
        // Create Student Profile
        createdProfile = await StudentProfile.create({
          user: createdUser._id,
          rollNumber: rollNumber.trim().toUpperCase(),
          branch: branch.trim(),
          cgpa: numericCgpa,
          tenthPercentage: tenthPercentage !== undefined ? Number(tenthPercentage) : undefined,
          twelfthPercentage: twelfthPercentage !== undefined ? Number(twelfthPercentage) : undefined,
          activeBacklogs: activeBacklogs !== undefined ? Number(activeBacklogs) : 0,
          skills: Array.isArray(skills)
            ? skills
            : typeof skills === 'string' && skills.trim()
            ? skills.split(',').map((s) => s.trim())
            : [],
          phone: phone ? phone.trim() : undefined,
        });
      } catch (profileErr) {
        // Rollback user if profile creation fails
        await User.findByIdAndDelete(createdUser._id);
        throw profileErr;
      }
    } else if (role === 'company') {
      if (!companyName) {
        return res.status(400).json({
          success: false,
          message: 'Company registration requires: companyName',
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create base User
      createdUser = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'company',
      });

      try {
        // Create Company Profile
        createdProfile = await CompanyProfile.create({
          user: createdUser._id,
          companyName: companyName.trim(),
          website: website ? website.trim() : '',
          industry: industry ? industry.trim() : '',
          hrName: hrName ? hrName.trim() : name.trim(),
          hrEmail: hrEmail ? hrEmail.trim().toLowerCase() : email.trim().toLowerCase(),
          hrPhone: hrPhone ? hrPhone.trim() : '',
          isApproved: false,
        });
      } catch (profileErr) {
        // Rollback user if profile creation fails
        await User.findByIdAndDelete(createdUser._id);
        throw profileErr;
      }
    }

    // 7. Generate JWT token
    const token = generateToken(createdUser);

    // 8. Return response without password
    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
      token,
      user: {
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        isActive: createdUser.isActive,
      },
      profile: createdProfile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check account status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.',
      });
    }

    // Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Fetch related profile
    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ user: user._id });
    } else if (user.role === 'company') {
      profile = await CompanyProfile.findOne({ user: user._id });
    }

    // Generate token
    const token = generateToken(user);

    // Send response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user profile
// @route   GET /api/auth/me
// @access  Private (Requires Protect)
const getCurrentUser = async (req, res, next) => {
  try {
    const user = req.user;

    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ user: user._id });
    } else if (user.role === 'company') {
      profile = await CompanyProfile.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};
