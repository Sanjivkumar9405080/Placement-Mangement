const mongoose = require('mongoose');
const Drive = require('../models/Drive');
const CompanyProfile = require('../models/CompanyProfile');

// @desc    Create a new placement drive
// @route   POST /api/drives
// @access  Private (Approved Company only)
const createDrive = async (req, res, next) => {
  try {
    // 1. Fetch company profile using authenticated user's ID
    const companyProfile = await CompanyProfile.findOne({ user: req.user._id });

    if (!companyProfile) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found',
      });
    }

    // 2. Enforce company approval check
    if (!companyProfile.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Company account is pending approval. You cannot post drives yet.',
      });
    }

    const {
      jobTitle,
      jobRole,
      department,
      description,
      responsibilities,
      requiredSkills,
      skills,
      preferredSkills,
      packageLPA,
      minimumCTC,
      maximumCTC,
      stipend,
      minimumCGPA,
      maxBacklogs,
      minimumTenthPercentage,
      minimumTwelfthPercentage,
      allowedBranches,
      eligibleDegrees,
      eligibleSpecializations,
      experienceType,
      minimumExperience,
      employmentType,
      workMode,
      workLocation,
      bondRequired,
      bondDuration,
      bondDetails,
      recruitmentRounds,
      additionalRequirements,
      driveDate,
      applicationDeadline,
      status,
    } = req.body;

    // Helper functions for parsing arrays & numbers
    const toStrArray = (val) => {
      if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
      if (typeof val === 'string' && val.trim()) {
        return val.split(',').map((s) => s.trim()).filter(Boolean);
      }
      return [];
    };

    const toNum = (val, defaultVal = 0) => {
      if (val === undefined || val === null || val === '') return defaultVal;
      const n = Number(val);
      return isNaN(n) ? defaultVal : n;
    };

    // 3. Validation: jobTitle
    if (!jobTitle || !jobTitle.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Job title is required',
      });
    }

    // 4. Validation: packageLPA
    if (packageLPA === undefined || packageLPA === null || packageLPA === '') {
      return res.status(400).json({
        success: false,
        message: 'Package (in LPA) is required',
      });
    }
    const numPackage = Number(packageLPA);
    if (isNaN(numPackage) || numPackage < 0) {
      return res.status(400).json({
        success: false,
        message: 'Package LPA must be a valid non-negative number',
      });
    }

    // 5. Validation: minimumCGPA (0 - 10)
    let numCgpa = toNum(minimumCGPA, 0);
    if (numCgpa < 0 || numCgpa > 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum CGPA must be a number between 0 and 10',
      });
    }

    // 6. Validation: maxBacklogs (>= 0)
    let numBacklogs = toNum(maxBacklogs, 0);
    if (numBacklogs < 0) {
      return res.status(400).json({
        success: false,
        message: 'Max backlogs cannot be negative',
      });
    }

    // 7. Validation: 10th & 12th percentage (0 - 100)
    let numTenth = toNum(minimumTenthPercentage, 0);
    if (numTenth < 0 || numTenth > 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum 10th percentage must be between 0 and 100',
      });
    }

    let numTwelfth = toNum(minimumTwelfthPercentage, 0);
    if (numTwelfth < 0 || numTwelfth > 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum 12th percentage must be between 0 and 100',
      });
    }

    // 8. Validation: Date relationship
    if (applicationDeadline && driveDate) {
      if (new Date(applicationDeadline) > new Date(driveDate)) {
        return res.status(400).json({
          success: false,
          message: 'Application deadline cannot be after the drive date',
        });
      }
    }

    // 9. Validation: status
    if (status && !['upcoming', 'active', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'upcoming', 'active', or 'completed'",
      });
    }

    // 10. Validation: enum fields
    const validExpTypes = ['freshers', 'experienced', 'both'];
    const validEmpTypes = ['Full Time', 'Internship', 'Internship + Full Time', 'Contract'];
    const validWorkModes = ['On-site', 'Hybrid', 'Remote'];

    const finalExpType = validExpTypes.includes(experienceType) ? experienceType : 'freshers';
    const finalEmpType = validEmpTypes.includes(employmentType) ? employmentType : 'Full Time';
    const finalWorkMode = validWorkModes.includes(workMode) ? workMode : 'On-site';

    // 11. Create Drive setting company directly from companyProfile._id
    const drive = await Drive.create({
      company: companyProfile._id,
      jobTitle: jobTitle.trim(),
      jobRole: jobRole ? jobRole.trim() : '',
      department: department ? department.trim() : '',
      description: description ? description.trim() : '',
      responsibilities: toStrArray(responsibilities),
      requiredSkills: toStrArray(requiredSkills || skills),
      preferredSkills: toStrArray(preferredSkills),
      minimumCGPA: numCgpa,
      maxBacklogs: numBacklogs,
      minimumTenthPercentage: numTenth,
      minimumTwelfthPercentage: numTwelfth,
      allowedBranches: toStrArray(allowedBranches),
      eligibleDegrees: toStrArray(eligibleDegrees),
      eligibleSpecializations: toStrArray(eligibleSpecializations),
      experienceType: finalExpType,
      minimumExperience: toNum(minimumExperience, 0),
      employmentType: finalEmpType,
      workMode: finalWorkMode,
      workLocation: workLocation ? workLocation.trim() : '',
      packageLPA: numPackage,
      minimumCTC: toNum(minimumCTC, 0),
      maximumCTC: toNum(maximumCTC, 0),
      stipend: toNum(stipend, 0),
      bondRequired: Boolean(bondRequired),
      bondDuration: toNum(bondDuration, 0),
      bondDetails: bondDetails ? bondDetails.trim() : '',
      recruitmentRounds: toStrArray(recruitmentRounds),
      additionalRequirements: toStrArray(additionalRequirements),
      driveDate: driveDate ? new Date(driveDate) : undefined,
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined,
      status: status || 'upcoming',
      approvalStatus: 'pending',
      rejectionReason: '',
    });

    const populatedDrive = await Drive.findById(drive._id).populate({
      path: 'company',
      select: 'companyName website industry hrName isApproved',
    });

    res.status(201).json({
      success: true,
      message: 'Placement drive created successfully and is awaiting admin approval',
      drive: populatedDrive,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all placement drives with optional filters
// @route   GET /api/drives
// @access  Private (student, company, admin)
const getAllDrives = async (req, res, next) => {
  try {
    const { status, branch, minCGPA, approvalStatus } = req.query;
    const conditions = [];

    // Role-based visibility enforcement
    if (req.user.role === 'student') {
      // Students can ONLY EVER see approved drives
      conditions.push({ approvalStatus: 'approved' });
    } else if (req.user.role === 'company') {
      const companyProfile = await CompanyProfile.findOne({ user: req.user._id });
      if (approvalStatus) {
        if (companyProfile) {
          conditions.push({
            company: companyProfile._id,
            approvalStatus,
          });
        } else {
          conditions.push({ approvalStatus });
        }
      } else if (companyProfile) {
        conditions.push({
          $or: [
            { company: companyProfile._id },
            { approvalStatus: 'approved' },
          ],
        });
      } else {
        conditions.push({ approvalStatus: 'approved' });
      }
    } else if (req.user.role === 'admin') {
      if (approvalStatus) {
        conditions.push({ approvalStatus });
      }
    }

    // Filter by lifecycle status (e.g. ?status=active)
    if (status) {
      conditions.push({ status });
    }

    // Filter by branch: either branch is included in allowedBranches OR allowedBranches is empty (open to all)
    if (branch) {
      conditions.push({
        $or: [
          { allowedBranches: branch },
          { allowedBranches: { $size: 0 } },
          { allowedBranches: { $exists: false } },
        ],
      });
    }

    // Filter by CGPA: return drives where minimumCGPA <= requested CGPA
    if (minCGPA !== undefined && minCGPA !== '') {
      const parsedCgpa = Number(minCGPA);
      if (!isNaN(parsedCgpa)) {
        conditions.push({ minimumCGPA: { $lte: parsedCgpa } });
      }
    }

    const finalQuery = conditions.length > 0 ? { $and: conditions } : {};

    const drives = await Drive.find(finalQuery)
      .populate({
        path: 'company',
        select: 'companyName website industry hrName isApproved',
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: drives.length,
      drives,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single placement drive by ID
// @route   GET /api/drives/:id
// @access  Private (student, company, admin)
const getDriveById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: 'Drive not found',
      });
    }

    const drive = await Drive.findById(req.params.id).populate({
      path: 'company',
      select: 'companyName website industry hrName isApproved',
    });

    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Drive not found',
      });
    }

    // Role-based drive visibility check: students can only view approved drives
    if (req.user.role === 'student') {
      if (drive.approvalStatus !== 'approved') {
        return res.status(404).json({
          success: false,
          message: 'Placement drive not available.',
        });
      }
    } else if (req.user.role === 'company') {
      const companyProfile = await CompanyProfile.findOne({ user: req.user._id });
      const isOwner =
        companyProfile &&
        drive.company &&
        (drive.company._id
          ? drive.company._id.toString() === companyProfile._id.toString()
          : drive.company.toString() === companyProfile._id.toString());

      if (!isOwner && drive.approvalStatus !== 'approved') {
        return res.status(404).json({
          success: false,
          message: 'Placement drive not available.',
        });
      }
    }

    res.status(200).json({
      success: true,
      drive,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a placement drive
// @route   PUT /api/drives/:id
// @access  Private (Company owner only)
const updateDrive = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: 'Drive not found',
      });
    }

    // Find authenticated company profile
    const companyProfile = await CompanyProfile.findOne({ user: req.user._id });
    if (!companyProfile) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found',
      });
    }

    const drive = await Drive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Drive not found',
      });
    }

    // Verify company ownership
    if (drive.company.toString() !== companyProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to update another company’s drive',
      });
    }

    const {
      jobTitle,
      jobRole,
      department,
      description,
      responsibilities,
      requiredSkills,
      skills,
      preferredSkills,
      packageLPA,
      minimumCTC,
      maximumCTC,
      stipend,
      minimumCGPA,
      maxBacklogs,
      minimumTenthPercentage,
      minimumTwelfthPercentage,
      allowedBranches,
      eligibleDegrees,
      eligibleSpecializations,
      experienceType,
      minimumExperience,
      employmentType,
      workMode,
      workLocation,
      bondRequired,
      bondDuration,
      bondDetails,
      recruitmentRounds,
      additionalRequirements,
      driveDate,
      applicationDeadline,
      status,
    } = req.body;

    const toStrArray = (val) => {
      if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
      if (typeof val === 'string' && val.trim()) {
        return val.split(',').map((s) => s.trim()).filter(Boolean);
      }
      return [];
    };

    const toNum = (val, defaultVal = 0) => {
      if (val === undefined || val === null || val === '') return defaultVal;
      const n = Number(val);
      return isNaN(n) ? defaultVal : n;
    };

    // Validate fields
    if (jobTitle !== undefined) {
      if (!jobTitle.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Job title cannot be empty',
        });
      }
      drive.jobTitle = jobTitle.trim();
    }

    if (jobRole !== undefined) drive.jobRole = jobRole ? jobRole.trim() : '';
    if (department !== undefined) drive.department = department ? department.trim() : '';
    if (description !== undefined) drive.description = description ? description.trim() : '';

    if (responsibilities !== undefined) drive.responsibilities = toStrArray(responsibilities);
    if (requiredSkills !== undefined || skills !== undefined) {
      drive.requiredSkills = toStrArray(requiredSkills || skills);
    }
    if (preferredSkills !== undefined) drive.preferredSkills = toStrArray(preferredSkills);

    if (packageLPA !== undefined && packageLPA !== null && packageLPA !== '') {
      const numPackage = Number(packageLPA);
      if (isNaN(numPackage) || numPackage < 0) {
        return res.status(400).json({
          success: false,
          message: 'Package LPA must be a non-negative number',
        });
      }
      drive.packageLPA = numPackage;
    }

    if (minimumCTC !== undefined) drive.minimumCTC = toNum(minimumCTC, 0);
    if (maximumCTC !== undefined) drive.maximumCTC = toNum(maximumCTC, 0);
    if (stipend !== undefined) drive.stipend = toNum(stipend, 0);

    if (minimumCGPA !== undefined && minimumCGPA !== null && minimumCGPA !== '') {
      const numCgpa = toNum(minimumCGPA, 0);
      if (numCgpa < 0 || numCgpa > 10) {
        return res.status(400).json({
          success: false,
          message: 'Minimum CGPA must be a number between 0 and 10',
        });
      }
      drive.minimumCGPA = numCgpa;
    }

    if (maxBacklogs !== undefined && maxBacklogs !== null && maxBacklogs !== '') {
      const numBacklogs = toNum(maxBacklogs, 0);
      if (numBacklogs < 0) {
        return res.status(400).json({
          success: false,
          message: 'Max backlogs cannot be negative',
        });
      }
      drive.maxBacklogs = numBacklogs;
    }

    if (minimumTenthPercentage !== undefined && minimumTenthPercentage !== null && minimumTenthPercentage !== '') {
      const numTenth = toNum(minimumTenthPercentage, 0);
      if (numTenth < 0 || numTenth > 100) {
        return res.status(400).json({
          success: false,
          message: 'Minimum 10th percentage must be between 0 and 100',
        });
      }
      drive.minimumTenthPercentage = numTenth;
    }

    if (minimumTwelfthPercentage !== undefined && minimumTwelfthPercentage !== null && minimumTwelfthPercentage !== '') {
      const numTwelfth = toNum(minimumTwelfthPercentage, 0);
      if (numTwelfth < 0 || numTwelfth > 100) {
        return res.status(400).json({
          success: false,
          message: 'Minimum 12th percentage must be between 0 and 100',
        });
      }
      drive.minimumTwelfthPercentage = numTwelfth;
    }

    if (allowedBranches !== undefined) drive.allowedBranches = toStrArray(allowedBranches);
    if (eligibleDegrees !== undefined) drive.eligibleDegrees = toStrArray(eligibleDegrees);
    if (eligibleSpecializations !== undefined) drive.eligibleSpecializations = toStrArray(eligibleSpecializations);

    if (experienceType !== undefined) {
      const validExpTypes = ['freshers', 'experienced', 'both'];
      if (validExpTypes.includes(experienceType)) drive.experienceType = experienceType;
    }
    if (minimumExperience !== undefined) drive.minimumExperience = toNum(minimumExperience, 0);

    if (employmentType !== undefined) {
      const validEmpTypes = ['Full Time', 'Internship', 'Internship + Full Time', 'Contract'];
      if (validEmpTypes.includes(employmentType)) drive.employmentType = employmentType;
    }

    if (workMode !== undefined) {
      const validWorkModes = ['On-site', 'Hybrid', 'Remote'];
      if (validWorkModes.includes(workMode)) drive.workMode = workMode;
    }

    if (workLocation !== undefined) drive.workLocation = workLocation ? workLocation.trim() : '';

    if (bondRequired !== undefined) drive.bondRequired = Boolean(bondRequired);
    if (bondDuration !== undefined) drive.bondDuration = toNum(bondDuration, 0);
    if (bondDetails !== undefined) drive.bondDetails = bondDetails ? bondDetails.trim() : '';

    if (recruitmentRounds !== undefined) drive.recruitmentRounds = toStrArray(recruitmentRounds);
    if (additionalRequirements !== undefined) drive.additionalRequirements = toStrArray(additionalRequirements);

    const targetDeadline = applicationDeadline !== undefined ? new Date(applicationDeadline) : drive.applicationDeadline;
    const targetDriveDate = driveDate !== undefined ? new Date(driveDate) : drive.driveDate;

    if (targetDeadline && targetDriveDate && targetDeadline > targetDriveDate) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline cannot be after the drive date',
      });
    }

    if (driveDate !== undefined) {
      drive.driveDate = driveDate ? new Date(driveDate) : undefined;
    }
    if (applicationDeadline !== undefined) {
      drive.applicationDeadline = applicationDeadline ? new Date(applicationDeadline) : undefined;
    }

    if (status !== undefined) {
      if (!['upcoming', 'active', 'completed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be either 'upcoming', 'active', or 'completed'",
        });
      }
      drive.status = status;
    }

    // Crucial business rule: Editing an existing drive resets approvalStatus to 'pending'
    // and clears any previous rejectionReason so Admin can review the updated criteria.
    drive.approvalStatus = 'pending';
    drive.rejectionReason = '';

    await drive.save();

    const updatedDrive = await Drive.findById(drive._id).populate({
      path: 'company',
      select: 'companyName website industry hrName isApproved',
    });

    res.status(200).json({
      success: true,
      message: 'Drive updated successfully and resubmitted for admin approval',
      drive: updatedDrive,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a placement drive
// @route   DELETE /api/drives/:id
// @access  Private (Company owner only)
const deleteDrive = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: 'Drive not found',
      });
    }

    // Find authenticated company profile
    const companyProfile = await CompanyProfile.findOne({ user: req.user._id });
    if (!companyProfile) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found',
      });
    }

    const drive = await Drive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Drive not found',
      });
    }

    // Verify company ownership
    if (drive.company.toString() !== companyProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to delete another company’s drive',
      });
    }

    await Drive.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Drive deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDrive,
  getAllDrives,
  getDriveById,
  updateDrive,
  deleteDrive,
};
