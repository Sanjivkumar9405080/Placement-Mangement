const mongoose = require('mongoose');
const Application = require('../models/Application');
const StudentProfile = require('../models/StudentProfile');
const CompanyProfile = require('../models/CompanyProfile');
const Drive = require('../models/Drive');

// @desc    Apply to a placement drive
// @route   POST /api/applications
// @access  Private (Student only)
const applyToDrive = async (req, res, next) => {
  try {
    const { driveId } = req.body;

    if (!driveId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide driveId',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(driveId)) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found',
      });
    }

    // 1. Check if student profile exists
    const studentProfile = await StudentProfile.findOne({ user: req.user._id });
    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    // 2. Check if drive exists
    const drive = await Drive.findById(driveId);
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found',
      });
    }

    // 2b. Check if drive is approved
    if (drive.approvalStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'This placement drive is not open for applications as it is not approved',
      });
    }

    // 3. Check if drive is completed / closed
    if (drive.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Drive is no longer accepting applications',
      });
    }

    // 4. Check application deadline
    if (drive.applicationDeadline && new Date() > new Date(drive.applicationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline has passed',
      });
    }

    // 5. Check CGPA eligibility (student.cgpa >= drive.minimumCGPA)
    if (studentProfile.cgpa < drive.minimumCGPA) {
      return res.status(400).json({
        success: false,
        message: 'Your CGPA does not meet the required minimum',
      });
    }

    // 6. Check active backlogs eligibility (student.activeBacklogs <= drive.maxBacklogs)
    if (studentProfile.activeBacklogs > drive.maxBacklogs) {
      return res.status(400).json({
        success: false,
        message: 'Your active backlogs exceed the allowed limit',
      });
    }

    // 7. Check branch eligibility
    if (drive.allowedBranches && drive.allowedBranches.length > 0) {
      const studentBranch = studentProfile.branch.trim().toLowerCase();
      const isBranchAllowed = drive.allowedBranches.some(
        (b) => b.trim().toLowerCase() === studentBranch
      );
      if (!isBranchAllowed) {
        return res.status(400).json({
          success: false,
          message: 'Your branch is not eligible for this drive',
        });
      }
    }

    // 7b. Check 10th percentage eligibility (if drive defines minimumTenthPercentage > 0)
    if (drive.minimumTenthPercentage && drive.minimumTenthPercentage > 0) {
      if (
        studentProfile.tenthPercentage !== undefined &&
        studentProfile.tenthPercentage !== null &&
        studentProfile.tenthPercentage < drive.minimumTenthPercentage
      ) {
        return res.status(400).json({
          success: false,
          message: `Your 10th percentage (${studentProfile.tenthPercentage}%) does not meet the minimum required (${drive.minimumTenthPercentage}%)`,
        });
      }
    }

    // 7c. Check 12th percentage eligibility (if drive defines minimumTwelfthPercentage > 0)
    if (drive.minimumTwelfthPercentage && drive.minimumTwelfthPercentage > 0) {
      if (
        studentProfile.twelfthPercentage !== undefined &&
        studentProfile.twelfthPercentage !== null &&
        studentProfile.twelfthPercentage < drive.minimumTwelfthPercentage
      ) {
        return res.status(400).json({
          success: false,
          message: `Your 12th percentage (${studentProfile.twelfthPercentage}%) does not meet the minimum required (${drive.minimumTwelfthPercentage}%)`,
        });
      }
    }

    // 8. Check if already applied
    const existingApplication = await Application.findOne({
      student: studentProfile._id,
      drive: drive._id,
    });
    if (existingApplication) {
      if (existingApplication.status === 'Removed' || existingApplication.isRemoved) {
        return res.status(400).json({
          success: false,
          message: 'You have been administratively removed from this placement drive and cannot re-apply',
        });
      }
      return res.status(409).json({
        success: false,
        message: 'You have already applied to this drive',
      });
    }

    // Create the Application record
    const application = await Application.create({
      student: studentProfile._id,
      drive: drive._id,
      status: 'Applied',
    });

    const populatedApplication = await Application.findById(application._id).populate({
      path: 'drive',
      select: 'jobTitle packageLPA driveDate applicationDeadline status company',
      populate: {
        path: 'company',
        select: 'companyName website industry hrName',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: populatedApplication,
    });
  } catch (error) {
    // Gracefully handle MongoDB duplicate key error (code 11000)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied to this drive',
      });
    }
    next(error);
  }
};

// @desc    Get all applications submitted by the logged-in student
// @route   GET /api/applications/my
// @access  Private (Student only)
const getMyApplications = async (req, res, next) => {
  try {
    const studentProfile = await StudentProfile.findOne({ user: req.user._id });
    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    const applications = await Application.find({
      student: studentProfile._id,
      status: { $ne: 'Removed' },
      isRemoved: { $ne: true },
    })
      .populate({
        path: 'drive',
        select: 'jobTitle packageLPA minimumCGPA allowedBranches driveDate applicationDeadline status company',
        populate: {
          path: 'company',
          select: 'companyName website industry hrName',
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single application by ID for the logged-in student
// @route   GET /api/applications/:id
// @access  Private (Student only)
const getApplicationById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const studentProfile = await StudentProfile.findOne({ user: req.user._id });
    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    const application = await Application.findById(req.params.id).populate({
      path: 'drive',
      select: 'jobTitle packageLPA minimumCGPA allowedBranches driveDate applicationDeadline status company recruitmentRounds description',
      populate: {
        path: 'company',
        select: 'companyName website industry hrName',
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Verify application belongs to authenticated student
    if (application.student.toString() !== studentProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view another student’s application',
      });
    }

    // If application was administratively removed, student cannot view it
    if (application.status === 'Removed' || application.isRemoved) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or has been administratively removed',
      });
    }

    res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all applications across all drives created by the logged-in company
// @route   GET /api/company/applications
// @access  Private (Company only)
const getCompanyApplications = async (req, res, next) => {
  try {
    const companyProfile = await CompanyProfile.findOne({ user: req.user._id });
    if (!companyProfile) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found',
      });
    }

    // Find all drives belonging to this company
    const drives = await Drive.find({ company: companyProfile._id }).select('_id');
    const driveIds = drives.map((d) => d._id);

    // Find applications belonging to those drives
    const applications = await Application.find({ drive: { $in: driveIds } })
      .populate({
        path: 'student',
        select:
          'rollNumber branch cgpa tenthPercentage twelfthPercentage activeBacklogs skills resumeUrl phone user',
        populate: {
          path: 'user',
          select: 'name email role isActive createdAt',
        },
      })
      .populate({
        path: 'drive',
        select: 'jobTitle packageLPA status driveDate applicationDeadline',
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all applications for a specific drive created by the logged-in company
// @route   GET /api/company/drives/:driveId/applications
// @access  Private (Company only)
const getDriveApplications = async (req, res, next) => {
  try {
    const { driveId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(driveId)) {
      return res.status(404).json({
        success: false,
        message: 'Drive not found',
      });
    }

    const companyProfile = await CompanyProfile.findOne({ user: req.user._id });
    if (!companyProfile) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found',
      });
    }

    const drive = await Drive.findById(driveId);
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Drive not found',
      });
    }

    // Verify company ownership of the drive
    if (drive.company.toString() !== companyProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view applicants for another company’s drive',
      });
    }

    const applications = await Application.find({ drive: drive._id })
      .populate({
        path: 'student',
        select:
          'rollNumber branch cgpa tenthPercentage twelfthPercentage activeBacklogs skills resumeUrl phone user',
        populate: {
          path: 'user',
          select: 'name email role isActive createdAt',
        },
      })
      .populate({
        path: 'drive',
        select: 'jobTitle packageLPA status driveDate applicationDeadline',
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update candidate application status with strict workflow rules
// @route   PUT /api/company/applications/:applicationId/status
// @access  Private (Company only)
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    const validStatuses = ['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const companyProfile = await CompanyProfile.findOne({ user: req.user._id });
    if (!companyProfile) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found',
      });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Find the associated drive to verify ownership
    const drive = await Drive.findById(application.drive);
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Associated drive not found',
      });
    }

    if (drive.company.toString() !== companyProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to modify another company’s application',
      });
    }

    // Status transition rules
    const allowedTransitions = {
      Applied: ['Shortlisted', 'Rejected'],
      Shortlisted: ['Interview', 'Rejected'],
      Interview: ['Selected', 'Rejected'],
      Selected: [],
      Rejected: [],
    };

    const currentStatus = application.status;
    const permittedNextStatuses = allowedTransitions[currentStatus] || [];

    if (!permittedNextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition status from '${currentStatus}' to '${status}'. ${
          permittedNextStatuses.length > 0
            ? `Allowed transitions: ${permittedNextStatuses.join(', ')}`
            : `'${currentStatus}' is a terminal status and cannot be changed.`
        }`,
      });
    }

    // Update only status
    application.status = status;
    await application.save();

    const updatedApplication = await Application.findById(application._id)
      .populate({
        path: 'student',
        select:
          'rollNumber branch cgpa tenthPercentage twelfthPercentage activeBacklogs skills resumeUrl phone user',
        populate: {
          path: 'user',
          select: 'name email role isActive',
        },
      })
      .populate({
        path: 'drive',
        select: 'jobTitle packageLPA status driveDate applicationDeadline',
      });

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      application: updatedApplication,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyToDrive,
  getMyApplications,
  getApplicationById,
  getCompanyApplications,
  getDriveApplications,
  updateApplicationStatus,
};
