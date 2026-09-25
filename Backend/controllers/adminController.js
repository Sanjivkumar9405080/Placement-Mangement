const mongoose = require('mongoose');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const CompanyProfile = require('../models/CompanyProfile');
const Drive = require('../models/Drive');
const Application = require('../models/Application');

// @desc    Get dashboard metrics & statistics for TPO Control Center
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalCompanies,
      approvedCompanies,
      pendingCompanies,
      totalDrives,
      activeDrives,
      pendingDriveApprovals,
      approvedDrives,
      rejectedDrives,
      totalApplications,
      selectedStudents,
      rejectedApplications,
      removedApplications,
    ] = await Promise.all([
      StudentProfile.countDocuments(),
      CompanyProfile.countDocuments(),
      CompanyProfile.countDocuments({ isApproved: true }),
      CompanyProfile.countDocuments({ isApproved: { $ne: true } }),
      Drive.countDocuments(),
      Drive.countDocuments({ status: 'active', approvalStatus: 'approved' }),
      Drive.countDocuments({ approvalStatus: 'pending' }),
      Drive.countDocuments({ approvalStatus: 'approved' }),
      Drive.countDocuments({ approvalStatus: 'rejected' }),
      Application.countDocuments(),
      Application.countDocuments({ status: 'Selected' }),
      Application.countDocuments({ status: 'Rejected' }),
      Application.countDocuments({ status: 'Removed' }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalCompanies,
        approvedCompanies,
        pendingCompanies,
        totalDrives,
        activeDrives,
        pendingDriveApprovals,
        approvedDrives,
        rejectedDrives,
        totalApplications,
        selectedStudents,
        rejectedApplications,
        removedApplications,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all students with populated user credentials, search & application summary
// @route   GET /api/admin/students
// @access  Private (Admin only)
const getAllStudents = async (req, res, next) => {
  try {
    const { branch, minCGPA, search } = req.query;
    const query = {};

    if (branch) {
      query.branch = { $regex: new RegExp(`^${branch.trim()}$`, 'i') };
    }

    if (minCGPA !== undefined && minCGPA !== '') {
      const parsedCgpa = Number(minCGPA);
      if (!isNaN(parsedCgpa)) {
        query.cgpa = { $gte: parsedCgpa };
      }
    }

    if (search && search.trim()) {
      const searchTrimmed = search.trim();
      const searchRegex = new RegExp(searchTrimmed, 'i');
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
        role: 'student',
      }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      query.$or = [
        { rollNumber: searchRegex },
        { user: { $in: userIds } },
      ];
    }

    const students = await StudentProfile.find(query)
      .populate({
        path: 'user',
        select: 'name email role isActive createdAt',
      })
      .sort({ createdAt: -1 });

    // Aggregate application counts for each student
    const studentIds = students.map((s) => s._id);
    const applicationCounts = await Application.aggregate([
      { $match: { student: { $in: studentIds } } },
      {
        $group: {
          _id: '$student',
          total: { $sum: 1 },
          selected: {
            $sum: { $cond: [{ $eq: ['$status', 'Selected'] }, 1, 0] },
          },
          shortlisted: {
            $sum: { $cond: [{ $eq: ['$status', 'Shortlisted'] }, 1, 0] },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] },
          },
          removed: {
            $sum: { $cond: [{ $eq: ['$status', 'Removed'] }, 1, 0] },
          },
        },
      },
    ]);

    const countsMap = {};
    applicationCounts.forEach((c) => {
      countsMap[c._id.toString()] = {
        total: c.total,
        selected: c.selected,
        shortlisted: c.shortlisted,
        rejected: c.rejected,
        removed: c.removed,
      };
    });

    const studentsWithMetrics = students.map((s) => {
      const plain = s.toObject();
      const metrics = countsMap[s._id.toString()] || {
        total: 0,
        selected: 0,
        shortlisted: 0,
        rejected: 0,
        removed: 0,
      };
      return {
        ...plain,
        fullName: plain.user?.name || '',
        email: plain.user?.email || '',
        applicationCount: metrics.total,
        selectedCount: metrics.selected,
        shortlistedCount: metrics.shortlisted,
        rejectedCount: metrics.rejected,
        removedCount: metrics.removed,
        placed: metrics.selected > 0,
      };
    });

    res.status(200).json({
      success: true,
      count: studentsWithMetrics.length,
      students: studentsWithMetrics,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed student profile by ID with full placement history
// @route   GET /api/admin/students/:id
// @access  Private (Admin only)
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let student = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      student = await StudentProfile.findById(id).populate({
        path: 'user',
        select: 'name email role isActive createdAt',
      });
      // Fallback search by user ID
      if (!student) {
        student = await StudentProfile.findOne({ user: id }).populate({
          path: 'user',
          select: 'name email role isActive createdAt',
        });
      }
    }

    // Also support roll number query if ID not ObjectId
    if (!student) {
      student = await StudentProfile.findOne({
        rollNumber: id.trim().toUpperCase(),
      }).populate({
        path: 'user',
        select: 'name email role isActive createdAt',
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found',
      });
    }

    // Fetch all placement applications of the student (including audit info)
    const applications = await Application.find({ student: student._id })
      .populate({
        path: 'drive',
        select:
          'jobTitle jobRole packageLPA driveDate applicationDeadline status company recruitmentRounds description minimumCGPA allowedBranches',
        populate: {
          path: 'company',
          select: 'companyName website industry hrName hrEmail hrPhone',
        },
      })
      .populate({
        path: 'removedBy',
        select: 'name email',
      })
      .sort({ createdAt: -1 });

    const metrics = {
      totalApplications: applications.length,
      shortlisted: applications.filter((a) => a.status === 'Shortlisted').length,
      interview: applications.filter((a) => a.status === 'Interview').length,
      selected: applications.filter((a) => a.status === 'Selected').length,
      rejected: applications.filter((a) => a.status === 'Rejected').length,
      removed: applications.filter((a) => a.status === 'Removed').length,
    };

    res.status(200).json({
      success: true,
      student,
      applications,
      metrics,
      stats: metrics,
      placementStats: metrics,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all company profiles with populated user info, drive counts & filters
// @route   GET /api/admin/companies
// @access  Private (Admin only)
const getAllCompanies = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status === 'approved') {
      query.isApproved = true;
    } else if (status === 'pending') {
      query.isApproved = { $ne: true };
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { companyName: searchRegex },
        { industry: searchRegex },
        { hrEmail: searchRegex },
        { hrName: searchRegex },
      ];
    }

    const companies = await CompanyProfile.find(query)
      .populate({
        path: 'user',
        select: 'name email role isActive createdAt',
      })
      .sort({ createdAt: -1 });

    // Aggregate drive counts for each company
    const companyIds = companies.map((c) => c._id);
    const driveCounts = await Drive.aggregate([
      { $match: { company: { $in: companyIds } } },
      { $group: { _id: '$company', count: { $sum: 1 } } },
    ]);

    const driveCountMap = {};
    driveCounts.forEach((d) => {
      driveCountMap[d._id.toString()] = d.count;
    });

    const companiesWithDrives = companies.map((comp) => {
      const plain = comp.toObject();
      return {
        ...plain,
        drivesCount: driveCountMap[comp._id.toString()] || 0,
      };
    });

    res.status(200).json({
      success: true,
      count: companiesWithDrives.length,
      companies: companiesWithDrives,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or revoke company profile approval
// @route   PUT /api/admin/companies/:id/approve
// @access  Private (Admin only)
const approveCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found',
      });
    }

    if (typeof isApproved !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "Please provide 'isApproved' as a boolean (true or false)",
      });
    }

    const companyProfile = await CompanyProfile.findById(id);
    if (!companyProfile) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found',
      });
    }

    companyProfile.isApproved = isApproved;
    await companyProfile.save();

    const updatedCompany = await CompanyProfile.findById(companyProfile._id).populate({
      path: 'user',
      select: 'name email role isActive',
    });

    res.status(200).json({
      success: true,
      message: `Company ${isApproved ? 'approved' : 'approval revoked'} successfully`,
      company: updatedCompany,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all drives across all companies with optional status, company & approval filtering
// @route   GET /api/admin/drives
// @access  Private (Admin only)
const getAllDrives = async (req, res, next) => {
  try {
    const { status, company, approvalStatus } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (approvalStatus) {
      query.approvalStatus = approvalStatus;
    }

    if (company && mongoose.Types.ObjectId.isValid(company)) {
      query.company = company;
    }

    const drives = await Drive.find(query)
      .populate({
        path: 'company',
        select: 'companyName website industry hrName hrEmail hrPhone isApproved',
      })
      .sort({ createdAt: -1 });

    // Aggregate applicants count per drive
    const driveIds = drives.map((d) => d._id);
    const appCounts = await Application.aggregate([
      { $match: { drive: { $in: driveIds } } },
      {
        $group: {
          _id: '$drive',
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $ne: ['$status', 'Removed'] }, 1, 0] } },
        },
      },
    ]);

    const appMap = {};
    appCounts.forEach((a) => {
      appMap[a._id.toString()] = { total: a.total, active: a.active };
    });

    const drivesWithCounts = drives.map((d) => {
      const plain = d.toObject();
      const stats = appMap[d._id.toString()] || { total: 0, active: 0 };
      return {
        ...plain,
        totalApplicants: stats.total,
        activeApplicants: stats.active,
      };
    });

    res.status(200).json({
      success: true,
      count: drivesWithCounts.length,
      drives: drivesWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review and approve/reject placement drive
// @route   PUT /api/admin/drives/:id/approval
// @access  Private (Admin only)
const reviewDriveApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approvalStatus, rejectionReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found',
      });
    }

    if (!['approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: "approvalStatus must be either 'approved' or 'rejected'",
      });
    }

    if (approvalStatus === 'rejected') {
      if (!rejectionReason || !rejectionReason.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required when rejecting a placement drive',
        });
      }
    }

    const drive = await Drive.findById(id);
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found',
      });
    }

    drive.approvalStatus = approvalStatus;
    drive.rejectionReason = approvalStatus === 'rejected' ? rejectionReason.trim() : '';

    await drive.save();

    const updatedDrive = await Drive.findById(drive._id).populate({
      path: 'company',
      select: 'companyName website industry hrName hrEmail hrPhone isApproved',
    });

    res.status(200).json({
      success: true,
      message:
        approvalStatus === 'approved'
          ? 'Placement drive approved successfully'
          : 'Placement drive rejected',
      drive: updatedDrive,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all applicants for a specific placement drive (Admin inspection)
// @route   GET /api/admin/drives/:id/applicants
// @access  Private (Admin only)
const getDriveApplicants = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found',
      });
    }

    const drive = await Drive.findById(id).populate({
      path: 'company',
      select: 'companyName website industry hrName hrEmail hrPhone isApproved',
    });

    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found',
      });
    }

    const applications = await Application.find({ drive: id })
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'name email role isActive',
        },
      })
      .populate({
        path: 'removedBy',
        select: 'name email',
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      drive,
      count: applications.length,
      applications,
      applicants: applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a student from a specific placement drive (Soft removal with audit tracking)
// @route   DELETE /api/admin/applications/:id
// @access  Private (Admin only)
const removeStudentFromDrive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reason =
      req.body.removalReason ||
      req.body.reason ||
      req.query.reason ||
      'TPO administrative decision';

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const application = await Application.findById(id)
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' },
      })
      .populate({
        path: 'drive',
        select: 'jobTitle company',
        populate: { path: 'company', select: 'companyName' },
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Apply audit-safe soft removal
    application.status = 'Removed';
    application.isRemoved = true;
    application.removedBy = req.user._id;
    application.removedAt = new Date();
    application.removalReason = reason.trim();

    await application.save();

    const updated = await Application.findById(application._id)
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' },
      })
      .populate({
        path: 'drive',
        select: 'jobTitle company',
        populate: { path: 'company', select: 'companyName' },
      })
      .populate({
        path: 'removedBy',
        select: 'name email',
      });

    res.status(200).json({
      success: true,
      message: 'Student was successfully removed from this placement drive',
      application: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all applications across drives with filtering (status, search, etc.)
// @route   GET /api/admin/applications
// @access  Private (Admin only)
const getAllApplications = async (req, res, next) => {
  try {
    const { status, search, driveId, studentId } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (driveId && mongoose.Types.ObjectId.isValid(driveId)) {
      query.drive = driveId;
    }

    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      query.student = studentId;
    }

    let applications = await Application.find(query)
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' },
      })
      .populate({
        path: 'drive',
        select: 'jobTitle jobRole packageLPA driveDate applicationDeadline status company',
        populate: { path: 'company', select: 'companyName website industry' },
      })
      .populate({
        path: 'removedBy',
        select: 'name email',
      })
      .sort({ createdAt: -1 });

    // Client-side text filter on populated fields if search query provided
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      applications = applications.filter((app) => {
        const studentName = app.student?.user?.name?.toLowerCase() || '';
        const rollNumber = app.student?.rollNumber?.toLowerCase() || '';
        const studentEmail = app.student?.user?.email?.toLowerCase() || '';
        const jobTitle = app.drive?.jobTitle?.toLowerCase() || '';
        const companyName = app.drive?.company?.companyName?.toLowerCase() || '';
        return (
          studentName.includes(q) ||
          rollNumber.includes(q) ||
          studentEmail.includes(q) ||
          jobTitle.includes(q) ||
          companyName.includes(q)
        );
      });
    }

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllStudents,
  getStudentById,
  getAllCompanies,
  approveCompany,
  getAllDrives,
  reviewDriveApproval,
  getDriveApplicants,
  removeStudentFromDrive,
  getAllApplications,
};
