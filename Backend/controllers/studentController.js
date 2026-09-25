const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');

// @desc    Get current student's profile
// @route   GET /api/students/profile
// @access  Private (Student only)
const getStudentProfile = async (req, res, next) => {
  try {
    const studentProfile = await StudentProfile.findOne({ user: req.user._id }).populate(
      'user',
      'name email role isActive createdAt'
    );

    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    res.status(200).json({
      success: true,
      profile: studentProfile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current student's profile
// @route   PUT /api/students/profile
// @access  Private (Student only)
const updateStudentProfile = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      branch,
      cgpa,
      tenthPercentage,
      twelfthPercentage,
      activeBacklogs,
      skills,
    } = req.body;

    const studentProfile = await StudentProfile.findOne({ user: req.user._id });

    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    // 1. Validate CGPA (between 0 and 10)
    if (cgpa !== undefined && cgpa !== null) {
      const numCgpa = Number(cgpa);
      if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
        return res.status(400).json({
          success: false,
          message: 'CGPA must be a valid number between 0 and 10',
        });
      }
      studentProfile.cgpa = numCgpa;
    }

    // 2. Validate 10th percentage (between 0 and 100)
    if (tenthPercentage !== undefined && tenthPercentage !== null) {
      const numTenth = Number(tenthPercentage);
      if (isNaN(numTenth) || numTenth < 0 || numTenth > 100) {
        return res.status(400).json({
          success: false,
          message: '10th percentage must be a valid number between 0 and 100',
        });
      }
      studentProfile.tenthPercentage = numTenth;
    }

    // 3. Validate 12th percentage (between 0 and 100)
    if (twelfthPercentage !== undefined && twelfthPercentage !== null) {
      const numTwelfth = Number(twelfthPercentage);
      if (isNaN(numTwelfth) || numTwelfth < 0 || numTwelfth > 100) {
        return res.status(400).json({
          success: false,
          message: '12th percentage must be a valid number between 0 and 100',
        });
      }
      studentProfile.twelfthPercentage = numTwelfth;
    }

    // 4. Validate activeBacklogs (not negative)
    if (activeBacklogs !== undefined && activeBacklogs !== null) {
      const numBacklogs = Number(activeBacklogs);
      if (isNaN(numBacklogs) || numBacklogs < 0) {
        return res.status(400).json({
          success: false,
          message: 'Active backlogs cannot be negative',
        });
      }
      studentProfile.activeBacklogs = numBacklogs;
    }

    // 5. Update other student profile fields
    if (phone !== undefined) {
      studentProfile.phone = phone ? phone.trim() : '';
    }

    if (branch !== undefined && branch.trim()) {
      studentProfile.branch = branch.trim();
    }

    if (skills !== undefined) {
      studentProfile.skills = Array.isArray(skills)
        ? skills
        : typeof skills === 'string'
        ? skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    }

    // 6. Update User.name separately if provided (disallowing role, email, password, isActive changes)
    if (name && name.trim()) {
      await User.findByIdAndUpdate(req.user._id, { name: name.trim() });
    }

    await studentProfile.save();

    // Re-fetch populated profile so the returned object includes updated user data
    const updatedProfile = await StudentProfile.findOne({ user: req.user._id }).populate(
      'user',
      'name email role isActive createdAt'
    );

    res.status(200).json({
      success: true,
      message: 'Student profile updated successfully',
      profile: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudentProfile,
  updateStudentProfile,
};
